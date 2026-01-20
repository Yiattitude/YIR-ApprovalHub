# Maven 项目创建完整教程

## 📚 教程目标
学习如何从零开始创建一个 Spring Boot Maven 项目，理解 Maven 的工作原理和项目结构。

---
我要修改普通员工界面

需求：1.普通员工的权限只能查看和操作自己发起的申请。
2。普通员工界面的侧边栏只需要有“我的申请” “审批历史”，“仪表盘”
3.“我的申请”：里面只需要显示状态是待审批的申请，状态是已完成的申请在“审批历史”中
4.“审批历史”：里面显示状态是已完成的申请，按时间顺序排序。有查询功能，可以根据“时间”，“审批人”，“请假类型”，“报销类型”等来进行查询
5.“仪表盘”：界面上方显示个人信息：“部门”，“岗位”，“姓名”，“角色”；界面下方是用卡片样式显示的对“请假次数”“请假时长”“报销次数”“报销金额”“申请通过率”的统计，用数字方式体现

要求：1.在普通员工界面创建“审批历史”“仪表盘”，移除“待审批任务”和“已审批任务”
2.实现：”审批历史“的功能（查询功能，显示已审核的申请）
3.代码风格参考前端pages的代码
4.实现前后端逻辑自洽
5.完成后给我一份解释文档
## 1. Maven 基础知识

### 1.1 什么是 Maven？
**Maven** 是 Java 项目的构建和依赖管理工具。

**核心功能**：
- 📦 **依赖管理**：自动下载和管理项目依赖的 jar 包
- 🔨 **项目构建**：编译、测试、打包一键完成
- 📋 **项目标准化**：统一的项目结构和生命周期

### 1.2 Maven 项目结构
```
my-project/
├── src/
│   ├── main/
│   │   ├── java/           # Java 源代码
│   │   └── resources/      # 配置文件、静态资源
│   └── test/
│       └── java/           # 测试代码
├── target/                 # 编译输出目录
└── pom.xml                 # 项目配置文件（核心）
```

### 1.3 什么是 pom.xml？
`pom.xml` = **P**roject **O**bject **M**odel

**包含内容**：
- 项目基本信息（groupId, artifactId, version）
- 依赖声明（dependencies）
- 插件配置（plugins）
- 构建配置

---

## 2. 方法一：使用 Maven 命令创建项目

### 2.1 前置条件
确保已安装 Maven：
```bash
mvn -version
```

输出示例：
```
Apache Maven 3.9.5
Maven home: C:\Program Files\Apache\maven
Java version: 17.0.9
```

### 2.2 创建项目命令

#### 最简单的方式
```bash
mvn archetype:generate
```
然后按提示选择模板和输入信息（交互式）

#### 直接指定参数（推荐）
```bash
mvn archetype:generate \
  -DgroupId=com.approval \
  -DartifactId=approval-system \
  -DarchetypeArtifactId=maven-archetype-quickstart \
  -DarchetypeVersion=1.4 \
  -DinteractiveMode=false
```

**参数说明**：
- `-DgroupId`：组织ID（通常是域名反写，如 com.approval）
- `-DartifactId`：项目名称（如 approval-system）
- `-DarchetypeArtifactId`：项目模板
  - `maven-archetype-quickstart`：普通 Java 项目
  - `maven-archetype-webapp`：Web 项目
- `-DinteractiveMode=false`：非交互模式，直接创建

### 2.3 生成的项目结构
```
approval-system/
├── src/
│   ├── main/
│   │   └── java/
│   │       └── com/approval/
│   │           └── App.java
│   └── test/
│       └── java/
│           └── com/approval/
│               └── AppTest.java
└── pom.xml
```

### 2.4 生成的 pom.xml 示例
```xml
<project>
  <modelVersion>4.0.0</modelVersion>
  
  <groupId>com.approval</groupId>
  <artifactId>approval-system</artifactId>
  <version>1.0-SNAPSHOT</version>
  
  <dependencies>
    <dependency>
      <groupId>junit</groupId>
      <artifactId>junit</artifactId>
      <version>4.11</version>
      <scope>test</scope>
    </dependency>
  </dependencies>
</project>
```

---

## 3. 方法二：使用 Spring Initializr 创建 Spring Boot 项目

### 3.1 在线创建（推荐）

访问：**https://start.spring.io/**

**配置选项**：
1. **Project**：Maven
2. **Language**：Java
3. **Spring Boot**：3.2.0
4. **Project Metadata**：
   - Group：com.approval
   - Artifact：approval-system
   - Name：Approval System
   - Package name：com.approval
   - Packaging：Jar
   - Java：17

5. **Dependencies**（点击 Add Dependencies）：
   - Spring Web
   - Spring Security
   - MySQL Driver
   - Lombok
   - Validation

6. 点击 **GENERATE** 下载项目压缩包

7. 解压后即可使用

### 3.2 使用命令行创建（Spring CLI）

安装 Spring Boot CLI 后：
```bash
spring init \
  --dependencies=web,security,mysql,lombok \
  --group-id=com.approval \
  --artifact-id=approval-system \
  --name="Approval System" \
  --java-version=17 \
  approval-system
```

---

## 4. 方法三：在 VSCode 中创建项目

### 4.1 安装插件
1. 安装 **Extension Pack for Java**
2. 安装 **Spring Boot Extension Pack**

### 4.2 创建步骤
1. 按 `Ctrl+Shift+P` 打开命令面板
2. 输入 `Spring Initializr: Create a Maven Project`
3. 选择 Spring Boot 版本：`3.2.0`
4. 选择语言：`Java`
5. 输入 Group Id：`com.approval`
6. 输入 Artifact Id：`approval-system`
7. 选择打包方式：`Jar`
8. 选择 Java 版本：`17`
9. 选择依赖项（多选）：
   - Spring Web
   - Spring Security
   - MySQL Driver
   - Lombok
