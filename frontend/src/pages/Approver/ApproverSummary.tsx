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
        },
        {
            title: '审批通过数',
            value: summary?.approvedCount,
            description: '已同意的审批',
        },
        {
            title: '审批拒绝数',
            value: summary?.rejectedCount,
            description: '已拒绝的审批',
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

    if (showSkeleton) {
        return (
            <div className="space-y-6">
                {[0, 1].map((key) => (
                    <div key={key} className="h-40 rounded-2xl border bg-white shadow-sm animate-pulse" />
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>审批人信息</CardTitle>
                    <CardDescription>了解当前审批人的基础信息与权限</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6 md:grid-cols-4">
                        <div>
                            <p className="text-sm text-muted-foreground">姓名</p>
                            <p className="text-2xl font-semibold text-foreground mt-1">
                                {summary?.realName || user?.realName || '--'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">部门</p>
                            <p className="text-2xl font-semibold text-foreground mt-1">
                                {summary?.deptName || '未分配'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">岗位</p>
                            <p className="text-2xl font-semibold text-foreground mt-1">
                                {summary?.postName || '未分配'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">权限</p>
                            <div className="mt-2 flex flex-wrap gap-2">{permissionBadges}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

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
                            <Card key={card.title} className="border-muted bg-white shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base font-medium text-muted-foreground">
                                        {card.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold tracking-tight">
                                        {formatInt(card.value)}
                                    </div>
                                    {card.description && (
                                        <p className="text-sm text-muted-foreground mt-2">{card.description}</p>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>按申请类型统计</CardTitle>
                            <CardDescription>不同申请类型的审批占比</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {summary?.typeStats?.length ? (
                                <div className="grid gap-4 md:grid-cols-3">
                                    {summary.typeStats.map((item) => {
                                        const formatted = formatInt(item.count)
                                        return (
                                            <Card key={item.appType} className="border-muted bg-muted/10">
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-base font-medium text-muted-foreground">
                                                        {item.typeLabel}
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="text-3xl font-bold tracking-tight">
                                                        {formatted}
                                                        {formatted !== '--' && (
                                                            <span className="ml-1 text-sm text-muted-foreground">件</span>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">暂无审批类型统计数据</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <CardTitle>按日审批趋势</CardTitle>
                                <CardDescription>选择年月查看每日审批任务的波动情况</CardDescription>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <select
                                    className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                                    value={selectedYear}
                                    onChange={(event) => setSelectedYear(Number(event.target.value))}
                                >
                                    {yearOptions.map((year) => (
                                        <option key={year} value={year}>
                                            {year}年
                                        </option>
                                    ))}
                                </select>
                                <select
                                    className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                                    value={selectedMonth}
                                    onChange={(event) => setSelectedMonth(Number(event.target.value))}
                                >
                                    {monthOptions.map((month) => (
                                        <option key={month} value={month}>
                                            {month}月
                                        </option>
                                    ))}
                                </select>
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
                        <CardContent className="h-[320px]">
                            {chartData.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-muted-foreground">
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
