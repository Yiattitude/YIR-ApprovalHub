package com.approval.module.system.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DeptDto {

    private Long deptId;

    private Long parentId;

    @NotBlank(message = "部门名称不能为空")
    private String deptName;

    private String leader;

    private String phone;

    @Email(message = "邮箱格式不正确")
    private String email;

    private Integer orderNum;

    private Integer status;
}
