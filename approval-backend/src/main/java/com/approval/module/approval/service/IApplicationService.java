package com.approval.module.approval.service;

import com.approval.module.approval.dto.CreateLeaveDto;
import com.approval.module.approval.dto.CreateReimburseDto;
import com.approval.module.approval.vo.ApproverOptionVo;
import com.approval.module.approval.vo.ApplicationHistoryVo;
import com.approval.module.approval.vo.ApplicationSummaryVo;
import com.approval.module.approval.vo.ApplicationVo;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 申请服务接口
 */
public interface IApplicationService {

    /**
     * 创建请假申请
     */
    Long createLeaveApplication(CreateLeaveDto dto, Long userId);

    /**
     * 创建报销申请
     */
    Long createReimburseApplication(CreateReimburseDto dto, Long userId);

    /**
     * 查询我的申请列表
     */
    Page<ApplicationVo> getMyApplications(Long userId, Integer pageNum, Integer pageSize,
            String appType, Integer status);

        /**
         * 查询审批历史
         */
            Page<ApplicationHistoryVo> getMyHistoryApplications(Long userId, Integer pageNum, Integer pageSize,
                String appType, LocalDateTime startTime, LocalDateTime endTime, String approverName,
                Integer leaveType, Integer expenseType, Integer status);

        /**
         * 获取申请统计
         */
        ApplicationSummaryVo getMySummary(Long userId);

    /**
     * 查询申请详情
     */
    Object getApplicationDetail(Long appId);

    /**
     * 撤回申请
     */
    void withdrawApplication(Long appId, Long userId);

    /**
     * 查询部门审批人
     */
    List<ApproverOptionVo> getDeptApprovers(Long userId, Long deptId);
}
