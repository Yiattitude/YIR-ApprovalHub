import { useState } from 'react'
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
import { FileUpload } from '@/components/ui/FileUpload'

export default function CreateReimburse() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        amount: '',
        expenseType: '1',
        reason: '',
        invoiceAttachment: '',
        occurDate: '',
    })

    const expenseTypeOptions = [
        { label: '差旅交通费', value: '1' },
        { label: '业务招待费', value: '2' },
        { label: '日常办公费', value: '3' },
        { label: '培训教育费', value: '4' },
        { label: '服务采购费', value: '5' },
        { label: '其他', value: '6' },
    ]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!form.amount || !form.reason || !form.invoiceAttachment || !form.occurDate) {
            alert('请填写必填项')
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
                            <FileUpload
                                id="invoice-attachment"
                                label="发票附件 *"
                                acceptedTypes=".pdf, .doc, .docx, .xls, .xlsx"
                                maxSize={10}
                                value={form.invoiceAttachment}
                                onChange={(value) => setForm({ ...form, invoiceAttachment: value })}
                                required={true}
                                useBase64={true}
                            />
                        </div>

                        

                        <div className="flex gap-4 pt-4">
                            <Button type="submit" className="flex-1" disabled={loading}>
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
