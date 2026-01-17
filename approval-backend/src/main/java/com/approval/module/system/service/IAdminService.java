package com.approval.module.system.service;

import com.approval.module.system.dto.AssignRolesDto;
import com.approval.module.system.dto.DeptDto;
import com.approval.module.system.dto.PostDto;
import com.approval.module.system.dto.UserDto;
import com.approval.module.system.vo.DeptVo;
import com.approval.module.system.vo.PostVo;
import com.approval.module.system.vo.UserVo;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;

public interface IAdminService {

    Page<UserVo> getUserList(Integer pageNum, Integer pageSize, String username, String realName, Long deptId, Integer status);

    UserVo getUserById(Long userId);

    void createUser(UserDto dto);

    void updateUser(UserDto dto);

    void deleteUser(Long userId);

    Page<DeptVo> getDeptList(Integer pageNum, Integer pageSize, String deptName, Integer status);

    DeptVo getDeptById(Long deptId);

    void createDept(DeptDto dto);

    void updateDept(DeptDto dto);

    void deleteDept(Long deptId);

    Page<PostVo> getPostList(Integer pageNum, Integer pageSize, String postName, Integer status);

    PostVo getPostById(Long postId);

    void createPost(PostDto dto);

    void updatePost(PostDto dto);

    void deletePost(Long postId);

    void assignRoles(AssignRolesDto dto);

    java.util.List<DeptVo> getAllDepts();

    java.util.List<PostVo> getAllPosts();

    java.util.List<com.approval.module.system.entity.Role> getAllRoles();
}
