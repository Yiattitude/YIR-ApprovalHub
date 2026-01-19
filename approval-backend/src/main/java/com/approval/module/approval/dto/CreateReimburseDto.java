package com.approval.module.approval.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 创建报销申请DTO
 */
@Data
public class CreateReimburseDto {

    @NotNull(message = "费用类型不能为空")
    private Integer expenseType; // 1=差旅费 2=餐饮费 3=办公费 4=其他

    @NotNull(message = "报销金额不能为空")
    private BigDecimal amount;

    @NotBlank(message = "报销事由不能为空")
    private String reason;

    @NotBlank(message = "发票附件不能为空")
    private String invoiceAttachment;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate occurDate; // 发生日期

    @NotNull(message = "审批人不能为空")
    private Long approverId;
}
