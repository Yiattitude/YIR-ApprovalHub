package com.approval.module.approval.service.impl;

import com.approval.common.exception.BusinessException;
import com.approval.module.approval.dto.CreateLeaveDto;
import com.approval.module.approval.dto.CreateReimburseDto;
import com.approval.module.approval.entity.Application;
import com.approval.module.approval.entity.LeaveApplication;
import com.approval.module.approval.entity.ReimburseApplication;
import com.approval.module.approval.mapper.ApplicationMapper;
import com.approval.module.approval.mapper.LeaveApplicationMapper;
import com.approval.module.approval.mapper.ReimburseApplicationMapper;
import com.approval.module.approval.service.IApplicationService;
import com.approval.module.approval.vo.ApplicationHistoryVo;
import com.approval.module.approval.vo.ApplicationSummaryVo;
import com.approval.module.approval.vo.ApplicationVo;
import com.approval.module.system.entity.User;
import com.approval.module.system.mapper.DeptMapper;
import com.approval.module.system.mapper.PostMapper;
import com.approval.module.system.mapper.UserMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * 申请服务实现
 */
@Service
@RequiredArgsConstructor
public class ApplicationServiceImpl implements IApplicationService {

    private final ApplicationMapper applicationMapper;
    private final LeaveApplicationMapper leaveApplicationMapper;
    private final ReimburseApplicationMapper reimburseApplicationMapper;
    private final UserMapper userMapper;
    private final com.approval.module.approval.mapper.TaskMapper taskMapper;
    private final com.approval.module.approval.mapper.HistoryMapper historyMapper;
    private final DeptMapper deptMapper;
    private final PostMapper postMapper;

    private static final int STATUS_APPROVED = 3;
    private static final List<Integer> HISTORY_STATUSES = Arrays.asList(STATUS_APPROVED, 4, 5);

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createLeaveApplication(CreateLeaveDto dto, Long userId) {
        // 1. 获取用户信息
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }

        // 2. 创建申请主表
        Application application = new Application();
        application.setAppNo(generateAppNo());
        application.setAppType("leave");
        application.setTitle(
                "请假申请-" + (dto.getReason().length() > 10 ? dto.getReason().substring(0, 10) + "..." : dto.getReason()));
        application.setApplicantId(userId);
        application.setDeptId(user.getDeptId());
        application.setStatus(1); // 待审批
        application.setCurrentNode("部门经理审批");
        application.setSubmitTime(LocalDateTime.now());

        applicationMapper.insert(application);

        // 3. 创建请假详情
        LeaveApplication leave = new LeaveApplication();
        leave.setAppId(application.getAppId());
        leave.setLeaveType(dto.getLeaveType());
        leave.setStartTime(dto.getStartTime());
        leave.setEndTime(dto.getEndTime());
        leave.setDays(dto.getDays());
        leave.setReason(dto.getReason());
        leave.setAttachment(dto.getAttachment());

        leaveApplicationMapper.insert(leave);

        // 4. 创建审批任务 (自动指派给经理，ID=2)
        createTask(application, 2L, "技术部经理");

        return application.getAppId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createReimburseApplication(CreateReimburseDto dto, Long userId) {
        // 1. 获取用户信息
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }

        // 2. 创建申请主表
        Application application = new Application();
        application.setAppNo(generateAppNo());
        application.setAppType("reimburse");
        application.setTitle(
                "报销申请-" + (dto.getReason().length() > 10 ? dto.getReason().substring(0, 10) + "..." : dto.getReason()));
        application.setApplicantId(userId);
        application.setDeptId(user.getDeptId());
        application.setStatus(1); // 待审批
        application.setCurrentNode("部门经理审批");
        application.setSubmitTime(LocalDateTime.now());

        applicationMapper.insert(application);

        // 3. 创建报销详情
        ReimburseApplication reimburse = new ReimburseApplication();
        reimburse.setAppId(application.getAppId());
        reimburse.setExpenseType(dto.getExpenseType());
        reimburse.setAmount(dto.getAmount());
        reimburse.setReason(dto.getReason());
        reimburse.setInvoiceAttachment(dto.getInvoiceAttachment());
        reimburse.setOccurDate(dto.getOccurDate());

        reimburseApplicationMapper.insert(reimburse);

