import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { applicationApi } from '@/api'
import dayjs from 'dayjs'
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
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { FileUpload } from '@/components/ui/FileUpload'

export default function CreateLeave() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        leaveType: 1,
        startTime: '',
        endTime: '',
        days: 0,
        reason: '',
        attachment: '',
    })

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!form.startTime || !form.endTime || !form.reason) {
            alert('请填写必填项')
            return
        }

        setLoading(true)
        try {
            // 格式化日期为 yyyy-MM-dd HH:mm:ss
            const formattedForm = {
                ...form,
                startTime: dayjs(form.startTime).format('YYYY-MM-DD HH:mm:ss'),
                endTime: dayjs(form.endTime).format('YYYY-MM-DD HH:mm:ss')
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

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>开始时间 *</Label>
                                <Input
                                    type="datetime-local"
                                    value={form.startTime}
                                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>结束时间 *</Label>
                                <Input
                                    type="datetime-local"
                                    value={form.endTime}
                                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>请假天数 *</Label>
                            <Input
                                type="number"
                                step="0.5"
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
                                rows={4}
                            />
                        </div>

                        <div className="space-y-2">
                            <FileUpload
                                id="leave-attachment"
                                label="附件"
                                acceptedTypes=".pdf, .doc, .docx"
                                maxSize={5}
                                value={form.attachment}
                                onChange={(value) => setForm({ ...form, attachment: value })}
                                required={false}
                                useBase64={true}
                            />
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button
                                type="submit"
                                className="flex-1"
                                disabled={loading}
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
