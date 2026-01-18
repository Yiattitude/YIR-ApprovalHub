import { Button } from '@/components/ui/button'

interface PaginationControlsProps {
    pageNum: number
    pageSize: number
    total: number
    onPageChange: (page: number) => void
}

export default function PaginationControls({ pageNum, pageSize, total, onPageChange }: PaginationControlsProps) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const canPrev = pageNum > 1
    const canNext = pageNum < totalPages

    if (total <= pageSize) {
        return null
    }

    return (
        <div className="flex items-center justify-between py-4">
            <span className="text-sm text-muted-foreground">
                每页 {pageSize} 条，共 {total} 条
            </span>
            <div className="flex items-center gap-3">
                <Button
                    variant="outline"
                    size="sm"
                    disabled={!canPrev}
                    onClick={() => canPrev && onPageChange(pageNum - 1)}
                >
                    上一页
                </Button>
                <span className="text-sm text-muted-foreground">
                    第 {pageNum} / {totalPages} 页
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={!canNext}
                    onClick={() => canNext && onPageChange(pageNum + 1)}
                >
                    下一页
                </Button>
            </div>
        </div>
    )
}
