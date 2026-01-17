import request from '@/lib/request'
import type {
    AdminUser,
    AdminDept,
    AdminPost,
    AdminRole,
    UserFormData,
    DeptFormData,
    PostFormData,
    AssignRolesData,
    Application,
} from '@/types'

export const adminApi = {
    getUserList: (params: {
        pageNum?: number
        pageSize?: number
        username?: string
        realName?: string
        deptId?: number
        status?: number
    }) =>
        request.get<any, { records: AdminUser[]; total: number }>('/admin/users', { params }),

    getUserById: (userId: number) =>
        request.get<AdminUser>(`/admin/users/${userId}`),

    createUser: (data: UserFormData) =>
        request.post('/admin/users', data),

    updateUser: (data: UserFormData) =>
        request.put('/admin/users', data),

    deleteUser: (userId: number) =>
        request.delete(`/admin/users/${userId}`),

    getDeptList: (params: {
        pageNum?: number
        pageSize?: number
        deptName?: string
        status?: number
    }) =>
        request.get<any, { records: AdminDept[]; total: number }>('/admin/depts', { params }),

    getDeptById: (deptId: number) =>
        request.get<AdminDept>(`/admin/depts/${deptId}`),

    createDept: (data: DeptFormData) =>
        request.post('/admin/depts', data),

    updateDept: (data: DeptFormData) =>
        request.put('/admin/depts', data),

    deleteDept: (deptId: number) =>
        request.delete(`/admin/depts/${deptId}`),

    getPostList: (params: {
        pageNum?: number
        pageSize?: number
        postName?: string
        status?: number
    }) =>
        request.get<any, { records: AdminPost[]; total: number }>('/admin/posts', { params }),

    getPostById: (postId: number) =>
        request.get<AdminPost>(`/admin/posts/${postId}`),

    createPost: (data: PostFormData) =>
        request.post('/admin/posts', data),

    updatePost: (data: PostFormData) =>
        request.put('/admin/posts', data),

    deletePost: (postId: number) =>
        request.delete(`/admin/posts/${postId}`),

    assignRoles: (data: AssignRolesData) =>
        request.post('/admin/users/roles', data),

    getAllDepts: () =>
        request.get<AdminDept[]>('/admin/depts/all'),

    getAllPosts: () =>
        request.get<AdminPost[]>('/admin/posts/all'),

    getAllRoles: () =>
        request.get<AdminRole[]>('/admin/roles/all'),

    getAllApplications: (params: {
        pageNum?: number
        pageSize?: number
        appType?: string
        status?: number
        appNo?: string
    }) =>
        request.get<any, { records: Application[]; total: number }>('/admin/applications', { params }),

    getApplicationDetail: (appId: number) =>
        request.get(`/admin/applications/${appId}`),
}
