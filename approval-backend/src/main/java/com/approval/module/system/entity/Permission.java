package com.approval.module.system.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 权限实体
 */
@Data
@TableName("sys_permission")
public class Permission {

    @TableId(type = IdType.AUTO)
    private Long permissionId;

    private String permissionCode;

    private String permissionName;

    private String description;

    private Integer status;

    @TableLogic
    private Integer delFlag;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
