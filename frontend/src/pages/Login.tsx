import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '@/api'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card'

export default function Login() {
    const navigate = useNavigate()
    const setAuth = useAuthStore((state) => state.setAuth)
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        username: '',
        password: '',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!form.username || !form.password) {
            alert('请填写用户名和密码')
            return
        }

        setLoading(true)
        try {
            const res = await authApi.login(form)
            setAuth(res.token, res.userInfo)
            navigate('/dashboard')
        } catch (error: any) {
            alert(error?.message || '登录失败')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold">YIR-审批系统</CardTitle>
                    <CardDescription>请输入您的账号密码登录</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">用户名</Label>
                            <Input
                                id="username"
                                type="text"
                                value={form.username}
                                onChange={(e) => setForm({ ...form, username: e.target.value })}
                                placeholder="请输入用户名"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">密码</Label>
                            <Input
                                id="password"
                                type="password"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                placeholder="请输入密码"
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? '登录中...' : '登录'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col gap-4 text-center">
                    <div className="text-sm text-gray-500">
                        还没有账号？
                        <Link to="/register" className="text-primary hover:underline ml-1">
                            立即注册
                        </Link>
                    </div>
                    <div className="flex flex-col gap-2 text-xs text-muted-foreground border-t pt-4 w-full">
                        {[
                            { label: '管理账号', account: 'admin / 123456', icon: '👩‍💼' },
                            { label: '审批账号', account: 'zyb / 123456', icon: '✅' },
                            { label: '员工账号', account: 'wangyi / 123456', icon: '👤' },
                        ].map((item) => (
                            <span
                                key={item.label}
                                className="flex items-center gap-3 rounded-full border border-muted-foreground/20 px-4 py-2 text-sm"
                            >
                                <span className="text-base w-6 text-center">{item.icon}</span>
                                <span className="font-medium text-foreground w-20 text-left">{item.label}</span>
                                <span className="text-muted-foreground flex-1 text-left">{item.account}</span>
                            </span>
                        ))}
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
