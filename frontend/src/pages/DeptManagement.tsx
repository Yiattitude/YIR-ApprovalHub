import { useState, useEffect } from 'react'
import { adminApi } from '@/api/admin'
import type { AdminDept, DeptFormData } from '@/types'
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

export default function DeptManagement() {
    const [depts, setDepts] = useState<AdminDept[]>([])
    const [loading, setLoading] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingDept, setEditingDept] = useState<AdminDept | null>(null)
    const [parentDepts, setParentDepts] = useState<AdminDept[]>([])
    const [filter, setFilter] = useState({ deptName: '', status: '' })

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
                pageNum: 1,
                pageSize: 100,
                deptName: filter.deptName || undefined,
                status: filter.status ? Number(filter.status) : undefined,
            })
            console.log('部门数据:', res)
            setDepts(res.records)
            setParentDepts(res.records)
        } catch (error) {
            console.error('获取部门列表失败:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDepts()
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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">部门管理</h2>
                <Button onClick={handleCreate}>
                    <Plus className="w-4 h-4 mr-2" />
                    新增部门
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex gap-4 flex-wrap">
                        <Input
                            placeholder="部门名称"
                            value={filter.deptName}
                            onChange={(e) => setFilter({ ...filter, deptName: e.target.value })}
                            className="w-[200px]"
                        />
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
                    ) : depts.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">暂无部门</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>部门ID</TableHead>
                                    <TableHead>部门名称</TableHead>
                                    <TableHead>父部门</TableHead>
                                    <TableHead>负责人</TableHead>
                                    <TableHead>联系电话</TableHead>
                                    <TableHead>邮箱</TableHead>
                                    <TableHead>排序</TableHead>
                                    <TableHead>状态</TableHead>
                                    <TableHead>创建时间</TableHead>
                                    <TableHead>操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {depts.map((dept) => (
                                    <TableRow key={dept.deptId}>
                                        <TableCell>{dept.deptId}</TableCell>
                                        <TableCell>{dept.deptName}</TableCell>
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
                                        <TableCell>
                                            {new Date(dept.createTime).toLocaleString('zh-CN')}
                                        </TableCell>
                                        <TableCell className="space-x-2">
                                            <Button variant="ghost" size="sm" onClick={() => handleEdit(dept)}>
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive"
                                                onClick={() => handleDelete(dept.deptId)}
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
                <DialogContent className="max-w-2xl">
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
