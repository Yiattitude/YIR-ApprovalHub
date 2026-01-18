import { useState, useEffect } from 'react'
import { adminApi } from '@/api/admin'
import type { AdminUser, UserFormData, AdminDept, AdminPost } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
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
import { Plus, Pencil, Trash2 } from 'lucide-react'

const statusMap: Record<number, { text: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }> = {
    0: { text: '禁用', variant: 'destructive' },
    1: { text: '启用', variant: 'success' },
}

export default function UserManagement() {
    const [users, setUsers] = useState<AdminUser[]>([])
    const [loading, setLoading] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
    const [depts, setDepts] = useState<AdminDept[]>([])
    const [posts, setPosts] = useState<AdminPost[]>([])
    const [filter, setFilter] = useState({ username: '', realName: '', deptId: '', status: '' })

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
                pageNum: 1,
                pageSize: 100,
                username: filter.username || undefined,
                realName: filter.realName || undefined,
                deptId: filter.deptId ? Number(filter.deptId) : undefined,
                status: filter.status ? Number(filter.status) : undefined,
            })
            console.log('用户数据:', res)
            setUsers(res.records)
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
    }, [filter])

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
                            onChange={(e) => setFilter({ ...filter, username: e.target.value })}
                            className="w-[200px]"
                        />
                        <Input
                            placeholder="真实姓名"
                            value={filter.realName}
                            onChange={(e) => setFilter({ ...filter, realName: e.target.value })}
                            className="w-[200px]"
                        />
                        <Select
                            value={filter.deptId}
                            onValueChange={(val) => setFilter({ ...filter, deptId: val === "all" ? "" : val })}
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
                            onValueChange={(val) => setFilter({ ...filter, status: val === "all" ? "" : val })}
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
                                    <TableHead>用户ID</TableHead>
                                    <TableHead>用户名</TableHead>
                                    <TableHead>真实姓名</TableHead>
                                    <TableHead>手机号</TableHead>
                                    <TableHead>邮箱</TableHead>
                                    <TableHead>部门</TableHead>
                                    <TableHead>岗位</TableHead>
                                    <TableHead>角色</TableHead>
                                    <TableHead>状态</TableHead>
                                    <TableHead>创建时间</TableHead>
                                    <TableHead>操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.userId}>
                                        <TableCell>{user.userId}</TableCell>
                                        <TableCell>{user.username}</TableCell>
                                        <TableCell>{user.realName}</TableCell>
                                        <TableCell>{user.phone || '-'}</TableCell>
                                        <TableCell>{user.email || '-'}</TableCell>
                                        <TableCell>{user.deptName || '-'}</TableCell>
                                        <TableCell>{user.postName || '-'}</TableCell>
                                        <TableCell>{user.roles?.join(', ') || '-'}</TableCell>
                                        <TableCell>
                                            <Badge variant={statusMap[user.status]?.variant}>
                                                {statusMap[user.status]?.text}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(user.createTime).toLocaleString('zh-CN')}
                                        </TableCell>
                                        <TableCell className="space-x-2">
                                            <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive"
                                                onClick={() => handleDelete(user.userId)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
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
