import { useState, useEffect } from 'react'
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
import { Plus, Pencil, Trash2 } from 'lucide-react'

const statusMap: Record<number, { text: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }> = {
    0: { text: '禁用', variant: 'destructive' },
    1: { text: '启用', variant: 'success' },
}

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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">用户管理</h2>
                <Button onClick={handleCreate}>
                    <Plus className="w-4 h-4 mr-2" />
                    新增用户
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex gap-4 flex-wrap">
                        <Input
                            placeholder="用户名"
                            value={filter.username}
                            onChange={(e) => updateFilter('username', e.target.value)}
                            className="w-[200px]"
                        />
                        <Input
                            placeholder="真实姓名"
                            value={filter.realName}
                            onChange={(e) => updateFilter('realName', e.target.value)}
                            className="w-[200px]"
                        />
                        <Select
                            value={filter.deptId}
                            onValueChange={(val) => updateFilter('deptId', val === "all" ? "" : val)}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="全部部门" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">全部部门</SelectItem>
                                {depts.map((dept) => (
                                    <SelectItem key={dept.deptId} value={String(dept.deptId)}>
                                        {dept.deptName}
                                    </SelectItem>
                                ))}
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
                                <SelectItem value="1">启用</SelectItem>
                                <SelectItem value="0">禁用</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-10 text-muted-foreground">加载中...</div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">暂无用户</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="whitespace-nowrap">用户ID</TableHead>
                                    <TableHead className="whitespace-nowrap">用户名</TableHead>
                                    <TableHead className="whitespace-nowrap">真实姓名</TableHead>
                                    <TableHead className="whitespace-nowrap">手机号</TableHead>
                                    <TableHead className="whitespace-nowrap">邮箱</TableHead>
                                    <TableHead className="whitespace-nowrap">部门</TableHead>
                                    <TableHead className="whitespace-nowrap">岗位</TableHead>
                                    <TableHead className="whitespace-nowrap">状态</TableHead>
                                    <TableHead className="whitespace-nowrap">创建时间</TableHead>
                                    <TableHead className="whitespace-nowrap">操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.userId}>
                                        <TableCell className="whitespace-nowrap">{user.userId}</TableCell>
                                        <TableCell className="whitespace-nowrap">{user.username}</TableCell>
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
                                        <TableCell className="whitespace-nowrap">
                                            {new Date(user.createTime).toLocaleString('zh-CN')}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            <div className="flex flex-col gap-2 min-w-[120px]">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="justify-start"
                                                    onClick={() => handleEdit(user)}
                                                >
                                                    <Pencil className="w-4 h-4 mr-2" />
                                                    编辑
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="justify-start text-destructive"
                                                    onClick={() => handleDelete(user.userId)}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    删除
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

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
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
