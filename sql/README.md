# 数据库初始化指南

## 📋 概述

本文档说明如何初始化审批系统数据库。

## 🔧 环境要求

- MySQL 8.0+
- MySQL客户端工具（MySQL Workbench / Navicat / 命令行）

## 📁 SQL 脚本说明

| 文件名 | 说明 | 执行顺序 |
|--------|------|----------|
| `01-create-tables.sql` | 创建数据库和所有表结构 | 1 |
| `02-init-data.sql` | 插入初始数据（用户、部门、角色等） | 2 |

---

## 🚀 快速开始

### 方法一：使用 MySQL 命令行（推荐）

```bash
# 1. 登录 MySQL
mysql -u root -p

# 2. 执行建表脚本
mysql> source e:/CSProject/审批系统-new/YIR-ApprovalHub/sql/01-create-tables.sql;

# 3. 执行初始数据脚本
mysql> source e:/CSProject/审批系统-new/YIR-ApprovalHub/sql/02-init-data.sql;

# 4. 验证
mysql> USE approval_system;
mysql> SHOW TABLES;
mysql> SELECT * FROM sys_user;
```

### 方法二：使用 MySQL Workbench

1. 打开 MySQL Workbench
2. 连接到 MySQL 服务器
3. 点击 `File` → `Open SQL Script`
4. 依次打开并执行：
   - `01-create-tables.sql`
   - `02-init-data.sql`
5. 查看执行结果

### 方法三：使用 Navicat   

1. 打开 Navicat
2. 连接到 MySQL
3. 点击 `查询` → `新建查询`
4. 复制脚本内容并执行
5. 刷新数据库查看结果

---

## 📊 数据库结构

### 表分类

#### 1. 系统管理表（5张）
- `sys_user` - 用户表
- `sys_dept` - 部门表
- `sys_post` - 岗位表
- `sys_role` - 角色表
- `sys_user_role` - 用户角色关联表

#### 2. 审批业务表（5张）
- `bpm_application` - 审批申请主表
- `bpm_leave_application` - 请假申请详情表
- `bpm_reimburse_application` - 报销申请详情表
- `bpm_task` - 审批任务表
- `bpm_history` - 审批历史表

#### 3. 文件管理表（1张）
- `sys_file` - 文件表

#### 4. 可选功能表（2张 - 暂不使用）
- `bpm_form_template` - 动态表单模板表
- `bpm_process_template` - 动态流程模板表

**总计：13张表**

---

## 👥 初始测试账号

执行初始化脚本后，系统将创建以下测试账号：

### 管理员账号
| 用户名 | 密码 | 姓名 | 角色 | 部门 |
|--------|------|------|------|------|
| admin | 123456 | 系统管理员 | 管理员 | 总公司 |

### 审批人账号（部门经理）
| 用户名 | 密码 | 姓名 | 角色 | 部门 |
|--------|------|------|------|------|
| tech_manager | 123456 | 李经理 | 审批人 | 技术部 |
| finance_manager | 123456 | 王经理 | 审批人 | 财务部 |
| hr_manager | 123456 | 赵经理 | 审批人 | 人事部 |

### 普通员工账号
| 用户名 | 密码 | 姓名 | 角色 | 部门 |
|--------|------|------|------|------|
| zhangsan | 123456 | 张三 | 普通员工 | 前端组 |
| lisi | 123456 | 李四 | 普通员工 | 后端组 |
| wangwu | 123456 | 王五 | 普通员工 | 技术部 |

**注意**：所有账号密码均为 `123456`（已BCrypt加密）

---

## ✅ 验证安装

### 1. 检查表是否创建成功

```sql
USE approval_system;
SHOW TABLES;
```

应该显示 13 张表。

### 2. 检查数据是否插入成功

```sql
-- 查看用户数量
SELECT COUNT(*) AS user_count FROM sys_user;
-- 应该返回：7

-- 查看部门数量
SELECT COUNT(*) AS dept_count FROM sys_dept;
-- 应该返回：6

-- 查看角色数量
SELECT COUNT(*) AS role_count FROM sys_role;
-- 应该返回：3

-- 查看测试申请
SELECT * FROM bpm_application;
-- 应该返回：3 条记录
```

### 3. 测试登录

使用任意测试账号登录后端系统，验证数据库连接正常。

---

## 🔄 重置数据库

如果需要重新初始化数据库：

```sql
-- 方法一：删除数据库重新创建
DROP DATABASE IF EXISTS approval_system;
-- 然后重新执行 01 和 02 脚本

-- 方法二：只清空数据
USE approval_system;
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE sys_user;
TRUNCATE TABLE sys_dept;
-- ... 清空所有表
SET FOREIGN_KEY_CHECKS = 1;
-- 然后重新执行 02-init-data.sql
```

---

## 🛠️ 修改数据库配置

修改后端配置文件 `approval-backend/src/main/resources/application.yml`：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/approval_system?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
    username: root        # 修改为你的MySQL用户名
    password: your_password   # 修改为你的MySQL密码
```

---

## ⚠️ 常见问题

### 1. 连接数据库失败

**问题**：`Communications link failure`

**解决**：
- 检查 MySQL 服务是否启动
- 确认端口号（默认 3306）
- 检查防火墙设置

### 2. 字符编码问题

**问题**：中文显示乱码

**解决**：
```sql
-- 检查数据库字符集
SHOW CREATE DATABASE approval_system;

-- 应该显示
CREATE DATABASE `approval_system` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci
```

### 3. 权限不足

**问题**：`Access denied`

**解决**：
```sql
-- 授予权限
GRANT ALL PRIVILEGES ON approval_system.* TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
```

---

## 📝 下一步

数据库初始化完成后：

1. ✅ 启动后端项目，测试数据库连接
2. ✅ 使用 Knife4j 测试 API 接口
3. ✅ 开始开发业务功能

---

> 📅 **文档版本**：v1.0  
> 📝 **最后更新**：2026-01-14  
> 💡 **提示**：生产环境请修改所有默认密码！
