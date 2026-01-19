import { useEffect, useState } from 'react'
import { adminApi } from '@/api/admin'
import type { AdminUser, AdminPost, AdminDept } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { Briefcase } from 'lucide-react'

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

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const res = await adminApi.getUserList({
                pageNum: 1,
                pageSize: 100,
            })
            setUsers(res.records)
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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">岗位分配</h2>
            </div>

            <Card>
                <CardHeader>
                    <p className="text-sm text-muted-foreground">
                        为用户快速分配岗位。系统权限由岗位绑定的权限决定，无需单独维护角色。
                    </p>
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
                                    <TableHead>用户账号</TableHead>
                                    <TableHead>真实姓名</TableHead>
                                    <TableHead>部门</TableHead>
                                    <TableHead>岗位</TableHead>
                                    <TableHead>状态</TableHead>
                                    <TableHead>操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.userId}>
                                        <TableCell>{user.userId}</TableCell>
                                        <TableCell>{user.username}</TableCell>
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
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleAssignPost(user)}
                                            >
                                                <Briefcase className="w-4 h-4 mr-2" />
                                                分配岗位
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
                <DialogContent className="max-w-md">
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
