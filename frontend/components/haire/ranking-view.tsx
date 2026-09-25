"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Sparkles, Trophy } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ScoreBadge } from "@/components/haire/score-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Candidato } from "@/lib/mock-data"
import { api } from "@/lib/api"

export function RankingView({
  vacanteId,
  cargando: cargandoExterno = false,
  refetchTrigger,
}: {
  vacanteId: string
  cargando?: boolean
  refetchTrigger?: number | string
}) {
  const [candidatos, setCandidatos] = useState<Candidato[]>([])
  const [cargandoDatos, setCargandoDatos] = useState(true)

  useEffect(() => {
    if (!vacanteId) {
      setCandidatos([])
      setCargandoDatos(false)
      return
    }
    setCargandoDatos(true)
    api
      .getCandidatosDeVacante(vacanteId)
      .then(setCandidatos)
      .catch(() => setCandidatos([]))
      .finally(() => setCargandoDatos(false))
  }, [vacanteId, refetchTrigger])

  // La API ya devuelve ordenado por porcentaje desc.
  const recomendado = candidatos.find((c) => c.esRecomendado) ?? candidatos[0]

  if (cargandoExterno || cargandoDatos) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-xl" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (candidatos.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Aún no hay candidatos analizados para esta vacante. Sube algunos CVs
            para empezar.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Recomendación de la IA */}
      {recomendado && (
        <div className="overflow-hidden rounded-xl bg-sidebar p-6 text-sidebar-foreground">
          <div className="flex items-center gap-2 text-brand">
            <Sparkles className="size-4" />
            <span className="text-sm font-semibold uppercase tracking-wide">
              Recomendación de la IA
            </span>
          </div>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="flex items-center gap-2 text-xl font-semibold">
                <Trophy className="size-5 text-brand" />
                {recomendado.nombre}
              </h3>
              <p className="mt-2 max-w-2xl text-pretty text-sm text-sidebar-foreground/75">
                {recomendado.justificacion}
              </p>
            </div>
            <div className="shrink-0 text-center">
              <div className="rounded-xl bg-brand px-5 py-3 text-brand-foreground">
                <p className="text-3xl font-bold tabular-nums">
                  {recomendado.porcentaje}%
                </p>
                <p className="text-xs font-medium">compatibilidad</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de candidatos */}
      <Card>
        <CardContent className="pt-2">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidato</TableHead>
                  <TableHead>Compatibilidad</TableHead>
                  <TableHead>Habilidades detectadas</TableHead>
                  <TableHead className="w-0" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidatos.map((c, i) => {
                  const habilidades = [
                    ...c.requeridas.filter((r) => r.cumple).map((r) => r.nombre),
                    ...c.adicionales,
                  ]
                  const visibles = habilidades.slice(0, 4)
                  const extra = habilidades.length - visibles.length
                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground tabular-nums">
                            {i + 1}
                          </span>
                          <div>
                            <p className="font-medium text-foreground">
                              {c.nombre}
                            </p>
                            {c.esRecomendado && (
                              <span className="text-xs font-medium text-brand">
                                Recomendado
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <ScoreBadge porcentaje={c.porcentaje} />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {visibles.map((h) => (
                            <Badge key={h} variant="outline" className="font-normal">
                              {h}
                            </Badge>
                          ))}
                          {extra > 0 && (
                            <Badge variant="secondary" className="font-normal">
                              +{extra} más
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/candidatos/${c.id}`}
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                          )}
                        >
                          Ver detalle
                        </Link>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
