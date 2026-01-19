import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '@/api'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardFooter,
    CardDescription
} from '@/components/ui/card'

export default function Register() {
    const navigate = useNavigate()
    const setAuth = useAuthStore((state) => state.setAuth)
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        realName: '',
        phone: '',
        email: '',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!form.username || !form.password || !form.realName) {
            alert('请填写必填项')
            return
        }

        if (form.password !== form.confirmPassword) {
            alert('两次密码输入不一致')
            return
        }

        setLoading(true)
        try {
            const res = await authApi.register(form)
            setAuth(res.token, res.userInfo)
            navigate('/dashboard')
        } catch (error: any) {
            alert(error?.message || '注册失败')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* 注册卡片 */}
            <Card className="w-full max-w-md shadow-lg bg-white/30 backdrop-blur-md border border-white/20">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold text-white text-shadow-md">注册账号</CardTitle>
                    <CardDescription className="text-white/80">创建您的审批系统账号</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-white">用户名 *</Label>
                            <Input
                                id="username"
                                value={form.username}
                                onChange={(e) => setForm({ ...form, username: e.target.value })}
                                placeholder="3-50个字符"
                                className="bg-white/40 backdrop-blur-sm border-white/30 text-white placeholder-white/70"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="realName" className="text-white">真实姓名 *</Label>
                            <Input
                                id="realName"
                                value={form.realName}
                                onChange={(e) => setForm({ ...form, realName: e.target.value })}
                                className="bg-white/40 backdrop-blur-sm border-white/30 text-white placeholder-white/70"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-white">密码 *</Label>
                            <Input
                                id="password"
                                type="password"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                placeholder="6-20个字符"
                                className="bg-white/40 backdrop-blur-sm border-white/30 text-white placeholder-white/70"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-white">确认密码 *</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={form.confirmPassword}
                                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                                className="bg-white/40 backdrop-blur-sm border-white/30 text-white placeholder-white/70"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-white">手机号</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    className="bg-white/40 backdrop-blur-sm border-white/30 text-white placeholder-white/70"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-white">邮箱</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="bg-white/40 backdrop-blur-sm border-white/30 text-white placeholder-white/70"
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full mt-4 bg-white/80 hover:bg-white text-gray-900" disabled={loading}>
                            {loading ? '注册中...' : '注册'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center text-sm text-white">
                    已有账号？
                    <Link to="/login" className="text-primary hover:underline ml-1">
                        立即登录
                    </Link>
                </CardFooter>
            </Card>
        </div>
    )
}
