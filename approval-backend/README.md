# Approval System Backend

## 项目说明
这是审批系统的后端项目，基于 Spring Boot 3.2 + MyBatis Plus 构建。

## 技术栈
- Spring Boot 3.2.0
- Spring Security + JWT
- MyBatis Plus 3.5.5  
- MySQL 8.0+
- Redis (可选)
- Knife4j (Swagger)

## 快速开始

### 1. 环境要求
- JDK 17+
- Maven 3.8+
- MySQL 8.0+

### 2. 配置数据库
修改 `src/main/resources/application.yml` 中的数据库配置：
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/approval_system
    username: your_username
    password: your_password
```

### 3. 创建数据库
```sql
CREATE DATABASE approval_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. 启动项目
```bash
mvn clean install
mvn spring-boot:run
```

### 5. 访问 API  文档
启动成功后访问：http://localhost:8080/api/doc.html

## 项目结构
```
src/main/java/com/approval/
├── ApprovalApplication.java    # 启动类
├── config/                     # 配置类
│   ├── SecurityConfig.java
│   └── MyBatisPlusConfig.java
├── common/                     # 公共模块
│   ├── result/                 # 统一响应
│   ├── exception/              # 异常处理
│   └── utils/                  # 工具类
└── module/                     # 业务模块
    ├── system/                 # 系统管理
    ├── approval/               # 审批业务
    └── file/                   # 文件管理
```

## 开发规范
- 遵循 MVC 分层架构
- 使用 MyBatis Plus 简化 CRUD
- 统一异常处理和响应格式
- 使用 Lombok 简化代码

## 下一步
1. 创建数据库表（参考 docs/03-数据库设计.md）
2. 实现用户认证模块
3. 实现业务功能模块
