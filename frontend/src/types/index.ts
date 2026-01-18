export interface User {
    userId: number
    username: string
    realName: string
    avatar?: string
    postId?: number
    postName?: string
    permissions: string[]
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
    leaveType?: number
    expenseType?: number
}

export interface ApplicationEntity {
    appId: number
    appNo: string
    appType: string
    title: string
    applicantId: number
    deptId?: number
    status: number
    currentNode?: string
    submitTime?: string
    finishTime?: string
    createTime?: string
    updateTime?: string
}

export interface ApplicationHistory {
    appId: number
    appNo: string
    appType: string
    title: string
    status: number
    applicantName: string
    deptName: string
    currentNode?: string
    approverName?: string
    action?: number
    comment?: string
    leaveType?: number
    leaveDays?: number
    expenseType?: number
    expenseAmount?: number
    submitTime: string
    approveTime?: string
    finishTime?: string
}

export interface LeaveApplicationDetail {
    leaveId: number
    appId: number
    leaveType: number
    startTime?: string
    endTime?: string
    days?: number
    reason?: string
    attachment?: string
}

export interface ReimburseApplicationDetail {
    reimburseId: number
    appId: number
    expenseType: number
    amount?: number
    reason?: string
    invoiceAttachment?: string
    occurDate?: string
}

export interface ApprovalHistoryRecord {
    historyId: number
    nodeName?: string
    approverName?: string
    action?: number
    comment?: string
    approveTime?: string
}

export interface ApplicationDetailResponse {
    application: ApplicationEntity
    detail?: LeaveApplicationDetail | ReimburseApplicationDetail
    history: ApprovalHistoryRecord[]
}

export interface ApplicationSummary {
    userId: number
    realName: string
    deptName?: string
    postName?: string
    totalCount: number
    pendingCount: number
    approvedCount: number
    rejectedCount: number
    withdrawnCount: number
    leaveCount: number
    reimburseCount: number
    totalLeaveDays: number
    totalReimburseAmount: number
    approvalRate: number
    lastSubmitTime?: string
}

export interface ApprovalTypeStat {
    appType: string
    typeLabel: string
    count: number
}

export interface DailyApprovalStat {
    date: string
    count: number
}

export interface ApproverDashboardSummary {
    realName: string
    deptName?: string
    postName?: string
    totalCount: number
    approvedCount: number
    rejectedCount: number
    typeStats: ApprovalTypeStat[]
    dailyStats: DailyApprovalStat[]
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
    permissions: string[]
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
    permissions?: Permission[]
}

export interface Permission {
    permissionId: number
    permissionCode: string
    permissionName: string
    description?: string
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
    permissionIds?: number[]
}

export interface AssignPostData {
    userId: number
    postId: number
}
