import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { applicationApi } from '@/api'
import type { ApplicationSummary } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

/**
 * 普通员工仪表盘统计页
 */
export default function UserSummary() {
    const { user } = useAuthStore()
    const [summary, setSummary] = useState<ApplicationSummary | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [refreshFlag, setRefreshFlag] = useState(0)

    useEffect(() => {
        let active = true
        setLoading(true)
        setError(null)
        applicationApi
            .getSummary()
            .then((data) => {
                if (!active) return
                setSummary(data)
            })
            .catch(() => {
                if (!active) return
                setError('统计数据加载失败，请稍后重试。')
            })
            .finally(() => {
                if (!active) return
                setLoading(false)
            })

        return () => {
            active = false
        }
    }, [refreshFlag])

    const infoItems = [
        {
            label: '姓名',
            value: summary?.realName || user?.realName || '--',
        },
        {
            label: '部门',
            value: summary?.deptName || '未分配',
        },
        {
            label: '岗位',
            value: summary?.postName || '未分配',
        },
    ]

    const roleLabelMap: Record<string, string> = {
        admin: '管理员',
        approver: '审批人',
        user: '普通员工',
    }

    const permissionBadges = (user?.roles?.length ? user.roles : ['user']).map((role) => {
        const normalized = role.replace(/^ROLE_/i, '').toLowerCase()
        const label = roleLabelMap[normalized] || (normalized ? normalized : '普通员工')
        return (
            <Badge key={role} variant="secondary">
                {label}
            </Badge>
        )
    })

    const formatValue = (value?: number | null, digits = 0) => {
        if (value === null || value === undefined || Number.isNaN(Number(value))) {
            return '--'
        }
        return Number(value).toLocaleString('zh-CN', {
            minimumFractionDigits: digits,
            maximumFractionDigits: digits,
        })
    }

    const statCards = [
        {
            title: '请假申请数量',
            value: summary?.leaveCount,
            unit: '次',
            description: '累计提交的请假单',
        },
        {
            title: '请假总时长',
            value: summary?.totalLeaveDays,
            unit: '天',
            description: '已提交请假单的总时长',
            digits: 1,
        },
        {
            title: '报销申请数量',
            value: summary?.reimburseCount,
            unit: '次',
            description: '累计提交的报销单',
        },
        {
            title: '报销总额',
            value: summary?.totalReimburseAmount,
            unit: '元',
            description: '已提交报销单对应金额',
            digits: 2,
        },
        {
            title: '申请通过率',
            value: summary?.approvalRate,
            unit: '%',
            description: '以通过申请 / 总申请量计算',
            digits: 2,
        },
    ]

    const showSkeleton = loading && !summary && !error

    if (showSkeleton) {
        return (
            <div className="space-y-6">
                {[0, 1].map((key) => (
                    <div key={key} className="h-40 rounded-2xl border bg-white shadow-sm animate-pulse" />
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>个人信息</CardTitle>
                    <CardDescription>了解当前账号的基础信息与权限</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6 md:grid-cols-4">
                        {infoItems.map((item) => (
                            <div key={item.label}>
                                <p className="text-sm text-muted-foreground">{item.label}</p>
                                <p className="text-2xl font-semibold text-foreground mt-1">{item.value}</p>
                            </div>
                        ))}
                        <div>
                            <p className="text-sm text-muted-foreground">权限</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {permissionBadges}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {error ? (
                <Card className="border-destructive/40 shadow-sm">
                    <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                        <AlertCircle className="h-5 w-5 text-destructive" />
                        <div>
                            <CardTitle>统计数据加载失败</CardTitle>
                            <CardDescription>{error}</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" onClick={() => setRefreshFlag((flag) => flag + 1)}>
                            重试
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>个人申请统计</CardTitle>
                        <CardDescription>请假与报销的核心指标一目了然</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {statCards.map((card) => {
                                const formattedValue = formatValue(card.value, card.digits)
                                return (
                                    <Card key={card.title} className="border-muted bg-muted/20">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-base font-medium text-muted-foreground">
                                                {card.title}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-3xl font-bold tracking-tight">
                                                {formattedValue}
                                                {card.unit && formattedValue !== '--' && (
                                                    <span className="ml-1 text-lg font-semibold text-muted-foreground">
                                                        {card.unit}
                                                    </span>
                                                )}
                                            </div>
                                            {card.description && (
                                                <p className="text-sm text-muted-foreground mt-2">{card.description}</p>
                                            )}
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
