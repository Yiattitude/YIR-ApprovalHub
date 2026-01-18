package com.approval.module.approval.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 按月份统计审批任务
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyApprovalStatVo {

    /**
     * 月份，例如 2026-01
     */
    private String month;

    /**
     * 当月审批任务数量
     */
    private Long count;
}
