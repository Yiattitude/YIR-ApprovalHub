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
import com.approval.module.approval.vo.TaskVo;
import com.approval.module.system.entity.User;
import com.approval.module.system.mapper.UserMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

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

    @Override
    public Page<TaskVo> getTodoTasks(Long userId, Integer pageNum, Integer pageSize) {
        Page<Task> page = new Page<>(pageNum, pageSize);

        LambdaQueryWrapper<Task> wrapper = new LambdaQueryWrapper<>();
        // 所有待处理的任务都可以被审批员看到
        wrapper.eq(Task::getStatus, 0) // 待处理
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

        // 2. 验证权限 - 所有审批员都可以处理任何待办任务
        // 移除了基于assigneeId的权限验证

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
}
