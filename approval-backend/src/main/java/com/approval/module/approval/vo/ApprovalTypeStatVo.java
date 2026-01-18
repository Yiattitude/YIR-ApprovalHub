package com.approval.module.approval.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 各申请类型审批统计
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalTypeStatVo {

    private String appType;

    private String typeLabel;

    private Long count;
}
