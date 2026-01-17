package com.approval.module.system.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class AssignRolesDto {

    private Long userId;

    @NotEmpty(message = "角色列表不能为空")
    private List<Long> roleIds;
}
