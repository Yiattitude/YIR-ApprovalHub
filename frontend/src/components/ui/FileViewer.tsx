import React from 'react'
import { Button } from './button'
import { Download, Eye, FileText, Image as ImageIcon, ExternalLink } from 'lucide-react'
import { Card, CardContent } from './card'

interface FileViewerProps {
  fileName: string
  fileUrl?: string
  fileContent?: string // base64编码的文件内容
  fileType?: string
}

export function FileViewer({ fileName, fileUrl, fileContent }: FileViewerProps) {
  // 支持在线查看的文件类型
  const viewableTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'text/html',
    'text/css',
    'text/javascript',
    'application/json'
  ]

  // 获取文件类型
  const getFileType = (name: string): string => {
    const extension = name.split('.').pop()?.toLowerCase() || ''
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg'
      case 'png':
        return 'image/png'
      case 'gif':
        return 'image/gif'
      case 'webp':
        return 'image/webp'
      case 'pdf':
        return 'application/pdf'
      case 'txt':
        return 'text/plain'
      case 'html':
        return 'text/html'
      case 'css':
        return 'text/css'
      case 'js':
        return 'text/javascript'
      case 'json':
        return 'application/json'
      case 'doc':
        return 'application/msword'
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      case 'xls':
        return 'application/vnd.ms-excel'
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      default:
        return 'application/octet-stream'
    }
  }

  const fileType = getFileType(fileName)
  const isViewable = viewableTypes.includes(fileType)

  // 下载文件
  const handleDownload = () => {
    try {
      if (fileUrl) {
        // 如果有文件URL，直接下载
        window.open(fileUrl, '_blank')
        return
      }

      if (fileContent) {
        // 处理不同类型的文件内容
        if (fileContent.startsWith('data:')) {
          // 如果是完整的data URL，先转换为Blob
          const blob = base64ToBlob(fileContent)
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = fileName
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        } else {
          // 如果只是文件名，提示用户
          alert(`文件名: ${fileName}\n\n由于文件未以Base64格式存储，无法直接下载。请联系管理员获取完整的文件下载链接。`)
        }
      } else {
        // 如果没有文件内容，只有文件名
        alert(`文件名: ${fileName}\n\n由于文件未上传或未以Base64格式存储，无法直接下载。请联系管理员获取完整的文件下载链接。`)
      }
    } catch (error) {
      console.error('文件下载失败:', error)
      alert('文件下载失败，请稍后重试')
    }
  }

  // base64转Blob
  const base64ToBlob = (base64: string): Blob => {
    const parts = base64.split(';base64,')
    const contentType = parts[0].split(':')[1]
    const raw = window.atob(parts[1])
    const rawLength = raw.length
    const uInt8Array = new Uint8Array(rawLength)

    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i)
    }

    return new Blob([uInt8Array], { type: contentType })
  }

  // 获取文件图标
  const getFileIcon = () => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="h-12 w-12 text-gray-400" />
    }
    return <FileText className="h-12 w-12 text-gray-400" />
  }

  // 查看文件
  const handleView = () => {
    try {
      if (fileUrl) {
        window.open(fileUrl, '_blank')
        return
      }

      if (fileContent) {
        // 确保fileContent是有效的base64格式
        if (!fileContent.startsWith('data:')) {
          // 如果不是完整的data URL，尝试根据文件类型创建
          const mimeType = fileType || 'application/octet-stream'
          const fullDataUrl = `data:${mimeType};base64,${fileContent}`
          window.open(fullDataUrl, '_blank')
        } else {
          // 如果是完整的data URL，直接打开
          window.open(fileContent, '_blank')
        }
      }
    } catch (error) {
      console.error('文件查看失败:', error)
      alert('文件查看失败，请尝试下载后查看')
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* 文件图标区域 */}
          <div className="bg-gray-100 p-4 flex items-center justify-center min-w-[120px]">
            {getFileIcon()}
          </div>
          
          {/* 文件信息和操作区域 */}
          <div className="flex-1 p-4 flex flex-col justify-center">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium truncate">{fileName}</p>
              <div className="flex gap-2">
                {isViewable && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleView}
                    className="h-8 px-2"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    查看
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  className="h-8 px-2"
                >
                  <Download className="h-4 w-4 mr-1" />
                  下载
                </Button>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
              <span>{fileType}</span>
              {isViewable && (
                <span className="flex items-center">
                  <Eye className="h-3 w-3 mr-1" />
                  支持在线查看
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 图片预览区域 */}
        {isViewable && fileContent && fileType.startsWith('image/') && (
          <div className="p-4 border-t">
            <img
              src={fileContent}
              alt={fileName}
              className="max-w-full h-auto rounded"
            />
          </div>
        )}

        {/* PDF预览区域 */}
        {isViewable && fileContent && fileType === 'application/pdf' && (
          <div className="p-4 border-t">
            <iframe
              src={fileContent}
              title={fileName}
              className="w-full h-[400px] border rounded"
            />
          </div>
        )}

        {/* 文本文件预览区域 */}
        {isViewable && fileContent && fileType.startsWith('text/') && (
          <div className="p-4 border-t">
            <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded overflow-auto max-h-[400px]">
              {atob(fileContent.split(',')[1])}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
