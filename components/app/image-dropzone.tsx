"use client"

import { useCallback, useRef, useState } from "react"
import { Loader2, Upload, X, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { formatBytes } from "@/lib/format"
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from "@/lib/validations"

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
      if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
        toast.error("Formato no soportado. Usa JPG, PNG, WebP o TIFF.")
        return
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error("La imagen supera el límite de 50 MB.")
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
          toast.info("Reutilizamos una imagen idéntica que ya tenías subida.")
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
            className="text-xs text-foreground hover:text-primary inline-flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            Quitar
          </button>
        )}
      </div>

      {image ? (
        <div className="rounded-lg border border-border overflow-hidden bg-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.url || "/placeholder.svg"}
            alt={image.filename}
            className="w-full aspect-[4/3] object-contain bg-muted"
          />
          <div className="p-3 border-t border-border flex items-center justify-between text-xs">
            <div className="flex flex-col min-w-0">
              <span className="truncate text-foreground">{image.filename}</span>
              <span className="text-foreground">
                {image.width && image.height ? `${image.width} × ${image.height} px · ` : ""}
                {formatBytes(image.size_bytes)}
              </span>
            </div>
            <ImageIcon className="h-4 w-4 text-foreground shrink-0 ml-2" />
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragActive(true)
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={cn(
            "rounded-lg border border-dashed border-border bg-card hover:bg-secondary/40 transition-colors",
            "aspect-[4/3] flex flex-col items-center justify-center gap-3 px-4 text-center",
            dragActive && "border-primary bg-primary/5",
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
              <span className="text-sm text-foreground">Subiendo imagen...</span>
            </>
          ) : (
            <>
              <span className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                <Upload className="h-5 w-5 text-foreground" />
              </span>
              <span className="text-sm text-foreground">Arrastra o selecciona una imagen</span>
              <span className="text-xs text-foreground">
                JPG, PNG, WebP o TIFF · hasta 50 MB
              </span>
              <div
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground px-3 py-1 cursor-pointer mt-1"
              >
                Elegir archivo
              </div>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/tiff"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleFile(f)
              e.target.value = ""
            }}
          />
        </button>
      )}
    </div>
  )
}
