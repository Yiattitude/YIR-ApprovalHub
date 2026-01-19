import { useState, useEffect, useMemo } from 'react'
import { adminApi } from '@/api/admin'
import type { AdminDept, DeptFormData } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import PaginationControls from '@/components/PaginationControls'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Plus, Pencil, Trash2, Sparkles, RefreshCcw, Filter, Building2 } from 'lucide-react'

const statusMap: Record<number, { text: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }> = {
    0: { text: '禁用', variant: 'destructive' },
    1: { text: '启用', variant: 'success' },
}

const SELECT_ALL_VALUE = 'all-option'

export default function DeptManagement() {
    const [depts, setDepts] = useState<AdminDept[]>([])
    const [loading, setLoading] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingDept, setEditingDept] = useState<AdminDept | null>(null)
    const [parentDepts, setParentDepts] = useState<AdminDept[]>([])
    const [filter, setFilter] = useState({ deptName: '', status: '' })
    const [pageNum, setPageNum] = useState(1)
    const [total, setTotal] = useState(0)
    const [lastUpdated, setLastUpdated] = useState('')
    const pageSize = 5

    const [formData, setFormData] = useState<DeptFormData>({
        parentId: 0,
        deptName: '',
        leader: '',
        phone: '',
        email: '',
        orderNum: 0,
        status: 1,
    })

    const fetchDepts = async () => {
        setLoading(true)
        try {
            const res = await adminApi.getDeptList({
                pageNum,
                pageSize,
                deptName: filter.deptName || undefined,
                status: filter.status ? Number(filter.status) : undefined,
            })
            if (pageNum > 1 && res.records.length === 0 && res.total > 0) {
                setPageNum((prev) => Math.max(1, prev - 1))
                return
            }
            setDepts(res.records)
            setTotal(res.total)
            setLastUpdated(new Date().toLocaleString('zh-CN', { hour12: false }))
        } catch (error) {
            console.error('获取部门列表失败:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDepts()
    }, [filter, pageNum])

    useEffect(() => {
        const fetchParentOptions = async () => {
            try {
                const res = await adminApi.getAllDepts()
                setParentDepts(res)
            } catch (error) {
                console.error('获取全部部门失败:', error)
            }
        }
        fetchParentOptions()
    }, [])

    const updateFilter = (key: 'deptName' | 'status', value: string) => {
        setFilter((prev) => ({ ...prev, [key]: value }))
        setPageNum(1)
    }

    const resetFilters = () => {
        setFilter({ deptName: '', status: '' })
        setPageNum(1)
    }

    const quickStatusFilters = [
        { label: '全部', value: '' },
        { label: '启用', value: '1' },
        { label: '禁用', value: '0' },
    ]

    const stats = useMemo(() => {
        const pageTotal = depts.length
        const active = depts.filter((item) => item.status === 1).length
        const inactive = depts.filter((item) => item.status === 0).length
        const enableRate = pageTotal === 0 ? 0 : Math.round((active / pageTotal) * 100)
        return { pageTotal, active, inactive, enableRate }
    }, [depts])

    const activeFilterTags = useMemo(() => {
        const tags: { label: string; value: string }[] = []
        if (filter.deptName) tags.push({ label: '名称', value: filter.deptName })
        if (filter.status) tags.push({ label: '状态', value: statusMap[Number(filter.status)]?.text || filter.status })
        return tags
    }, [filter])

    const handleCreate = () => {
        setEditingDept(null)
        setFormData({
            parentId: 0,
            deptName: '',
            leader: '',
            phone: '',
            email: '',
            orderNum: 0,
            status: 1,
        })
        setDialogOpen(true)
    }

    const handleEdit = (dept: AdminDept) => {
        setEditingDept(dept)
        setFormData({
            deptId: dept.deptId,
            parentId: dept.parentId,
            deptName: dept.deptName,
            leader: dept.leader,
            phone: dept.phone,
            email: dept.email,
            orderNum: dept.orderNum,
            status: dept.status,
        })
        setDialogOpen(true)
    }

    const handleDelete = async (deptId: number) => {
        if (!confirm('确定要删除此部门吗？')) return

        try {
            await adminApi.deleteDept(deptId)
            alert('删除成功')
            fetchDepts()
        } catch (error: any) {
            alert(error?.message || '删除失败')
        }
    }

    const handleSubmit = async () => {
        try {
            if (editingDept) {
                await adminApi.updateDept(formData)
                alert('更新成功')
            } else {
                await adminApi.createDept(formData)
                alert('创建成功')
            }
            setDialogOpen(false)
            fetchDepts()
        } catch (error: any) {
            alert(error?.message || '操作失败')
        }
    }

    return (
        <div className="space-y-8">
            <section className="rounded-[32px] border border-white/60 bg-gradient-to-r from-emerald-400/10 via-white to-sky-500/10 p-8 shadow-[0_35px_120px_rgba(15,23,42,0.12)]">
                <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-4">
                        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
                            <Sparkles className="h-4 w-4" /> 组织资产
                        </span>
                        <div>
                            <h2 className="text-4xl font-semibold tracking-tight text-[#0F172A]">部门结构实时洞察</h2>
                            <p className="mt-3 max-w-2xl text-base text-muted-foreground">
                                关注启用率与负责人分布，方便管理员识别长期未维护的部门，保持组织架构整洁可用。
                            </p>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            {[
                                { label: '当前页部门', value: stats.pageTotal, helper: '仅统计本页数据' },
                                { label: '启用中', value: stats.active, helper: '状态=启用' },
                                { label: '已禁用', value: stats.inactive, helper: '状态=禁用' },
                                { label: '启用占比', value: `${stats.enableRate}%`, helper: '当前页统计' },
                            ].map((card) => (
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
                        <Button onClick={handleCreate}>
                            <Plus className="mr-2 h-4 w-4" /> 新增部门
                        </Button>
                        <Button variant="soft" onClick={fetchDepts}>
                            <RefreshCcw className="mr-2 h-4 w-4" /> 刷新列表
                        </Button>
                        <div className="space-y-1 text-left">
                            <p>系统记录：<span className="font-semibold text-foreground">{total}</span> 条</p>
                            <p>最近同步：{lastUpdated || '尚未刷新'}</p>
                        </div>
                    </div>
                </div>
            </section>

            <Card className="border-white/70 bg-white/80 shadow-[0_25px_80px_rgba(15,23,42,0.08)]">
                <CardHeader className="space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-[0.2em]">
                            <Filter className="h-4 w-4" /> 条件面板
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="ghost-tonal" size="sm" onClick={resetFilters}>
                                重置条件
                            </Button>
                            <Button variant="outline" size="sm" onClick={fetchDepts}>
                                <RefreshCcw className="mr-2 h-4 w-4" /> 即时同步
                            </Button>
                        </div>
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
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <Input
                            placeholder="按部门名称模糊搜索"
                            value={filter.deptName}
                            onChange={(e) => updateFilter('deptName', e.target.value)}
                            className="h-12 rounded-2xl border-white/70 bg-white/70"
                        />
                        <Select
                            value={filter.status || SELECT_ALL_VALUE}
                            onValueChange={(val) => updateFilter('status', val === SELECT_ALL_VALUE ? '' : val)}
                        >
                            <SelectTrigger className="h-12 rounded-2xl border-white/70 bg-white/70">
                                <SelectValue placeholder="全部状态" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={SELECT_ALL_VALUE}>全部状态</SelectItem>
                                <SelectItem value="1">启用</SelectItem>
                                <SelectItem value="0">禁用</SelectItem>
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
                </CardContent>
            </Card>

            <Card className="border-white/70 bg-white/80 shadow-[0_18px_65px_rgba(15,23,42,0.07)]">
                <CardHeader>
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                        <Building2 className="h-4 w-4" /> 部门列表
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="py-12 text-center text-muted-foreground">加载中...</div>
                    ) : depts.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">暂无部门</div>
                    ) : (
                        <div className="rounded-[28px] border border-dashed border-primary/15">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-white/60">
                                        <TableHead className="text-xs uppercase tracking-[0.2em] text-muted-foreground">部门ID</TableHead>
                                        <TableHead className="text-xs uppercase tracking-[0.2em] text-muted-foreground">部门名称</TableHead>
                                        <TableHead className="text-xs uppercase tracking-[0.2em] text-muted-foreground">父部门</TableHead>
                                        <TableHead className="text-xs uppercase tracking-[0.2em] text-muted-foreground">负责人</TableHead>
                                        <TableHead className="text-xs uppercase tracking-[0.2em] text-muted-foreground">联系电话</TableHead>
                                        <TableHead className="text-xs uppercase tracking-[0.2em] text-muted-foreground">邮箱</TableHead>
                                        <TableHead className="text-xs uppercase tracking-[0.2em] text-muted-foreground">排序</TableHead>
                                        <TableHead className="text-xs uppercase tracking-[0.2em] text-muted-foreground">状态</TableHead>
                                        <TableHead className="text-xs uppercase tracking-[0.2em] text-muted-foreground">创建时间</TableHead>
                                        <TableHead className="text-xs uppercase tracking-[0.2em] text-muted-foreground">操作</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {depts.map((dept) => (
                                        <TableRow key={dept.deptId} className="border-white/40 hover:bg-primary/5">
                                            <TableCell className="font-medium">{dept.deptId}</TableCell>
                                            <TableCell className="font-semibold text-foreground">{dept.deptName}</TableCell>
                                            <TableCell>{dept.parentName || '根部门'}</TableCell>
                                            <TableCell>{dept.leader || '-'}</TableCell>
                                            <TableCell>{dept.phone || '-'}</TableCell>
                                            <TableCell>{dept.email || '-'}</TableCell>
                                            <TableCell>{dept.orderNum}</TableCell>
                                            <TableCell>
                                                <Badge variant={statusMap[dept.status]?.variant}>
                                                    {statusMap[dept.status]?.text}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {new Date(dept.createTime).toLocaleString('zh-CN')}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => handleEdit(dept)}>
                                                        <Pencil className="mr-2 h-4 w-4" /> 编辑
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive"
                                                        onClick={() => handleDelete(dept.deptId)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" /> 删除
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                    {!loading && total > pageSize && (
                        <div className="mt-4 flex justify-end">
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

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl rounded-[28px]">
                    <DialogHeader>
                        <DialogTitle>{editingDept ? '编辑部门' : '新增部门'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>部门名称 *</Label>
                                <Input
                                    value={formData.deptName}
                                    onChange={(e) => setFormData({ ...formData, deptName: e.target.value })}
                                    placeholder="请输入部门名称"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>父部门</Label>
                                <Select
                                    value={String(formData.parentId)}
                                    onValueChange={(val) => setFormData({ ...formData, parentId: Number(val) })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="请选择父部门" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">根部门</SelectItem>
                                        {parentDepts
                                            .filter((d) => d.deptId !== editingDept?.deptId)
                                            .map((dept) => (
                                                <SelectItem key={dept.deptId} value={String(dept.deptId)}>
                                                    {dept.deptName}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>负责人</Label>
                                <Input
                                    value={formData.leader}
                                    onChange={(e) => setFormData({ ...formData, leader: e.target.value })}
                                    placeholder="请输入负责人"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>联系电话</Label>
                                <Input
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="请输入联系电话"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>邮箱</Label>
                                <Input
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="请输入邮箱"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>排序</Label>
                                <Input
                                    type="number"
                                    value={formData.orderNum}
                                    onChange={(e) => setFormData({ ...formData, orderNum: Number(e.target.value) })}
                                    placeholder="请输入排序"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>状态</Label>
                            <Select
                                value={String(formData.status)}
                                onValueChange={(val) => setFormData({ ...formData, status: Number(val) })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">启用</SelectItem>
                                    <SelectItem value="0">禁用</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            取消
                        </Button>
                        <Button onClick={handleSubmit}>
                            {editingDept ? '更新' : '创建'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
