package com.approval.module.system.mapper;

import com.approval.module.system.entity.Role;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 角色Mapper
 */
@Mapper
public interface RoleMapper extends BaseMapper<Role> {

    /**
     * 根据用户ID查询用户角色列表
     */
    @Select("SELECT r.role_key FROM sys_role r " +
            "INNER JOIN sys_user_role ur ON r.role_id = ur.role_id " +
            "WHERE ur.user_id = #{userId} AND r.status = 1 AND r.del_flag = 0")
    List<String> selectRoleKeysByUserId(@Param("userId") Long userId);
}

