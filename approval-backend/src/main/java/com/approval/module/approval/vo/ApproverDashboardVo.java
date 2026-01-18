package com.approval.module.approval.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 审批人仪表盘数据
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApproverDashboardVo {

    private String realName;

    private String deptName;

    private String postName;

    private Long totalCount;

    private Long approvedCount;

    private Long rejectedCount;

    private List<ApprovalTypeStatVo> typeStats;

    private List<DailyApprovalStatVo> dailyStats;
}
