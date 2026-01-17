package com.approval.module.approval.controller;

import com.approval.common.result.Result;
import com.approval.module.approval.entity.Application;
import com.approval.module.approval.entity.LeaveApplication;
import com.approval.module.approval.entity.ReimburseApplication;
import com.approval.module.approval.mapper.ApplicationMapper;
import com.approval.module.approval.mapper.HistoryMapper;
import com.approval.module.approval.mapper.LeaveApplicationMapper;
import com.approval.module.approval.mapper.ReimburseApplicationMapper;
import com.approval.module.approval.vo.ApplicationVo;
import com.approval.module.system.entity.User;
import com.approval.module.system.mapper.UserMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Tag(name = "系统管理员-审批数据")
@RestController
@RequestMapping("/admin/applications")
@RequiredArgsConstructor
public class AdminApplicationController {

    private final ApplicationMapper applicationMapper;
    private final LeaveApplicationMapper leaveApplicationMapper;
    private final ReimburseApplicationMapper reimburseApplicationMapper;
    private final HistoryMapper historyMapper;
    private final UserMapper userMapper;

    @Operation(summary = "获取全部审批数据（只读）")
    @GetMapping
    public Result<Page<ApplicationVo>> getAllApplications(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String appType,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String appNo) {
        Page<Application> page = new Page<>(pageNum, pageSize);

        LambdaQueryWrapper<Application> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(appType != null && !appType.isEmpty(), Application::getAppType, appType)
                .eq(status != null, Application::getStatus, status)
                .like(appNo != null && !appNo.isEmpty(), Application::getAppNo, appNo)
                .orderByDesc(Application::getSubmitTime);

        Page<Application> appPage = applicationMapper.selectPage(page, wrapper);

        List<Long> userIds = appPage.getRecords().stream()
                .map(Application::getApplicantId)
                .distinct()
                .collect(Collectors.toList());

        Map<Long, User> userMap = userMapper.selectBatchIds(userIds).stream()
                .collect(Collectors.toMap(User::getUserId, u -> u));

        Page<ApplicationVo> voPage = new Page<>(appPage.getCurrent(), appPage.getSize(), appPage.getTotal());
        voPage.setRecords(appPage.getRecords().stream().map(app -> {
            ApplicationVo vo = new ApplicationVo();
            org.springframework.beans.BeanUtils.copyProperties(app, vo);
            User user = userMap.get(app.getApplicantId());
            vo.setApplicantName(user != null ? user.getRealName() : "");
            vo.setDeptName("技术部");
            return vo;
        }).collect(Collectors.toList()));

        return Result.success(voPage);
    }

    @Operation(summary = "获取审批数据详情（只读）")
    @GetMapping("/{appId}")
    public Result<Object> getApplicationDetail(@PathVariable Long appId) {
        Application application = applicationMapper.selectById(appId);
        if (application == null) {
            return Result.fail(404, "申请不存在");
        }

        Map<String, Object> detail = new HashMap<>();
        detail.put("application", application);

        if ("leave".equals(application.getAppType())) {
            LeaveApplication leave = leaveApplicationMapper.selectOne(
                    new LambdaQueryWrapper<LeaveApplication>().eq(LeaveApplication::getAppId, appId));
            detail.put("detail", leave);
        } else if ("reimburse".equals(application.getAppType())) {
            ReimburseApplication reimburse = reimburseApplicationMapper.selectOne(
                    new LambdaQueryWrapper<ReimburseApplication>().eq(ReimburseApplication::getAppId, appId));
            detail.put("detail", reimburse);
        }

        List<com.approval.module.approval.entity.History> histories = historyMapper.selectList(
                new LambdaQueryWrapper<com.approval.module.approval.entity.History>()
                        .eq(com.approval.module.approval.entity.History::getAppId, appId)
                        .orderByDesc(com.approval.module.approval.entity.History::getCreateTime));
        detail.put("history", histories);

        return Result.success(detail);
    }
}
