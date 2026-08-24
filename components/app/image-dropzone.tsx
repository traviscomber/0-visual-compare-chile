"use client"

import type React from "react"
import { useCallback, useRef, useState } from "react"
import { Loader2, Upload, X } from "lucide-react"
import { toast } from "sonner"
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
        const res = await fetch("/api/images/upload", { method: "POST", body: formData })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json.error ?? "No fue posible subir la imagen.")
        if (json.deduplicated) toast.info("Reutilizamos una imagen idéntica que ya estaba en tu cuenta.")
        onChange(json as UploadedImage)
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "No fue posible subir la imagen.")
      } finally {
        setUploading(false)
      }
    },
    [onChange],
  )

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setDragActive(false)
    const file = event.dataTransfer.files?.[0]
    if (file) void handleFile(file)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex min-h-9 items-center justify-between border-b border-border pb-2">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
        {image ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="inline-flex min-h-9 items-center gap-1 px-2 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-3 w-3" /> Quitar
          </button>
        ) : null}
      </div>

      {image ? (
        <div className="border border-border bg-card/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.url || "/placeholder.svg"} alt={image.filename} className="aspect-[4/3] w-full bg-muted object-contain" />
          <div className="border-t border-border px-3 py-3">
            <p className="truncate text-sm font-medium text-foreground">{image.filename}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {image.width && image.height ? `${image.width} × ${image.height} px · ` : ""}
              {formatBytes(image.size_bytes)}
            </p>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault()
            setDragActive(true)
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={cn(
            "flex aspect-[4/3] w-full flex-col items-center justify-center border border-dashed border-border bg-card/30 px-6 py-8 text-center transition-colors hover:bg-secondary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            dragActive && "border-primary bg-primary/[0.06]",
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin text-primary motion-reduce:animate-none" />
              <span className="mt-3 text-sm font-medium text-foreground">Subiendo imagen…</span>
              <span className="mt-1 text-xs text-muted-foreground">Validando y guardando evidencia</span>
            </>
          ) : (
            <>
              <Upload className="h-5 w-5 text-primary" />
              <span className="mt-3 text-sm font-medium text-foreground">Arrastra o selecciona una imagen</span>
              <span className="mt-1 text-xs leading-5 text-muted-foreground">JPG, PNG, WebP o TIFF · hasta 50 MB</span>
              <span className="mt-4 inline-flex min-h-10 items-center border border-border px-3 text-xs font-medium text-foreground">Elegir archivo</span>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/tiff"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void handleFile(file)
              event.target.value = ""
            }}
          />
        </button>
      )}
    </div>
  )
}
