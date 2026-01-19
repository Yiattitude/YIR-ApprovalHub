import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { applicationApi } from '@/api'
import dayjs from 'dayjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { useAuthStore } from '@/store/authStore'
import type { ApproverOption } from '@/types'

export default function CreateLeave() {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        leaveType: 1,
        startTime: '',
        endTime: '',
        days: 0,
        reason: '',
        attachment: '',
    })
    const [approvers, setApprovers] = useState<ApproverOption[]>([])
    const [selectedApproverId, setSelectedApproverId] = useState('')
    const [submitBlockReason, setSubmitBlockReason] = useState<string | null>(null)
    const [timeDialogOpen, setTimeDialogOpen] = useState(false)
    const [timeDraft, setTimeDraft] = useState({ start: '', end: '' })

    // 自动计算天数
    useEffect(() => {
        if (form.startTime && form.endTime) {
            const start = dayjs(form.startTime)
            const end = dayjs(form.endTime)

            if (end.isAfter(start)) {
                // 计算小时差，然后转换为天数（假设一天8小时工作制或24小时制，这里简单按24小时算或者0.5天精度）
                // 暂时按简单天数差计算，向上取整或保留1位小数
                const diffHours = end.diff(start, 'hour', true)
                const days = Math.ceil((diffHours / 24) * 2) / 2 // 0.5 step
                setForm(prev => ({ ...prev, days: days > 0 ? days : 0 }))
            }
        }
    }, [form.startTime, form.endTime])

    useEffect(() => {
        setSelectedApproverId('')
        if (!user?.deptId) {
            setSubmitBlockReason('请先联系管理员为您分配部门后再提交申请')
            setApprovers([])
            return
        }

        let active = true
        const fetchApprovers = async () => {
            try {
                const list = await applicationApi.getApprovers({ deptId: user.deptId })
                if (!active) return
                setApprovers(list)
                if (list.length === 0) {
                    setSubmitBlockReason('该部门暂无审批人，请联系管理员')
                } else {
                    setSubmitBlockReason(null)
                }
            } catch (error: any) {
                if (!active) return
                setApprovers([])
                setSubmitBlockReason(error?.message || '审批人列表获取失败')
            }
        }

        fetchApprovers()

        return () => {
            active = false
        }
    }, [user?.deptId])
    
    const formatDisplayTime = (value: string) => (value ? dayjs(value).format('YYYY/MM/DD HH:mm') : '')

    const openTimeDialog = () => {
        const now = dayjs().format('YYYY-MM-DDTHH:mm')
        const defaultEnd = form.startTime ? dayjs(form.startTime).add(1, 'hour').format('YYYY-MM-DDTHH:mm') : now
        setTimeDraft({
            start: form.startTime || now,
            end: form.endTime || defaultEnd,
        })
        setTimeDialogOpen(true)
    }

    const handleTimeDialogConfirm = () => {
        if (!timeDraft.start || !timeDraft.end) {
            alert('请完整选择开始和结束时间')
            return
        }

        const start = dayjs(timeDraft.start)
        const end = dayjs(timeDraft.end)
        if (!end.isAfter(start)) {
            alert('结束时间必须晚于开始时间')
            return
        }

        setForm((prev) => ({
            ...prev,
            startTime: timeDraft.start,
            endTime: timeDraft.end,
        }))
        setTimeDialogOpen(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!form.startTime || !form.endTime || !form.reason) {
            alert('请填写必填项')
            return
        }

        if (submitBlockReason) {
            alert(submitBlockReason)
            return
        }

        if (!selectedApproverId) {
            alert('请选择审批人')
            return
        }

        setLoading(true)
        try {
            // 格式化日期为 yyyy-MM-dd HH:mm:ss
            const formattedForm = {
                ...form,
                startTime: dayjs(form.startTime).format('YYYY-MM-DD HH:mm:ss'),
                endTime: dayjs(form.endTime).format('YYYY-MM-DD HH:mm:ss'),
                approverId: Number(selectedApproverId),
            }
            await applicationApi.createLeave(formattedForm)
            alert('提交成功')
            navigate('/dashboard/applications')
        } catch (error: any) {
            alert(error?.message || '提交失败')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>创建请假申请</CardTitle>
                    <CardDescription>请填写真实的请假信息</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>所属部门 *</Label>
                                <Input
                                    value={user?.deptName || '未分配'}
                                    readOnly
                                    placeholder="未分配"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>审批人 *</Label>
                                <Select
                                    value={selectedApproverId}
                                    onValueChange={setSelectedApproverId}
                                    disabled={!!submitBlockReason || approvers.length === 0}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="请选择审批人" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {approvers.length === 0 ? (
                                            <SelectItem value="__no_approver__" disabled>
                                                暂无可用审批人
                                            </SelectItem>
                                        ) : (
                                            approvers.map((approver) => (
                                                <SelectItem key={approver.userId} value={String(approver.userId)}>
                                                    {approver.realName}
                                                    {approver.postName ? `（${approver.postName}）` : ''}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        {submitBlockReason && (
                            <p className="text-sm text-red-500">{submitBlockReason}</p>
                        )}

                        <div className="space-y-2">
                            <Label>请假类型 *</Label>
                            <Select
                                value={String(form.leaveType)}
                                onValueChange={(val) => setForm({ ...form, leaveType: Number(val) })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="选择请假类型" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">事假</SelectItem>
                                    <SelectItem value="2">病假</SelectItem>
                                    <SelectItem value="3">年假</SelectItem>
                                    <SelectItem value="4">调休</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>请假时间段 *</Label>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full flex-col items-start text-left gap-1"
                                onClick={openTimeDialog}
                            >
                                <span className="text-sm font-medium">
                                    {form.startTime && form.endTime
                                        ? `${formatDisplayTime(form.startTime)} 至 ${formatDisplayTime(form.endTime)}`
                                        : '点击按钮选择开始与结束时间'}
                                </span>
                              
                            </Button>
                        
                        </div>

                        <div className="space-y-2">
                            <Label>请假天数 *</Label>
                            <Input
                                type="number"
                                step="0.5"
                                readOnly
                                value={form.days}
                                onChange={(e) => setForm({ ...form, days: Number(e.target.value) })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>请假事由 *</Label>
                            <Textarea
                                value={form.reason}
                                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                                placeholder="请详细说明请假原因"
                                className="rounded-xl border-[#090a0a] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.08)] focus-visible:ring-1 focus-visible:ring-[#5b8ef9]"
                                rows={4}
                            />
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button
                                type="submit"
                                className="flex-1"
                                disabled={loading || !!submitBlockReason || !selectedApproverId}
                            >
                                {loading ? '提交中...' : '提交申请'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate('/dashboard/applications')}
                            >
                                取消
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
            <Dialog open={timeDialogOpen} onOpenChange={setTimeDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>选择时间范围</DialogTitle>
                        <DialogDescription>
                            左侧为开始时间，右侧为结束时间。
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>开始时间</Label>
                            <Input
                                type="datetime-local"
                                value={timeDraft.start}
                                onChange={(e) => setTimeDraft((prev) => ({ ...prev, start: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>结束时间</Label>
                            <Input
                                type="datetime-local"
                                value={timeDraft.end}
                                onChange={(e) => setTimeDraft((prev) => ({ ...prev, end: e.target.value }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" type="button" onClick={() => setTimeDialogOpen(false)}>
                            取消
                        </Button>
                        <Button type="button" onClick={handleTimeDialogConfirm}>
                            确定
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
