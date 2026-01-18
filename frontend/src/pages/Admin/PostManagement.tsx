import { useState, useEffect } from 'react'
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
import { Plus, Pencil, Trash2 } from 'lucide-react'

const statusMap: Record<number, { text: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }> = {
    0: { text: '禁用', variant: 'destructive' },
    1: { text: '启用', variant: 'success' },
}

export default function PostManagement() {
    const [posts, setPosts] = useState<AdminPost[]>([])
    const [loading, setLoading] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingPost, setEditingPost] = useState<AdminPost | null>(null)
    const [filter, setFilter] = useState({ postName: '', status: '' })
    const [allPermissions, setAllPermissions] = useState<Permission[]>([])
    const [pageNum, setPageNum] = useState(1)
    const [total, setTotal] = useState(0)
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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">岗位管理</h2>
                <Button onClick={handleCreate}>
                    <Plus className="w-4 h-4 mr-2" />
                    新增岗位
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex gap-4 flex-wrap">
                        <Input
                            placeholder="岗位名称"
                            value={filter.postName}
                            onChange={(e) => updateFilter('postName', e.target.value)}
                            className="w-[200px]"
                        />
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
                    ) : posts.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">暂无岗位</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>岗位ID</TableHead>
                                    <TableHead>岗位编码</TableHead>
                                    <TableHead>岗位名称</TableHead>
                                    <TableHead>排序</TableHead>
                                    <TableHead>状态</TableHead>
                                    <TableHead>权限</TableHead>
                                    <TableHead>创建时间</TableHead>
                                    <TableHead>操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {posts.map((post) => (
                                    <TableRow key={post.postId}>
                                        <TableCell>{post.postId}</TableCell>
                                        <TableCell>{post.postCode}</TableCell>
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
                                        <TableCell>
                                            {new Date(post.createTime).toLocaleString('zh-CN')}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-2 min-w-[120px]">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="justify-start"
                                                    onClick={() => handleEdit(post)}
                                                >
                                                    <Pencil className="w-4 h-4 mr-2" />
                                                    编辑
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="justify-start text-destructive"
                                                    onClick={() => handleDelete(post.postId)}
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
                <DialogContent className="max-w-md">
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
