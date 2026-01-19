import { useState, useEffect, useMemo } from 'react'
import { adminApi } from '@/api/admin'
import type { Application } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { Sparkles, RefreshCcw, Filter } from 'lucide-react'

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

const quickStatusFilters = [
    { label: '全部状态', value: '' },
    { label: statusMap[1].text, value: '1' },
    { label: statusMap[2].text, value: '2' },
    { label: statusMap[3].text, value: '3' },
    { label: statusMap[4].text, value: '4' },
]

const quickTypeFilters = [
    { label: '全部类型', value: '' },
    { label: typeMap.leave, value: 'leave' },
    { label: typeMap.reimburse, value: 'reimburse' },
]

const SELECT_ALL_VALUE = 'all-option'

export default function AllApplications() {
    const [applications, setApplications] = useState<Application[]>([])
    const [loading, setLoading] = useState(false)
    const [filter, setFilter] = useState({ appType: '', status: '', appNo: '' })
    const [pageNum, setPageNum] = useState(1)
    const [total, setTotal] = useState(0)
    const [lastUpdated, setLastUpdated] = useState('')
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
            setLastUpdated(new Date().toLocaleString('zh-CN', { hour12: false }))
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

    const handleResetFilters = () => {
        setFilter({ appType: '', status: '', appNo: '' })
        setPageNum(1)
    }

    const statusSummary = useMemo(() => {
        return applications.reduce(
            (acc, app) => {
                if (app.status === 1) acc.pending += 1
                if (app.status === 3) acc.approved += 1
                if (app.status === 4) acc.rejected += 1
                return acc
            },
            { pending: 0, approved: 0, rejected: 0 }
        )
    }, [applications])

    const typeSummary = useMemo(() => {
        return applications.reduce(
            (acc, app) => {
                if (app.appType === 'leave') acc.leave += 1
                if (app.appType === 'reimburse') acc.reimburse += 1
                return acc
            },
            { leave: 0, reimburse: 0 }
        )
    }, [applications])

    const highlightCards = useMemo(() => {
        const current = applications.length || 0
        const reimburseRatio = current === 0 ? 0 : Math.round((typeSummary.reimburse / current) * 100)
        return [
            { label: '当前页申请', value: current.toString(), helper: '展示中的记录' },
            { label: '待审批', value: statusSummary.pending.toString(), helper: '需尽快处理' },
            { label: '已通过', value: statusSummary.approved.toString(), helper: '当前页完成量' },
            { label: '报销占比', value: `${reimburseRatio}%`, helper: '按当前页计算' },
        ]
    }, [applications.length, statusSummary, typeSummary])

    const activeFilterTags = useMemo(() => {
        const tags: { label: string; value: string }[] = []
        if (filter.appType) {
            tags.push({ label: '类型', value: typeMap[filter.appType] })
        }
        if (filter.status) {
            const statusText = statusMap[Number(filter.status)]?.text ?? filter.status
            tags.push({ label: '状态', value: statusText })
        }
        if (filter.appNo) {
            tags.push({ label: '单号', value: filter.appNo })
        }
        return tags
    }, [filter])

    return (
        <div className="space-y-8">
            <section className="rounded-[32px] border border-white/50 bg-gradient-to-r from-sky-500/10 via-white to-indigo-500/10 p-8 shadow-[0_35px_120px_rgba(15,23,42,0.12)]">
                <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-4">
                        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
                            <Sparkles className="h-4 w-4" /> 审批总览
                        </span>
                        <div>
                            <h2 className="text-4xl font-semibold tracking-tight text-[#0F172A]">跨部门审批透明化</h2>
                            <p className="mt-3 max-w-2xl text-base text-muted-foreground">
                                通过统一的筛选面板与状态追踪，管理员可以快速定位堵点、了解当前审批堆积，并协助业务部门完成治理。
                            </p>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            {highlightCards.map((card) => (
                                <div
                                    key={card.label}
                                    className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur"
                                >
                                    <p className="text-sm text-muted-foreground">{card.label}</p>
                                    <p className="mt-2 text-3xl font-semibold tracking-tight text-[#0F172A]">{card.value}</p>
                                    <p className="text-xs text-muted-foreground">{card.helper}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col gap-3 rounded-3xl border border-white/70 bg-white/80 p-6 text-sm text-muted-foreground backdrop-blur">
                        <Button variant="soft" onClick={fetchApplications} className="w-full">
                            <RefreshCcw className="mr-2 h-4 w-4" /> 即时刷新
                        </Button>
                        <Button variant="outline" onClick={handleResetFilters} className="w-full">
                            重置筛选
                        </Button>
                        <div className="space-y-1 text-left">
                            <p>系统累计：<span className="font-semibold text-foreground">{total}</span> 条记录</p>
                            <p>最近更新：{lastUpdated || '尚未刷新'}</p>
                        </div>
                    </div>
                </div>
            </section>

            <Card className="border-white/70 bg-white/80 shadow-[0_25px_80px_rgba(15,23,42,0.08)]">
                <CardHeader className="space-y-5">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-[0.2em]">
                            <Filter className="h-4 w-4" /> 智能筛选
                        </div>
                        <span className="text-xs text-muted-foreground">
                            快速切换常用条件，也可使用下方输入框进行精准过滤。
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {quickTypeFilters.map((item) => (
                            <Button
                                key={item.value || 'all'}
                                variant={filter.appType === item.value ? 'default' : 'ghost-tonal'}
                                size="sm"
                                onClick={() => updateFilter('appType', item.value)}
                            >
                                {item.label}
                            </Button>
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {quickStatusFilters.map((item) => (
                            <Button
                                key={item.value || 'all'}
                                variant={filter.status === item.value ? 'default' : 'ghost-tonal'}
                                size="sm"
                                onClick={() => updateFilter('status', item.value)}
                            >
                                {item.label}
                            </Button>
                        ))}
                    </div>
                </CardHeader>
                <CardContent className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-3">
                        <Input
                            placeholder="按申请单号模糊搜索"
                            value={filter.appNo}
                            onChange={(e) => updateFilter('appNo', e.target.value)}
                            className="h-12 rounded-2xl border-white/70 bg-white/70"
                        />
                        <Select
                            value={filter.appType || SELECT_ALL_VALUE}
                            onValueChange={(val) => updateFilter('appType', val === SELECT_ALL_VALUE ? '' : val)}
                        >
                            <SelectTrigger className="h-12 rounded-2xl border-white/70 bg-white/70">
                                <SelectValue placeholder="全部类型" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={SELECT_ALL_VALUE}>全部类型</SelectItem>
                                <SelectItem value="leave">请假</SelectItem>
                                <SelectItem value="reimburse">报销</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={filter.status || SELECT_ALL_VALUE}
                            onValueChange={(val) => updateFilter('status', val === SELECT_ALL_VALUE ? '' : val)}
                        >
                            <SelectTrigger className="h-12 rounded-2xl border-white/70 bg-white/70">
                                <SelectValue placeholder="全部状态" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={SELECT_ALL_VALUE}>全部状态</SelectItem>
                                <SelectItem value="0">草稿</SelectItem>
                                <SelectItem value="1">待审批</SelectItem>
                                <SelectItem value="2">审批中</SelectItem>
                                <SelectItem value="3">已通过</SelectItem>
                                <SelectItem value="4">已拒绝</SelectItem>
                                <SelectItem value="5">已撤回</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {activeFilterTags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="text-muted-foreground">已选条件：</span>
                            {activeFilterTags.map((tag) => (
                                <Badge key={`${tag.label}-${tag.value}`} variant="secondary" className="rounded-full px-3 py-1">
                                    {tag.label} · {tag.value}
                                </Badge>
                            ))}
                        </div>
                    )}
                    <div className="rounded-[28px] border border-dashed border-primary/20">
                        {loading ? (
                            <div className="py-12 text-center text-muted-foreground">加载中...</div>
                        ) : applications.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground">暂无申请记录</div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-white/60">
                                        <TableHead className="text-xs uppercase tracking-[0.2em] text-muted-foreground">申请单号</TableHead>
                                        <TableHead className="text-xs uppercase tracking-[0.2em] text-muted-foreground">类型</TableHead>
                                        <TableHead className="text-xs uppercase tracking-[0.2em] text-muted-foreground">标题</TableHead>
                                        <TableHead className="text-xs uppercase tracking-[0.2em] text-muted-foreground">申请人</TableHead>
                                        <TableHead className="text-xs uppercase tracking-[0.2em] text-muted-foreground">部门</TableHead>
                                        <TableHead className="text-xs uppercase tracking-[0.2em] text-muted-foreground">状态</TableHead>
                                        <TableHead className="text-xs uppercase tracking-[0.2em] text-muted-foreground">提交时间</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {applications.map((app) => (
                                        <TableRow key={app.appId} className="border-white/40 hover:bg-primary/5">
                                            <TableCell className="font-medium text-foreground">{app.appNo}</TableCell>
                                            <TableCell>{typeMap[app.appType]}</TableCell>
                                            <TableCell className="max-w-[280px] truncate text-muted-foreground">{app.title}</TableCell>
                                            <TableCell>{app.applicantName}</TableCell>
                                            <TableCell>{app.deptName}</TableCell>
                                            <TableCell>
                                                <Badge variant={statusMap[app.status]?.variant}>
                                                    {statusMap[app.status]?.text}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {new Date(app.submitTime).toLocaleString('zh-CN')}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                    {!loading && total > pageSize && (
                        <div className="flex justify-end">
                            <PaginationControls
                                pageNum={pageNum}
                                pageSize={pageSize}
                                total={total}
                                onPageChange={setPageNum}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
