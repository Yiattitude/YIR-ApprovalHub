package com.approval.module.approval.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 创建请假申请DTO
 */
@Data
public class CreateLeaveDto {

    @NotNull(message = "请假类型不能为空")
    private Integer leaveType; // 1=事假 2=病假 3=年假 4=调休

    @NotNull(message = "开始时间不能为空")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime startTime;

    @NotNull(message = "结束时间不能为空")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime endTime;

    @NotNull(message = "请假天数不能为空")
    private BigDecimal days;

    @NotBlank(message = "请假事由不能为空")
    private String reason;

    private String attachment; // 附件地址

    @NotNull(message = "审批人不能为空")
    private Long approverId;
}
