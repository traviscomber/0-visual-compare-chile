"use client"

import type React from "react"
import { useCallback, useRef, useState } from "react"
import { ImageIcon, Loader2, Upload, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { formatBytes } from "@/lib/format"
import { cn } from "@/lib/utils"
import { validateImageFile } from "@/lib/validations"

type UploadedImage = {
  id: string
  filename: string
  size_bytes: number
  width: number | null
  height: number | null
  url: string
}

export function ImageDropzone({
  label,
  image,
  onChange,
}: {
  label: string
  image: UploadedImage | null
  onChange: (image: UploadedImage | null) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    async (file: File) => {
      const validation = validateImageFile(file)
      if (!validation.ok) {
        toast.error(validation.error)
        return
      }

      setUploading(true)
      try {
        const formData = new FormData()
        formData.append("file", file)
        const res = await fetch("/api/images/upload", {
          method: "POST",
          body: formData,
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? "Error al subir imagen")
        if (json.deduplicated) {
          toast.info("Reutilizamos una imagen identica que ya tenias subida.")
        }
        onChange(json as UploadedImage)
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Error al subir imagen")
      } finally {
        setUploading(false)
      }
    },
    [onChange],
  )

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {image && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="inline-flex items-center gap-1 text-xs text-foreground hover:text-primary"
          >
            <X className="h-3 w-3" />
            Quitar
          </button>
        )}
      </div>

      {image ? (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.url || "/placeholder.svg"}
            alt={image.filename}
            className="aspect-[4/3] w-full object-contain bg-muted"
          />
          <div className="flex items-center justify-between border-t border-border p-3 text-xs">
            <div className="min-w-0 flex flex-col">
              <span className="truncate text-foreground">{image.filename}</span>
              <span className="text-foreground">
                {image.width && image.height ? `${image.width} x ${image.height} px · ` : ""}
                {formatBytes(image.size_bytes)}
              </span>
            </div>
            <ImageIcon className="ml-2 h-4 w-4 shrink-0 text-foreground" />
          </div>
        </div>
      ) : (
        <Button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragActive(true)
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          variant="outline"
          className={cn(
            "aspect-[4/3] h-auto flex-col items-center justify-center gap-3 rounded-lg border-dashed bg-card px-4 py-6 text-center transition-colors hover:bg-secondary/40",
            dragActive && "border-primary bg-primary/5",
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-sm text-foreground">Subiendo imagen...</span>
            </>
          ) : (
            <>
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                <Upload className="h-5 w-5 text-foreground" />
              </span>
              <span className="text-sm text-foreground">Arrastra o selecciona una imagen</span>
              <span className="text-xs text-foreground">JPG, PNG, WebP o TIFF · hasta 50 MB</span>
              <span className="mt-1 inline-flex h-9 cursor-pointer items-center justify-center whitespace-nowrap rounded-md border border-input bg-background px-3 py-1 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
                Elegir archivo
              </span>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/tiff"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
              e.target.value = ""
            }}
          />
        </Button>
      )}
    </div>
  )
}
