package com.approval.module.system.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PostVo {

    private Long postId;

    private String postCode;

    private String postName;

    private Integer postSort;

    private Integer status;

    private LocalDateTime createTime;
}
