-- =============================================
-- 更新文件字段类型脚本
-- 版本：1.0
-- 创建时间：2026-01-19
-- =============================================

USE approval_system;

-- 修改请假申请表的附件字段类型为TEXT
ALTER TABLE bpm_leave_application 
MODIFY COLUMN attachment TEXT COMMENT '附件地址';

-- 修改报销申请表的发票附件字段类型为TEXT
ALTER TABLE bpm_reimburse_application 
MODIFY COLUMN invoice_attachment TEXT COMMENT '发票附件';

-- =============================================
-- 脚本执行完成提示
-- =============================================
SELECT '✅ 文件字段类型更新完成！' AS message;
