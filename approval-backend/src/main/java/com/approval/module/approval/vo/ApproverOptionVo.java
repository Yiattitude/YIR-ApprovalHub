package com.approval.module.approval.vo;

import lombok.Data;

/**
 * 部门审批人下拉选项
 */
@Data
public class ApproverOptionVo {

    private Long userId;

    private String realName;

    private Long deptId;

    private String deptName;

    private Long postId;

    private String postName;
}
