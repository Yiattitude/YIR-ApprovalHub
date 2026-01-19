import { useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { taskApi } from '@/api'
import type { ApproverDashboardSummary } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'

export default function ApproverSummary() {
    const { user } = useAuthStore()
    const [summary, setSummary] = useState<ApproverDashboardSummary | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [refreshFlag, setRefreshFlag] = useState(0)
    const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear())
    const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1)

    const yearOptions = useMemo(() => {
        const currentYear = new Date().getFullYear()
        return Array.from({ length: 5 }, (_, idx) => currentYear - idx)
    }, [])

    const monthOptions = useMemo(() => Array.from({ length: 12 }, (_, idx) => idx + 1), [])

    useEffect(() => {
        let active = true
        setLoading(true)
        setError(null)

        taskApi
            .getApproverDashboard({ year: selectedYear, month: selectedMonth })
            .then((data) => {
                if (!active) return
                setSummary(data)
            })
            .catch(() => {
                if (!active) return
                setError('仪表盘数据加载失败，请稍后重试。')
            })
            .finally(() => {
                if (!active) return
                setLoading(false)
            })

        return () => {
            active = false
        }
    }, [refreshFlag, selectedYear, selectedMonth])

    const permissionLabelMap: Record<string, string> = {
        SYSTEM_ADMIN: '系统管理',
        APPROVAL_REVIEW: '审批处理',
        APPLICATION_SUBMIT: '申请提交',
    }

    const fallbackPermissions = user?.permissions?.length ? user.permissions : ['APPROVAL_REVIEW']
    const permissionBadges = fallbackPermissions.map((permission) => {
        const label = permissionLabelMap[permission.toUpperCase()] || permission
        return (
            <Badge key={permission} variant="secondary">
                {label}
            </Badge>
        )
    })

    const formatInt = (value?: number | null) => {
        if (value === null || value === undefined || Number.isNaN(Number(value))) {
            return '--'
        }
        return Number(value).toLocaleString('zh-CN')
    }

    const metricCards = [
        {
            title: '审批申请数量',
            value: summary?.totalCount,
            description: '累计处理的审批任务',
            accent: 'from-indigo-500/20 via-indigo-500/10 to-transparent',
        },
        {
            title: '审批通过数',
            value: summary?.approvedCount,
            description: '已同意的审批',
            accent: 'from-emerald-500/25 via-emerald-500/10 to-transparent',
        },
        {
            title: '审批拒绝数',
            value: summary?.rejectedCount,
            description: '已拒绝的审批',
            accent: 'from-rose-500/25 via-rose-500/10 to-transparent',
        },
    ]

    const chartData = useMemo(() => {
        if (!summary?.dailyStats?.length) {
            return []
        }
        return [...summary.dailyStats]
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((item) => {
                const daySegment = item.date ? item.date.split('-')[2] : undefined
                const dayNumber = daySegment ? Number(daySegment) : NaN
                return {
                    date: item.date,
                    dayLabel: Number.isNaN(dayNumber) ? item.date : `${dayNumber}日`,
                    count: Number(item.count) || 0,
                }
            })
    }, [summary])

    const showSkeleton = loading && !summary && !error

    return (
        <div className="space-y-8">
            {showSkeleton ? (
                <div className="space-y-4">
                    {[0, 1].map((key) => (
                        <div key={key} className="h-40 rounded-[28px] border border-white/70 bg-white/70 shadow-[0_25px_45px_rgba(15,23,42,0.06)] animate-pulse" />
                    ))}
                </div>
            ) : (
                <Card className="border-none bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-400 text-white">
                    <CardHeader className="pb-0">
                        <CardTitle className="text-white">审批人信息</CardTitle>
                        <CardDescription className="text-white/70">
                            了解当前审批人的基础信息与权限
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid gap-6 md:grid-cols-4">
                            <div>
                                <p className="text-sm text-white/70">姓名</p>
                                <p className="mt-1 text-2xl font-semibold">{summary?.realName || user?.realName || '--'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-white/70">部门</p>
                                <p className="mt-1 text-2xl font-semibold">{summary?.deptName || '未分配'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-white/70">岗位</p>
                                <p className="mt-1 text-2xl font-semibold">{summary?.postName || '未分配'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-white/70">权限</p>
                                <div className="mt-2 flex flex-wrap gap-2">{permissionBadges}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {error ? (
                <Card className="border-destructive/40 shadow-sm">
                    <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                        <AlertCircle className="h-5 w-5 text-destructive" />
                        <div>
                            <CardTitle>统计数据加载失败</CardTitle>
                            <CardDescription>{error}</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" onClick={() => setRefreshFlag((flag) => flag + 1)}>
                            重试
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="grid gap-4 md:grid-cols-3">
                        {metricCards.map((card) => (
                            <Card key={card.title} className="border-none bg-white/90">
                                <CardContent className="space-y-4 pt-6">
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">{card.title}</p>
                                        <p className="text-4xl font-semibold tracking-tight">{formatInt(card.value)}</p>
                                        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{card.description}</p>
                                    </div>
                                    <div className={`rounded-2xl bg-gradient-to-b ${card.accent} p-2`}> 
                                        <div className="h-[48px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={chartData.slice(-10)}>
                                                    <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle>按申请类型统计</CardTitle>
                            <CardDescription>不同申请类型的审批占比</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {summary?.typeStats?.length ? (
                                summary.typeStats.map((item) => {
                                    const formatted = formatInt(item.count)
                                    const percent = summary?.totalCount ? Math.round(((item.count || 0) / (summary.totalCount || 1)) * 100) : 0
                                    return (
                                        <div key={item.appType} className="rounded-2xl border border-muted/60 p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-muted-foreground">{item.typeLabel}</p>
                                                    <p className="text-2xl font-semibold text-foreground mt-1">
                                                        {formatted}
                                                        {formatted !== '--' && (
                                                            <span className="ml-1 text-sm text-muted-foreground">件</span>
                                                        )}
                                                    </p>
                                                </div>
                                                <span className="text-sm font-semibold text-primary">{percent}%</span>
                                            </div>
                                            <div className="mt-3 h-2 rounded-full bg-muted">
                                                <div className="h-full rounded-full bg-gradient-to-r from-primary to-indigo-400" style={{ width: `${Math.min(100, percent)}%` }} />
                                            </div>
                                        </div>
                                    )
                                })
                            ) : (
                                <p className="text-sm text-muted-foreground">暂无审批类型统计数据</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="gap-6">
                            <div className="flex flex-col gap-2">
                                <CardTitle>按日审批趋势</CardTitle>
                                <CardDescription>选择年月查看每日审批任务的波动情况</CardDescription>
                            </div>
                            <div className="flex flex-wrap gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">年度</p>
                                    <div className="flex flex-wrap gap-2">
                                        {yearOptions.map((year) => (
                                            <button
                                                key={year}
                                                className={`rounded-full border px-4 py-1.5 text-sm transition ${
                                                    selectedYear === year
                                                        ? 'border-primary bg-primary/10 text-primary'
                                                        : 'border-muted-foreground/10 text-muted-foreground hover:border-primary/30'
                                                }`}
                                                onClick={() => setSelectedYear(year)}
                                            >
                                                {year}年
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">月份</p>
                                    <div className="flex flex-wrap gap-2">
                                        {monthOptions.map((month) => (
                                            <button
                                                key={month}
                                                className={`rounded-full border px-3 py-1 text-sm transition ${
                                                    selectedMonth === month
                                                        ? 'border-primary bg-primary/10 text-primary'
                                                        : 'border-muted-foreground/10 text-muted-foreground hover:border-primary/30'
                                                }`}
                                                onClick={() => setSelectedMonth(month)}
                                            >
                                                {month}月
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setRefreshFlag((flag) => flag + 1)}
                                    disabled={loading}
                                >
                                    刷新
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="h-[360px]">
                            {chartData.length === 0 ? (
                                <div className="flex h-full items-center justify-center text-muted-foreground">
                                    所选月份暂无审批趋势数据
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis dataKey="dayLabel" tickLine={false} axisLine={false} />
                                        <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: 12,
                                                border: '1px solid var(--border)',
                                            }}
                                        />
                                        <Line type="monotone" dataKey="count" strokeWidth={3} stroke="hsl(var(--primary))" />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    )
}