10. 选择项目存放位置
11. 等待项目创建完成

---

## 5. 将基础项目升级为审批系统

### 5.1 修改 pom.xml 添加依赖

在 `<dependencies>` 中添加：

```xml
<!-- MyBatis Plus -->
<dependency>
    <groupId>com.baomidou</groupId>
    <artifactId>mybatis-plus-spring-boot3-starter</artifactId>
    <version>3.5.5</version>
</dependency>

<!-- JWT -->
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.12.3</version>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.12.3</version>
    <scope>runtime</scope>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>0.12.3</version>
    <scope>runtime</scope>
</dependency>

<!-- Knife4j (Swagger) -->
<dependency>
    <groupId>com.github.xiaoymin</groupId>
    <artifactId>knife4j-openapi3-jakarta-spring-boot-starter</artifactId>
    <version>4.3.0</version>
</dependency>

<!-- Hutool 工具类 -->
<dependency>
    <groupId>cn.hutool</groupId>
    <artifactId>hutool-all</artifactId>
    <version>5.8.23</version>
</dependency>
```

### 5.2 创建 application.yml
删除 `application.properties`，创建 `application.yml`：

```yaml
spring:
  application:
    name: approval-system
  datasource:
    url: jdbc:mysql://localhost:3306/approval_system
    username: root
    password: 123456

server:
  port: 8080
  servlet:
    context-path: /api
```

### 5.3 创建包结构
```bash
src/main/java/com/approval/
├── config/           # 配置类
├── common/           # 公共模块
│   ├── result/       # 统一响应
│   ├── exception/    # 异常处理
│   └── utils/        # 工具类
└── module/           # 业务模块
    ├── system/       # 系统管理
    ├── approval/     # 审批业务
    └── file/         # 文件管理
```

---

## 6. Maven 常用命令

### 6.1 项目构建

```bash
# 清理编译输出
mvn clean

# 编译项目
mvn compile

# 运行测试
mvn test

# 打包项目（生成 jar 或 war）
mvn package

# 安装到本地仓库
mvn install

# 跳过测试打包
mvn package -DskipTests

# 清理并打包
mvn clean package

# 运行 Spring Boot 项目
mvn spring-boot:run
```

### 6.2 依赖管理

```bash
# 查看依赖树
mvn dependency:tree

# 下载依赖源码
mvn dependency:sources

# 分析依赖
mvn dependency:analyze
```

---

## 7. 常见问题解决

### 7.1 Maven 依赖下载失败
**原因**：网络问题或中央仓库连接慢

**解决方案**：配置阿里云镜像

编辑 `~/.m2/settings.xml`：
```xml
<mirrors>
  <mirror>
    <id>aliyun</id>
    <name>Aliyun Maven</name>
    <url>https://maven.aliyun.com/repository/public</url>
    <mirrorOf>central</mirrorOf>
  </mirror>
</mirrors>
```

### 7.2 编译错误：找不到符号
**原因**：依赖未下载或版本冲突

**解决方案**：
```bash
# 强制更新依赖
mvn clean install -U

# 清理本地仓库缓存
rm -rf ~/.m2/repository/com/approval
mvn clean install
```

### 7.3 Lombok 不生效
**原因**：IDE 未安装 Lombok 插件

**解决方案**（VSCode）：
1. 安装 Lombok Annotations Support 插件
2. 重启 VSCode

---

## 8. 最佳实践

### 8.1 版本管理
使用 `<properties>` 统一管理版本：
```xml
<properties>
    <java.version>17</java.version>
    <mybatis-plus.version>3.5.5</mybatis-plus.version>
</properties>

<dependencies>
    <dependency>
        <groupId>com.baomidou</groupId>
        <artifactId>mybatis-plus-spring-boot3-starter</artifactId>
        <version>${mybatis-plus.version}</version>
    </dependency>
</dependencies>
```

### 8.2 多环境配置
```
resources/
├── application.yml           # 主配置
├── application-dev.yml       # 开发环境
├── application-test.yml      # 测试环境
└── application-prod.yml      # 生产环境
```

激活环境：
```yaml
spring:
  profiles:
    active: dev
```

### 8.3 依赖范围
- `compile`：默认，编译和运行都需要
- `provided`：编译需要，运行由容器提供（如 servlet-api）
- `runtime`：运行需要，编译不需要（如 MySQL 驱动）
- `test`：仅测试时需要（如 JUnit）

---

## 9. 对比总结

| 方法 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **Maven 命令** | 完全控制 | 需要手动配置 | 学习 Maven 原理 |
| **Spring Initializr** | 快速、依赖全 | 固定模板 | 快速开发 Spring Boot |
| **VSCode 插件** | 图形化、简单 | 依赖 IDE | 日常开发 |
| **直接生成文件** | 最快速 | 学不到创建过程 | 生产项目 |

---

## 10. 下一步学习

- 📖 学习 Maven 生命周期
- 📖 学习 Maven 多模块项目
- 📖 学习 Maven 父子工程
- 📖 学习私服搭建（Nexus）

---

## 🎯 练习任务

1. 使用 Maven 命令创建一个 Java 项目
2. 手动添加 Spring Boot 依赖
3. 配置 application.yml
4. 创建一个简单的 Controller
5. 运行项目并访问接口

---

> 📅 **文档版本**：v1.0  
> 📝 **最后更新**：2026-01-14  
> 👤 **编写人**：开发教程组  
> 💡 **提示**：实际项目开发建议使用 Spring Initializr 快速创建！
