"use client"

import { useState, useRef } from "react"
import { cn } from "@/lib/utils"
import { CloudUpload, CheckCircle, X, FileImage } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"

interface FileUploadProps {
  onFileSelect: (file: File | null) => void
  accept?: string
  maxSize?: number
  className?: string
  id?: string
  label?: string
}

export function FileUpload({
  onFileSelect,
  accept = "image/png,image/jpeg",
  maxSize = 4 * 1024 * 1024,
  className,
  id = "file-upload",
  label,
}: FileUploadProps) {
  const { t } = useLanguage()
  const displayLabel = label || t("upload.chooseFile")
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const validateFile = (selectedFile: File): boolean => {
    const acceptedTypes = accept.split(",").map((t) => t.trim())
    if (!acceptedTypes.includes(selectedFile.type)) {
      setError(t("upload.invalidType"))
      return false
    }
    if (selectedFile.size > maxSize) {
      setError(t("upload.tooLarge"))
      return false
    }
    return true
  }

  const handleFile = (selectedFile: File) => {
    setError(null)
    if (validateFile(selectedFile)) {
      setFile(selectedFile)
      onFileSelect(selectedFile)
    } else {
      setFile(null)
      onFileSelect(null)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFile(selectedFile)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFile(droppedFile)
    }
  }

  const handleRemove = () => {
    setFile(null)
    setError(null)
    onFileSelect(null)
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  return (
    <div className={cn("w-full", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
        id={id}
      />

      {!file ? (
        <label
          htmlFor={id}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all",
            isDragging
              ? "border-accent bg-accent/10"
              : "border-muted hover:border-accent/50 hover:bg-accent/5",
            error && "border-destructive bg-destructive/5"
          )}
        >
          <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center">
            <CloudUpload className="w-7 h-7 text-accent-foreground" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-foreground">{displayLabel}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {t("upload.dragDrop")}
            </p>
          </div>
          <Button type="button" variant="outline" className="mt-2 bg-accent text-accent-foreground border-accent hover:bg-accent/80">
            <CloudUpload className="w-4 h-4 mr-2" />
            {t("upload.chooseFile")}
          </Button>
        </label>
      ) : (
        <div className="flex items-center gap-4 p-4 rounded-2xl border border-green-200 bg-green-50">
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
            <FileImage className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">{file.name}</p>
            <p className="text-sm text-muted-foreground">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <button
              type="button"
              onClick={handleRemove}
              className="p-1 hover:bg-green-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-2">
        {t("upload.limitHint")}
      </p>

      {error && (
        <p className="text-sm text-destructive mt-2 flex items-center gap-1">
          <X className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  )
}
