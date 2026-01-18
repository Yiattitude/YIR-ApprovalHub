package com.approval.module.system.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AssignPostDto {

    @NotNull(message = "用户ID不能为空")
    private Long userId;

    @NotNull(message = "岗位ID不能为空")
    private Long postId;
}
