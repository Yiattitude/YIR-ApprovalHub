package com.approval.module.auth.vo;

import lombok.Data;

import java.util.List;

/**
 * 登录响应VO
 */
@Data
public class LoginVo {

    private String token;

    private UserInfoVo userInfo;

    @Data
    public static class UserInfoVo {
        private Long userId;
        private String username;
        private String realName;
        private String avatar;
        private Long deptId;
        private String deptName;
        private Long postId;
        private String postName;
        private List<String> permissions;
    }
}
