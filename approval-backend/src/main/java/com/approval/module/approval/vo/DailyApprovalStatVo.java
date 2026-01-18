package com.approval.module.approval.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 按天统计审批任务数量
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyApprovalStatVo {

    /**
     * 日期，格式：yyyy-MM-dd
     */
    private String date;

    /**
     * 当日审批任务数量
     */
    private Long count;
}
