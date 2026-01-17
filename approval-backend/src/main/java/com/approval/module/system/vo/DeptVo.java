package com.approval.module.system.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DeptVo {

    private Long deptId;

    private Long parentId;

    private String parentName;

    private String deptName;

    private String leader;

    private String phone;

    private String email;

    private Integer orderNum;

    private Integer status;

    private LocalDateTime createTime;
}
