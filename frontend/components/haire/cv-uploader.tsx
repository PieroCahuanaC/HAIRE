"use client"

import {
  useState,
  useRef,
  useCallback,
  type DragEvent,
  type ChangeEvent,
} from "react"
import {
  UploadCloud,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { api, ApiError } from "@/lib/api"

type EstadoArchivo =
  | "en_cola"
  | "subiendo"
  | "procesando"
  | "completado"
  | "error"

interface ArchivoCV {
  id: string
  nombre: string
  tamanoKb: number
  progreso: number
  estado: EstadoArchivo
  error?: string
  file?: File
}

const MAX_BYTES = 10 * 1024 * 1024 // 10MB

const estadoConfig: Record<
  EstadoArchivo,
  { label: string; className: string; icon: React.ReactNode }
> = {
  en_cola: {
    label: "En cola",
    className: "text-muted-foreground",
    icon: <FileText className="size-4" />,
  },
  subiendo: {
    label: "Subiendo",
    className: "text-brand",
    icon: <Loader2 className="size-4 animate-spin" />,
  },
  procesando: {
    label: "Procesando con IA",
    className: "text-brand",
    icon: <Sparkles className="size-4" />,
  },
  completado: {
    label: "Completado",
    className: "text-success",
    icon: <CheckCircle2 className="size-4" />,
  },
  error: {
    label: "Error",
    className: "text-destructive",
    icon: <AlertCircle className="size-4" />,
  },
}

export function CvUploader({
  vacanteId,
  onCompletado,
}: {
  vacanteId: string
  onCompletado?: () => void
}) {
  const [archivos, setArchivos] = useState<ArchivoCV[]>([])
  const [arrastrando, setArrastrando] = useState(false)
  const [analizando, setAnalizando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const agregarArchivos = useCallback((fileList: FileList) => {
    const nuevos: ArchivoCV[] = []
    Array.from(fileList).forEach((file) => {
      const nombreLower = file.name.toLowerCase()
      const esPdf = file.type === "application/pdf" || nombreLower.endsWith(".pdf")
      const excedeTamano = file.size > MAX_BYTES
      const estaVacio = file.size === 0

      let errorMsg: string | undefined
      if (!esPdf) {
        errorMsg = "Solo se aceptan archivos PDF"
      } else if (excedeTamano) {
        errorMsg = "Supera el máximo de 10MB"
      } else if (estaVacio) {
        errorMsg = "El archivo está vacío (0 KB)"
      }

      nuevos.push({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        nombre: file.name,
        tamanoKb: Math.max(1, Math.round(file.size / 1024)),
        progreso: errorMsg ? 100 : 0,
        estado: errorMsg ? "error" : "en_cola",
        error: errorMsg,
        file: errorMsg ? undefined : file,
      })
    })
    setArchivos((prev) => [...prev, ...nuevos])
  }, [])

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setArrastrando(false)
    if (e.dataTransfer.files?.length) agregarArchivos(e.dataTransfer.files)
  }

  function handleInput(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) agregarArchivos(e.target.files)
    e.target.value = ""
  }

  function eliminar(id: string) {
    setArchivos((prev) => prev.filter((a) => a.id !== id))
  }

  function reintentar(id: string) {
    setArchivos((prev) =>
      prev.map((a) => (a.id === id && a.file ? { ...a, estado: "en_cola", error: undefined, progreso: 0 } : a)),
    )
  }

  function actualizar(id: string, cambios: Partial<ArchivoCV>) {
    setArchivos((prev) => prev.map((a) => (a.id === id ? { ...a, ...cambios } : a)))
  }

  async function procesarArchivo(archivo: ArchivoCV): Promise<boolean> {
    if (!archivo.file || !vacanteId) return false
    try {
      actualizar(archivo.id, { estado: "subiendo", progreso: 45 })
      const { id_curriculum } = await api.uploadCv(vacanteId, archivo.file)

      actualizar(archivo.id, { estado: "procesando", progreso: 85 })
      await api.analizarCv(id_curriculum)

      actualizar(archivo.id, { estado: "completado", progreso: 100 })
      return true
    } catch (err) {
      actualizar(archivo.id, {
        estado: "error",
        progreso: 100,
        error:
          err instanceof ApiError
            ? err.message
            : "Error al procesar el archivo con IA",
      })
      return false
    }
  }

  // Sube y analiza concurrentemente con un pool de 2 trabajadores para alta velocidad
  async function iniciarAnalisis() {
    if (!vacanteId) return
    setAnalizando(true)
    const enCola = archivos.filter((a) => a.estado === "en_cola" && a.file)
    let algunoCompletado = false

    const CONCURRENCIA = 2
    const cola = [...enCola]

    async function trabajador() {
      while (cola.length > 0) {
        const item = cola.shift()
        if (!item) break
        const exito = await procesarArchivo(item)
        if (exito) algunoCompletado = true
      }
    }

    const trabajadores = Array.from({ length: Math.min(CONCURRENCIA, cola.length) }).map(() => trabajador())
    await Promise.all(trabajadores)

    setAnalizando(false)
    if (algunoCompletado) onCompletado?.()
  }

  const hayEnCola = archivos.some((a) => a.estado === "en_cola")

  return (
    <div className="space-y-5">
      {/* Zona drag & drop */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click()
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setArrastrando(true)
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={handleDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          arrastrando
            ? "border-brand bg-brand/5"
            : "border-border bg-muted/30 hover:border-brand/50 hover:bg-muted/50",
        )}
      >
        <div className="flex size-14 items-center justify-center rounded-full bg-brand/10 text-brand">
          <UploadCloud className="size-7" />
        </div>
        <div>
          <p className="font-medium text-foreground">
            Arrastra los CVs aquí o haz clic para seleccionar archivos
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Puedes subir varios PDF a la vez · Máximo 10MB por archivo
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={handleInput}
        />
      </div>

      {/* Lista de archivos */}
      {archivos.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">
              {archivos.length}{" "}
              {archivos.length === 1 ? "archivo" : "archivos"}
            </p>
            <Button
              onClick={iniciarAnalisis}
              disabled={!hayEnCola || analizando}
              className="bg-brand text-brand-foreground hover:bg-brand/90"
            >
              {analizando ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              Iniciar Análisis de IA
            </Button>
          </div>

          <ul className="space-y-2">
            {archivos.map((a) => {
              const cfg = estadoConfig[a.estado]
              return (
                <li
                  key={a.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <FileText className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-foreground">
                        {a.nombre}
                      </p>
                      <span
                        className={cn(
                          "flex shrink-0 items-center gap-1 text-xs font-medium",
                          cfg.className,
                        )}
                      >
                        {cfg.icon}
                        {cfg.label}
                      </span>
                    </div>
                    {a.estado === "error" ? (
                      <div className="mt-1 flex items-center justify-between">
                        <p className="text-xs text-destructive">{a.error}</p>
                        {a.file && (
                          <button
                            onClick={() => reintentar(a.id)}
                            className="text-xs font-medium text-brand hover:underline"
                          >
                            Reintentar
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            a.estado === "completado"
                              ? "bg-success"
                              : "bg-brand",
                          )}
                          style={{
                            width: `${
                              a.estado === "procesando" ||
                              a.estado === "completado"
                                ? 100
                                : a.progreso
                            }%`,
                          }}
                        />
                      </div>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {(a.tamanoKb / 1024).toFixed(1)} MB
                    </p>
                  </div>
                  <button
                    onClick={() => eliminar(a.id)}
                    disabled={a.estado === "subiendo" || a.estado === "procesando"}
                    className="shrink-0 text-muted-foreground hover:text-destructive disabled:opacity-30 disabled:pointer-events-none"
                    aria-label={`Eliminar ${a.nombre}`}
                  >
                    <X className="size-4" />
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
