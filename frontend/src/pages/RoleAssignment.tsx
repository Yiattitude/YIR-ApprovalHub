import { useState, useEffect } from 'react'
import { adminApi } from '@/api/admin'
import type { AdminUser, AdminRole } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Shield } from 'lucide-react'

const statusMap: Record<number, { text: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }> = {
    0: { text: '禁用', variant: 'destructive' },
    1: { text: '启用', variant: 'success' },
}

export default function RoleAssignment() {
    const [users, setUsers] = useState<AdminUser[]>([])
    const [loading, setLoading] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
    const [allRoles, setAllRoles] = useState<AdminRole[]>([])
    const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([])

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const res = await adminApi.getUserList({
                pageNum: 1,
                pageSize: 100,
            })
            setUsers(res.records)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const fetchAllRoles = async () => {
        try {
            const res = await adminApi.getAllRoles()
            setAllRoles(res)
        } catch (error) {
            console.error(error)
        }
    }

    useEffect(() => {
        fetchUsers()
        fetchAllRoles()
    }, [])

    const handleAssignRoles = (user: AdminUser) => {
        setSelectedUser(user)
        setSelectedRoleIds([])
        setDialogOpen(true)
    }

    const handleRoleToggle = (roleId: number) => {
        setSelectedRoleIds((prev) =>
            prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
        )
    }

    const handleSubmit = async () => {
        if (!selectedUser) return

        try {
            await adminApi.assignRoles({
                userId: selectedUser.userId,
                roleIds: selectedRoleIds,
            })
            alert('角色分配成功')
            setDialogOpen(false)
            fetchUsers()
        } catch (error: any) {
            alert(error?.message || '分配失败')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">角色分配</h2>
            </div>

            <Card>
                <CardHeader>
                    <p className="text-sm text-muted-foreground">
                        为用户分配系统角色，控制用户的访问权限
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
                                    <TableHead>用户名</TableHead>
                                    <TableHead>真实姓名</TableHead>
                                    <TableHead>部门</TableHead>
                                    <TableHead>岗位</TableHead>
                                    <TableHead>当前角色</TableHead>
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
                                        <TableCell>{user.postName || '-'}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {user.roles && user.roles.length > 0 ? (
                                                    user.roles.map((role) => (
                                                        <Badge key={role} variant="secondary">
                                                            {role}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-muted-foreground">未分配</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={statusMap[user.status]?.variant}>
                                                {statusMap[user.status]?.text}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleAssignRoles(user)}
                                            >
                                                <Shield className="w-4 h-4 mr-2" />
                                                分配角色
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
                        <DialogTitle>分配角色</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="mb-4">
                            <p className="text-sm font-medium">用户：{selectedUser?.realName} ({selectedUser?.username})</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                当前角色：{selectedUser?.roles?.join(', ') || '无'}
                            </p>
                        </div>
                        <div className="space-y-3">
                            <Label>选择角色：</Label>
                            {allRoles.map((role) => (
                                <div key={role.roleId} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`role-${role.roleId}`}
                                        checked={selectedRoleIds.includes(role.roleId)}
                                        onCheckedChange={() => handleRoleToggle(role.roleId)}
                                    />
                                    <Label
                                        htmlFor={`role-${role.roleId}`}
                                        className="flex-1 cursor-pointer"
                                    >
                                        <div>
                                            <div className="font-medium">{role.roleName}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {role.roleKey} - {role.remark || '无描述'}
                                            </div>
                                        </div>
                                    </Label>
                                </div>
                            ))}
                        </div>
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
