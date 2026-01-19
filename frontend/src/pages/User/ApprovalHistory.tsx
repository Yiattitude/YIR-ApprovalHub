import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { applicationApi } from '@/api'
import type { ApplicationHistory } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { FileViewer } from '@/components/ui/FileViewer'


const statusMap: Record<number, { text: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }> = {
    0: { text: '草稿', variant: 'secondary' },
    1: { text: '待审批', variant: 'warning' },
    2: { text: '审批中', variant: 'default' },
    3: { text: '已通过', variant: 'success' },
    4: { text: '已拒绝', variant: 'destructive' },
    5: { text: '已撤回', variant: 'outline' },
}

const typeMap: Record<string, string> = {
    leave: '请假',
    reimburse: '报销',
}

const getMonthRange = (month: string) => {
    const start = dayjs(month, 'YYYY-MM').startOf('month')
    const end = start.endOf('month')
    return {
        startTime: start.format('YYYY-MM-DD[T]HH:mm:ss'),
        endTime: end.format('YYYY-MM-DD[T]HH:mm:ss'),
    }
}

export default function ApprovalHistory() {
    const [applications, setApplications] = useState<ApplicationHistory[]>([])
    const [loading, setLoading] = useState(false)
    const [detailLoading, setDetailLoading] = useState(false)
    const [selectedApp, setSelectedApp] = useState<ApplicationHistory | null>(null)
    const [applicationDetail, setApplicationDetail] = useState<any>(null)
    const [approverOptions, setApproverOptions] = useState<string[]>([])
    const [monthOptions, setMonthOptions] = useState<string[]>([])
    const [filter, setFilter] = useState({ appType: '', status: '', approverName: '', month: '' })

    const loadFilterOptions = async () => {
        try {
            const res = await applicationApi.getHistoryApplications({ pageNum: 1, pageSize: 500 })
            const records = Array.isArray(res.records) ? res.records : []

            const approvers = Array.from(
                new Set(records.map((item) => item.approverName).filter((name): name is string => Boolean(name)))
            )

            const months = Array.from(
                new Set(
                    records
                        .map((item) => item.approveTime || item.submitTime)
                        .filter((time): time is string => Boolean(time))
                        .map((time) => dayjs(time).format('YYYY-MM'))
                )
            ).sort((a, b) => (a > b ? -1 : 1))

            setApproverOptions(approvers)
            setMonthOptions(months)
        } catch (error) {
            console.error(error)
        }
    }

    const fetchApplications = async () => {
        setLoading(true)
        try {
            const params: Record<string, any> = {
                pageNum: 1,
                pageSize: 20,
                appType: filter.appType || undefined,
                status: filter.status ? Number(filter.status) : undefined,
                approverName: filter.approverName || undefined,
            }

            if (filter.month) {
                const { startTime, endTime } = getMonthRange(filter.month)
                params.startTime = startTime
                params.endTime = endTime
            }

            const res = await applicationApi.getHistoryApplications(params)
            const records = Array.isArray(res.records) ? res.records : []
            setApplications(records)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadFilterOptions()
    }, [])

    useEffect(() => {
        fetchApplications()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter.appType, filter.status, filter.approverName, filter.month])

    const renderDateTime = (value?: string) => (value ? new Date(value).toLocaleString('zh-CN') : '-')

    const fetchApplicationDetail = async (appId: number) => {
        setDetailLoading(true)
        try {
            const res = await applicationApi.getDetail(appId)
            setApplicationDetail(res)
        } catch (error) {
            console.error(error)
        } finally {
            setDetailLoading(false)
        }
    }


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">审批历史</h2>
                <div className="flex gap-4">
                    <Button onClick={fetchApplications} disabled={loading}>
                        {loading ? '刷新中...' : '刷新'}
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex gap-4">
                        <Select
                            value={filter.appType}
                            onValueChange={(val) =>
                                setFilter((prev) => ({ ...prev, appType: val === 'all' ? '' : val }))
                            }
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
                            onValueChange={(val) =>
                                setFilter((prev) => ({ ...prev, status: val === 'all' ? '' : val }))
                            }
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="全部状态" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">全部状态</SelectItem>
                                <SelectItem value="3">已通过</SelectItem>
                                <SelectItem value="4">已拒绝</SelectItem>
                                <SelectItem value="5">已撤回</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={filter.approverName}
                            onValueChange={(val) =>
                                setFilter((prev) => ({ ...prev, approverName: val === 'all' ? '' : val }))
                            }
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="审批人" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">全部审批人</SelectItem>
                                {approverOptions.length === 0 ? (
                                    <SelectItem value="__empty" disabled>
                                        暂无审批人
                                    </SelectItem>
                                ) : (
                                    approverOptions.map((name) => (
                                        <SelectItem key={name} value={name}>
                                            {name}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filter.month}
                            onValueChange={(val) =>
                                setFilter((prev) => ({ ...prev, month: val === 'all' ? '' : val }))
                            }
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="时间" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">全部时间</SelectItem>
                                {monthOptions.length === 0 ? (
                                    <SelectItem value="__empty" disabled>
                                        暂无数据
                                    </SelectItem>
                                ) : (
                                    monthOptions.map((month) => (
                                        <SelectItem key={month} value={month}>
                                            {month}
                                        </SelectItem>
                                    ))
                                )}
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
                                    <TableHead>审批人</TableHead>
                                    <TableHead>状态</TableHead>
                                    <TableHead>提交时间</TableHead>
                                    <TableHead>操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {applications.map((app) => (
                                    <TableRow key={app.appId}>
                                        <TableCell>{app.appNo}</TableCell>
                                        <TableCell>{typeMap[app.appType]}</TableCell>
                                        <TableCell>{app.title}</TableCell>
                                        <TableCell>{app.approverName || '-'}</TableCell>
                                        <TableCell>
                                            <Badge variant={statusMap[app.status]?.variant}>
                                                {statusMap[app.status]?.text}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{renderDateTime(app.submitTime)}</TableCell>
                                        <TableCell className="space-x-2">
                                            <Button 
                                                variant="link" 
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedApp(app);
                                                    fetchApplicationDetail(app.appId);
                                                }}
                                            >
                                                查看详情
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* 审批详情对话框 */}
            <Dialog open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>审批详情：{selectedApp?.title}</DialogTitle>
                        <DialogDescription>
                            查看完整的申请和审批信息
                        </DialogDescription>
                    </DialogHeader>

                    {detailLoading ? (
                        <div className="text-center py-8">加载详情中...</div>
                    ) : applicationDetail ? (
                        <div className="space-y-6">
                            {/* 申请基本信息 */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">申请信息</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500">申请单号</p>
                                            <p className="font-medium">{applicationDetail.application.appNo}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">申请类型</p>
                                            <p className="font-medium">{typeMap[applicationDetail.application.appType]}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">状态</p>
                                            <Badge variant={statusMap[applicationDetail.application.status]?.variant}>
                                                {statusMap[applicationDetail.application.status]?.text}
                                            </Badge>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">当前节点</p>
                                            <p className="font-medium">{applicationDetail.application.currentNode || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">提交时间</p>
                                            <p className="font-medium">{renderDateTime(applicationDetail.application.submitTime)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">完成时间</p>
                                            <p className="font-medium">{renderDateTime(applicationDetail.application.finishTime)}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* 申请详细信息 */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">申请内容</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {applicationDetail.application.appType === 'leave' ? (
                                        /* 请假申请详情 */
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-gray-500">请假类型</p>
                                                <p className="font-medium">
                                                    {applicationDetail.detail.leaveType === 1 ? '事假' : 
                                                     applicationDetail.detail.leaveType === 2 ? '病假' : 
                                                     applicationDetail.detail.leaveType === 3 ? '年假' : '调休'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">请假天数</p>
                                                <p className="font-medium">{applicationDetail.detail.days} 天</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">开始时间</p>
                                                <p className="font-medium">{renderDateTime(applicationDetail.detail.startTime)}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">结束时间</p>
                                                <p className="font-medium">{renderDateTime(applicationDetail.detail.endTime)}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-sm text-gray-500">请假事由</p>
                                                <p className="font-medium whitespace-pre-wrap">{applicationDetail.detail.reason}</p>
                                            </div>
                                            {applicationDetail.detail.attachment && (
                                                <div className="col-span-2 space-y-2">
                                                    <p className="text-sm text-gray-500">附件</p>
                                                    <FileViewer
                                                        fileName={applicationDetail.detail.attachment}
                                                        fileContent={applicationDetail.detail.attachment.startsWith('data:') ? applicationDetail.detail.attachment : undefined}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ) : applicationDetail.application.appType === 'reimburse' ? (
                                        /* 报销申请详情 */
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-gray-500">报销类别</p>
                                                <p className="font-medium">
                                                    {applicationDetail.detail.expenseType === 1 ? '差旅交通费' : 
                                                     applicationDetail.detail.expenseType === 2 ? '业务招待费' : 
                                                     applicationDetail.detail.expenseType === 3 ? '日常办公费' : 
                                                     applicationDetail.detail.expenseType === 4 ? '培训教育费' : 
                                                     applicationDetail.detail.expenseType === 5 ? '服务采购费' : '其他'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">报销金额</p>
                                                <p className="font-medium">¥ {applicationDetail.detail.amount.toFixed(2)}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-sm text-gray-500">费用发生日期</p>
                                                <p className="font-medium">{new Date(applicationDetail.detail.occurDate).toLocaleDateString('zh-CN')}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-sm text-gray-500">费用说明</p>
                                                <p className="font-medium whitespace-pre-wrap">{applicationDetail.detail.reason}</p>
                                            </div>
                                            <div className="col-span-2 space-y-2">
                                                <p className="text-sm text-gray-500">发票附件</p>
                                                <FileViewer
                                                    fileName={applicationDetail.detail.invoiceAttachment}
                                                    fileContent={applicationDetail.detail.invoiceAttachment.startsWith('data:') ? applicationDetail.detail.invoiceAttachment : undefined}
                                                />
                                            </div>
                                        </div>
                                    ) : null}
                                </CardContent>
                            </Card>

                            {/* 审批历史 */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">审批历史</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {applicationDetail.history && applicationDetail.history.length > 0 ? (
                                        <div className="space-y-4">
                                            {applicationDetail.history.map((item: any, index: number) => (
                                                <div key={item.historyId || index} className="relative pl-8 pb-4 border-l-2 border-gray-200">
                                                    <div className="absolute left-[-9px] top-0 w-4 h-4 bg-gray-800 rounded-full"></div>
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between items-center">
                                                            <p className="font-medium">{item.approverName || '系统'}</p>
                                                            <p className="text-sm text-gray-500">{renderDateTime(item.approveTime || item.createTime)}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm">
                                                                {item.action === 1 ? '同意' : item.action === 2 ? '拒绝' : '处理中'}
                                                            </p>
                                                            <p className="text-sm text-gray-500">{item.nodeName}</p>
                                                        </div>
                                                        {item.comment && (
                                                            <div className="mt-2 bg-gray-50 p-3 rounded">
                                                                <p className="text-sm">{item.comment}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500">暂无审批历史</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">无法加载申请详情</div>
                    )}

                    <DialogFooter>
                        <Button onClick={() => setSelectedApp(null)}>关闭</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
