import request from '@/lib/request'
import type {
    LoginRequest,
    RegisterRequest,
    LoginResponse,
    User,
    Application,
    ApplicationHistory,
    ApplicationSummary,
    ApplicationDetailResponse,
    CreateLeaveRequest,
    CreateReimburseRequest,
    Task,
    ApproveTaskRequest,
    ApproverDashboardSummary,
} from '@/types'

// ========== 认证相关 ==========
export const authApi = {
    // 注册
    register: (data: RegisterRequest) =>
        request.post<any, LoginResponse>('/auth/register', data),

    // 登录
    login: (data: LoginRequest) =>
        request.post<any, LoginResponse>('/auth/login', data),

    // 获取用户信息
    getUserInfo: () =>
        request.get<any, User>('/auth/userinfo'),

    // 登出
    logout: () =>
        request.post('/auth/logout'),
}

// ========== 申请相关 ==========
export const applicationApi = {
    // 创建请假申请
    createLeave: (data: CreateLeaveRequest) =>
        request.post<any, number>('/application/leave', data),

    // 创建报销申请
    createReimburse: (data: CreateReimburseRequest) =>
        request.post<any, number>('/application/reimburse', data),

    // 查询我的申请列表
    getMyApplications: (params: {
        pageNum?: number
        pageSize?: number
        appType?: string
        status?: number
    }) =>
        request.get<any, { records: Application[]; total: number }>('/application/my', { params }),

    // 查询审批历史
    getHistoryApplications: (params: {
        pageNum?: number
        pageSize?: number
        appType?: string
        status?: number
        approverName?: string
        startTime?: string
        endTime?: string
        leaveType?: number
        expenseType?: number
    }) =>
        request.get<any, { records: ApplicationHistory[]; total: number }>('/application/history', { params }),

    // 查询申请详情
    getDetail: (appId: number) =>
        request.get<any, ApplicationDetailResponse>(`/application/${appId}`),

    // 撤回申请
    withdraw: (appId: number) =>
        request.put(`/application/withdraw/${appId}`),

    // 获取我的申请统计概要
    getSummary: () =>
        request.get<any, ApplicationSummary>('/application/summary'),
}

// ========== 任务相关 ==========
export const taskApi = {
    // 查询待办任务
    getTodoTasks: (params: { pageNum?: number; pageSize?: number }) =>
        request.get<any, { records: Task[]; total: number }>('/task/todo', { params }),

    // 审批任务
    approve: (data: ApproveTaskRequest) =>
        request.post('/task/approve', data),

    // 查询已办任务
    getDoneTasks: (params: { pageNum?: number; pageSize?: number }) =>
        request.get<any, { records: Task[]; total: number }>('/task/done', { params }),

    // 审批人仪表盘统计
    getApproverDashboard: (params?: { year?: number; month?: number }) =>
        request.get<any, ApproverDashboardSummary>('/task/dashboard', { params }),
}
