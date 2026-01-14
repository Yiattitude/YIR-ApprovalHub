package com.approval;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ApprovalApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(ApprovalApplication.class, args);
        System.out.println("========================================");
        System.out.println("审批系统启动成功！");
        System.out.println("API 文档地址: http://localhost:8080/api/doc.html");
        System.out.println("========================================");
    }
}
