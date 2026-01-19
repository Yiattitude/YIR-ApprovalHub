import { useState, useEffect, useMemo } from 'react'
import { adminApi } from '@/api/admin'
import type { AdminPost, Permission, PostFormData } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Plus, Pencil, Trash2, Sparkles, ShieldCheck, Filter, RefreshCcw } from 'lucide-react'

const statusMap: Record<number, { text: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }> = {
    0: { text: '禁用', variant: 'destructive' },
    1: { text: '启用', variant: 'success' },
}

const SELECT_ALL_VALUE = 'all-option'

export default function PostManagement() {
    const [posts, setPosts] = useState<AdminPost[]>([])
    const [loading, setLoading] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingPost, setEditingPost] = useState<AdminPost | null>(null)
    const [filter, setFilter] = useState({ postName: '', status: '' })
    const [allPermissions, setAllPermissions] = useState<Permission[]>([])
    const [pageNum, setPageNum] = useState(1)
    const [total, setTotal] = useState(0)
    const [lastUpdated, setLastUpdated] = useState('')
    const pageSize = 5

    const [formData, setFormData] = useState<PostFormData>({
        postCode: '',
        postName: '',
        postSort: 0,
        status: 1,
        permissionIds: [],
    })

    const fetchPosts = async () => {
        setLoading(true)
        try {
            const res = await adminApi.getPostList({
                pageNum,
                pageSize,
                postName: filter.postName || undefined,
                status: filter.status ? Number(filter.status) : undefined,
            })
            if (pageNum > 1 && res.records.length === 0 && res.total > 0) {
                setPageNum((prev) => Math.max(1, prev - 1))
                return
            }
            setPosts(res.records)
            setTotal(res.total)
            setLastUpdated(new Date().toLocaleString('zh-CN', { hour12: false }))
        } catch (error) {
            console.error('获取岗位列表失败:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPosts()
    }, [filter, pageNum])

    useEffect(() => {
        const fetchPermissions = async () => {
            try {
                const list = await adminApi.getAllPermissions()
                setAllPermissions(list)
            } catch (error) {
                console.error('获取权限列表失败:', error)
            }
        }
        fetchPermissions()
    }, [])

    const updateFilter = (key: 'postName' | 'status', value: string) => {
        setFilter((prev) => ({ ...prev, [key]: value }))
        setPageNum(1)
    }

    const resetFilters = () => {
        setFilter({ postName: '', status: '' })
        setPageNum(1)
    }

    const quickStatusFilters = [
        { label: '全部', value: '' },
        { label: '启用', value: '1' },
        { label: '禁用', value: '0' },
    ]

    const stats = useMemo(() => {
        const pageTotal = posts.length
        const active = posts.filter((post) => post.status === 1).length
        const inactive = posts.filter((post) => post.status === 0).length
        const permissionCoverage = posts.reduce((acc, post) => acc + (post.permissions?.length || 0), 0)
        return {
            pageTotal,
            active,
            inactive,
            permissionCoverage,
        }
    }, [posts])

    const activeFilterTags = useMemo(() => {
        const tags: { label: string; value: string }[] = []
        if (filter.postName) tags.push({ label: '名称', value: filter.postName })
        if (filter.status) tags.push({ label: '状态', value: statusMap[Number(filter.status)]?.text || filter.status })
        return tags
    }, [filter])

    const handleCreate = () => {
        setEditingPost(null)
        setFormData({
            postCode: '',
            postName: '',
            postSort: 0,
            status: 1,
            permissionIds: [],
        })
        setDialogOpen(true)
    }

    const handleEdit = (post: AdminPost) => {
        setEditingPost(post)
        setFormData({
            postId: post.postId,
            postCode: post.postCode,
            postName: post.postName,
            postSort: post.postSort,
            status: post.status,
            permissionIds: post.permissions?.map((item) => item.permissionId) || [],
        })
        setDialogOpen(true)
    }

    const handleDelete = async (postId: number) => {
        if (!confirm('确定要删除此岗位吗？')) return

        try {
            await adminApi.deletePost(postId)
            alert('删除成功')
            fetchPosts()
        } catch (error: any) {
            alert(error?.message || '删除失败')
        }
    }

    const togglePermission = (permissionId: number) => {
        setFormData((prev) => {
            const current = prev.permissionIds || []
            const exists = current.includes(permissionId)
            return {
                ...prev,
                permissionIds: exists
                    ? current.filter((id) => id !== permissionId)
                    : [...current, permissionId],
            }
        })
    }

    const handleSubmit = async () => {
        try {
            if (editingPost) {
                await adminApi.updatePost(formData)
                alert('更新成功')
            } else {
                await adminApi.createPost(formData)
                alert('创建成功')
            }
            setDialogOpen(false)
            fetchPosts()
        } catch (error: any) {
            alert(error?.message || '操作失败')
        }
    }

    return (
        <div className="space-y-8">
            <section className="rounded-[32px] border border-white/60 bg-gradient-to-r from-blue-500/10 via-white to-cyan-400/10 p-8 shadow-[0_35px_120px_rgba(15,23,42,0.12)]">
                <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-4">
                        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
                            <Sparkles className="h-4 w-4" /> 岗位矩阵
                        </span>
                        <div>
                            <h2 className="text-4xl font-semibold tracking-tight text-[#0F172A]">权限与岗位一体化</h2>
                            <p className="mt-3 max-w-2xl text-base text-muted-foreground">
                                快速洞察岗位启用情况与权限覆盖度，保持审批链条的可控与合规。
                            </p>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            {[
                                { label: '当前页岗位', value: stats.pageTotal, helper: '展示中的记录' },
                                { label: '启用中', value: stats.active, helper: '状态=启用' },
                                { label: '已禁用', value: stats.inactive, helper: '状态=禁用' },
                                { label: '权限覆盖量', value: stats.permissionCoverage, helper: '累计权限条目' },
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
                            <Plus className="mr-2 h-4 w-4" /> 新增岗位
                        </Button>
                        <Button variant="soft" onClick={fetchPosts}>
                            <RefreshCcw className="mr-2 h-4 w-4" /> 刷新数据
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
                            <Filter className="h-4 w-4" /> 筛选面板
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="ghost-tonal" size="sm" onClick={resetFilters}>
                                重置条件
                            </Button>
                            <Button variant="outline" size="sm" onClick={fetchPosts}>
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
                            placeholder="岗位名称/编码"
                            value={filter.postName}
                            onChange={(e) => updateFilter('postName', e.target.value)}
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
                        <ShieldCheck className="h-4 w-4" /> 岗位列表
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="py-12 text-center text-muted-foreground">加载中...</div>
                    ) : posts.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">暂无岗位</div>
                    ) : (
                        <div className="rounded-[28px] border border-dashed border-primary/15">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-white/60">
                                        <TableHead className="text-xs uppercase tracking-[0.2em] text-muted-foreground">岗位ID</TableHead>
                                        <TableHead className="text-xs uppercase tracking-[0.2em] text-muted-foreground">岗位编码</TableHead>
                                        <TableHead className="text-xs uppercase tracking-[0.2em] text-muted-foreground">岗位名称</TableHead>
                                        <TableHead className="text-xs uppercase tracking-[0.2em] text-muted-foreground">排序</TableHead>
                                        <TableHead className="text-xs uppercase tracking-[0.2em] text-muted-foreground">状态</TableHead>
                                        <TableHead className="text-xs uppercase tracking-[0.2em] text-muted-foreground">权限</TableHead>
                                        <TableHead className="text-xs uppercase tracking-[0.2em] text-muted-foreground">创建时间</TableHead>
                                        <TableHead className="text-xs uppercase tracking-[0.2em] text-muted-foreground">操作</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {posts.map((post) => (
                                        <TableRow key={post.postId} className="border-white/40 hover:bg-primary/5">
                                            <TableCell className="font-medium">{post.postId}</TableCell>
                                            <TableCell className="font-semibold text-foreground">{post.postCode}</TableCell>
                                            <TableCell>{post.postName}</TableCell>
                                            <TableCell>{post.postSort}</TableCell>
                                            <TableCell>
                                                <Badge variant={statusMap[post.status]?.variant}>
                                                    {statusMap[post.status]?.text}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {post.permissions && post.permissions.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {post.permissions.map((permission) => (
                                                            <Badge key={permission.permissionId} variant="outline">
                                                                {permission.permissionName}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">未配置</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {new Date(post.createTime).toLocaleString('zh-CN')}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => handleEdit(post)}>
                                                        <Pencil className="mr-2 h-4 w-4" /> 编辑
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive"
                                                        onClick={() => handleDelete(post.postId)}
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
                <DialogContent className="max-w-md rounded-[28px]">
                    <DialogHeader>
                        <DialogTitle>{editingPost ? '编辑岗位' : '新增岗位'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>岗位编码 *</Label>
                            <Input
                                value={formData.postCode}
                                onChange={(e) => setFormData({ ...formData, postCode: e.target.value })}
                                placeholder="请输入岗位编码"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>岗位名称 *</Label>
                            <Input
                                value={formData.postName}
                                onChange={(e) => setFormData({ ...formData, postName: e.target.value })}
                                placeholder="请输入岗位名称"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>排序</Label>
                                <Input
                                    type="number"
                                    value={formData.postSort}
                                    onChange={(e) => setFormData({ ...formData, postSort: Number(e.target.value) })}
                                    placeholder="请输入排序"
                                />
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
                        <div className="space-y-2">
                            <Label>权限配置</Label>
                            {allPermissions.length === 0 ? (
                                <p className="text-sm text-muted-foreground">暂无可用权限，请稍后再试。</p>
                            ) : (
                                <div className="grid gap-3">
                                    {allPermissions.map((permission) => {
                                        const checked = formData.permissionIds?.includes(permission.permissionId) ?? false
                                        return (
                                            <label
                                                key={permission.permissionId}
                                                htmlFor={`permission-${permission.permissionId}`}
                                                className="flex items-start gap-3 rounded-md border border-dashed p-3"
                                            >
                                                <Checkbox
                                                    id={`permission-${permission.permissionId}`}
                                                    checked={checked}
                                                    onCheckedChange={() => togglePermission(permission.permissionId)}
                                                />
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium text-foreground leading-tight">
                                                        {permission.permissionName}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">{permission.permissionCode}</p>
                                                    {permission.description && (
                                                        <p className="text-xs text-muted-foreground">{permission.description}</p>
                                                    )}
                                                </div>
                                            </label>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            取消
                        </Button>
                        <Button onClick={handleSubmit}>
                            {editingPost ? '更新' : '创建'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
