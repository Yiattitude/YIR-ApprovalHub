package com.approval.module.auth.service.impl;

import com.approval.common.exception.BusinessException;
import com.approval.common.utils.JwtUtils;
import com.approval.module.auth.dto.LoginDto;
import com.approval.module.auth.dto.RegisterDto;
import com.approval.module.auth.service.IAuthService;
import com.approval.module.auth.vo.LoginVo;
import com.approval.module.system.entity.User;
import com.approval.module.system.entity.Post;
import com.approval.module.system.mapper.PermissionMapper;
import com.approval.module.system.mapper.PostMapper;
import com.approval.module.system.mapper.UserMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

/**
 * 认证服务实现
 */
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements IAuthService {

    private final UserMapper userMapper;
    private final PostMapper postMapper;
    private final PermissionMapper permissionMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public LoginVo register(RegisterDto dto) {
        // 1. 验证两次密码是否一致
        if (!dto.getPassword().equals(dto.getConfirmPassword())) {
            throw new BusinessException("两次密码输入不一致");
        }

        // 2. 检查用户名是否已存在
        Long count = userMapper.selectCount(
                new LambdaQueryWrapper<User>()
                        .eq(User::getUsername, dto.getUsername()));
        if (count > 0) {
            throw new BusinessException("用户名已存在");
        }

        // 3. 创建用户
        User user = new User();
        user.setUsername(dto.getUsername());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setRealName(dto.getRealName());
        user.setPhone(dto.getPhone());
        user.setEmail(dto.getEmail());
        user.setStatus(1); // 默认启用

        userMapper.insert(user);

        // 4. 生成Token并返回（注册成功后自动登录）
        String token = jwtUtils.generateToken(user.getUsername());

        LoginVo loginVo = new LoginVo();
        loginVo.setToken(token);
        loginVo.setUserInfo(buildUserInfo(user));

        return loginVo;
    }

    @Override
    public LoginVo login(LoginDto dto) {
        // 1. 查询用户
        User user = userMapper.selectOne(
                new LambdaQueryWrapper<User>()
                        .eq(User::getUsername, dto.getUsername()));

        if (user == null) {
            throw new BusinessException(401, "用户名或密码错误");
        }

        // 2. 验证密码
        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            throw new BusinessException(401, "用户名或密码错误");
        }

        // 3. 检查用户状态
        if (user.getStatus() == 0) {
            throw new BusinessException(403, "账号已被禁用");
        }

        // 4. 生成Token
        String token = jwtUtils.generateToken(user.getUsername());

        LoginVo loginVo = new LoginVo();
        loginVo.setToken(token);
        loginVo.setUserInfo(buildUserInfo(user));

        return loginVo;
    }

    @Override
    public LoginVo.UserInfoVo getUserInfo(String username) {
        User user = userMapper.selectOne(
                new LambdaQueryWrapper<User>()
                        .eq(User::getUsername, username));

        if (user == null) {
            throw new BusinessException(404, "用户不存在");
        }

        return buildUserInfo(user);
    }

    /**
     * 构建用户信息VO
     */
    private LoginVo.UserInfoVo buildUserInfo(User user) {
        LoginVo.UserInfoVo userInfo = new LoginVo.UserInfoVo();
        userInfo.setUserId(user.getUserId());
        userInfo.setUsername(user.getUsername());
        userInfo.setRealName(user.getRealName());
        userInfo.setAvatar(user.getAvatar());
        
        if (user.getPostId() != null) {
            Post post = postMapper.selectById(user.getPostId());
            if (post != null) {
                userInfo.setPostId(post.getPostId());
                userInfo.setPostName(post.getPostName());
            }
        }

        List<String> permissions = user.getPostId() != null
                ? permissionMapper.selectPermissionCodesByPostId(user.getPostId())
                : Collections.emptyList();
        if (permissions == null || permissions.isEmpty()) {
            permissions = Collections.singletonList("BASIC_APPLICANT");
        }
        userInfo.setPermissions(permissions);
        
        return userInfo;
    }
}
