import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { applicationApi } from '@/api'
import type { Application } from '@/types'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileViewer } from '@/components/ui/FileViewer'

// 这个界面是干什么的？ 显示用户自己的申请列表，并允许用户筛选和撤回申请

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

export default function MyApplications() {
    const navigate = useNavigate()
    const [applications, setApplications] = useState<Application[]>([])
    const [loading, setLoading] = useState(false)
    const [detailLoading, setDetailLoading] = useState(false)
    const [selectedApp, setSelectedApp] = useState<Application | null>(null)
    const [applicationDetail, setApplicationDetail] = useState<any>(null)
    const [filter, setFilter] = useState({ appType: '', status: '' })

    const allowedStatuses = [0, 1, 2]

    const fetchApplications = async () => {
        setLoading(true)
        try {
            const res = await applicationApi.getMyApplications({
                pageNum: 1,
                pageSize: 20,
                appType: filter.appType || undefined,
                status: filter.status ? Number(filter.status) : undefined,
            })
            const records = Array.isArray(res.records) ? res.records : []// 防止后端返回非数组
            setApplications(records.filter((item) => allowedStatuses.includes(item.status)))// 只显示未完成的申请
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchApplications()
    }, [filter])

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

    const renderDateTime = (value?: string) => (value ? new Date(value).toLocaleString('zh-CN') : '-')

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
                            onValueChange={(val) => setFilter({ ...filter, appType: val === "all" ? "" : val })}
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
                            onValueChange={(val) => setFilter({ ...filter, status: val === "all" ? "" : val })}
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
                                        <TableCell>{typeMap[app.appType]}</TableCell>
                                        <TableCell>{app.title}</TableCell>
                                        <TableCell>
                                            <Badge variant={statusMap[app.status]?.variant}>
                                                {statusMap[app.status]?.text}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(app.submitTime).toLocaleString('zh-CN')}
                                        </TableCell>
                                        <TableCell className="space-x-2">
                                            <Button 
                                                variant="link" 
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedApp(app);
                                                    fetchApplicationDetail(app.appId);
                                                }}
                                            >
                                                查看
                                            </Button>
                                            {app.status === 1 && (
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="text-destructive"
                                                    onClick={() => handleWithdraw(app.appId)}
                                                >
                                                    撤回
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* 申请详情对话框 */}
            <Dialog open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>申请详情：{selectedApp?.title}</DialogTitle>
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
