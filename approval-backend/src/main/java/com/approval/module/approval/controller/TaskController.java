package com.approval.module.approval.controller;

import com.approval.common.result.Result;
import com.approval.common.utils.JwtUtils;
import com.approval.module.approval.dto.ApproveTaskDto;
import com.approval.module.approval.service.ITaskService;
import com.approval.module.approval.vo.ApproverDashboardVo;
import com.approval.module.approval.vo.TaskVo;
import com.approval.module.system.entity.User;
import com.approval.module.system.mapper.UserMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 任务管理控制器
 */
@Tag(name = "任务管理")
@RestController
@RequestMapping("/task")
@RequiredArgsConstructor
public class TaskController {

    private final ITaskService taskService;
    private final JwtUtils jwtUtils;
    private final UserMapper userMapper;

    @Operation(summary = "查询待办任务")
    @GetMapping("/todo")
    public Result<Page<TaskVo>> getTodoTasks(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestHeader("Authorization") String token) {
        Long userId = getUserIdFromToken(token);
        Page<TaskVo> page = taskService.getTodoTasks(userId, pageNum, pageSize);
        return Result.success(page);
    }

    @Operation(summary = "审批任务")
    @PostMapping("/approve")
    public Result<Void> approveTask(
            @Valid @RequestBody ApproveTaskDto dto,
            @RequestHeader("Authorization") String token) {
        Long userId = getUserIdFromToken(token);
        taskService.approveTask(dto, userId);
        return Result.success();
    }

    @Operation(summary = "查询已办任务")
    @GetMapping("/done")
    public Result<Page<TaskVo>> getDoneTasks(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestHeader("Authorization") String token) {
        Long userId = getUserIdFromToken(token);
        Page<TaskVo> page = taskService.getDoneTasks(userId, pageNum, pageSize);
        return Result.success(page);
    }

    @Operation(summary = "审批人仪表盘统计")
    @GetMapping("/dashboard")
    public Result<ApproverDashboardVo> getApproverDashboard(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestHeader("Authorization") String token) {
        Long userId = getUserIdFromToken(token);
        ApproverDashboardVo data = taskService.getApproverDashboard(userId, year, month);
        return Result.success(data);
    }

    /**
     * 从Token中获取用户ID
     */
    private Long getUserIdFromToken(String token) {
        String actualToken = token.replace("Bearer ", "");
        String username = jwtUtils.getUsernameFromToken(actualToken);
        User user = userMapper.selectOne(
                new LambdaQueryWrapper<User>().eq(User::getUsername, username));
        return user != null ? user.getUserId() : null;
    }
}
