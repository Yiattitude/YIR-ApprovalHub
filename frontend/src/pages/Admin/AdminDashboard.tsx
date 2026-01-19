import { Routes, Route, useNavigate, useLocation, type NavigateFunction } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import UserManagement from './UserManagement'
import DeptManagement from './DeptManagement'
import PostManagement from './PostManagement'
import PostAssignment from './PostAssignment'
import AllApplications from './AllApplications'
import ReportCenter from './ReportCenter'
import { Button } from '@/components/ui/button'
import { Users, Building2, Briefcase, Shield, Database, BarChart3, Sparkles } from 'lucide-react'
import { ShellLayout, type ShellNavItem } from '@/components/layout/ShellLayout'

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

    const navItems: ShellNavItem[] = [
        { to: '/dashboard/users', label: '用户管理', icon: Users, description: '账号与权限' },
        { to: '/dashboard/depts', label: '部门管理', icon: Building2, description: '组织架构' },
        { to: '/dashboard/posts', label: '岗位管理', icon: Briefcase, description: '岗位职责' },
        { to: '/dashboard/roles', label: '岗位分配', icon: Shield, description: '人员调度' },
        { to: '/dashboard/all-applications', label: '审批数据', icon: Database, description: '流程统计' },
        { to: '/dashboard/reports', label: '统计报表', icon: BarChart3, description: '趋势洞察' },
    ]

    const pageMeta = resolvePageMeta(location.pathname)

    return (
        <ShellLayout
            userName={user?.realName}
            userPosition={user?.postName || '系统管理员'}
            avatarFallback={user?.realName?.slice(0, 1) || 'A'}
            pageTitle={pageMeta.title}
            pageDescription={pageMeta.description}
            navItems={navItems}
            onLogout={handleLogout}
            headerSlot={
                <div className="flex flex-wrap gap-3">
                    <Button variant="soft" size="sm" onClick={() => navigate('/dashboard/users')}>
                        <Users className="mr-2 h-4 w-4" /> 新建用户
                    </Button>
                    <Button variant="tonal" size="sm" onClick={() => navigate('/dashboard/reports')}>
                        <BarChart3 className="mr-2 h-4 w-4" /> 查看报表
                    </Button>
                </div>
            }
        >
            <div className="mx-auto max-w-6xl space-y-10">
                <Routes>
                    <Route path="users" element={<UserManagement />} />
                    <Route path="depts" element={<DeptManagement />} />
                    <Route path="posts" element={<PostManagement />} />
                    <Route path="roles" element={<PostAssignment />} />
                    <Route path="all-applications" element={<AllApplications />} />
                    <Route path="reports" element={<ReportCenter />} />
                    <Route index element={<AdminWelcome navigate={navigate} />} />
                </Routes>
            </div>
        </ShellLayout>
    )
}

function resolvePageMeta(pathname: string) {
    const metaMap: Record<string, { title: string; description: string }> = {
        '/dashboard/users': {
            title: '用户管理',
            description: '集中管理系统账户、重置密码并配置访问权限。',
        },
        '/dashboard/depts': {
            title: '部门管理',
            description: '维护组织树结构以及负责人，保证审批链可追踪。',
        },
        '/dashboard/posts': {
            title: '岗位管理',
            description: '配置岗位职责和权限，保持角色一致性。',
        },
        '/dashboard/roles': {
            title: '岗位分配',
            description: '为员工绑定岗位、同步权限，支持一键调整。',
        },
        '/dashboard/all-applications': {
            title: '全局审批数据',
            description: '实时监控请假/报销流程，洞察瓶颈节点。',
        },
        '/dashboard/reports': {
            title: '统计报表中心',
            description: '多维度分析审批趋势，导出经营报告。',
        },
    }

    const matched = Object.entries(metaMap).find(([key]) => pathname.startsWith(key))?.[1]
    return matched ?? {
        title: '管理员控制台',
        description: '从左侧模块进入各项配置与监控，保持组织高效运转。',
    }
}

function AdminWelcome({ navigate }: { navigate: NavigateFunction }) {
    return (
        <div className="rounded-[32px] border border-white/60 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-10 text-white">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-sm font-medium">
                        <Sparkles className="h-4 w-4" /> 管理员专属控制台
                    </span>
                    <h2 className="mt-4 text-4xl font-semibold tracking-tight">掌控组织、流程与数据</h2>
                    <p className="mt-3 max-w-2xl text-base text-white/70">
                        快速前往用户、部门、岗位与审批模块，或者打开报表洞察全局运行情况。
                    </p>
                </div>
                <div className="flex flex-col gap-3">
                    <Button size="lg" onClick={() => navigate('/dashboard/all-applications')}>
                        <Database className="mr-2 h-5 w-5" /> 查看审批数据
                    </Button>
                    <div className="flex flex-wrap gap-3">
                        <Button variant="outline" onClick={() => navigate('/dashboard/users')}>
                            <Users className="mr-2 h-4 w-4" /> 用户管理
                        </Button>
                        <Button variant="outline" onClick={() => navigate('/dashboard/reports')}>
                            <BarChart3 className="mr-2 h-4 w-4" /> 报表中心
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

