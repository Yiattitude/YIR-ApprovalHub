import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { applicationApi } from '@/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useAuthStore } from '@/store/authStore'
import type { ApproverOption } from '@/types'

export default function CreateReimburse() {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        amount: '',
        expenseType: '1',
        reason: '',
        invoiceAttachment: '',
        occurDate: '',
    })
    const [approvers, setApprovers] = useState<ApproverOption[]>([])
    const [selectedApproverId, setSelectedApproverId] = useState('')
    const [submitBlockReason, setSubmitBlockReason] = useState<string | null>(null)

    const expenseTypeOptions = [
        { label: '差旅交通费', value: '1' },
        { label: '业务招待费', value: '2' },
        { label: '日常办公费', value: '3' },
        { label: '培训教育费', value: '4' },
        { label: '服务采购费', value: '5' },
        { label: '其他', value: '6' },
    ]

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!form.amount || !form.reason || !form.invoiceAttachment || !form.occurDate) {
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
            await applicationApi.createReimburse({
                amount: Number(form.amount),
                expenseType: Number(form.expenseType),
                reason: form.reason,
                invoiceAttachment: form.invoiceAttachment,
                occurDate: form.occurDate,
                approverId: Number(selectedApproverId),
            })
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
                    <CardTitle>创建报销申请</CardTitle>
                    <CardDescription>请填写真实的报销信息</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>所属部门 *</Label>
                                <Input value={user?.deptName || '未分配'} readOnly placeholder="未分配" />
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
                            <Label>报销金额 (元) *</Label>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.amount}
                                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                placeholder="0.00"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>报销类别 *</Label>
                            <Select
                                value={form.expenseType}
                                onValueChange={(val) => setForm({ ...form, expenseType: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="请选择类别" />
                                </SelectTrigger>
                                <SelectContent>
                                    {expenseTypeOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>费用发生日期 *</Label>
                            <Input
                                type="date"
                                value={form.occurDate}
                                onChange={(e) => setForm({ ...form, occurDate: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>费用说明 *</Label>
                            <Textarea
                                value={form.reason}
                                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                                placeholder="请详细说明费用产生的详情"
                                rows={4}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>发票附件链接 *</Label>
                            <Input
                                type="url"
                                value={form.invoiceAttachment}
                                onChange={(e) => setForm({ ...form, invoiceAttachment: e.target.value })}
                                placeholder="请输入发票附件链接"
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
        </div>
    )
}
