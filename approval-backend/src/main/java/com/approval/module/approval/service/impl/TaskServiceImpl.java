package com.approval.module.approval.service.impl;

import com.approval.common.exception.BusinessException;
import com.approval.module.approval.dto.ApproveTaskDto;
import com.approval.module.approval.entity.Application;
import com.approval.module.approval.entity.History;
import com.approval.module.approval.entity.Task;
import com.approval.module.approval.mapper.ApplicationMapper;
import com.approval.module.approval.mapper.HistoryMapper;
import com.approval.module.approval.mapper.TaskMapper;
import com.approval.module.approval.service.ITaskService;
import com.approval.module.approval.vo.ApprovalTypeStatVo;
import com.approval.module.approval.vo.ApproverDashboardVo;
import com.approval.module.approval.vo.DailyApprovalStatVo;
import com.approval.module.approval.vo.TaskVo;
import com.approval.module.system.entity.Dept;
import com.approval.module.system.entity.Post;
import com.approval.module.system.entity.User;
import com.approval.module.system.mapper.DeptMapper;
import com.approval.module.system.mapper.PostMapper;
import com.approval.module.system.mapper.UserMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DateTimeException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 任务服务实现
 */
@Service
@RequiredArgsConstructor
public class TaskServiceImpl implements ITaskService {

    private final TaskMapper taskMapper;
    private final ApplicationMapper applicationMapper;
    private final HistoryMapper historyMapper;
    private final UserMapper userMapper;
    private final DeptMapper deptMapper;
    private final PostMapper postMapper;

    @Override
    public Page<TaskVo> getTodoTasks(Long userId, Integer pageNum, Integer pageSize) {
        Page<Task> page = new Page<>(pageNum, pageSize);

        LambdaQueryWrapper<Task> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Task::getAssigneeId, userId)
                .eq(Task::getStatus, 0) // 待处理
                .orderByDesc(Task::getCreateTime);

        Page<Task> taskPage = taskMapper.selectPage(page, wrapper);

        Page<TaskVo> voPage = new Page<>(taskPage.getCurrent(), taskPage.getSize(), taskPage.getTotal());

        voPage.setRecords(taskPage.getRecords().stream().map(task -> {
            TaskVo vo = new TaskVo();
            org.springframework.beans.BeanUtils.copyProperties(task, vo);

            // 查询申请信息
            Application app = applicationMapper.selectById(task.getAppId());
            if (app != null) {
                vo.setAppNo(app.getAppNo());
                vo.setAppType(app.getAppType());
                vo.setTitle(app.getTitle());

                User applicant = userMapper.selectById(app.getApplicantId());
                if (applicant != null) {
                    vo.setApplicantName(applicant.getRealName());
                }
            }

            return vo;
        }).collect(java.util.stream.Collectors.toList()));

        return voPage;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void approveTask(ApproveTaskDto dto, Long userId) {
        // 1. 查询任务
        Task task = taskMapper.selectById(dto.getTaskId());
        if (task == null) {
            throw new BusinessException(404, "任务不存在");
        }

        // 2. 验证权限
        if (!task.getAssigneeId().equals(userId)) {
            throw new BusinessException(403, "无权处理此任务");
        }

        if (task.getStatus() == 1) {
            throw new BusinessException("任务已处理，请勿重复操作");
        }

        // 3. 查询申请
        Application application = applicationMapper.selectById(task.getAppId());
        if (application == null) {
            throw new BusinessException("申请不存在");
        }

        // 4. 获取审批人信息
        User approver = userMapper.selectById(userId);

        // 5. 更新任务状态
        task.setStatus(1); // 已处理
        task.setFinishTime(LocalDateTime.now());
        taskMapper.updateById(task);

        // 6. 记录审批历史
        History history = new History();
        history.setAppId(task.getAppId());
        history.setTaskId(task.getTaskId());
        history.setNodeName(task.getNodeName());
        history.setApproverId(userId);
        history.setApproverName(approver.getRealName());
        history.setAction(dto.getAction());
        history.setComment(dto.getComment());
        history.setCreateTime(LocalDateTime.now());
        history.setApproveTime(LocalDateTime.now());

        // 7. 更新申请状态
        if (dto.getAction() == 1) {
            // 同意 - 简化流程，直接通过
            application.setStatus(3); // 已通过
            application.setFinishTime(LocalDateTime.now());
            history.setNextNode("结束");
        } else {
            // 拒绝
            application.setStatus(4); // 已拒绝
            application.setFinishTime(LocalDateTime.now());
            history.setNextNode("结束");
        }

        applicationMapper.updateById(application);
        historyMapper.insert(history);
    }

