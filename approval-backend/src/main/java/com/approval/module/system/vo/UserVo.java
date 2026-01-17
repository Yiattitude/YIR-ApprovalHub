package com.approval.module.system.vo;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class UserVo {

    private Long userId;

    private String username;

    private String realName;

    private String phone;

    private String email;

    private Long deptId;

    private String deptName;

    private Long postId;

    private String postName;

    private String avatar;

    private Integer status;

    private List<String> roles;

    private LocalDateTime createTime;
}
