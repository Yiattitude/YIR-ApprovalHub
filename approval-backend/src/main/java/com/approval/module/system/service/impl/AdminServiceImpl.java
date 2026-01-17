package com.approval.module.system.service.impl;

import com.approval.common.exception.BusinessException;
import com.approval.module.system.dto.AssignRolesDto;
import com.approval.module.system.dto.DeptDto;
import com.approval.module.system.dto.PostDto;
import com.approval.module.system.dto.UserDto;
import com.approval.module.system.entity.Dept;
import com.approval.module.system.entity.Post;
import com.approval.module.system.entity.Role;
import com.approval.module.system.entity.User;
import com.approval.module.system.mapper.DeptMapper;
import com.approval.module.system.mapper.PostMapper;
import com.approval.module.system.mapper.RoleMapper;
import com.approval.module.system.mapper.UserMapper;
import com.approval.module.system.service.IAdminService;
import com.approval.module.system.vo.DeptVo;
import com.approval.module.system.vo.PostVo;
import com.approval.module.system.vo.UserVo;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements IAdminService {

    private final UserMapper userMapper;
    private final DeptMapper deptMapper;
    private final PostMapper postMapper;
    private final RoleMapper roleMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    public Page<UserVo> getUserList(Integer pageNum, Integer pageSize, String username, String realName, Long deptId, Integer status) {
        Page<User> page = new Page<>(pageNum, pageSize);

        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(username != null && !username.isEmpty(), User::getUsername, username)
                .like(realName != null && !realName.isEmpty(), User::getRealName, realName)
                .eq(deptId != null, User::getDeptId, deptId)
                .eq(status != null, User::getStatus, status)
                .orderByDesc(User::getCreateTime);

        Page<User> userPage = userMapper.selectPage(page, wrapper);
        Page<UserVo> voPage = new Page<>(userPage.getCurrent(), userPage.getSize(), userPage.getTotal());

        voPage.setRecords(userPage.getRecords().stream().map(user -> {
            UserVo vo = convertToUserVo(user);
            return vo;
        }).collect(Collectors.toList()));

        return voPage;
    }

    @Override
    public UserVo getUserById(Long userId) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(404, "用户不存在");
        }
        return convertToUserVo(user);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void createUser(UserDto dto) {
        User existUser = userMapper.selectOne(
                new LambdaQueryWrapper<User>().eq(User::getUsername, dto.getUsername()));
        if (existUser != null) {
            throw new BusinessException("用户名已存在");
        }

        User user = new User();
        user.setUsername(dto.getUsername());
        user.setPassword(passwordEncoder.encode(dto.getPassword() != null ? dto.getPassword() : "123456"));
        user.setRealName(dto.getRealName());
        user.setPhone(dto.getPhone());
        user.setEmail(dto.getEmail());
        user.setDeptId(dto.getDeptId());
        user.setPostId(dto.getPostId());
        user.setAvatar(dto.getAvatar());
        user.setStatus(dto.getStatus() != null ? dto.getStatus() : 1);

        userMapper.insert(user);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateUser(UserDto dto) {
        if (dto.getUserId() == null) {
            throw new BusinessException("用户ID不能为空");
        }

        User user = userMapper.selectById(dto.getUserId());
        if (user == null) {
            throw new BusinessException(404, "用户不存在");
        }

        if (dto.getUsername() != null && !dto.getUsername().equals(user.getUsername())) {
            User existUser = userMapper.selectOne(
                    new LambdaQueryWrapper<User>().eq(User::getUsername, dto.getUsername()));
            if (existUser != null) {
                throw new BusinessException("用户名已存在");
            }
        }

        user.setUsername(dto.getUsername());
        if (dto.getPassword() != null && !dto.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(dto.getPassword()));
        }
        user.setRealName(dto.getRealName());
        user.setPhone(dto.getPhone());
        user.setEmail(dto.getEmail());
        user.setDeptId(dto.getDeptId());
        user.setPostId(dto.getPostId());
        user.setAvatar(dto.getAvatar());
        user.setStatus(dto.getStatus());

        userMapper.updateById(user);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteUser(Long userId) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(404, "用户不存在");
        }

        if (userId == 1L) {
            throw new BusinessException("不能删除系统管理员");
        }

        userMapper.deleteById(userId);
    }

    @Override
    public Page<DeptVo> getDeptList(Integer pageNum, Integer pageSize, String deptName, Integer status) {
        Page<Dept> page = new Page<>(pageNum, pageSize);

        LambdaQueryWrapper<Dept> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(deptName != null && !deptName.isEmpty(), Dept::getDeptName, deptName)
                .eq(status != null, Dept::getStatus, status)
                .orderByAsc(Dept::getOrderNum);

        Page<Dept> deptPage = deptMapper.selectPage(page, wrapper);
        Page<DeptVo> voPage = new Page<>(deptPage.getCurrent(), deptPage.getSize(), deptPage.getTotal());

        voPage.setRecords(deptPage.getRecords().stream().map(dept -> {
            DeptVo vo = new DeptVo();
            org.springframework.beans.BeanUtils.copyProperties(dept, vo);

            if (dept.getParentId() != null && dept.getParentId() != 0) {
                Dept parentDept = deptMapper.selectById(dept.getParentId());
                if (parentDept != null) {
                    vo.setParentName(parentDept.getDeptName());
                }
            }

            return vo;
        }).collect(Collectors.toList()));

        return voPage;
    }

    @Override
    public DeptVo getDeptById(Long deptId) {
        Dept dept = deptMapper.selectById(deptId);
        if (dept == null) {
            throw new BusinessException(404, "部门不存在");
        }

        DeptVo vo = new DeptVo();
        org.springframework.beans.BeanUtils.copyProperties(dept, vo);

        if (dept.getParentId() != null && dept.getParentId() != 0) {
            Dept parentDept = deptMapper.selectById(dept.getParentId());
            if (parentDept != null) {
                vo.setParentName(parentDept.getDeptName());
            }
        }

        return vo;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void createDept(DeptDto dto) {
        if (dto.getParentId() != null && dto.getParentId() != 0) {
            Dept parentDept = deptMapper.selectById(dto.getParentId());
            if (parentDept == null) {
                throw new BusinessException("父部门不存在");
            }
        }

        Dept dept = new Dept();
        dept.setParentId(dto.getParentId() != null ? dto.getParentId() : 0L);
        dept.setDeptName(dto.getDeptName());
        dept.setLeader(dto.getLeader());
        dept.setPhone(dto.getPhone());
        dept.setEmail(dto.getEmail());
        dept.setOrderNum(dto.getOrderNum() != null ? dto.getOrderNum() : 0);
        dept.setStatus(dto.getStatus() != null ? dto.getStatus() : 1);

        deptMapper.insert(dept);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateDept(DeptDto dto) {
        if (dto.getDeptId() == null) {
            throw new BusinessException("部门ID不能为空");
        }

        Dept dept = deptMapper.selectById(dto.getDeptId());
        if (dept == null) {
            throw new BusinessException(404, "部门不存在");
        }

        if (dto.getParentId() != null && dto.getParentId() != 0) {
            if (dto.getParentId().equals(dto.getDeptId())) {
                throw new BusinessException("父部门不能是自己");
            }

            Dept parentDept = deptMapper.selectById(dto.getParentId());
            if (parentDept == null) {
                throw new BusinessException("父部门不存在");
            }
        }

        dept.setParentId(dto.getParentId() != null ? dto.getParentId() : 0L);
        dept.setDeptName(dto.getDeptName());
        dept.setLeader(dto.getLeader());
        dept.setPhone(dto.getPhone());
        dept.setEmail(dto.getEmail());
        dept.setOrderNum(dto.getOrderNum());
        dept.setStatus(dto.getStatus());

        deptMapper.updateById(dept);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteDept(Long deptId) {
        Dept dept = deptMapper.selectById(deptId);
        if (dept == null) {
            throw new BusinessException(404, "部门不存在");
        }

        Long childCount = deptMapper.selectCount(
                new LambdaQueryWrapper<Dept>().eq(Dept::getParentId, deptId));
        if (childCount > 0) {
            throw new BusinessException("存在子部门，无法删除");
        }

        Long userCount = userMapper.selectCount(
                new LambdaQueryWrapper<User>().eq(User::getDeptId, deptId));
        if (userCount > 0) {
            throw new BusinessException("部门下存在用户，无法删除");
        }

        deptMapper.deleteById(deptId);
    }

    @Override
    public Page<PostVo> getPostList(Integer pageNum, Integer pageSize, String postName, Integer status) {
        Page<Post> page = new Page<>(pageNum, pageSize);

        LambdaQueryWrapper<Post> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(postName != null && !postName.isEmpty(), Post::getPostName, postName)
                .eq(status != null, Post::getStatus, status)
                .orderByAsc(Post::getPostSort);

        Page<Post> postPage = postMapper.selectPage(page, wrapper);
        Page<PostVo> voPage = new Page<>(postPage.getCurrent(), postPage.getSize(), postPage.getTotal());

        voPage.setRecords(postPage.getRecords().stream().map(post -> {
            PostVo vo = new PostVo();
            org.springframework.beans.BeanUtils.copyProperties(post, vo);
            return vo;
        }).collect(Collectors.toList()));

        return voPage;
    }

    @Override
    public PostVo getPostById(Long postId) {
        Post post = postMapper.selectById(postId);
        if (post == null) {
            throw new BusinessException(404, "岗位不存在");
        }

        PostVo vo = new PostVo();
        org.springframework.beans.BeanUtils.copyProperties(post, vo);
        return vo;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void createPost(PostDto dto) {
        Post existPost = postMapper.selectOne(
                new LambdaQueryWrapper<Post>().eq(Post::getPostCode, dto.getPostCode()));
        if (existPost != null) {
            throw new BusinessException("岗位编码已存在");
        }

        Post post = new Post();
        post.setPostCode(dto.getPostCode());
        post.setPostName(dto.getPostName());
        post.setPostSort(dto.getPostSort() != null ? dto.getPostSort() : 0);
        post.setStatus(dto.getStatus() != null ? dto.getStatus() : 1);

        postMapper.insert(post);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updatePost(PostDto dto) {
        if (dto.getPostId() == null) {
            throw new BusinessException("岗位ID不能为空");
        }

        Post post = postMapper.selectById(dto.getPostId());
        if (post == null) {
            throw new BusinessException(404, "岗位不存在");
        }

        if (dto.getPostCode() != null && !dto.getPostCode().equals(post.getPostCode())) {
            Post existPost = postMapper.selectOne(
                    new LambdaQueryWrapper<Post>().eq(Post::getPostCode, dto.getPostCode()));
            if (existPost != null) {
                throw new BusinessException("岗位编码已存在");
            }
        }

        post.setPostCode(dto.getPostCode());
        post.setPostName(dto.getPostName());
        post.setPostSort(dto.getPostSort());
        post.setStatus(dto.getStatus());

        postMapper.updateById(post);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deletePost(Long postId) {
        Post post = postMapper.selectById(postId);
        if (post == null) {
            throw new BusinessException(404, "岗位不存在");
        }

        Long userCount = userMapper.selectCount(
                new LambdaQueryWrapper<User>().eq(User::getPostId, postId));
        if (userCount > 0) {
            throw new BusinessException("岗位下存在用户，无法删除");
        }

        postMapper.deleteById(postId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void assignRoles(AssignRolesDto dto) {
        User user = userMapper.selectById(dto.getUserId());
        if (user == null) {
            throw new BusinessException(404, "用户不存在");
        }

        for (Long roleId : dto.getRoleIds()) {
            Role role = roleMapper.selectById(roleId);
            if (role == null) {
                throw new BusinessException("角色不存在");
            }
        }

        userMapper.deleteUserRole(dto.getUserId());

        for (Long roleId : dto.getRoleIds()) {
            userMapper.insertUserRole(dto.getUserId(), roleId);
        }
    }

    @Override
    public List<DeptVo> getAllDepts() {
        List<Dept> depts = deptMapper.selectList(
                new LambdaQueryWrapper<Dept>().eq(Dept::getStatus, 1).orderByAsc(Dept::getOrderNum));
        return depts.stream().map(dept -> {
            DeptVo vo = new DeptVo();
            org.springframework.beans.BeanUtils.copyProperties(dept, vo);
            return vo;
        }).collect(Collectors.toList());
    }

    @Override
    public List<PostVo> getAllPosts() {
        List<Post> posts = postMapper.selectList(
                new LambdaQueryWrapper<Post>().eq(Post::getStatus, 1).orderByAsc(Post::getPostSort));
        return posts.stream().map(post -> {
            PostVo vo = new PostVo();
            org.springframework.beans.BeanUtils.copyProperties(post, vo);
            return vo;
        }).collect(Collectors.toList());
    }

    @Override
    public List<Role> getAllRoles() {
        return roleMapper.selectList(
                new LambdaQueryWrapper<Role>().eq(Role::getStatus, 1).orderByAsc(Role::getRoleSort));
    }

    private UserVo convertToUserVo(User user) {
        UserVo vo = new UserVo();
        org.springframework.beans.BeanUtils.copyProperties(user, vo);

        if (user.getDeptId() != null) {
            Dept dept = deptMapper.selectById(user.getDeptId());
            if (dept != null) {
                vo.setDeptName(dept.getDeptName());
            }
        }

        if (user.getPostId() != null) {
            Post post = postMapper.selectById(user.getPostId());
            if (post != null) {
                vo.setPostName(post.getPostName());
            }
        }

        List<String> roles = userMapper.selectRolesByUserId(user.getUserId());
        vo.setRoles(roles);

        return vo;
    }
}
