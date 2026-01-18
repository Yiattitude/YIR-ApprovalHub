-- =============================================
-- 审批系统数据库创建脚本
-- 版本：1.0
-- 创建时间：2026-01-14
-- =============================================

-- 1. 创建数据库
DROP DATABASE IF EXISTS approval_system;
CREATE DATABASE approval_system 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

USE approval_system;

-- =============================================
-- 系统管理表
-- =============================================

-- 2.1 用户表
CREATE TABLE sys_user (
    user_id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(200) NOT NULL COMMENT '密码（加密）',
    real_name VARCHAR(50) NOT NULL COMMENT '真实姓名',
    phone VARCHAR(20) COMMENT '手机号',
    email VARCHAR(100) COMMENT '邮箱',
    dept_id BIGINT COMMENT '部门ID',
    post_id BIGINT COMMENT '岗位ID',
    avatar VARCHAR(255) COMMENT '头像地址',
    status TINYINT DEFAULT 1 COMMENT '状态：0=禁用 1=启用',
    del_flag TINYINT DEFAULT 0 COMMENT '删除标志：0=正常 1=删除',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_username (username),
    INDEX idx_dept_id (dept_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 2.2 部门表
CREATE TABLE sys_dept (
    dept_id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '部门ID',
    parent_id BIGINT DEFAULT 0 COMMENT '父部门ID（0表示根部门）',
    dept_name VARCHAR(50) NOT NULL COMMENT '部门名称',
    leader VARCHAR(50) COMMENT '负责人',
    phone VARCHAR(20) COMMENT '联系电话',
    email VARCHAR(100) COMMENT '邮箱',
    order_num INT DEFAULT 0 COMMENT '显示顺序',
    status TINYINT DEFAULT 1 COMMENT '状态：0=禁用 1=启用',
    del_flag TINYINT DEFAULT 0 COMMENT '删除标志：0=正常 1=删除',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_parent_id (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='部门表';

-- 2.3 岗位表
CREATE TABLE sys_post (
    post_id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '岗位ID',
    post_code VARCHAR(50) NOT NULL UNIQUE COMMENT '岗位编码',
    post_name VARCHAR(50) NOT NULL COMMENT '岗位名称',
    post_sort INT DEFAULT 0 COMMENT '显示顺序',
    status TINYINT DEFAULT 1 COMMENT '状态：0=禁用 1=启用',
    del_flag TINYINT DEFAULT 0 COMMENT '删除标志：0=正常 1=删除',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='岗位表';

-- 2.4 角色表
CREATE TABLE sys_role (
    role_id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '角色ID',
    role_name VARCHAR(50) NOT NULL COMMENT '角色名称',
    role_key VARCHAR(50) NOT NULL UNIQUE COMMENT '角色权限字符串',
    role_sort INT DEFAULT 0 COMMENT '显示顺序',
    status TINYINT DEFAULT 1 COMMENT '状态：0=禁用 1=启用',
    del_flag TINYINT DEFAULT 0 COMMENT '删除标志：0=正常 1=删除',
    remark VARCHAR(500) COMMENT '备注',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表';

-- 2.5 用户角色关联表
CREATE TABLE sys_user_role (
    user_id BIGINT NOT NULL COMMENT '用户ID',
    role_id BIGINT NOT NULL COMMENT '角色ID',
    PRIMARY KEY (user_id, role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户角色关联表';

-- 2.6 权限表
CREATE TABLE sys_permission (
    permission_id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '权限ID',
    permission_code VARCHAR(100) NOT NULL UNIQUE COMMENT '权限编码',
    permission_name VARCHAR(100) NOT NULL COMMENT '权限名称',
    description VARCHAR(255) COMMENT '权限描述',
    status TINYINT DEFAULT 1 COMMENT '状态：0=禁用 1=启用',
    del_flag TINYINT DEFAULT 0 COMMENT '删除标志：0=正常 1=删除',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='权限表';

-- 2.7 岗位权限关联表
CREATE TABLE sys_post_permission (
    post_id BIGINT NOT NULL COMMENT '岗位ID',
    permission_id BIGINT NOT NULL COMMENT '权限ID',
    PRIMARY KEY (post_id, permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='岗位权限关联表';

-- =============================================
-- 审批业务表
-- =============================================

-- 3.1 审批申请主表
CREATE TABLE bpm_application (
    app_id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '申请ID',
    app_no VARCHAR(50) NOT NULL UNIQUE COMMENT '申请单号',
    app_type VARCHAR(20) NOT NULL COMMENT '申请类型：leave=请假 reimburse=报销',
    title VARCHAR(200) NOT NULL COMMENT '申请标题',
    applicant_id BIGINT NOT NULL COMMENT '申请人ID',
    dept_id BIGINT COMMENT '申请人部门ID',
    status TINYINT DEFAULT 1 COMMENT '状态：0=草稿 1=待审批 2=审批中 3=已通过 4=已拒绝 5=已撤回',
    current_node VARCHAR(100) COMMENT '当前审批节点',
    submit_time DATETIME COMMENT '提交时间',
    finish_time DATETIME COMMENT '完成时间',
    del_flag TINYINT DEFAULT 0 COMMENT '删除标志：0=正常 1=删除',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_applicant_id (applicant_id),
    INDEX idx_status (status),
    INDEX idx_app_type (app_type),
    INDEX idx_submit_time (submit_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='审批申请主表';

-- 3.2 请假申请表
CREATE TABLE bpm_leave_application (
    leave_id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '请假ID',
    app_id BIGINT NOT NULL COMMENT '申请ID',
    leave_type TINYINT NOT NULL COMMENT '请假类型：1=事假 2=病假 3=年假 4=调休',
    start_time DATETIME NOT NULL COMMENT '开始时间',
    end_time DATETIME NOT NULL COMMENT '结束时间',
    days DECIMAL(5,2) NOT NULL COMMENT '请假天数',
    reason VARCHAR(500) NOT NULL COMMENT '请假事由',
    attachment VARCHAR(255) COMMENT '附件地址',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_app_id (app_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='请假申请表';

-- 3.3 报销申请表
CREATE TABLE bpm_reimburse_application (
    reimburse_id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '报销ID',
    app_id BIGINT NOT NULL COMMENT '申请ID',
    expense_type TINYINT NOT NULL COMMENT '费用类型：1=差旅费 2=餐饮费 3=办公费 4=其他',
    amount DECIMAL(10,2) NOT NULL COMMENT '报销金额',
    reason VARCHAR(500) NOT NULL COMMENT '报销事由',
    invoice_attachment VARCHAR(255) NOT NULL COMMENT '发票附件',
    occur_date DATE COMMENT '发生日期',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_app_id (app_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='报销申请表';

-- 3.4 审批任务表
CREATE TABLE bpm_task (
    task_id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '任务ID',
    app_id BIGINT NOT NULL COMMENT '申请ID',
    node_name VARCHAR(100) NOT NULL COMMENT '节点名称',
    assignee_id BIGINT NOT NULL COMMENT '审批人ID',
    assignee_name VARCHAR(50) COMMENT '审批人姓名',
    status TINYINT DEFAULT 0 COMMENT '状态：0=待处理 1=已处理',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    finish_time DATETIME COMMENT '完成时间',
    INDEX idx_app_id (app_id),
    INDEX idx_assignee_id (assignee_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='审批任务表';

-- 3.5 审批历史表
CREATE TABLE bpm_history (
    history_id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '历史ID',
    app_id BIGINT NOT NULL COMMENT '申请ID',
    task_id BIGINT COMMENT '任务ID',
    node_name VARCHAR(100) NOT NULL COMMENT '节点名称',
    approver_id BIGINT COMMENT '审批人ID',
    approver_name VARCHAR(50) COMMENT '审批人姓名',
    action TINYINT COMMENT '审批动作：1=同意 2=拒绝',
    comment VARCHAR(500) COMMENT '审批意见',
    approve_time DATETIME COMMENT '审批时间',
    next_node VARCHAR(100) COMMENT '下一节点',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_app_id (app_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='审批历史表';

-- =============================================
-- 文件管理表
-- =============================================

-- 4.1 文件表
CREATE TABLE sys_file (
    file_id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '文件ID',
    file_name VARCHAR(255) NOT NULL COMMENT '文件名',
    file_path VARCHAR(500) NOT NULL COMMENT '文件路径',
    file_size BIGINT COMMENT '文件大小（字节）',
    file_type VARCHAR(50) COMMENT '文件类型',
    business_type VARCHAR(50) COMMENT '业务类型',
    business_id BIGINT COMMENT '业务ID',
    uploader_id BIGINT COMMENT '上传人ID',
    del_flag TINYINT DEFAULT 0 COMMENT '删除标志：0=正常 1=删除',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_business (business_type, business_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文件表';

-- =============================================
-- 可选功能表（暂不创建，预留）
-- =============================================

-- 动态表单模板表
CREATE TABLE bpm_form_template (
    template_id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '模板ID',
    template_name VARCHAR(100) NOT NULL COMMENT '模板名称',
    template_key VARCHAR(50) NOT NULL UNIQUE COMMENT '模板标识',
    form_config TEXT COMMENT '表单配置（JSON）',
    status TINYINT DEFAULT 1 COMMENT '状态：0=禁用 1=启用',
    del_flag TINYINT DEFAULT 0 COMMENT '删除标志：0=正常 1=删除',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='表单模板表';

-- 动态流程模板表
CREATE TABLE bpm_process_template (
    template_id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '模板ID',
    template_name VARCHAR(100) NOT NULL COMMENT '模板名称',
    template_key VARCHAR(50) NOT NULL UNIQUE COMMENT '模板标识',
    process_config TEXT COMMENT '流程配置（JSON/BPMN）',
    status TINYINT DEFAULT 1 COMMENT '状态：0=禁用 1=启用',
    del_flag TINYINT DEFAULT 0 COMMENT '删除标志：0=正常 1=删除',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='流程模板表';

-- =============================================
-- 脚本执行完成提示
-- =============================================
SELECT '✅ 数据库表结构创建完成！' AS message;
