import { useAuthStore } from '@/store/authStore'
import AdminDashboard from '@/pages/Admin/AdminDashboard'
import ApproverDashboard from '@/pages/Approver/ApproverDashboard'
import UserDashboard from '@/pages/User/UserDashboard'

/**
 * 基于角色的Dashboard路由组件
 * 根据用户角色显示不同的Dashboard
 */
export default function RoleBasedDashboard() {
    const { user } = useAuthStore()
    
    // 根据岗位权限判断要展示的主控台
    const permissions = user?.permissions || []
    let dashboardComponent = null
    
    if (permissions.includes('SYSTEM_ADMIN')) {
        dashboardComponent = <AdminDashboard />
    } else if (permissions.includes('APPROVAL_REVIEW')) {
        dashboardComponent = <ApproverDashboard />
    } else {
        // 默认普通员工
        dashboardComponent = <UserDashboard />
    }
    
    return dashboardComponent
}