    @Override
    public Page<TaskVo> getDoneTasks(Long userId, Integer pageNum, Integer pageSize) {
        Page<Task> page = new Page<>(pageNum, pageSize);

        LambdaQueryWrapper<Task> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Task::getAssigneeId, userId)
                .eq(Task::getStatus, 1) // 已处理
                .orderByDesc(Task::getFinishTime);

        Page<Task> taskPage = taskMapper.selectPage(page, wrapper);

        Page<TaskVo> voPage = new Page<>(taskPage.getCurrent(), taskPage.getSize(), taskPage.getTotal());

        voPage.setRecords(taskPage.getRecords().stream().map(task -> {
            TaskVo vo = new TaskVo();
            org.springframework.beans.BeanUtils.copyProperties(task, vo);

            // 查询申请信息
            Application app = applicationMapper.selectById(task.getAppId());
            if (app != null) {
                vo.setAppNo(app.getAppNo());
                vo.setAppType(app.getAppType());
                vo.setTitle(app.getTitle());

                User applicant = userMapper.selectById(app.getApplicantId());
                if (applicant != null) {
                    vo.setApplicantName(applicant.getRealName());
                }
            }

            // 查询审批结果（从历史记录）
            History history = historyMapper.selectOne(
                    new LambdaQueryWrapper<History>()
                            .eq(History::getTaskId, task.getTaskId())
                            .orderByDesc(History::getCreateTime)
                            .last("LIMIT 1"));
            if (history != null) {
                vo.setAction(history.getAction());
                vo.setComment(history.getComment());
            }

            return vo;
        }).collect(java.util.stream.Collectors.toList()));

