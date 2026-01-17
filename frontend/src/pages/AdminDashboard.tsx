import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import UserManagement from './UserManagement'
import DeptManagement from './DeptManagement'
import PostManagement from './PostManagement'
import RoleAssignment from './RoleAssignment'
import AllApplications from './AllApplications'
import { Button } from '@/components/ui/button'
import { LogOut, Users, Building2, Briefcase, Shield, Database } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * 管理员Dashboard
 * 功能：用户管理、部门管理、岗位管理、角色分配、审批数据
 */
export default function AdminDashboard() {
    const navigate = useNavigate()
    const location = useLocation()
    const { user, clearAuth } = useAuthStore()

    const handleLogout = () => {
        clearAuth()
        navigate('/login')
    }

    const navItems = [
        { href: '/dashboard/users', label: '用户管理', icon: Users },
        { href: '/dashboard/depts', label: '部门管理', icon: Building2 },
        { href: '/dashboard/posts', label: '岗位管理', icon: Briefcase },
        { href: '/dashboard/roles', label: '角色分配', icon: Shield },
        { href: '/dashboard/all-applications', label: '审批数据', icon: Database },
    ]

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            {/* 顶部导航栏 */}
            <header className="bg-white border-b h-16 flex items-center px-8 justify-between sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-primary-foreground font-bold">
                        Y
                    </div>
                    <span className="font-bold text-xl">审批系统 - 管理员</span>
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">欢迎，{user?.realName}</span>
                    <Button variant="ghost" size="sm" onClick={handleLogout}>
                        <LogOut className="w-4 h-4 mr-2" />
                        退出
                    </Button>
                </div>
            </header>

            <div className="flex flex-1">
                {/* 侧边栏 */}
                <aside className="w-64 bg-white border-r min-h-[calc(100vh-4rem)] p-4 space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = location.pathname.startsWith(item.href)

                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary text-primary-foreground"
                                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                {item.label}
                            </Link>
                        )
                    })}
                </aside>

                {/* 主内容区 */}
                <main className="flex-1 p-8 overflow-auto">
                    <div className="max-w-5xl mx-auto">
                        <Routes>
                            <Route path="users" element={<UserManagement />} />
                            <Route path="depts" element={<DeptManagement />} />
                            <Route path="posts" element={<PostManagement />} />
                            <Route path="roles" element={<RoleAssignment />} />
                            <Route path="all-applications" element={<AllApplications />} />
                            <Route
                                path="/"
                                element={
                                    <div className="text-center py-20 space-y-4">
                                        <h2 className="text-3xl font-bold text-gray-800">
                                            管理员控制台
                                        </h2>
                                        <p className="text-muted-foreground">
                                            请从左侧菜单选择功能开始工作
                                        </p>
                                        <div className="flex justify-center gap-4 mt-8">
                                            <Button onClick={() => navigate('/dashboard/users')}>
                                                用户管理
                                            </Button>
                                            <Button variant="outline" onClick={() => navigate('/dashboard/depts')}>
                                                部门管理
                                            </Button>
                                            <Button variant="outline" onClick={() => navigate('/dashboard/all-applications')}>
                                                审批数据
                                            </Button>
                                        </div>
                                    </div>
                                }
                            />
                        </Routes>
                    </div>
                </main>
            </div>
        </div>
    )
}

