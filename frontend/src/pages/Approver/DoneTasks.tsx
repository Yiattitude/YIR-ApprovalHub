import { useState, useEffect, useMemo } from 'react'
import { applicationApi, taskApi } from '@/api'
import type { Task } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye } from 'lucide-react'
import { ApplicationDetailDialog } from '@/components/ApplicationDetailDialog'
import PaginationControls from '@/components/PaginationControls'
import {
    LEAVE_TYPE_LABELS,
    EXPENSE_TYPE_LABELS,
    APPLICATION_TYPE_LABELS,
} from '@/constants/application'
import { cn } from '@/lib/utils'

const actionMap: Record<number, { text: string; variant: "success" | "destructive" | "default" | "secondary" | "outline" | "warning" }> = {
    1: { text: '同意', variant: 'success' },
    2: { text: '拒绝', variant: 'destructive' },
}

type TaskWithType = Task & { leaveType?: number; expenseType?: number }

export default function DoneTasks() {
    const [tasks, setTasks] = useState<TaskWithType[]>([])
    const [loading, setLoading] = useState(false)
    const [detailAppId, setDetailAppId] = useState<number | undefined>()
    const [detailOpen, setDetailOpen] = useState(false)
    const [pageNum, setPageNum] = useState(1)
    const [total, setTotal] = useState(0)
    const pageSize = 10
    const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week'>('all')
    const [typeFilter, setTypeFilter] = useState<'all' | 'leave' | 'reimburse'>('all')

    const fetchTasks = async () => {
        setLoading(true)
        try {
            const res = await taskApi.getDoneTasks({ pageNum, pageSize })
            const records = Array.isArray(res.records) ? res.records : []
            const enriched = await enrichTasksWithTypes(records)
            if (pageNum > 1 && enriched.length === 0 && (res.total || 0) > 0) {
                setPageNum((prev) => Math.max(1, prev - 1))
                return
            }
            setTasks(enriched)
            setTotal(res.total || enriched.length)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTasks()
    }, [pageNum])

    const visibleTasks = useMemo(() => {
        return tasks.filter((task) => {
            const matchType = typeFilter === 'all' ? true : task.appType === typeFilter
            if (!matchType) return false

            if (timeFilter === 'all') return true

            const finishedAt = task.finishTime ? new Date(task.finishTime) : null
            if (!finishedAt) return false
            const now = new Date()
            if (timeFilter === 'today') {
                return finishedAt.toDateString() === now.toDateString()
            }
            if (timeFilter === 'week') {
                const diff = now.getTime() - finishedAt.getTime()
                return diff <= 7 * 24 * 60 * 60 * 1000
            }
            return true
        })
    }, [tasks, timeFilter, typeFilter])

    const timeFilters = [
        { label: '全部', value: 'all' as const },
        { label: '今日', value: 'today' as const },
        { label: '近7天', value: 'week' as const },
    ]

    const typeFilters = [
        { label: '全部类型', value: 'all' as const },
        { label: '请假', value: 'leave' as const },
        { label: '报销', value: 'reimburse' as const },
    ]

    const accentMap: Record<string, string> = {
        leave: 'border-l-4 border-indigo-400/90',
        reimburse: 'border-l-4 border-amber-400/90',
    }

    return (
        <div className="space-y-6">
        
            <Card>
                <CardHeader className="space-y-4">
                    
                    <div className="flex items-center justify-between gap-3">
                                            <CardTitle>任务历史</CardTitle>
                                            <Button variant="soft" size="sm" onClick={fetchTasks} disabled={loading}>
                                                刷新列表
                                            </Button>
                                        </div>
                    <div className="flex flex-wrap gap-3">
                        <div className="flex flex-wrap gap-2">
                            {timeFilters.map((filter) => (
                                <button
                                    key={filter.value}
                                    className={cn(
                                        'rounded-full border px-4 py-1.5 text-sm transition',
                                        timeFilter === filter.value
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-muted-foreground/10 text-muted-foreground hover:border-primary/30'
                                    )}
                                    onClick={() => setTimeFilter(filter.value)}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {typeFilters.map((filter) => (
                                <button
                                    key={filter.value}
                                    className={cn(
                                        'rounded-full border px-4 py-1.5 text-sm transition',
                                        typeFilter === filter.value
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-muted-foreground/10 text-muted-foreground hover:border-primary/30'
                                    )}
                                    onClick={() => setTypeFilter(filter.value)}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-10 text-muted-foreground">加载中...</div>
                    ) : visibleTasks.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">暂无已办任务</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>申请单号</TableHead>
                                    <TableHead>标题</TableHead>
                                    <TableHead>申请人</TableHead>
                                    <TableHead>审批结果</TableHead>
                                    <TableHead>审批意见</TableHead>
                                    <TableHead>完成时间</TableHead>
                                    <TableHead>操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {visibleTasks.map((task) => (
                                    <TableRow
                                        key={task.taskId}
                                        className={cn(
                                            'transition hover:bg-muted/40',
                                            accentMap[task.appType] || 'border-l-4 border-transparent'
                                        )}
                                    >
                                        <TableCell>{task.appNo}</TableCell>
                                        <TableCell>{renderTaskTitle(task)}</TableCell>
                                        <TableCell>{task.applicantName}</TableCell>
                                        <TableCell>
                                            <Badge variant={actionMap[task.action || 1]?.variant}>
                                                {actionMap[task.action || 1]?.text}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {task.comment || '-'}
                                        </TableCell>
                                        <TableCell>
                                            {task.finishTime
                                                ? new Date(task.finishTime).toLocaleString('zh-CN')
                                                : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="inline-flex items-center gap-1 rounded-full border-primary/30 px-4 py-1 text-primary hover:border-primary/60 hover:bg-primary/5"
                                                onClick={() => {
                                                    setDetailAppId(task.appId)
                                                    setDetailOpen(true)
                                                }}
                                            >
                                                <Eye className="h-4 w-4" /> 查看
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                    {!loading && total > pageSize && (
                        <PaginationControls
                            pageNum={pageNum}
                            pageSize={pageSize}
                            total={total}
                            onPageChange={setPageNum}
                        />
                    )}
                </CardContent>
            </Card>

            <ApplicationDetailDialog
                appId={detailAppId}
                open={detailOpen}
                onOpenChange={(open) => {
                    setDetailOpen(open)
                    if (!open) {
                        setDetailAppId(undefined)
                    }
                }}
            />
        </div>
    )
}

const enrichTasksWithTypes = async (tasks: Task[]): Promise<TaskWithType[]> => {
    if (tasks.length === 0) {
        return []
    }

    const detailEntries = await Promise.all(
        tasks.map(async (task) => {
            try {
                const detail = await applicationApi.getDetail(task.appId)
                return {
                    appId: task.appId,
                    leaveType: extractLeaveType(detail.detail),
                    expenseType: extractExpenseType(detail.detail),
                }
            } catch (error) {
                console.error('加载任务详情失败', task.appId, error)
                return { appId: task.appId }
            }
        })
    )

    const detailMap = new Map<number, { leaveType?: number; expenseType?: number }>()
    detailEntries.forEach((entry) => {
        detailMap.set(entry.appId, {
            leaveType: entry.leaveType,
            expenseType: entry.expenseType,
        })
    })

    return tasks.map((task) => {
        const extra = detailMap.get(task.appId)
        if (!extra) return task
        return {
            ...task,
            leaveType: extra.leaveType ?? task.leaveType,
            expenseType: extra.expenseType ?? task.expenseType,
        }
    })
}

const extractLeaveType = (detail: unknown): number | undefined => {
    if (detail && typeof detail === 'object' && 'leaveType' in detail) {
        const value = (detail as { leaveType?: number }).leaveType
        return typeof value === 'number' ? value : undefined
    }
    return undefined
}

const extractExpenseType = (detail: unknown): number | undefined => {
    if (detail && typeof detail === 'object' && 'expenseType' in detail) {
        const value = (detail as { expenseType?: number }).expenseType
        return typeof value === 'number' ? value : undefined
    }
    return undefined
}

const renderTaskTitle = (task: TaskWithType) => {
    if (task.appType === 'leave') {
        if (task.leaveType) {
            return LEAVE_TYPE_LABELS[task.leaveType] || '请假'
        }
        return '请假'
    }

    if (task.appType === 'reimburse') {
        if (task.expenseType) {
            return EXPENSE_TYPE_LABELS[task.expenseType] || '报销'
        }
        return '报销'
    }

    return task.title || APPLICATION_TYPE_LABELS[task.appType] || '-'
}
