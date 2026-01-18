package com.approval.module.system.mapper;

import com.approval.module.system.entity.Permission;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface PermissionMapper extends BaseMapper<Permission> {

    @Select("SELECT p.* FROM sys_permission p " +
            "INNER JOIN sys_post_permission pp ON p.permission_id = pp.permission_id " +
            "WHERE pp.post_id = #{postId} AND p.status = 1 AND p.del_flag = 0")
    List<Permission> selectPermissionsByPostId(@Param("postId") Long postId);

    @Select("SELECT p.permission_code FROM sys_permission p " +
            "INNER JOIN sys_post_permission pp ON p.permission_id = pp.permission_id " +
            "WHERE pp.post_id = #{postId} AND p.status = 1 AND p.del_flag = 0")
    List<String> selectPermissionCodesByPostId(@Param("postId") Long postId);

    @Delete("DELETE FROM sys_post_permission WHERE post_id = #{postId}")
    void deletePostPermissions(@Param("postId") Long postId);

    @Insert("INSERT INTO sys_post_permission (post_id, permission_id) VALUES (#{postId}, #{permissionId})")
    void insertPostPermission(@Param("postId") Long postId, @Param("permissionId") Long permissionId);
}
