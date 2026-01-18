package com.approval.module.system.vo;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class PostVo {

    private Long postId;

    private String postCode;

    private String postName;

    private Integer postSort;

    private Integer status;

    private LocalDateTime createTime;

    private List<PermissionVo> permissions;
}
