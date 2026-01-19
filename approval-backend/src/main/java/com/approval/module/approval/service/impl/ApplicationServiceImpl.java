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
import com.approval.module.approval.vo.ApproverOptionVo;
import com.approval.module.approval.vo.ApplicationHistoryVo;
import com.approval.module.approval.vo.ApplicationSummaryVo;
import com.approval.module.approval.vo.ApplicationVo;
import com.approval.module.system.entity.Dept;
import com.approval.module.system.entity.Post;
import com.approval.module.system.entity.User;
import com.approval.module.system.mapper.DeptMapper;
import com.approval.module.system.mapper.PermissionMapper;
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
    private final PermissionMapper permissionMapper;

    private static final int STATUS_APPROVED = 3;
    private static final List<Integer> HISTORY_STATUSES = Arrays.asList(STATUS_APPROVED, 4, 5);
    private static final String APPROVAL_PERMISSION_CODE = "APPROVAL_REVIEW";

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createLeaveApplication(CreateLeaveDto dto, Long userId) {
        // 1. 获取用户信息
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }
        if (user.getDeptId() == null) {
            throw new BusinessException("您尚未分配部门，暂时无法提交申请");
        }

        User approver = validateApprover(user, dto.getApproverId());
        Dept dept = deptMapper.selectById(user.getDeptId());
        String currentNode = dept != null ? dept.getDeptName() + "审批" : "部门审批";

        // 2. 创建申请主表
        Application application = new Application();
        application.setAppNo(generateAppNo());
        application.setAppType("leave");
        application.setTitle(
                "请假申请-" + (dto.getReason().length() > 10 ? dto.getReason().substring(0, 10) + "..." : dto.getReason()));
        application.setApplicantId(userId);
        application.setDeptId(user.getDeptId());
        application.setStatus(1); // 待审批
        application.setCurrentNode(currentNode);
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

        // 4. 创建审批任务
        createTask(application, approver.getUserId(), approver.getRealName());

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
        if (user.getDeptId() == null) {
            throw new BusinessException("您尚未分配部门，暂时无法提交申请");
        }

        User approver = validateApprover(user, dto.getApproverId());
        Dept dept = deptMapper.selectById(user.getDeptId());
        String currentNode = dept != null ? dept.getDeptName() + "审批" : "部门审批";

        // 2. 创建申请主表
        Application application = new Application();
        application.setAppNo(generateAppNo());
        application.setAppType("reimburse");
        application.setTitle(
                "报销申请-" + (dto.getReason().length() > 10 ? dto.getReason().substring(0, 10) + "..." : dto.getReason()));
        application.setApplicantId(userId);
        application.setDeptId(user.getDeptId());
        application.setStatus(1); // 待审批
        application.setCurrentNode(currentNode);
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
        createTask(application, approver.getUserId(), approver.getRealName());

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

    private User validateApprover(User applicant, Long approverId) {
        if (approverId == null) {
            throw new BusinessException("请选择审批人");
        }
        if (Objects.equals(applicant.getUserId(), approverId)) {
            throw new BusinessException("申请人不能审批自己的申请");
        }

        User approver = userMapper.selectById(approverId);
        if (approver == null || approver.getStatus() == null || approver.getStatus() == 0) {
            throw new BusinessException("审批人无效或已停用");
        }
        if (approver.getDeptId() == null || !Objects.equals(applicant.getDeptId(), approver.getDeptId())) {
            throw new BusinessException("审批人必须与申请人属于同一部门");
        }
        if (approver.getPostId() == null) {
            throw new BusinessException("审批人尚未分配岗位，无法处理审批");
        }

        List<String> permissions = permissionMapper.selectPermissionCodesByPostId(approver.getPostId());
        boolean hasApprovalPermission = permissions != null
                && permissions.stream().anyMatch(APPROVAL_PERMISSION_CODE::equals);
        if (!hasApprovalPermission) {
            throw new BusinessException("所选人员暂无审批权限");
        }
        return approver;
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
        List<Application> records = appPage.getRecords();

        List<Long> leaveAppIds = records.stream()
                .filter(app -> "leave".equals(app.getAppType()))
                .map(Application::getAppId)
                .collect(Collectors.toList());
        List<Long> reimburseAppIds = records.stream()
                .filter(app -> "reimburse".equals(app.getAppType()))
                .map(Application::getAppId)
                .collect(Collectors.toList());

        Map<Long, LeaveApplication> leaveMap = leaveAppIds.isEmpty()
                ? Collections.emptyMap()
                : leaveApplicationMapper.selectList(new LambdaQueryWrapper<LeaveApplication>()
                        .in(LeaveApplication::getAppId, leaveAppIds))
                        .stream()
                        .collect(Collectors.toMap(LeaveApplication::getAppId, leave -> leave));

        Map<Long, ReimburseApplication> reimburseMap = reimburseAppIds.isEmpty()
                ? Collections.emptyMap()
                : reimburseApplicationMapper.selectList(new LambdaQueryWrapper<ReimburseApplication>()
                        .in(ReimburseApplication::getAppId, reimburseAppIds))
                        .stream()
                        .collect(Collectors.toMap(ReimburseApplication::getAppId, reimburse -> reimburse));

        // 转换为VO
        Page<ApplicationVo> voPage = new Page<>(appPage.getCurrent(), appPage.getSize(), appPage.getTotal());

        // 批量获取申请人信息
        User user = userMapper.selectById(userId);
        String deptName = "";
        if (user != null && user.getDeptId() != null) {
            Dept userDept = deptMapper.selectById(user.getDeptId());
            deptName = userDept != null ? userDept.getDeptName() : "";
        }
        final String finalDeptName = deptName;

        voPage.setRecords(records.stream().map(app -> {
            ApplicationVo vo = new ApplicationVo();
            org.springframework.beans.BeanUtils.copyProperties(app, vo);
            vo.setApplicantName(user != null ? user.getRealName() : "");
            vo.setDeptName(finalDeptName != null && !finalDeptName.isEmpty() ? finalDeptName : "未分配");

            if ("leave".equals(app.getAppType())) {
                LeaveApplication leave = leaveMap.get(app.getAppId());
                if (leave != null) {
                    vo.setLeaveType(leave.getLeaveType());
                }
            } else if ("reimburse".equals(app.getAppType())) {
                ReimburseApplication reimburse = reimburseMap.get(app.getAppId());
                if (reimburse != null) {
                    vo.setExpenseType(reimburse.getExpenseType());
                }
            }

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
    public List<ApproverOptionVo> getDeptApprovers(Long userId, Long deptId) {
        User currentUser = userMapper.selectById(userId);
        if (currentUser == null) {
            throw new BusinessException("用户不存在");
        }

        Long targetDeptId = deptId != null ? deptId : currentUser.getDeptId();
        if (targetDeptId == null) {
            return Collections.emptyList();
        }

        List<User> candidates = userMapper.selectList(new LambdaQueryWrapper<User>()
                .eq(User::getDeptId, targetDeptId)
                .eq(User::getStatus, 1)
                .isNotNull(User::getPostId));
        if (candidates.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> postIds = candidates.stream()
                .map(User::getPostId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());

        Map<Long, Post> postMap = postIds.isEmpty()
                ? Collections.emptyMap()
                : postMapper.selectBatchIds(postIds).stream()
                        .filter(Objects::nonNull)
                .collect(Collectors.toMap(Post::getPostId, post -> post, (first, second) -> first));

        Map<Long, List<String>> permissionMap = new HashMap<>();
        for (Long postId : postIds) {
            List<String> codes = permissionMapper.selectPermissionCodesByPostId(postId);
            permissionMap.put(postId, codes != null ? codes : Collections.emptyList());
        }

        Dept dept = deptMapper.selectById(targetDeptId);
        String deptName = dept != null ? dept.getDeptName() : null;

        return candidates.stream()
                .filter(candidate -> {
                    List<String> codes = permissionMap.get(candidate.getPostId());
                    return codes != null && codes.contains(APPROVAL_PERMISSION_CODE);
                })
                .map(candidate -> {
                    ApproverOptionVo vo = new ApproverOptionVo();
                    vo.setUserId(candidate.getUserId());
                    vo.setRealName(candidate.getRealName());
                    vo.setDeptId(targetDeptId);
                    vo.setDeptName(deptName);
                    Post post = postMap.get(candidate.getPostId());
                    if (post != null) {
                        vo.setPostId(post.getPostId());
                        vo.setPostName(post.getPostName());
                    }
                    return vo;
                })
                .collect(Collectors.toList());
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
