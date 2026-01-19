import { useEffect, useState, type ReactNode } from 'react'
import dayjs from 'dayjs'
import { applicationApi } from '@/api'
import type {
    ApplicationDetailResponse,
    LeaveApplicationDetail,
    ReimburseApplicationDetail,
} from '@/types'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    APPLICATION_STATUS,
    APPLICATION_TYPE_LABELS,
    LEAVE_TYPE_LABELS,
    EXPENSE_TYPE_LABELS,
    APPROVAL_ACTION_LABELS,
} from '@/constants/application'
import { cn } from '@/lib/utils'

interface ApplicationDetailDialogProps {
    appId?: number
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ApplicationDetailDialog({ appId, open, onOpenChange }: ApplicationDetailDialogProps) {
    const [detail, setDetail] = useState<ApplicationDetailResponse | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [previewFile, setPreviewFile] = useState<{ url: string; name?: string } | null>(null)

    useEffect(() => {
        if (!open || !appId) {
            return
        }

        let cancelled = false
        setLoading(true)
        setError(null)

        applicationApi
            .getDetail(appId)
            .then((data) => {
                if (!cancelled) {
                    setDetail(data)
                }
            })
            .catch((err: any) => {
                if (!cancelled) {
                    setError(err?.message || '加载详情失败')
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false)
                }
            })

        return () => {
            cancelled = true
        }
    }, [appId, open])

    useEffect(() => {
        if (!open) {
            setDetail(null)
            setError(null)
        }
    }, [open])

