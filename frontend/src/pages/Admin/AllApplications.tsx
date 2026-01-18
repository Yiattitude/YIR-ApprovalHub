import { useState, useEffect } from 'react'
import { adminApi } from '@/api/admin'
import type { Application } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import PaginationControls from '@/components/PaginationControls'

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

export default function AllApplications() {
    const [applications, setApplications] = useState<Application[]>([])
    const [loading, setLoading] = useState(false)
    const [filter, setFilter] = useState({ appType: '', status: '', appNo: '' })
    const [pageNum, setPageNum] = useState(1)
    const [total, setTotal] = useState(0)
    const pageSize = 10

    const fetchApplications = async () => {
        setLoading(true)
        try {
            const res = await adminApi.getAllApplications({
                pageNum,
                pageSize,
                appType: filter.appType || undefined,
                status: filter.status ? Number(filter.status) : undefined,
                appNo: filter.appNo || undefined,
            })
            if (pageNum > 1 && res.records.length === 0 && res.total > 0) {
                setPageNum((prev) => Math.max(1, prev - 1))
                return
            }
            setApplications(res.records)
            setTotal(res.total)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchApplications()
    }, [filter, pageNum])

    const updateFilter = (key: 'appType' | 'status' | 'appNo', value: string) => {
        setFilter((prev) => ({ ...prev, [key]: value }))
        setPageNum(1)
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">审批数据（只读）</h2>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex gap-4 flex-wrap">
                        <Input
                            placeholder="申请单号"
                            value={filter.appNo}
                            onChange={(e) => updateFilter('appNo', e.target.value)}
                            className="w-[200px]"
                        />
                        <Select
                            value={filter.appType}
                            onValueChange={(val) => updateFilter('appType', val === "all" ? "" : val)}
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
                            onValueChange={(val) => updateFilter('status', val === "all" ? "" : val)}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="全部状态" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">全部状态</SelectItem>
                                <SelectItem value="0">草稿</SelectItem>
                                <SelectItem value="1">待审批</SelectItem>
                                <SelectItem value="2">审批中</SelectItem>
                                <SelectItem value="3">已通过</SelectItem>
                                <SelectItem value="4">已拒绝</SelectItem>
                                <SelectItem value="5">已撤回</SelectItem>
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
                                    <TableHead>申请人</TableHead>
                                    <TableHead>部门</TableHead>
                                    <TableHead>状态</TableHead>
                                    <TableHead>提交时间</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {applications.map((app) => (
                                    <TableRow key={app.appId}>
                                        <TableCell>{app.appNo}</TableCell>
                                        <TableCell>{typeMap[app.appType]}</TableCell>
                                        <TableCell>{app.title}</TableCell>
                                        <TableCell>{app.applicantName}</TableCell>
                                        <TableCell>{app.deptName}</TableCell>
                                        <TableCell>
                                            <Badge variant={statusMap[app.status]?.variant}>
                                                {statusMap[app.status]?.text}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(app.submitTime).toLocaleString('zh-CN')}
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
        </div>
    )
}
