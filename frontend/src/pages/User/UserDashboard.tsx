import { Routes, Route, useNavigate, useLocation, type NavigateFunction } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import MyApplications from '../MyApplications'
import ApprovalHistory from './ApprovalHistory'
import CreateLeave from './CreateLeave'
import CreateReimburse from './CreateReimburse'
import UserSummary from './UserSummary'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, FileText, Clock, Plus, Sparkles, ClipboardList } from 'lucide-react'
import { ShellLayout, type ShellNavItem } from '@/components/layout/ShellLayout'

/**
 * 普通员工Dashboard
 
 */
export default function UserDashboard() {
    const navigate = useNavigate()
    const location = useLocation()
    const { user, clearAuth } = useAuthStore()

    const handleLogout = () => {
        clearAuth()
        navigate('/login')
    }

    const navItems: ShellNavItem[] = [
        { to: '/dashboard/summary', label: '仪表盘总览', icon: LayoutDashboard, description: '进度与提醒' },
        { to: '/dashboard/applications', label: '我的申请', icon: FileText, description: '草稿与状态' },
        { to: '/dashboard/approval-history', label: '审批历史', icon: Clock, description: '已完成记录' },
    ]

    const pageMeta = resolvePageMeta(location.pathname)
    const hideHeroPaths = [
        '/dashboard/applications',
        '/dashboard/approval-history',
        '/dashboard/create/leave',
        '/dashboard/create/reimburse',
    ]
    const shouldHideHero = hideHeroPaths.some((path) => location.pathname.startsWith(path))

    return (
        <ShellLayout
            userName={user?.realName}
            userPosition={user?.postName || user?.deptName || '普通员工'}
            avatarFallback={user?.realName?.slice(0, 1) || 'U'}
            pageTitle={shouldHideHero ? undefined : pageMeta.title}
            pageDescription={shouldHideHero ? undefined : pageMeta.description}
            navItems={navItems}
            onLogout={handleLogout}
            headerSlot={
                shouldHideHero ? null : (
                    <div className="flex flex-wrap gap-3">
                        <Button variant="soft" size="sm" onClick={() => navigate('/dashboard/create/leave')}>
                            <Plus className="mr-2 h-4 w-4" /> 请假申请
                        </Button>
                        <Button variant="tonal" size="sm" onClick={() => navigate('/dashboard/create/reimburse')}>
                            <ClipboardList className="mr-2 h-4 w-4" /> 报销申请
                        </Button>
                    </div>
                )
            }
        >
            <div className="mx-auto max-w-6xl space-y-10">
                <Routes>
                    <Route path="summary" element={<UserSummary />} />
                    <Route path="applications" element={<MyApplications />} />
                    <Route path="approval-history" element={<ApprovalHistory />} />
                    <Route path="create/leave" element={<CreateLeave />} />
                    <Route path="create/reimburse" element={<CreateReimburse />} />
                    <Route
                        index
                        element={<WelcomePanel navigate={navigate} />}
                    />
                </Routes>
            </div>
        </ShellLayout>
    )
}

function resolvePageMeta(pathname: string) {
    const metaMap: Record<string, { title: string; description: string }> = {
        '/dashboard/summary': {
            title: '个人仪表盘',
            description: '实时掌握待办、已办、申请统计，提前预知瓶颈节点。',
        },
        '/dashboard/applications': {
            title: '我的申请',
            description: '草稿、审批中与已完成申请一目了然，支持多条件筛选。',
        },
        '/dashboard/approval-history': {
            title: '审批历史',
            description: '回溯所有流转节点和审批意见，支持导出与复查。',
        },
        '/dashboard/create/leave': {
            title: '创建请假申请',
            description: '填写请假信息并上传附件，系统将自动指派审批人。',
        },
        '/dashboard/create/reimburse': {
            title: '创建报销申请',
            description: '上传发票凭证并选择费用类型，确保凭证完整可追溯。',
        },
    }

    const matched = Object.entries(metaMap).find(([key]) => pathname.startsWith(key))?.[1]
    return matched ?? {
        title: '工作台',
        description: '从左侧导航选择要处理的事项，快速开始一天的工作。',
    }
}

function WelcomePanel({ navigate }: { navigate: NavigateFunction }) {
    return (
        <div className="rounded-[32px] border border-white/60 bg-gradient-to-r from-indigo-500/10 via-white to-indigo-500/5 p-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
                        <Sparkles className="h-4 w-4" /> 欢迎回来
                    </span>
                    <h2 className="mt-4 text-4xl font-semibold tracking-tight text-[#0F172A]">开启高效审批的一天</h2>
                    <p className="mt-3 max-w-2xl text-base text-muted-foreground">
                        快速创建请假/报销申请，或前往仪表盘查看待办与实时统计，系统已为您准备好必要的提醒与指引。
                    </p>
                </div>
                <div className="flex flex-col gap-3">
                    <Button size="lg" onClick={() => navigate('/dashboard/applications')}>
                        <FileText className="mr-2 h-5 w-5" /> 查看我的申请
                    </Button>
                    <div className="flex flex-wrap gap-3">
                        <Button variant="outline" onClick={() => navigate('/dashboard/create/leave')}>
                            <Plus className="mr-2 h-4 w-4" /> 新建请假
                        </Button>
                        <Button variant="ghost-tonal" onClick={() => navigate('/dashboard/create/reimburse')}>
                            <ClipboardList className="mr-2 h-4 w-4" /> 新建报销
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

