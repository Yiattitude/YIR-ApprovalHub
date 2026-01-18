import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { applicationApi } from '@/api'
import type { Application } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, Undo2 } from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ApplicationDetailDialog } from '@/components/ApplicationDetailDialog'
import PaginationControls from '@/components/PaginationControls'
import {
    APPLICATION_STATUS,
    APPLICATION_TYPE_LABELS,
    LEAVE_TYPE_LABELS,
    EXPENSE_TYPE_LABELS,
} from '@/constants/application'

// 这个界面是干什么的？ 显示用户自己的申请列表，并允许用户筛选和撤回申请

export default function MyApplications() {
    const navigate = useNavigate()
    const [applications, setApplications] = useState<Application[]>([])
    const [loading, setLoading] = useState(false)
    const [filter, setFilter] = useState({ appType: '', status: '' })
    const [detailAppId, setDetailAppId] = useState<number | undefined>()
    const [detailOpen, setDetailOpen] = useState(false)
    const [pageNum, setPageNum] = useState(1)
    const [total, setTotal] = useState(0)
    const pageSize = 10

    const allowedStatuses = [0, 1, 2]

    const fetchApplications = async () => {
        setLoading(true)
        try {
            const res = await applicationApi.getMyApplications({
                pageNum,
                pageSize,
                appType: filter.appType || undefined,
                status: filter.status ? Number(filter.status) : undefined,
            })
            const records = Array.isArray(res.records) ? res.records : []// 防止后端返回非数组
            const enriched = await enrichApplications(records)
            if (pageNum > 1 && enriched.length === 0 && (res.total || 0) > 0) {
                setPageNum((prev) => Math.max(1, prev - 1))
                return
            }
            setApplications(enriched.filter((item) => allowedStatuses.includes(item.status)))// 只显示未完成的申请
            setTotal(res.total || enriched.length)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchApplications()
    }, [filter, pageNum])

    const handleViewDetail = (appId: number) => {
        setDetailAppId(appId)
        setDetailOpen(true)
    }

    const handleWithdraw = async (appId: number) => {
        if (!confirm('确定要撤回此申请吗？')) return

        try {
            await applicationApi.withdraw(appId)
            alert('撤回成功')
            fetchApplications()
        } catch (error: any) {
            alert(error?.message || '撤回失败')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">我的申请</h2>
                <div className="flex gap-4">
                    <Button onClick={() => navigate('/dashboard/create/leave')}>
                        + 请假申请
                    </Button>
                    <Button  onClick={() => navigate('/dashboard/create/reimburse')}>
                        + 报销申请
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex gap-4">
                        <Select
                            value={filter.appType}
                            onValueChange={(val) => {
                                setFilter({ ...filter, appType: val === "all" ? "" : val })
                                setPageNum(1)
                            }}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="全部类型" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">全部类型</SelectItem>
                                <SelectItem value="leave">请假</SelectItem>
                                <SelectItem value="reimburse">报销</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={filter.status}
                            onValueChange={(val) => {
                                setFilter({ ...filter, status: val === "all" ? "" : val })
                                setPageNum(1)
                            }}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="全部状态" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">全部状态</SelectItem>
                                <SelectItem value="1">待审批</SelectItem>
                                <SelectItem value="2">审批中</SelectItem>
                                <SelectItem value="0">草稿</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-10 text-muted-foreground">加载中...</div>
                    ) : applications.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">暂无申请记录</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>申请单号</TableHead>
                                    <TableHead>类型</TableHead>
                                    <TableHead>标题</TableHead>
                                    <TableHead>状态</TableHead>
                                    <TableHead>提交时间</TableHead>
                                    <TableHead>操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {applications.map((app) => (
                                    <TableRow key={app.appId}>
                                        <TableCell>{app.appNo}</TableCell>
                                        <TableCell>{APPLICATION_TYPE_LABELS[app.appType] || app.appType}</TableCell>
                                        <TableCell>{renderTitle(app)}</TableCell>
                                        <TableCell>
                                            <Badge variant={APPLICATION_STATUS[app.status]?.variant || 'outline'}>
                                                {APPLICATION_STATUS[app.status]?.text || '-'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(app.submitTime).toLocaleString('zh-CN')}
                                        </TableCell>
                                        <TableCell className="space-x-2">
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="inline-flex items-center gap-1"
                                                onClick={() => handleViewDetail(app.appId)}
                                            >
                                                <Eye className="h-4 w-4" />
                                                查看
                                            </Button>
                                            {app.status === 1 && (
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="inline-flex items-center gap-1 text-destructive"
                                                    onClick={() => handleWithdraw(app.appId)}
                                                >
                                                    <Undo2 className="h-4 w-4" />
                                                    撤回
                                                </Button>
                                            )}
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

const enrichApplications = async (apps: Application[]): Promise<Application[]> => {
    const needDetails = apps.filter((app) =>
        (app.appType === 'leave' && !app.leaveType) ||
        (app.appType === 'reimburse' && !app.expenseType)
    )

    if (needDetails.length === 0) {
        return apps
    }

    const detailEntries = await Promise.all(
        needDetails.map(async (app) => {
            try {
                const detail = await applicationApi.getDetail(app.appId)
                return {
                    appId: app.appId,
                    leaveType: extractLeaveType(detail.detail),
                    expenseType: extractExpenseType(detail.detail),
                }
            } catch (error) {
                console.error('加载申请详情失败', app.appId, error)
                return { appId: app.appId }
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

    return apps.map((app) => {
        const extra = detailMap.get(app.appId)
        if (!extra) return app
        return {
            ...app,
            leaveType: extra.leaveType ?? app.leaveType,
            expenseType: extra.expenseType ?? app.expenseType,
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

const renderTitle = (app: Application) => {
    if (app.appType === 'leave') {
        if (app.leaveType) {
            return LEAVE_TYPE_LABELS[app.leaveType] || '请假'
        }
        return '请假'
    }

    if (app.appType === 'reimburse') {
        if (app.expenseType) {
            return EXPENSE_TYPE_LABELS[app.expenseType] || '报销'
        }
        return '报销'
    }

    return app.title || '-'
}