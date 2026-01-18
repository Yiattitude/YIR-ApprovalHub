import { useState, useEffect } from 'react'
import { applicationApi, taskApi } from '@/api'
import type { Task } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, CheckCircle } from 'lucide-react'
import { ApplicationDetailDialog } from '@/components/ApplicationDetailDialog'
import PaginationControls from '@/components/PaginationControls'
import {
    LEAVE_TYPE_LABELS,
    EXPENSE_TYPE_LABELS,
    APPLICATION_TYPE_LABELS,
} from '@/constants/application'

type TaskWithType = Task & { leaveType?: number; expenseType?: number }

export default function TodoTasks() {
    const [tasks, setTasks] = useState<TaskWithType[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedTask, setSelectedTask] = useState<TaskWithType | null>(null)
    const [approveForm, setApproveForm] = useState({
        action: 1,
        comment: '',
    })
    const [detailAppId, setDetailAppId] = useState<number | undefined>()
    const [detailOpen, setDetailOpen] = useState(false)
    const [pageNum, setPageNum] = useState(1)
    const [total, setTotal] = useState(0)
    const pageSize = 10

    const fetchTasks = async () => {
        setLoading(true)
        try {
            const res = await taskApi.getTodoTasks({ pageNum, pageSize })
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

    const handleApprove = async () => {
        if (!selectedTask) return

        try {
            await taskApi.approve({
                taskId: selectedTask.taskId,
                action: approveForm.action,
                comment: approveForm.comment || undefined,
            })
            alert('审批成功')
            setSelectedTask(null)
            setApproveForm({ action: 1, comment: '' })
            fetchTasks()
        } catch (error: any) {
            alert(error?.message || '审批失败')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">待办任务</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>任务列表</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-10 text-muted-foreground">加载中...</div>
                    ) : tasks.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">暂无待办任务</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>申请单号</TableHead>
                                    <TableHead>标题</TableHead>
                                    <TableHead>申请人</TableHead>
                                    <TableHead>当前节点</TableHead>
                                    <TableHead>接收时间</TableHead>
                                    <TableHead>操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tasks.map((task) => (
                                    <TableRow key={task.taskId}>
                                        <TableCell>{task.appNo}</TableCell>
                                        <TableCell>{renderTaskTitle(task)}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{task.applicantName}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{task.nodeName}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(task.createTime).toLocaleString('zh-CN')}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-3">
                                            <Button
                                                variant="link"
                                                    className="inline-flex items-center gap-1 p-0"
                                                onClick={() => {
                                                    setDetailAppId(task.appId)
                                                    setDetailOpen(true)
                                                }}
                                            >
                                                <Eye className="h-4 w-4" /> 查看
                                            </Button>
                                            <Button
                                                variant="link"
                                                    className="inline-flex items-center gap-1 p-0"
                                                onClick={() => setSelectedTask(task)}
                                            >
                                                    <CheckCircle className="h-4 w-4" /> 审批
                                            </Button>
                                            </div>
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

            <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>审批：{selectedTask?.title}</DialogTitle>
                        <DialogDescription>
                            请仔细核对申请信息后进行审批操作。
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>审批动作</Label>
                            <RadioGroup
                                value={String(approveForm.action)}
                                onValueChange={(val) => setApproveForm({ ...approveForm, action: Number(val) })}
                                className="flex gap-4"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="1" id="r1" />
                                    <Label htmlFor="r1">同意</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="2" id="r2" />
                                    <Label htmlFor="r2">拒绝</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="grid gap-2">
                            <Label>审批意见</Label>
                            <Textarea
                                value={approveForm.comment}
                                onChange={(e) => setApproveForm({ ...approveForm, comment: e.target.value })}
                                placeholder="请输入审批意见..."
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedTask(null)}>取消</Button>
                        <Button onClick={handleApprove}>提交</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
