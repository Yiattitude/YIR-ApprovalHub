import { useAuthStore } from '@/store/authStore'
import AdminDashboard from '@/pages/AdminDashboard'
import ApproverDashboard from '@/pages/ApproverDashboard'
import UserDashboard from '@/pages/UserDashboard'

/**
 * 基于角色的Dashboard路由组件
 * 根据用户角色显示不同的Dashboard
 */
export default function RoleBasedDashboard() {
    const { user } = useAuthStore()
    
    // 获取用户的主要角色（优先级：ADMIN > APPROVER > USER）
    const roles = user?.roles || []
    let dashboardComponent = null
    
    if (roles.includes('ROLE_ADMIN')) {
        dashboardComponent = <AdminDashboard />
    } else if (roles.includes('ROLE_APPROVER')) {
        dashboardComponent = <ApproverDashboard />
    } else {
        // 默认普通员工
        dashboardComponent = <UserDashboard />
    }
    
    return dashboardComponent
}

