package com.approval.module.approval.service;

import com.approval.module.approval.dto.ApproveTaskDto;
import com.approval.module.approval.vo.ApproverDashboardVo;
import com.approval.module.approval.vo.TaskVo;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;

/**
 * 任务服务接口
 */
public interface ITaskService {

    /**
     * 查询待办任务
     */
    Page<TaskVo> getTodoTasks(Long userId, Integer pageNum, Integer pageSize);

    /**
     * 审批任务
     */
    void approveTask(ApproveTaskDto dto, Long userId);

    /**
     * 查询已办任务
     */
    Page<TaskVo> getDoneTasks(Long userId, Integer pageNum, Integer pageSize);

    /**
     * 获取审批人仪表盘统计
     */
    ApproverDashboardVo getApproverDashboard(Long userId, Integer year, Integer month);
}
