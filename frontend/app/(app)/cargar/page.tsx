"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Trophy, CheckCircle2 } from "lucide-react"

import { PageHeader } from "@/components/haire/page-header"
import { CvUploader } from "@/components/haire/cv-uploader"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { type Vacante } from "@/lib/mock-data"
import { api } from "@/lib/api"

export default function CargarPage() {
  const [activas, setActivas] = useState<Vacante[]>([])
  const [seleccion, setSeleccion] = useState("")
  const [cargaCompletada, setCargaCompletada] = useState(false)

  useEffect(() => {
    api
      .listarVacantes()
      .then((vs) => {
        const activasV = vs.filter((v) => v.estado === "activa")
        setActivas(activasV)
        setSeleccion((prev) => prev || activasV[0]?.id || "")
      })
      .catch(() => setActivas([]))
  }, [])

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Cargar CV"
        description="Sube los currículums de los postulantes a una vacante para que la IA los analice."
      />

      <Card>
        <CardHeader>
          <CardTitle>Vacante de destino</CardTitle>
          <CardDescription>
            Los CVs se asociarán a la vacante seleccionada.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {cargaCompletada && (
            <div className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-600 dark:text-emerald-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-5 shrink-0" />
                <span>¡CVs procesados exitosamente por la IA!</span>
              </div>
              <Button asChild size="sm" className="bg-brand text-brand-foreground hover:bg-brand/90">
                <Link href={`/vacantes/${seleccion}`}>
                  <Trophy className="mr-1.5 size-4" />
                  Ver ranking
                </Link>
              </Button>
            </div>
          )}

          {activas.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
              No tienes vacantes activas. Crea una vacante primero para poder subir CVs.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {activas.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setSeleccion(v.id)
                      setCargaCompletada(false)
                    }}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                      seleccion === v.id
                        ? "border-brand bg-brand/10 text-foreground"
                        : "border-border text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {v.titulo}
                  </button>
                ))}
              </div>

              {seleccion && (
                <CvUploader
                  vacanteId={seleccion}
                  onCompletado={() => setCargaCompletada(true)}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
