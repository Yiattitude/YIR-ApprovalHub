export interface User {
    userId: number
    username: string
    realName: string
    avatar?: string
    roles: string[]
}

export interface LoginRequest {
    username: string
    password: string
}

export interface RegisterRequest {
    username: string
    password: string
    confirmPassword: string
    realName: string
    phone?: string
    email?: string
}

export interface LoginResponse {
    token: string
    userInfo: User
}

export interface Application {
    appId: number
    appNo: string
    appType: string
    title: string
    applicantName: string
    deptName: string
    status: number
    currentNode: string
    submitTime: string
    finishTime?: string
}

export interface CreateLeaveRequest {
    leaveType: number
    startTime: string
    endTime: string
    days: number
    reason: string
    attachment?: string
}

export interface CreateReimburseRequest {
    expenseType: number
    amount: number
    reason: string
    invoiceAttachment: string
    occurDate: string
}

export interface Task {
    taskId: number
    appId: number
    appNo: string
    appType: string
    title: string
    applicantName: string
    nodeName: string
    createTime: string
    action?: number
    comment?: string
    finishTime?: string
}

export interface ApproveTaskRequest {
    taskId: number
    action: number
    comment?: string
}

export interface AdminUser {
    userId: number
    username: string
    realName: string
    phone?: string
    email?: string
    deptId?: number
    deptName?: string
    postId?: number
    postName?: string
    avatar?: string
    status: number
    roles: string[]
    createTime: string
}

export interface AdminDept {
    deptId: number
    parentId: number
    parentName?: string
    deptName: string
    leader?: string
    phone?: string
    email?: string
    orderNum: number
    status: number
    createTime: string
}

export interface AdminPost {
    postId: number
    postCode: string
    postName: string
    postSort: number
    status: number
    createTime: string
}

export interface AdminRole {
    roleId: number
    roleName: string
    roleKey: string
    roleSort: number
    status: number
    remark?: string
}

export interface UserFormData {
    userId?: number
    username: string
    password?: string
    realName: string
    phone?: string
    email?: string
    deptId?: number
    postId?: number
    avatar?: string
    status: number
}

export interface DeptFormData {
    deptId?: number
    parentId: number
    deptName: string
    leader?: string
    phone?: string
    email?: string
    orderNum: number
    status: number
}

export interface PostFormData {
    postId?: number
    postCode: string
    postName: string
    postSort: number
    status: number
}

export interface AssignRolesData {
    userId: number
    roleIds: number[]
}