    const application = detail?.application
    const statusMeta = application ? APPLICATION_STATUS[application.status] : null
    const leaveDetail = isLeaveDetail(detail?.detail) ? detail?.detail : null
    const reimburseDetail = isReimburseDetail(detail?.detail) ? detail?.detail : null
    const historyRecords = detail?.history ?? []
    const displayTitle = getDisplayTitle(
        application?.appType,
        leaveDetail,
        reimburseDetail,
        application?.title
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex  gap-4">
                        <span>{displayTitle}</span>
                        {application && (
                            <Badge variant={statusMeta?.variant || 'outline'}>
                                {statusMeta?.text || '未知状态'}
                            </Badge>
                        )}      
                    </DialogTitle>
                    {application && (
                        <DialogDescription>
                            单号：{application.appNo} · 类型：
                            {APPLICATION_TYPE_LABELS[application.appType] || application.appType}
                        </DialogDescription>
                    )}
                </DialogHeader>

                {loading && (
                    <div className="py-10 text-center text-muted-foreground">加载中...</div>
                )}

                {!loading && error && (
                    <div className="py-6 text-center text-destructive">{error}</div>
                )}

                {!loading && !error && !detail && (
                    <div className="py-6 text-center text-muted-foreground">请选择要查看的申请</div>
                )}

                {!loading && !error && detail && (
                    <div className="space-y-8">
                        <section className="space-y-3">
                            <h4 className="text-sm font-semibold text-muted-foreground">基础信息</h4>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <InfoRow label="标题" value={displayTitle} />
                                <InfoRow label="申请单号" value={application?.appNo} />
                                <InfoRow
                                    label="申请类型"
                                    value={
                                        application
                                            ? APPLICATION_TYPE_LABELS[application.appType] || application.appType
                                            : '-'
                                    }
                                />
                                <InfoRow label="当前节点" value={application?.currentNode || '-'} />
                                <InfoRow label="提交时间" value={formatDateTime(application?.submitTime)} />
                                <InfoRow label="完成时间" value={formatDateTime(application?.finishTime)} />
                            </div>
                        </section>

                        {leaveDetail && (
                            <section className="space-y-3">
                                <h4 className="text-sm font-semibold text-muted-foreground">请假信息</h4>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <InfoRow
                                        label="请假类型"
                                        value={LEAVE_TYPE_LABELS[leaveDetail.leaveType] || leaveDetail.leaveType}
                                    />
                                    <InfoRow label="请假天数" value={formatNumber(leaveDetail.days)} />
                                    <InfoRow label="开始时间" value={formatDateTime(leaveDetail.startTime)} />
                                    <InfoRow label="结束时间" value={formatDateTime(leaveDetail.endTime)} />
                                    <InfoRow
                                        className="sm:col-span-2"
                                        label="请假事由"
                                        value={<TextPanel text={leaveDetail.reason} />}
                                    />
                                    {leaveDetail.attachment && (
                                        <InfoRow
                                            className="sm:col-span-2"
                                            label="附件"
                                            value={
                                                <AttachmentActions
                                                    url={leaveDetail.attachment}
                                                    onPreview={() =>
                                                        setPreviewFile({
                                                            url: resolveAttachmentUrl(leaveDetail.attachment!),
                                                            name: leaveDetail.reason?.slice(0, 20) || '请假附件',
                                                        })
                                                    }
                                                />
                                            }
                                        />
                                    )}
                                </div>
                            </section>
                        )}

                        {reimburseDetail && (
                            <section className="space-y-3">
                                <h4 className="text-sm font-semibold text-muted-foreground">报销信息</h4>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <InfoRow
                                        label="费用类型"
                                        value={
                                            EXPENSE_TYPE_LABELS[reimburseDetail.expenseType] ||
                                            reimburseDetail.expenseType
                                        }
                                    />
                                    <InfoRow label="报销金额" value={formatCurrency(reimburseDetail.amount)} />
                                    <InfoRow label="发生日期" value={formatDateOnly(reimburseDetail.occurDate)} />
                                    <InfoRow
                                        className="sm:col-span-2"
                                        label="费用说明"
                                        value={<TextPanel text={reimburseDetail.reason} />}
                                    />
                                    {reimburseDetail.invoiceAttachment && (
                                        <InfoRow
                                            className="sm:col-span-2"   
                                            label="发票附件"
                                            value={
                                                <AttachmentActions
                                                    url={reimburseDetail.invoiceAttachment}
                                                    onPreview={() =>
                                                        setPreviewFile({
                                                            url: resolveAttachmentUrl(reimburseDetail.invoiceAttachment!),
                                                            name: '发票附件',
                                                        })
                                                    }
                                                />
                                            }
                                        />
                                    )}
                                </div>
                            </section>
                        )}

                        <section className="space-y-3">
                            <h4 className="text-sm font-semibold text-muted-foreground">审批流转</h4>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>节点</TableHead>
                                            <TableHead>审批人</TableHead>
                                            <TableHead>动作</TableHead>
                                            <TableHead>时间</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {historyRecords.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center text-muted-foreground">
                                                    暂无审批记录
                                                </TableCell>
                                            </TableRow>
                                        )}

                                        {historyRecords.map((record) => (
                                            <TableRow key={record.historyId}>
                                                <TableCell>{record.nodeName || '-'}</TableCell>
                                                <TableCell>{record.approverName || '-'}</TableCell>
                                                <TableCell>
                                                    {record.action
                                                        ? APPROVAL_ACTION_LABELS[record.action] || record.action
                                                        : '-'}
                                                </TableCell>
                                                <TableCell>{formatDateTime(record.approveTime)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            {historyRecords.length > 0 && (
                                <div className="space-y-3">
                                    <h5 className="text-xs uppercase tracking-wide text-muted-foreground">审批意见</h5>
                                    <div className="space-y-3">
                                        {historyRecords.map((record) => (
                                            <div key={`${record.historyId}-comment`} className="space-y-1">
                                                <div className="text-xs text-muted-foreground">
                                                    {record.approverName || '系统'} · {formatDateTime(record.approveTime)}
                                                </div>
                                                <TextPanel text={record.comment} placeholder="暂无审批意见" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </DialogContent>
            <AttachmentPreviewDialog file={previewFile} onClose={() => setPreviewFile(null)} />
        </Dialog>
    )
}

function InfoRow({ label, value, className }: { label: string; value?: ReactNode; className?: string }) {
    return (
        <div className={cn('text-sm', className)}>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
            <div className="mt-1 text-sm font-medium leading-6">{value ?? '-'}</div>
        </div>
    )
}

function TextPanel({ text, placeholder }: { text?: string; placeholder?: string }) {
    return (
        <div className="rounded-xl border border-[#d7dce5] bg-white px-3 py-2 text-sm text-muted-foreground shadow-[0_1px_2px_rgba(15,23,42,0.08)] min-h-[96px] whitespace-pre-line">
            {text?.trim() ? text : placeholder || '暂无说明'}
        </div>
    )
}

function AttachmentActions({ url, onPreview }: { url: string; onPreview?: () => void }) {
    const resolvedUrl = resolveAttachmentUrl(url)
    if (!resolvedUrl) return null
    const previewable = canPreviewInline(resolvedUrl)
    return (
        <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" asChild>
                <a href={resolvedUrl} target="_blank" rel="noreferrer">
                    链接打开
                </a>
            </Button>
            {previewable && onPreview && (
                <Button type="button" variant="outline" size="sm" onClick={onPreview}>
                    快速预览
                </Button>
            )}
        </div>
    )
}

function AttachmentPreviewDialog({
    file,
    onClose,
}: {
    file: { url: string; name?: string } | null
    onClose: () => void
}) {
    const open = Boolean(file?.url)
    const url = resolveAttachmentUrl(file?.url)

    return (
        <Dialog open={open} onOpenChange={(next) => {
            if (!next) onClose()
        }}>
            <DialogContent className="max-w-4xl h-[85vh]">
                <DialogHeader>
                    <DialogTitle>{file?.name || extractFileName(url)}</DialogTitle>
                    <DialogDescription>附件预览</DialogDescription>
                </DialogHeader>
                {url && (
                    <div className="h-[70vh] w-full overflow-hidden rounded-xl border bg-muted">
                        {isImageUrl(url) && (
                            <img src={url} alt={file?.name || '附件'} className="mx-auto h-full w-full object-contain" />
                        )}
                        {isPdfUrl(url) && (
                            <iframe
                                src={url}
                                title={file?.name || 'PDF 预览'}
                                className="h-full w-full"
                            />
                        )}
                        {!isImageUrl(url) && !isPdfUrl(url) && (
                            <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-sm text-muted-foreground">
                                <p>当前文件类型暂不支持内嵌预览，请在新标签页中打开。</p>
                                <Button asChild>
                                    <a href={url} target="_blank" rel="noreferrer">
                                        在新标签打开
                                    </a>
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

function isLeaveDetail(
    detail?: LeaveApplicationDetail | ReimburseApplicationDetail | null
): detail is LeaveApplicationDetail {
    return Boolean(detail && (detail as LeaveApplicationDetail).leaveType !== undefined)
}

function isReimburseDetail(
    detail?: LeaveApplicationDetail | ReimburseApplicationDetail | null
): detail is ReimburseApplicationDetail {
    return Boolean(detail && (detail as ReimburseApplicationDetail).expenseType !== undefined)
}

const formatDateTime = (value?: string) => (value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-')
const formatDateOnly = (value?: string) => (value ? dayjs(value).format('YYYY-MM-DD') : '-')

const formatNumber = (value?: number | string) => {
    if (value === null || value === undefined) {
        return '-'
    }
    const parsed = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(parsed) ? `${parsed}` : String(value)
}

const formatCurrency = (value?: number | string) => {
    if (value === null || value === undefined) {
        return '-'
    }
    const parsed = typeof value === 'number' ? value : Number(value)
    if (Number.isFinite(parsed)) {
        return `¥${parsed.toFixed(2)}`
    }
    return String(value)
}

function resolveAttachmentUrl(raw?: string) {
    if (!raw) return ''
    const trimmed = raw.trim()
    if (!trimmed) return ''
    if (/^https?:\/\//i.test(trimmed)) {
        return trimmed
    }

    const appBase = (import.meta.env.VITE_APP_BASE_API || '/api').trim() || '/api'
    const normalizedBase = /^https?:\/\//i.test(appBase)
        ? appBase.replace(/\/$/, '')
        : appBase.startsWith('/')
            ? appBase.replace(/\/$/, '')
            : `/${appBase}`.replace(/\/$/, '')

    const sanitized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`

    if (sanitized.startsWith('/api/')) {
        return sanitized
    }

    let path = sanitized
    if (sanitized.startsWith('/upload/')) {
        path = sanitized
    } else if (sanitized.startsWith('/file/upload')) {
        path = sanitized.replace('/file', '')
    } else {
        const withoutUploadPrefix = sanitized.replace(/^\/upload\//, '')
        path = `/upload/${withoutUploadPrefix.replace(/^\//, '')}`
    }

    if (/^https?:\/\//i.test(normalizedBase)) {
        return `${normalizedBase}${path}`
    }

    // normalizedBase 是诸如 /api 这样的相对路径
    return `${normalizedBase}${path}`
}

const IMAGE_EXT = /(\.png|\.jpe?g|\.gif|\.bmp|\.webp|\.svg)$/i
const PDF_EXT = /\.pdf$/i

const isImageUrl = (url?: string) => {
    if (!url) return false
    const cleanUrl = url.split('?')[0]
    return IMAGE_EXT.test(cleanUrl)
}

const isPdfUrl = (url?: string) => {
    if (!url) return false
    const cleanUrl = url.split('?')[0]
    return PDF_EXT.test(cleanUrl)
}

const canPreviewInline = (url?: string) => isImageUrl(url) || isPdfUrl(url)

const extractFileName = (url?: string) => {
    if (!url) return '附件'
    const cleanUrl = url.split('?')[0]
    const parts = cleanUrl.split('/')
    return parts[parts.length - 1] || '附件'
}

const getDisplayTitle = (
    appType?: string,
    leaveDetail?: LeaveApplicationDetail | null,
    reimburseDetail?: ReimburseApplicationDetail | null,
    fallback?: string
) => {
    if (appType === 'leave') {
        if (leaveDetail?.leaveType) {
            return LEAVE_TYPE_LABELS[leaveDetail.leaveType] || '请假'
        }
        return '请假'
    }

    if (appType === 'reimburse') {
        if (reimburseDetail?.expenseType) {
            return EXPENSE_TYPE_LABELS[reimburseDetail.expenseType] || '报销'
        }
        return '报销'
    }

    return fallback || '申请详情'
}
