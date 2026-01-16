package com.approval.module.system.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 角色实体
 */
@Data
@TableName("sys_role")
public class Role {

    @TableId(type = IdType.AUTO)
    private Long roleId;

    private String roleName;

    private String roleKey;

    private Integer roleSort;

    private Integer status;

    @TableLogic
    private Integer delFlag;

    private String remark;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}

