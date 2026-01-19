-- =============================================
-- 审批系统初始数据脚本
-- 版本：1.0
-- 创建时间：2026-01-14
-- =============================================

USE approval_system;

-- =============================================
-- 1. 初始化角色数据
-- =============================================

INSERT INTO sys_role (role_id, role_name, role_key, role_sort, remark) VALUES
(1, '系统管理员', 'ROLE_ADMIN', 1, '拥有系统最高权限'),
(2, '审批人', 'ROLE_APPROVER', 2, '可以审批申请'),
(3, '普通员工', 'ROLE_USER', 3, '可以发起申请');

-- =============================================
-- 2. 初始化部门数据
-- =============================================

INSERT INTO sys_dept (dept_id, parent_id, dept_name, leader, order_num) VALUES
(1, 0, '总公司', '张总', 1),
(2, 1, '技术部', '李经理', 1),
(3, 1, '财务部', '王经理', 2),
(4, 1, '人事部', '赵经理', 3),
(5, 2, '前端组', '前端组长', 1),
(6, 2, '后端组', '后端组长', 2);

-- =============================================
-- 3. 初始化岗位数据
-- =============================================

INSERT INTO sys_post (post_id, post_code, post_name, post_sort) VALUES
(1, 'CEO', '总经理', 1),
(2, 'MANAGER', '部门经理', 2),
(3, 'LEADER', '组长', 3),
(4, 'EMPLOYEE', '普通员工', 4);

-- =============================================
-- 4. 初始化用户数据
-- 注意：密码均为 123456（BCrypt加密后）
-- =============================================

-- 密码明文：123456
-- BCrypt加密：$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi

INSERT INTO sys_user (user_id, username, password, real_name, phone, email, dept_id, post_id, status) VALUES
-- 管理员
(1, 'admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '系统管理员', '13800138000', 'admin@approval.com', 1, 1, 1),

-- 部门经理（审批人）
(2, 'tech_manager', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '李经理', '13800138001', 'tech@approval.com', 2, 2, 1),
(3, 'finance_manager', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '王经理', '13800138002', 'finance@approval.com', 3, 2, 1),
(4, 'hr_manager', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '赵经理', '13800138003', 'hr@approval.com', 4, 2, 1),

-- 普通员工
(5, 'zhangsan', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '张三', '13800138005', 'zhangsan@approval.com', 5, 4, 1),
(6, 'lisi', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '李四', '13800138006', 'lisi@approval.com', 6, 4, 1),
(7, 'wangwu', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '王五', '13800138007', 'wangwu@approval.com', 2, 4, 1);

-- =============================================
-- 5. 初始化用户角色关联
-- =============================================

INSERT INTO sys_user_role (user_id, role_id) VALUES
-- 管理员：所有角色
(1, 1),
(1, 2),
(1, 3),

-- 部门经理：审批人 + 普通员工
(2, 2),
(2, 3),
(3, 2),
(3, 3),
(4, 2),
(4, 3),

-- 普通员工：普通员工
(5, 3),
(6, 3),
-- wangwu：普通员工 + 审批人
(7, 3),
(7, 2);

-- =============================================
-- 6. 初始化测试申请数据（可选）
-- =============================================

-- 生成申请单号函数（简化版，实际应在后端生成）
-- 申请单号格式：AP + yyyyMMdd + 6位流水号

INSERT INTO bpm_application (app_id, app_no, app_type, title, applicant_id, dept_id, status, submit_time) VALUES
(1, 'AP20260114000001', 'leave', '请假申请-春节回家', 5, 5, 3, '2026-01-10 10:00:00'),
(2, 'AP20260114000002', 'reimburse', '报销申请-出差费用', 6, 6, 1, '2026-01-12 14:30:00'),
(3, 'AP20260114000003', 'leave', '请假申请-病假', 7, 2, 2, '2026-01-13 09:15:00');

-- 请假申请详情
INSERT INTO bpm_leave_application (app_id, leave_type, start_time, end_time, days, reason) VALUES
(1, 1, '2026-01-20 09:00:00', '2026-01-25 18:00:00', 5.0, '春节回家过年'),
(3, 2, '2026-01-15 09:00:00', '2026-01-16 18:00:00', 2.0, '感冒发烧，需要休息');

-- 报销申请详情
INSERT INTO bpm_reimburse_application (app_id, expense_type, amount, reason, invoice_attachment, occur_date) VALUES
(2, 1, 1580.50, '北京出差费用报销', '/upload/invoice_001.pdf', '2026-01-10');

-- 审批历史
INSERT INTO bpm_history (app_id, node_name, approver_id, approver_name, action, comment, approve_time, next_node) VALUES
-- 已完成的申请
(1, '提交申请', 5, '张三', NULL, '发起申请', '2026-01-10 10:00:00', '部门经理审批'),
(1, '部门经理审批', 2, '李经理', 1, '同意请假，注意安全', '2026-01-10 15:30:00', '结束'),

-- 审批中的申请
(3, '提交申请', 7, '王五', NULL, '发起申请', '2026-01-13 09:15:00', '部门经理审批');

-- 待办任务
INSERT INTO bpm_task (app_id, node_name, assignee_id, assignee_name, status) VALUES
(2, '部门经理审批', 2, '李经理', 0),  -- 待审批
(3, '部门经理审批', 2, '李经理', 0);  -- 待审批

-- =============================================
-- 脚本执行完成提示
-- =============================================

-- 查看初始化数据统计
SELECT '✅ 初始数据插入完成！' AS message;
SELECT '📊 数据统计：' AS '';
SELECT CONCAT('用户数量：', COUNT(*)) AS stat FROM sys_user;
SELECT CONCAT('部门数量：', COUNT(*)) AS stat FROM sys_dept;
SELECT CONCAT('角色数量：', COUNT(*)) AS stat FROM sys_role;
SELECT CONCAT('测试申请：', COUNT(*)) AS stat FROM bpm_application;

-- 显示测试账号信息
SELECT '🔐 测试账号（密码均为：123456）：' AS '';
SELECT username AS '用户名', real_name AS '姓名', 
       CASE user_id 
           WHEN 1 THEN '管理员' 
           WHEN 2 THEN '技术部经理' 
           WHEN 3 THEN '财务部经理'
           WHEN 4 THEN '人事部经理'
           ELSE '普通员工' 
       END AS '角色'
FROM sys_user;
