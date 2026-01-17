import { useState, useEffect } from 'react'
import { adminApi } from '@/api/admin'
import type { AdminPost, PostFormData } from '@/types'
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

export default function PostManagement() {
    const [posts, setPosts] = useState<AdminPost[]>([])
    const [loading, setLoading] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingPost, setEditingPost] = useState<AdminPost | null>(null)
    const [filter, setFilter] = useState({ postName: '', status: '' })

    const [formData, setFormData] = useState<PostFormData>({
        postCode: '',
        postName: '',
        postSort: 0,
        status: 1,
    })

    const fetchPosts = async () => {
        setLoading(true)
        try {
            const res = await adminApi.getPostList({
                pageNum: 1,
                pageSize: 100,
                postName: filter.postName || undefined,
                status: filter.status ? Number(filter.status) : undefined,
            })
            console.log('岗位数据:', res)
            setPosts(res.records)
        } catch (error) {
            console.error('获取岗位列表失败:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPosts()
    }, [filter])

    const handleCreate = () => {
        setEditingPost(null)
        setFormData({
            postCode: '',
            postName: '',
            postSort: 0,
            status: 1,
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
                            onChange={(e) => setFilter({ ...filter, postName: e.target.value })}
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
                                            {new Date(post.createTime).toLocaleString('zh-CN')}
                                        </TableCell>
                                        <TableCell className="space-x-2">
                                            <Button variant="ghost" size="sm" onClick={() => handleEdit(post)}>
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive"
                                                onClick={() => handleDelete(post.postId)}
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
