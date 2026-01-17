package com.approval.module.system.controller;

import com.approval.common.result.Result;
import com.approval.common.utils.JwtUtils;
import com.approval.module.system.dto.AssignRolesDto;
import com.approval.module.system.dto.DeptDto;
import com.approval.module.system.dto.PostDto;
import com.approval.module.system.dto.UserDto;
import com.approval.module.system.entity.Role;
import com.approval.module.system.entity.User;
import com.approval.module.system.mapper.UserMapper;
import com.approval.module.system.service.IAdminService;
import com.approval.module.system.vo.DeptVo;
import com.approval.module.system.vo.PostVo;
import com.approval.module.system.vo.UserVo;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "系统管理")
@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final IAdminService adminService;
    private final JwtUtils jwtUtils;
    private final UserMapper userMapper;

    @Operation(summary = "获取用户列表")
    @GetMapping("/users")
    public Result<Page<UserVo>> getUserList(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String realName,
            @RequestParam(required = false) Long deptId,
            @RequestParam(required = false) Integer status) {
        Page<UserVo> page = adminService.getUserList(pageNum, pageSize, username, realName, deptId, status);
        return Result.success(page);
    }

    @Operation(summary = "获取用户详情")
    @GetMapping("/users/{userId}")
    public Result<UserVo> getUserById(@PathVariable Long userId) {
        UserVo user = adminService.getUserById(userId);
        return Result.success(user);
    }

    @Operation(summary = "创建用户")
    @PostMapping("/users")
    public Result<Void> createUser(@Valid @RequestBody UserDto dto) {
        adminService.createUser(dto);
        return Result.success();
    }

    @Operation(summary = "更新用户")
    @PutMapping("/users")
    public Result<Void> updateUser(@Valid @RequestBody UserDto dto) {
        adminService.updateUser(dto);
        return Result.success();
    }

    @Operation(summary = "删除用户")
    @DeleteMapping("/users/{userId}")
    public Result<Void> deleteUser(@PathVariable Long userId) {
        adminService.deleteUser(userId);
        return Result.success();
    }

    @Operation(summary = "获取部门列表")
    @GetMapping("/depts")
    public Result<Page<DeptVo>> getDeptList(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String deptName,
            @RequestParam(required = false) Integer status) {
        Page<DeptVo> page = adminService.getDeptList(pageNum, pageSize, deptName, status);
        return Result.success(page);
    }

    @Operation(summary = "获取部门详情")
    @GetMapping("/depts/{deptId}")
    public Result<DeptVo> getDeptById(@PathVariable Long deptId) {
        DeptVo dept = adminService.getDeptById(deptId);
        return Result.success(dept);
    }

    @Operation(summary = "创建部门")
    @PostMapping("/depts")
    public Result<Void> createDept(@Valid @RequestBody DeptDto dto) {
        adminService.createDept(dto);
        return Result.success();
    }

    @Operation(summary = "更新部门")
    @PutMapping("/depts")
    public Result<Void> updateDept(@Valid @RequestBody DeptDto dto) {
        adminService.updateDept(dto);
        return Result.success();
    }

    @Operation(summary = "删除部门")
    @DeleteMapping("/depts/{deptId}")
    public Result<Void> deleteDept(@PathVariable Long deptId) {
        adminService.deleteDept(deptId);
        return Result.success();
    }

    @Operation(summary = "获取岗位列表")
    @GetMapping("/posts")
    public Result<Page<PostVo>> getPostList(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String postName,
            @RequestParam(required = false) Integer status) {
        Page<PostVo> page = adminService.getPostList(pageNum, pageSize, postName, status);
        return Result.success(page);
    }

    @Operation(summary = "获取岗位详情")
    @GetMapping("/posts/{postId}")
    public Result<PostVo> getPostById(@PathVariable Long postId) {
        PostVo post = adminService.getPostById(postId);
        return Result.success(post);
    }

    @Operation(summary = "创建岗位")
    @PostMapping("/posts")
    public Result<Void> createPost(@Valid @RequestBody PostDto dto) {
        adminService.createPost(dto);
        return Result.success();
    }

    @Operation(summary = "更新岗位")
    @PutMapping("/posts")
    public Result<Void> updatePost(@Valid @RequestBody PostDto dto) {
        adminService.updatePost(dto);
        return Result.success();
    }

    @Operation(summary = "删除岗位")
    @DeleteMapping("/posts/{postId}")
    public Result<Void> deletePost(@PathVariable Long postId) {
        adminService.deletePost(postId);
        return Result.success();
    }

    @Operation(summary = "分配角色")
    @PostMapping("/users/roles")
    public Result<Void> assignRoles(@Valid @RequestBody AssignRolesDto dto) {
        adminService.assignRoles(dto);
        return Result.success();
    }

    @Operation(summary = "获取所有部门")
    @GetMapping("/depts/all")
    public Result<List<DeptVo>> getAllDepts() {
        List<DeptVo> depts = adminService.getAllDepts();
        return Result.success(depts);
    }

    @Operation(summary = "获取所有岗位")
    @GetMapping("/posts/all")
    public Result<List<PostVo>> getAllPosts() {
        List<PostVo> posts = adminService.getAllPosts();
        return Result.success(posts);
    }

    @Operation(summary = "获取所有角色")
    @GetMapping("/roles/all")
    public Result<List<Role>> getAllRoles() {
        List<Role> roles = adminService.getAllRoles();
        return Result.success(roles);
    }

    private Long getUserIdFromToken(String token) {
        String actualToken = token.replace("Bearer ", "");
        String username = jwtUtils.getUsernameFromToken(actualToken);
        User user = userMapper.selectOne(
                new LambdaQueryWrapper<User>().eq(User::getUsername, username));
        return user != null ? user.getUserId() : null;
    }
}
