import { useEffect, useState, useMemo } from 'react'
import { adminApi } from '@/api/admin'
import type { AdminUser, AdminPost, AdminDept } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
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
import { Briefcase, Sparkles, Filter, RefreshCcw, Users } from 'lucide-react'

const SELECT_ALL_VALUE = '__ALL__'

const statusMap: Record<number, { text: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }> = {
    0: { text: '禁用', variant: 'destructive' },
    1: { text: '启用', variant: 'success' },
}

export default function PostAssignment() {
    const [users, setUsers] = useState<AdminUser[]>([])
    const [posts, setPosts] = useState<AdminPost[]>([])
    const [depts, setDepts] = useState<AdminDept[]>([])
    const [loading, setLoading] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
    const [selectedPostId, setSelectedPostId] = useState<number | null>(null)
    const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null)
    const [deptAutoFilled, setDeptAutoFilled] = useState(false)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState(SELECT_ALL_VALUE)
    const [deptFilter, setDeptFilter] = useState(SELECT_ALL_VALUE)
    const [lastUpdated, setLastUpdated] = useState('')

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const res = await adminApi.getUserList({
                pageNum: 1,
                pageSize: 100,
            })
            setUsers(res.records)
            setLastUpdated(new Date().toLocaleString('zh-CN', { hour12: false }))
        } catch (error) {
            console.error('获取用户失败:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchPosts = async () => {
        try {
            const res = await adminApi.getAllPosts()
            setPosts(res)
        } catch (error) {
            console.error('获取岗位失败:', error)
        }
    }

    const fetchDepts = async () => {
        try {
            const res = await adminApi.getAllDepts()
            setDepts(res)
        } catch (error) {
            console.error('获取部门失败:', error)
        }
    }

    useEffect(() => {
        fetchUsers()
        fetchPosts()
        fetchDepts()
    }, [])

    useEffect(() => {
        if (!dialogOpen || deptAutoFilled) {
            return
        }
        if (selectedDeptId == null && depts.length > 0) {
            setSelectedDeptId(depts[0].deptId)
            setDeptAutoFilled(true)
        }
    }, [dialogOpen, depts, selectedDeptId, deptAutoFilled])

    const handleAssignPost = (user: AdminUser) => {
        setSelectedUser(user)
        setSelectedPostId(user.postId ?? null)
        setSelectedDeptId(user.deptId ?? null)
        setDeptAutoFilled(false)
        setDialogOpen(true)
    }

    const handleSubmit = async () => {
        if (!selectedUser || selectedPostId === null) {
            alert('请选择岗位')
            return
        }
        if (selectedDeptId === null) {
            alert('请选择部门')
            return
        }

        try {
            await adminApi.assignPost({
                userId: selectedUser.userId,
                postId: selectedPostId,
                deptId: selectedDeptId,
            })
            alert('岗位分配成功')
            setDialogOpen(false)
            fetchUsers()
        } catch (error: any) {
            alert(error?.message || '分配失败')
        }
    }

    const selectedPost = selectedPostId != null ? posts.find((post) => post.postId === selectedPostId) : undefined

    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            const matchKeyword = search
                ? `${user.username}${user.realName}`.toLowerCase().includes(search.toLowerCase())
                : true
            const matchStatus = statusFilter === SELECT_ALL_VALUE ? true : String(user.status) === statusFilter
            const matchDept = deptFilter === SELECT_ALL_VALUE ? true : String(user.deptId) === deptFilter
            return matchKeyword && matchStatus && matchDept
        })
    }, [users, search, statusFilter, deptFilter])

    const stats = useMemo(() => {
        const total = users.length
        const assigned = users.filter((user) => Boolean(user.postId)).length
        const unassigned = total - assigned
        const active = users.filter((user) => user.status === 1).length
        return { total, assigned, unassigned, active }
    }, [users])

    const quickStatusFilters = [
        { label: '全部', value: SELECT_ALL_VALUE },
        { label: '启用', value: '1' },
        { label: '禁用', value: '0' },
    ]

    const resetFilters = () => {
        setSearch('')
        setStatusFilter(SELECT_ALL_VALUE)
        setDeptFilter(SELECT_ALL_VALUE)
    }

    const activeFilterTags = useMemo(() => {
        const tags: { label: string; value: string }[] = []
        if (search) tags.push({ label: '关键字', value: search })
        if (statusFilter !== SELECT_ALL_VALUE) tags.push({ label: '状态', value: statusMap[Number(statusFilter)]?.text || statusFilter })
        if (deptFilter !== SELECT_ALL_VALUE) {
            const deptName = depts.find((dept) => String(dept.deptId) === deptFilter)?.deptName
            tags.push({ label: '部门', value: deptName || deptFilter })
        }
        return tags
    }, [search, statusFilter, deptFilter, depts])

    return (
        <div className="space-y-8">
            <section className="rounded-[32px] border border-white/60 bg-gradient-to-r from-purple-500/10 via-white to-indigo-400/10 p-8 shadow-[0_35px_120px_rgba(15,23,42,0.12)]">
                <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-4">
                        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
                            <Sparkles className="h-4 w-4" /> 岗位分配中心
                        </span>
                        <div>
                            <h2 className="text-4xl font-semibold tracking-tight text-[#0F172A]">让账号与岗位精准匹配</h2>
                            <p className="mt-3 max-w-2xl text-base text-muted-foreground">
                                通过统一的岗位分配，权限体系随岗位同步，避免手工分权带来的安全隐患。
                            </p>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            {[
                                { label: '已载入账号', value: stats.total, helper: '最多展示 100 条' },
                                { label: '已分配岗位', value: stats.assigned, helper: '具备岗位的人员' },
                                { label: '待分配', value: stats.unassigned, helper: '尚未绑定岗位' },
                                { label: '启用账号', value: stats.active, helper: '状态=启用' },
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
                        <Button variant="soft" onClick={fetchUsers}>
                            <RefreshCcw className="mr-2 h-4 w-4" /> 刷新数据
                        </Button>
                        <div className="space-y-1 text-left">
                            <p>最近同步：{lastUpdated || '尚未刷新'}</p>
                            <p>提示：列表默认拉取最近 100 个账号</p>
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
                            <Button variant="outline" size="sm" onClick={fetchUsers}>
                                <RefreshCcw className="mr-2 h-4 w-4" /> 即时同步
                            </Button>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {quickStatusFilters.map((item) => (
                            <Button
                                key={item.value || 'all'}
                                variant={statusFilter === item.value ? 'default' : 'ghost-tonal'}
                                size="sm"
                                onClick={() => setStatusFilter(item.value)}
                            >
                                {item.label}
                            </Button>
                        ))}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <Input
                            placeholder="搜索用户名/姓名"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-12 rounded-2xl border-white/70 bg-white/70"
                        />
                        <Select value={deptFilter} onValueChange={setDeptFilter}>
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
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
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
                    ) : filteredUsers.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">暂无符合条件的用户</div>
                    ) : (
                        <div className="rounded-[28px] border border-dashed border-primary/15">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-white/60">
                                        <TableHead className="text-xs uppercase tracking-[0.2em] text-muted-foreground">用户ID</TableHead>
                                        <TableHead className="text-xs uppercase tracking-[0.2em] text-muted-foreground">用户账号</TableHead>
                                        <TableHead className="text-xs uppercase tracking-[0.2em] text-muted-foreground">真实姓名</TableHead>
                                        <TableHead className="text-xs uppercase tracking-[0.2em] text-muted-foreground">部门</TableHead>
                                        <TableHead className="text-xs uppercase tracking-[0.2em] text-muted-foreground">岗位</TableHead>
                                        <TableHead className="text-xs uppercase tracking-[0.2em] text-muted-foreground">状态</TableHead>
                                        <TableHead className="text-xs uppercase tracking-[0.2em] text-muted-foreground">操作</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map((user) => (
                                        <TableRow key={user.userId} className="border-white/40 hover:bg-primary/5">
                                            <TableCell className="font-medium">{user.userId}</TableCell>
                                            <TableCell className="font-semibold text-foreground">{user.username}</TableCell>
                                            <TableCell>{user.realName}</TableCell>
                                            <TableCell>{user.deptName || '-'}</TableCell>
                                            <TableCell>{user.postName || '未分配'}</TableCell>
                                            <TableCell>
                                                <Badge variant={statusMap[user.status]?.variant}>
                                                    {statusMap[user.status]?.text}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="rounded-full"
                                                    onClick={() => handleAssignPost(user)}
                                                >
                                                    <Briefcase className="mr-2 h-4 w-4" /> 分配岗位
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-md rounded-[28px]">
                    <DialogHeader>
                        <DialogTitle>分配岗位</DialogTitle>
                        <DialogDescription>
                            请选择用户所属部门与岗位，保存后立即生效。
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div>
                            <p className="text-sm font-medium">
                                用户：{selectedUser?.realName} ({selectedUser?.username})
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                当前岗位：{selectedUser?.postName || '未分配'}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label>选择岗位</Label>
                            <Select
                                value={selectedPostId ? String(selectedPostId) : ''}
                                onValueChange={(value) => setSelectedPostId(Number(value))}
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
                        <div className="space-y-2">
                            <Label>选择部门</Label>
                            <Select
                                value={selectedDeptId ? String(selectedDeptId) : ''}
                                onValueChange={(value) => setSelectedDeptId(Number(value))}
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
                        {selectedPost && (
                            <div className="rounded-md border bg-muted/40 p-3 space-y-2">
                                <p className="text-sm font-medium">该岗位包含的权限</p>
                                {selectedPost.permissions && selectedPost.permissions.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {selectedPost.permissions.map((permission) => (
                                            <Badge key={permission.permissionId} variant="outline">
                                                {permission.permissionName}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground">该岗位尚未配置权限</p>
                                )}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            取消
                        </Button>
                        <Button onClick={handleSubmit}>保存</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
