import React, { useState, useRef } from 'react'
import { Button } from './button'
import { Label } from './label'
import { Upload, FileText, X, Image } from 'lucide-react'
import { Card, CardContent } from './card'

interface FileUploadProps {
  id?: string
  label?: string
  acceptedTypes?: string
  maxSize?: number // in MB
  value: string
  onChange: (value: string) => void
  required?: boolean
  disabled?: boolean
  useBase64?: boolean // 是否使用base64编码，默认为false
}

export function FileUpload({
  id,
  label,
  acceptedTypes = '.pdf, .doc, .docx, .xls, .xlsx',
  maxSize = 10,
  value,
  onChange,
  required = false,
  disabled = false,
  useBase64 = false,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>('')
  const [error, setError] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // 验证文件类型
    const fileType = selectedFile.type
    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase() || ''
    const acceptedExtensions = acceptedTypes
      .split(',')
      .map(type => type.trim())
      .filter(type => type !== '')

    const isAcceptedType = acceptedExtensions.some(ext => {
      if (ext.startsWith('.')) {
        return `.${fileExtension}` === ext
      }
      if (ext.endsWith('/*')) {
        return fileType.startsWith(ext.slice(0, -2))
      }
      return fileType === ext
    })

    if (!isAcceptedType) {
      setError(`不支持的文件类型。请上传以下类型的文件: ${acceptedTypes}`)
      return
    }

    // 验证文件大小
    if (selectedFile.size > maxSize * 1024 * 1024) {
      setError(`文件大小不能超过 ${maxSize}MB`)
      return
    }

    // 生成预览
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      setPreview(result)
      setFile(selectedFile)
      setError('')
      
      // 根据useBase64参数决定传递什么内容
      if (useBase64) {
        // 只在需要时传递base64编码的内容
        onChange(result)
      } else {
        // 默认只传递文件名，避免数据库插入失败
        onChange(selectedFile.name)
      }
    }
    reader.readAsDataURL(selectedFile)
  }

  // 移除文件
  const handleRemoveFile = () => {
    setFile(null)
    setPreview('')
    setError('')
    onChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 触发文件选择
  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={id} className="flex items-center gap-1">
          {label}
          {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <div className="flex flex-col gap-4">
        <input
          ref={fileInputRef}
          id={id}
          type="file"
          accept={acceptedTypes}
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />
        
        {!file && (
          <Button
            type="button"
            variant="outline"
            onClick={handleButtonClick}
            disabled={disabled}
            className="w-full flex items-center justify-center gap-2"
          >
            <Upload className="h-4 w-4" />
            选择文件
          </Button>
        )}

        {file && (
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col sm:flex-row">
                {/* 预览区域 */}
                <div className="bg-gray-100 p-4 flex items-center justify-center min-w-[120px]">
                  {preview && (
                    <div className="relative w-24 h-24 flex items-center justify-center">
                      {file.type.startsWith('image/') ? (
                        <Image className="h-12 w-12 text-gray-400" />
                      ) : (
                        <FileText className="h-12 w-12 text-gray-400" />
                      )}
                    </div>
                  )}
                </div>
                
                {/* 文件信息 */}
                <div className="flex-1 p-4 flex flex-col justify-center">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {file.type} • {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <p className="text-xs text-gray-500">
          支持格式: {acceptedTypes} | 最大大小: {maxSize}MB
        </p>
      </div>
    </div>
  )
}
