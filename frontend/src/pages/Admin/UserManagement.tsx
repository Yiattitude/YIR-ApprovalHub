import { useState, useEffect, useMemo } from 'react'
import { adminApi } from '@/api/admin'
import type { AdminUser, UserFormData, AdminDept, AdminPost } from '@/types'
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
import { Plus, Pencil, Trash2, Sparkles, Users, Filter, RefreshCcw } from 'lucide-react'

const statusMap: Record<number, { text: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }> = {
    0: { text: '禁用', variant: 'destructive' },
    1: { text: '启用', variant: 'success' },
}

const SELECT_ALL_VALUE = 'all-option'

type UserFilter = {
    username: string
    realName: string
    deptId: string
    status: string
}

export default function UserManagement() {
    const [users, setUsers] = useState<AdminUser[]>([])
    const [loading, setLoading] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
    const [depts, setDepts] = useState<AdminDept[]>([])
    const [posts, setPosts] = useState<AdminPost[]>([])
    const [filter, setFilter] = useState<UserFilter>({ username: '', realName: '', deptId: '', status: '' })
    const [pageNum, setPageNum] = useState(1)
    const [total, setTotal] = useState(0)
    const [lastUpdated, setLastUpdated] = useState('')
    const pageSize = 5

    const [formData, setFormData] = useState<UserFormData>({
        username: '',
        password: '',
        realName: '',
        phone: '',
        email: '',
        deptId: undefined,
        postId: undefined,
        status: 1,
    })

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const res = await adminApi.getUserList({
                pageNum,
                pageSize,
                username: filter.username || undefined,
                realName: filter.realName || undefined,
                deptId: filter.deptId ? Number(filter.deptId) : undefined,
                status: filter.status ? Number(filter.status) : undefined,
            })
            if (pageNum > 1 && res.records.length === 0 && res.total > 0) {
                setPageNum((prev) => Math.max(1, prev - 1))
                return
            }
            setUsers(res.records)
            setTotal(res.total)
            setLastUpdated(new Date().toLocaleString('zh-CN', { hour12: false }))
        } catch (error) {
            console.error('获取用户列表失败:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchDepts = async () => {
        try {
            const res = await adminApi.getAllDepts()
            console.log('部门数据:', res)
            setDepts(res)
        } catch (error) {
            console.error('获取部门列表失败:', error)
        }
    }

    const fetchPosts = async () => {
        try {
            const res = await adminApi.getAllPosts()
            console.log('岗位数据:', res)
            setPosts(res)
        } catch (error) {
            console.error('获取岗位列表失败:', error)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [filter, pageNum])

    useEffect(() => {
        fetchDepts()
        fetchPosts()
    }, [])

    const handleCreate = () => {
        setEditingUser(null)
        setFormData({
            username: '',
            password: '',
            realName: '',
            phone: '',
            email: '',
            deptId: undefined,
            postId: undefined,
            status: 1,
        })
        setDialogOpen(true)
    }

    const handleEdit = (user: AdminUser) => {
        setEditingUser(user)
        setFormData({
            userId: user.userId,
            username: user.username,
            password: '',
            realName: user.realName,
            phone: user.phone,
            email: user.email,
            deptId: user.deptId,
            postId: user.postId,
            status: user.status,
        })
        setDialogOpen(true)
    }

    const handleDelete = async (userId: number) => {
        if (!confirm('确定要删除此用户吗？')) return

        try {
            await adminApi.deleteUser(userId)
            alert('删除成功')
            fetchUsers()
        } catch (error: any) {
            alert(error?.message || '删除失败')
        }
    }

    const handleSubmit = async () => {
        try {
            if (editingUser) {
                await adminApi.updateUser(formData)
                alert('更新成功')
            } else {
                await adminApi.createUser(formData)
                alert('创建成功')
            }
            setDialogOpen(false)
            fetchUsers()
        } catch (error: any) {
            alert(error?.message || '操作失败')
        }
    }

    const updateFilter = (key: keyof UserFilter, value: string) => {
        setFilter((prev) => ({ ...prev, [key]: value }))
        setPageNum(1)
    }

    const resetFilters = () => {
        setFilter({ username: '', realName: '', deptId: '', status: '' })
        setPageNum(1)
    }

    const quickStatusFilters = [
        { label: '全部', value: '' },
        { label: '启用', value: '1' },
        { label: '禁用', value: '0' },
    ]

    const stats = useMemo(() => {
        const pageTotal = users.length
        const active = users.filter((user) => user.status === 1).length
        const inactive = users.filter((user) => user.status === 0).length
        const deptLinked = users.filter((user) => !!user.deptId).length
        return { pageTotal, active, inactive, deptLinked }
    }, [users])

    const activeFilterTags = useMemo(() => {
        const tags: { label: string; value: string }[] = []
        if (filter.username) tags.push({ label: '用户名', value: filter.username })
        if (filter.realName) tags.push({ label: '姓名', value: filter.realName })
        if (filter.deptId) {
            const deptName = depts.find((dept) => String(dept.deptId) === filter.deptId)?.deptName
            tags.push({ label: '部门', value: deptName || filter.deptId })
        }
        if (filter.status) {
            tags.push({ label: '状态', value: statusMap[Number(filter.status)]?.text || filter.status })
        }
        return tags
    }, [filter, depts])

    return (
        <div className="space-y-8">
            <section className="rounded-[32px] border border-white/60 bg-gradient-to-r from-indigo-500/10 via-white to-purple-400/10 p-8 shadow-[0_35px_120px_rgba(15,23,42,0.12)]">
                <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-4">
                        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
                            <Sparkles className="h-4 w-4" /> 人员资产
                        </span>
                        <div>
                            <h2 className="text-4xl font-semibold tracking-tight text-[#0F172A]">账号全局总控台</h2>
                            <p className="mt-3 max-w-2xl text-base text-muted-foreground">
                                快速识别活跃账号、挂靠关系与状态分布，控制审批链条的安全性与可回溯性。
                            </p>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            {[
                                { label: '当前页账号', value: stats.pageTotal, helper: '展示中的记录' },
                                { label: '启用中', value: stats.active, helper: '状态=启用' },
                                { label: '已禁用', value: stats.inactive, helper: '状态=禁用' },
                                { label: '已挂靠部门', value: stats.deptLinked, helper: '具备部门数据' },
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
                            <Plus className="mr-2 h-4 w-4" /> 新增用户
                        </Button>
                        <Button variant="soft" onClick={fetchUsers}>
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
                            <Filter className="h-4 w-4" /> 智能筛选
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="ghost-tonal" size="sm" onClick={resetFilters}>
                                重置条件
                            </Button>
                            <Button variant="outline" size="sm" onClick={fetchUsers}>
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
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <Input
                            placeholder="用户名/账号"
                            value={filter.username}
                            onChange={(e) => updateFilter('username', e.target.value)}
                            className="h-12 rounded-2xl border-white/70 bg-white/70"
                        />
                        <Input
                            placeholder="真实姓名"
                            value={filter.realName}
                            onChange={(e) => updateFilter('realName', e.target.value)}
                            className="h-12 rounded-2xl border-white/70 bg-white/70"
                        />
                        <Select
                            value={filter.deptId || SELECT_ALL_VALUE}
                            onValueChange={(val) => updateFilter('deptId', val === SELECT_ALL_VALUE ? '' : val)}
                        >
                            <SelectTrigger className="h-12 rounded-2xl border-white/70 bg-white/70">
                                <SelectValue placeholder="全部部门" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={SELECT_ALL_VALUE}>全部部门</SelectItem>
                                {depts.map((dept) => (
                                    <SelectItem key={dept.deptId} value={String(dept.deptId)}>
                                        {dept.deptName}
                                    </SelectItem>
                                ))}
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
                        <Users className="h-4 w-4" /> 用户列表
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="py-12 text-center text-muted-foreground">加载中...</div>
                    ) : users.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">暂无用户</div>
                    ) : (
                        <div className="rounded-[28px] border border-dashed border-primary/15">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-white/60">
                                        <TableHead className="whitespace-nowrap text-xs uppercase tracking-[0.2em] text-muted-foreground">用户ID</TableHead>
                                        <TableHead className="whitespace-nowrap text-xs uppercase tracking-[0.2em] text-muted-foreground">用户名</TableHead>
                                        <TableHead className="whitespace-nowrap text-xs uppercase tracking-[0.2em] text-muted-foreground">真实姓名</TableHead>
                                        <TableHead className="whitespace-nowrap text-xs uppercase tracking-[0.2em] text-muted-foreground">手机号</TableHead>
                                        <TableHead className="whitespace-nowrap text-xs uppercase tracking-[0.2em] text-muted-foreground">邮箱</TableHead>
                                        <TableHead className="whitespace-nowrap text-xs uppercase tracking-[0.2em] text-muted-foreground">部门</TableHead>
                                        <TableHead className="whitespace-nowrap text-xs uppercase tracking-[0.2em] text-muted-foreground">岗位</TableHead>
                                        <TableHead className="whitespace-nowrap text-xs uppercase tracking-[0.2em] text-muted-foreground">状态</TableHead>
                                        <TableHead className="whitespace-nowrap text-xs uppercase tracking-[0.2em] text-muted-foreground">创建时间</TableHead>
                                        <TableHead className="whitespace-nowrap text-xs uppercase tracking-[0.2em] text-muted-foreground">操作</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((user) => (
                                        <TableRow key={user.userId} className="border-white/40 hover:bg-primary/5">
                                            <TableCell className="whitespace-nowrap font-medium">{user.userId}</TableCell>
                                            <TableCell className="whitespace-nowrap font-semibold text-foreground">{user.username}</TableCell>
                                            <TableCell className="whitespace-nowrap">{user.realName}</TableCell>
                                            <TableCell className="whitespace-nowrap">{user.phone || '-'}</TableCell>
                                            <TableCell className="whitespace-nowrap">{user.email || '-'}</TableCell>
                                            <TableCell className="whitespace-nowrap">{user.deptName || '-'}</TableCell>
                                            <TableCell className="whitespace-nowrap">{user.postName || '-'}</TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                <Badge variant={statusMap[user.status]?.variant}>
                                                    {statusMap[user.status]?.text}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap text-muted-foreground">
                                                {new Date(user.createTime).toLocaleString('zh-CN')}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                <div className="flex flex-wrap gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => handleEdit(user)}>
                                                        <Pencil className="mr-2 h-4 w-4" /> 编辑
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive"
                                                        onClick={() => handleDelete(user.userId)}
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
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-[28px]">
                    <DialogHeader>
                        <DialogTitle>{editingUser ? '编辑用户' : '新增用户'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>用户名 *</Label>
                                <Input
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    placeholder="请输入用户名"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{editingUser ? '密码（留空不修改）' : '密码 *'}</Label>
                                <Input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder={editingUser ? '留空不修改' : '请输入密码'}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>真实姓名 *</Label>
                                <Input
                                    value={formData.realName}
                                    onChange={(e) => setFormData({ ...formData, realName: e.target.value })}
                                    placeholder="请输入真实姓名"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>手机号</Label>
                                <Input
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="请输入手机号"
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
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>部门</Label>
                                <Select
                                    value={formData.deptId ? String(formData.deptId) : ''}
                                    onValueChange={(val) => setFormData({ ...formData, deptId: val ? Number(val) : undefined })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="请选择部门" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {depts.map((dept) => (
                                            <SelectItem key={dept.deptId} value={String(dept.deptId)}>
                                                {dept.deptName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>岗位</Label>
                                <Select
                                    value={formData.postId ? String(formData.postId) : ''}
                                    onValueChange={(val) => setFormData({ ...formData, postId: val ? Number(val) : undefined })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="请选择岗位" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {posts.map((post) => (
                                            <SelectItem key={post.postId} value={String(post.postId)}>
                                                {post.postName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            取消
                        </Button>
                        <Button onClick={handleSubmit}>
                            {editingUser ? '更新' : '创建'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