        return voPage;
    }

    @Override
    public ApproverDashboardVo getApproverDashboard(Long userId, Integer year, Integer month) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }

        YearMonth targetMonth = resolveTargetMonth(year, month);

        String deptName = "";
        if (user.getDeptId() != null) {
            Dept dept = deptMapper.selectById(user.getDeptId());
            deptName = dept != null ? dept.getDeptName() : "";
        }

        String postName = "";
        if (user.getPostId() != null) {
            Post post = postMapper.selectById(user.getPostId());
            postName = post != null ? post.getPostName() : "";
        }

        List<Task> finishedTasks = taskMapper.selectList(new LambdaQueryWrapper<Task>()
            .eq(Task::getAssigneeId, userId)
            .eq(Task::getStatus, 1));

        List<Long> taskIds = finishedTasks.stream()
                .map(Task::getTaskId)
                .collect(Collectors.toList());
        Map<Long, History> latestHistoryMap = buildLatestHistoryMap(taskIds);

        List<DailyApprovalStatVo> dailyStats = buildDailyStats(finishedTasks, latestHistoryMap, targetMonth);

        if (finishedTasks.isEmpty()) {
            return ApproverDashboardVo.builder()
                .realName(user.getRealName())
                .deptName(deptName)
                .postName(postName)
                .totalCount(0L)
                .approvedCount(0L)
                .rejectedCount(0L)
                .typeStats(Collections.emptyList())
                .dailyStats(dailyStats)
                .build();
        }

        long approvedCount = latestHistoryMap.values().stream()
                .filter(history -> history != null && Integer.valueOf(1).equals(history.getAction()))
                .count();
        long rejectedCount = latestHistoryMap.values().stream()
                .filter(history -> history != null && Integer.valueOf(2).equals(history.getAction()))
                .count();

        List<Long> appIds = finishedTasks.stream()
                .map(Task::getAppId)
                .collect(Collectors.toList());
        Map<Long, Application> applicationMap = appIds.isEmpty()
                ? Collections.emptyMap()
                : applicationMapper.selectBatchIds(appIds).stream()
                        .collect(Collectors.toMap(Application::getAppId, Function.identity()));

        Map<String, Long> typeCounter = new HashMap<>();
        for (Task task : finishedTasks) {
            Application application = applicationMap.get(task.getAppId());
            String appType = application != null ? application.getAppType() : "other";
            typeCounter.merge(appType, 1L, Long::sum);
        }

        List<ApprovalTypeStatVo> typeStats = typeCounter.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue(Comparator.reverseOrder()))
                .map(entry -> ApprovalTypeStatVo.builder()
                        .appType(entry.getKey())
                        .typeLabel(resolveTypeLabel(entry.getKey()))
                        .count(entry.getValue())
                        .build())
                .collect(Collectors.toList());

        return ApproverDashboardVo.builder()
                .realName(user.getRealName())
                .deptName(deptName)
                .postName(postName)
                .totalCount((long) finishedTasks.size())
                .approvedCount(approvedCount)
                .rejectedCount(rejectedCount)
                .typeStats(typeStats)
                .dailyStats(dailyStats)
                .build();
    }

    private YearMonth resolveTargetMonth(Integer year, Integer month) {
        if (year == null || month == null) {
            return YearMonth.now();
        }
        try {
            return YearMonth.of(year, month);
        } catch (DateTimeException ex) {
            return YearMonth.now();
        }
    }

    private List<DailyApprovalStatVo> buildDailyStats(
            List<Task> tasks,
            Map<Long, History> latestHistoryMap,
            YearMonth targetMonth) {
        YearMonth month = targetMonth != null ? targetMonth : YearMonth.now();
        LocalDate startDate = month.atDay(1);
        LocalDate endDate = month.plusMonths(1).atDay(1);

        Map<LocalDate, Long> counter = new LinkedHashMap<>();
        for (LocalDate date = startDate; date.isBefore(endDate); date = date.plusDays(1)) {
            counter.put(date, 0L);
        }

        if (tasks != null && !tasks.isEmpty()) {
            for (Task task : tasks) {
                History history = latestHistoryMap != null ? latestHistoryMap.get(task.getTaskId()) : null;
                LocalDateTime time = history != null && history.getApproveTime() != null
                        ? history.getApproveTime()
                        : task.getFinishTime();
                if (time == null) {
                    continue;
                }

                LocalDate date = time.toLocalDate();
                if (!date.isBefore(startDate) && date.isBefore(endDate)) {
                    counter.merge(date, 1L, Long::sum);
                }
            }
        }

        return counter.entrySet().stream()
                .map(entry -> DailyApprovalStatVo.builder()
                        .date(entry.getKey().toString())
                        .count(entry.getValue())
                        .build())
                .collect(Collectors.toList());
    }

    private Map<Long, History> buildLatestHistoryMap(List<Long> taskIds) {
        if (taskIds == null || taskIds.isEmpty()) {
            return Collections.emptyMap();
        }

        List<History> histories = historyMapper.selectList(
                new LambdaQueryWrapper<History>().in(History::getTaskId, taskIds));
        if (histories.isEmpty()) {
            return Collections.emptyMap();
        }

        Map<Long, History> map = new HashMap<>();
        for (History history : histories) {
            History existing = map.get(history.getTaskId());
            if (existing == null) {
                map.put(history.getTaskId(), history);
                continue;
            }

            LocalDateTime existingTime = existing.getApproveTime() != null ? existing.getApproveTime() : existing.getCreateTime();
            LocalDateTime currentTime = history.getApproveTime() != null ? history.getApproveTime() : history.getCreateTime();

            if (currentTime == null) {
                continue;
            }

            if (existingTime == null || currentTime.isAfter(existingTime)) {
                map.put(history.getTaskId(), history);
            }
        }
        return map;
    }

    private String resolveTypeLabel(String appType) {
        if (appType == null) {
            return "其他";
        }
        if ("leave".equalsIgnoreCase(appType)) {
            return "请假";
        }
        if ("reimburse".equalsIgnoreCase(appType)) {
            return "报销";
        }
        return "其他";
    }
}