        // 4. 创建审批任务
        createTask(application, 2L, "技术部经理");

        return application.getAppId();
    }

    private void createTask(Application app, Long assigneeId, String assigneeName) {
        com.approval.module.approval.entity.Task task = new com.approval.module.approval.entity.Task();
        task.setAppId(app.getAppId());
        task.setNodeName(app.getCurrentNode());
        task.setAssigneeId(assigneeId);
        task.setAssigneeName(assigneeName);
        task.setStatus(0);
        task.setCreateTime(LocalDateTime.now());
        taskMapper.insert(task);
    }

    @Override
    public Page<ApplicationVo> getMyApplications(Long userId, Integer pageNum, Integer pageSize,
            String appType, Integer status) {
        Page<Application> page = new Page<>(pageNum, pageSize);

        LambdaQueryWrapper<Application> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Application::getApplicantId, userId)
                .eq(appType != null && !appType.isEmpty(), Application::getAppType, appType)
                .eq(status != null, Application::getStatus, status)
                .orderByDesc(Application::getSubmitTime);

        Page<Application> appPage = applicationMapper.selectPage(page, wrapper);

        // 转换为VO
        Page<ApplicationVo> voPage = new Page<>(appPage.getCurrent(), appPage.getSize(), appPage.getTotal());

        // 批量获取申请人信息
        User user = userMapper.selectById(userId);

        voPage.setRecords(appPage.getRecords().stream().map(app -> {
            ApplicationVo vo = new ApplicationVo();
            org.springframework.beans.BeanUtils.copyProperties(app, vo);
            vo.setApplicantName(user != null ? user.getRealName() : "");
            vo.setDeptName("技术部"); // 简化处理
            return vo;
        }).collect(Collectors.toList()));

        return voPage;
    }

    @Override
        public Page<ApplicationHistoryVo> getMyHistoryApplications(Long userId, Integer pageNum, Integer pageSize,
            String appType, LocalDateTime startTime, LocalDateTime endTime, String approverName,
            Integer leaveType, Integer expenseType, Integer status) {
        long current = (pageNum == null || pageNum <= 0) ? 1L : pageNum;
        long size = (pageSize == null || pageSize <= 0) ? 10L : pageSize;

        LambdaQueryWrapper<Application> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Application::getApplicantId, userId)
                .ge(startTime != null, Application::getSubmitTime, startTime)
                .le(endTime != null, Application::getSubmitTime, endTime)
                .orderByDesc(Application::getSubmitTime);

        if (status != null) {
            wrapper.eq(Application::getStatus, status);
        } else {
            wrapper.in(Application::getStatus, HISTORY_STATUSES);
        }

        if (appType != null && !appType.isEmpty()) {
            wrapper.eq(Application::getAppType, appType);
        }

        List<Application> applications = applicationMapper.selectList(wrapper);
        if (applications.isEmpty()) {
            return new Page<>(current, size, 0);
        }

        User applicant = userMapper.selectById(userId);
        String deptName = "";
        if (applicant != null && applicant.getDeptId() != null) {
            com.approval.module.system.entity.Dept dept = deptMapper.selectById(applicant.getDeptId());
            deptName = dept != null ? dept.getDeptName() : "";
        }

        List<ApplicationHistoryVo> historyVos = new ArrayList<>();
        for (Application application : applications) {
            LeaveApplication leaveDetail = null;
            ReimburseApplication reimburseDetail = null;

            if ("leave".equals(application.getAppType())) {
                leaveDetail = leaveApplicationMapper.selectOne(
                        new LambdaQueryWrapper<LeaveApplication>().eq(LeaveApplication::getAppId, application.getAppId()));
                if (leaveType != null && (leaveDetail == null || !leaveType.equals(leaveDetail.getLeaveType()))) {
                    continue;
                }
            }

            if ("reimburse".equals(application.getAppType())) {
                reimburseDetail = reimburseApplicationMapper.selectOne(
                        new LambdaQueryWrapper<ReimburseApplication>().eq(ReimburseApplication::getAppId, application.getAppId()));
                if (expenseType != null && (reimburseDetail == null || !expenseType.equals(reimburseDetail.getExpenseType()))) {
                    continue;
                }
            }

            com.approval.module.approval.entity.History latestHistory = historyMapper.selectOne(
                    new LambdaQueryWrapper<com.approval.module.approval.entity.History>()
                            .eq(com.approval.module.approval.entity.History::getAppId, application.getAppId())
                            .orderByDesc(com.approval.module.approval.entity.History::getApproveTime)
                            .last("limit 1"));

            if (approverName != null && !approverName.isEmpty()) {
                if (latestHistory == null || latestHistory.getApproverName() == null
                        || !latestHistory.getApproverName().contains(approverName)) {
                    continue;
                }
            }

            ApplicationHistoryVo vo = ApplicationHistoryVo.builder()
                    .appId(application.getAppId())
                    .appNo(application.getAppNo())
                    .appType(application.getAppType())
                    .title(application.getTitle())
                    .status(application.getStatus())
                    .applicantName(applicant != null ? applicant.getRealName() : "")
                    .deptName(deptName)
                    .currentNode(application.getCurrentNode())
                    .approverName(latestHistory != null ? latestHistory.getApproverName() : null)
                    .action(latestHistory != null ? latestHistory.getAction() : null)
                    .comment(latestHistory != null ? latestHistory.getComment() : null)
                    .leaveType(leaveDetail != null ? leaveDetail.getLeaveType() : null)
                    .leaveDays(leaveDetail != null ? leaveDetail.getDays() : null)
                    .expenseType(reimburseDetail != null ? reimburseDetail.getExpenseType() : null)
                    .expenseAmount(reimburseDetail != null ? reimburseDetail.getAmount() : null)
                    .submitTime(application.getSubmitTime())
                    .approveTime(latestHistory != null ? latestHistory.getApproveTime() : null)
                    .finishTime(application.getFinishTime())
                    .build();
            historyVos.add(vo);
        }

        int fromIndex = (int) Math.max((current - 1) * size, 0);
        int toIndex = Math.min((int) (fromIndex + size), historyVos.size());
        List<ApplicationHistoryVo> records = fromIndex >= historyVos.size()
                ? Collections.emptyList()
                : historyVos.subList(fromIndex, toIndex);

        Page<ApplicationHistoryVo> page = new Page<>(current, size, historyVos.size());
        page.setRecords(records);
        return page;
    }

    @Override
    public Object getApplicationDetail(Long appId) {
        Application application = applicationMapper.selectById(appId);
        if (application == null) {
            throw new BusinessException(404, "申请不存在");
        }

        Map<String, Object> detail = new HashMap<>();
        detail.put("application", application);

        if ("leave".equals(application.getAppType())) {
            LeaveApplication leave = leaveApplicationMapper.selectOne(
                    new LambdaQueryWrapper<LeaveApplication>().eq(LeaveApplication::getAppId, appId));
            detail.put("detail", leave);
        } else if ("reimburse".equals(application.getAppType())) {
            ReimburseApplication reimburse = reimburseApplicationMapper.selectOne(
                    new LambdaQueryWrapper<ReimburseApplication>().eq(ReimburseApplication::getAppId, appId));
            detail.put("detail", reimburse);
        }

        // 查询审批历史
        java.util.List<com.approval.module.approval.entity.History> histories = historyMapper.selectList(
                new LambdaQueryWrapper<com.approval.module.approval.entity.History>()
                        .eq(com.approval.module.approval.entity.History::getAppId, appId)
                        .orderByDesc(com.approval.module.approval.entity.History::getCreateTime));
        detail.put("history", histories);

        return detail;
    }

        @Override
        public ApplicationSummaryVo getMySummary(Long userId) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }

        List<Application> applications = applicationMapper.selectList(
            new LambdaQueryWrapper<Application>().eq(Application::getApplicantId, userId));

        long totalCount = applications.size();
        long pendingCount = applications.stream().filter(app -> Integer.valueOf(1).equals(app.getStatus())).count();
        long approvedCount = applications.stream().filter(app -> Integer.valueOf(STATUS_APPROVED).equals(app.getStatus())).count();
        long rejectedCount = applications.stream().filter(app -> Integer.valueOf(4).equals(app.getStatus())).count();
        long withdrawnCount = applications.stream().filter(app -> Integer.valueOf(5).equals(app.getStatus())).count();

        List<Long> leaveAppIds = applications.stream()
            .filter(app -> "leave".equals(app.getAppType()))
            .map(Application::getAppId)
            .collect(Collectors.toList());
        List<Long> approvedLeaveAppIds = applications.stream()
            .filter(app -> "leave".equals(app.getAppType()) && Integer.valueOf(STATUS_APPROVED).equals(app.getStatus()))
            .map(Application::getAppId)
            .collect(Collectors.toList());
        List<Long> reimburseAppIds = applications.stream()
            .filter(app -> "reimburse".equals(app.getAppType()))
            .map(Application::getAppId)
            .collect(Collectors.toList());
        List<Long> approvedReimburseAppIds = applications.stream()
            .filter(app -> "reimburse".equals(app.getAppType()) && Integer.valueOf(STATUS_APPROVED).equals(app.getStatus()))
            .map(Application::getAppId)
            .collect(Collectors.toList());

        long leaveCount = leaveAppIds.size();
        long reimburseCount = reimburseAppIds.size();

        BigDecimal totalLeaveDays = approvedLeaveAppIds.isEmpty() ? BigDecimal.ZERO :
            leaveApplicationMapper.selectList(new LambdaQueryWrapper<LeaveApplication>()
                .in(LeaveApplication::getAppId, approvedLeaveAppIds))
                .stream()
                .map(LeaveApplication::getDays)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalReimburseAmount = approvedReimburseAppIds.isEmpty() ? BigDecimal.ZERO :
            reimburseApplicationMapper.selectList(new LambdaQueryWrapper<ReimburseApplication>()
                .in(ReimburseApplication::getAppId, approvedReimburseAppIds))
                .stream()
                .map(ReimburseApplication::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal approvalRate = totalCount == 0 ? BigDecimal.ZERO
            : BigDecimal.valueOf(approvedCount)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(totalCount), 2, RoundingMode.HALF_UP);

        LocalDateTime lastSubmitTime = applications.stream()
            .map(Application::getSubmitTime)
            .filter(Objects::nonNull)
            .max(LocalDateTime::compareTo)
            .orElse(null);

        com.approval.module.system.entity.Dept dept = user.getDeptId() != null
            ? deptMapper.selectById(user.getDeptId())
            : null;
        com.approval.module.system.entity.Post post = user.getPostId() != null
            ? postMapper.selectById(user.getPostId())
            : null;

        return ApplicationSummaryVo.builder()
            .userId(userId)
            .realName(user.getRealName())
            .deptName(dept != null ? dept.getDeptName() : "")
            .postName(post != null ? post.getPostName() : "")
            .totalCount(totalCount)
            .pendingCount(pendingCount)
            .approvedCount(approvedCount)
            .rejectedCount(rejectedCount)
            .withdrawnCount(withdrawnCount)
            .leaveCount(leaveCount)
            .reimburseCount(reimburseCount)
            .totalLeaveDays(totalLeaveDays)
            .totalReimburseAmount(totalReimburseAmount)
            .approvalRate(approvalRate)
            .lastSubmitTime(lastSubmitTime)
            .build();
        }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void withdrawApplication(Long appId, Long userId) {
        Application application = applicationMapper.selectById(appId);

        if (application == null) {
            throw new BusinessException(404, "申请不存在");
        }

        if (!application.getApplicantId().equals(userId)) {
            throw new BusinessException(403, "只能撤回自己的申请");
        }

        if (application.getStatus() != 1) {
            throw new BusinessException("只能撤回待审批状态的申请");
        }

        application.setStatus(5); // 已撤回
        applicationMapper.updateById(application);

        // 删除待办任务
        taskMapper.delete(
                new LambdaQueryWrapper<com.approval.module.approval.entity.Task>()
                        .eq(com.approval.module.approval.entity.Task::getAppId, appId)
                        .eq(com.approval.module.approval.entity.Task::getStatus, 0));
    }

    /**
     * 生成申请单号
     * 格式：AP + yyyyMMdd + 6位流水号
     */
    private String generateAppNo() {
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        // 简化处理，实际应该查询当天最大流水号
        long count = applicationMapper.selectCount(null);
        String serial = String.format("%06d", count + 1);
        return "AP" + date + serial;
    }
}
