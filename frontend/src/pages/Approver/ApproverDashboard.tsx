import { Routes, Route, useNavigate, useLocation, type NavigateFunction } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import MyApplications from '../MyApplications'
import TodoTasks from './TodoTasks'
import DoneTasks from './DoneTasks'
import ApproverSummary from './ApproverSummary'
import { Button } from '@/components/ui/button'
import { FileText, CheckSquare, ClipboardList, Gauge, Sparkles } from 'lucide-react'
import { ShellLayout, type ShellNavItem } from '@/components/layout/ShellLayout'

/**
 * 审批人Dashboard
 * 功能：我的申请、待办任务、已办任务
 */
export default function ApproverDashboard() {
    const navigate = useNavigate()
    const location = useLocation()
    const { user, clearAuth } = useAuthStore()

    const handleLogout = () => {
        clearAuth()
        navigate('/login')
    }

    const navItems: ShellNavItem[] = [
        { to: '/dashboard/summary', label: '审批仪表盘', icon: Gauge, description: '整体趋势' },
        { to: '/dashboard/applications', label: '我的申请', icon: FileText, description: '自提事项' },
        { to: '/dashboard/todo', label: '待审批任务', icon: CheckSquare, description: '当前待办' },
        { to: '/dashboard/done', label: '已审批任务', icon: ClipboardList, description: '历史记录' },
    ]

    const pageMeta = resolvePageMeta(location.pathname)

    return (
        <ShellLayout
            userName={user?.realName}
            userPosition={user?.postName || '审批人'}
            avatarFallback={user?.realName?.slice(0, 1) || 'A'}
            pageTitle={pageMeta.title}
            pageDescription={pageMeta.description}
            navItems={navItems}
            onLogout={handleLogout}
            headerSlot={
                <div className="flex flex-wrap gap-3">
                    <Button variant="soft" size="sm" onClick={() => navigate('/dashboard/todo')}>
                        <CheckSquare className="mr-2 h-4 w-4" /> 立即审批
                    </Button>
                    <Button variant="tonal" size="sm" onClick={() => navigate('/dashboard/done')}>
                        <ClipboardList className="mr-2 h-4 w-4" /> 查看历史
                    </Button>
                </div>
            }
        >
            <div className="mx-auto max-w-6xl space-y-10">
                <Routes>
                    <Route path="summary" element={<ApproverSummary />} />
                    <Route path="applications" element={<MyApplications />} />
                    <Route path="todo" element={<TodoTasks />} />
                    <Route path="done" element={<DoneTasks />} />
                    <Route index element={<ApproverWelcome navigate={navigate} />} />
                </Routes>
            </div>
        </ShellLayout>
    )
}

function resolvePageMeta(pathname: string) {
    const metaMap: Record<string, { title: string; description: string }> = {
        '/dashboard/summary': {
            title: '审批仪表盘',
            description: '掌握你本月的审批数量、通过率与类型构成。',
        },
        '/dashboard/applications': {
            title: '我的申请',
            description: '查看自己提交的请假/报销，掌握审批进度。',
        },
        '/dashboard/todo': {
            title: '待审批任务',
            description: '按优先级列出所有待处理的审批，快速批量处理。',
        },
        '/dashboard/done': {
            title: '已审批任务',
            description: '回溯你的审批动作与意见，支持抽查与复核。',
        },
    }

    const matched = Object.entries(metaMap).find(([key]) => pathname.startsWith(key))?.[1]
    return matched ?? {
        title: '审批中心',
        description: '使用左侧功能切换不同审批视角，确保流转顺畅。',
    }
}

function ApproverWelcome({ navigate }: { navigate: NavigateFunction }) {
    return (
        <div className="rounded-[32px] border border-white/60 bg-gradient-to-r from-emerald-500/15 via-white to-indigo-500/10 p-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
                        <Sparkles className="h-4 w-4" /> 审批效率助手
                    </span>
                    <h2 className="mt-4 text-4xl font-semibold tracking-tight text-[#0F172A]">待办提醒已就绪</h2>
                    <p className="mt-3 max-w-2xl text-base text-muted-foreground">
                        进入待办任务即可查看优先级和附件预览，也可以先浏览仪表盘了解整体趋势。
                    </p>
                </div>
                <div className="flex flex-col gap-3">
                    <Button size="lg" onClick={() => navigate('/dashboard/todo')}>
                        <CheckSquare className="mr-2 h-5 w-5" /> 前往待办
                    </Button>
                    <div className="flex flex-wrap gap-3">
                        <Button variant="outline" onClick={() => navigate('/dashboard/done')}>
                            <ClipboardList className="mr-2 h-4 w-4" /> 查看已办
                        </Button>
                        <Button variant="outline" onClick={() => navigate('/dashboard/summary')}>
                            <Gauge className="mr-2 h-4 w-4" /> 仪表盘
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

