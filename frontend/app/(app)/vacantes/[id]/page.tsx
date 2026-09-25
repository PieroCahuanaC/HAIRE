"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Upload, Trophy, Briefcase } from "lucide-react"

import { PageHeader } from "@/components/haire/page-header"
import { CvUploader } from "@/components/haire/cv-uploader"
import { RankingView } from "@/components/haire/ranking-view"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatearFecha, type Vacante } from "@/lib/mock-data"
import { api, ApiError } from "@/lib/api"

type Tab = "ranking" | "cargar"

export default function VacanteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [vacante, setVacante] = useState<Vacante | null>(null)
  const [tab, setTab] = useState<Tab>("ranking")
  const [cargando, setCargando] = useState(true)
  const [noExiste, setNoExiste] = useState(false)
  const [refetchTrigger, setRefetchTrigger] = useState(0)

  useEffect(() => {
    api
      .getVacante(id)
      .then(setVacante)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setNoExiste(true)
      })
      .finally(() => setCargando(false))
  }, [id])

  if (noExiste) notFound()
  if (!vacante) return null

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/vacantes"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Vacantes
      </Link>

      <PageHeader title={vacante.titulo}>
        <Badge
          variant={vacante.estado === "activa" ? "default" : "secondary"}
          className={
            vacante.estado === "activa" ? "bg-success/15 text-success" : ""
          }
        >
          {vacante.estado === "activa" ? "Activa" : "Cerrada"}
        </Badge>
      </PageHeader>

      {/* Info de la vacante */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="size-4 text-muted-foreground" />
            Requisitos del puesto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {vacante.descripcion && (
            <p className="text-sm text-muted-foreground">
              {vacante.descripcion}
            </p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {vacante.requerimientos.map((r) => (
              <Badge
                key={r.nombre}
                variant={r.obligatoria ? "default" : "outline"}
                className={
                  r.obligatoria ? "bg-primary text-primary-foreground" : ""
                }
              >
                {r.nombre}
                {r.obligatoria && " *"}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Experiencia mínima: </span>
              <span className="font-medium text-foreground">
                {vacante.experienciaMinima} años
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Candidatos: </span>
              <span className="font-medium text-foreground">
                {vacante.candidatos}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Creada: </span>
              <span className="font-medium text-foreground">
                {formatearFecha(vacante.fechaCreacion)}
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            * Habilidad obligatoria
          </p>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 border-b border-border">
        <TabButton
          active={tab === "ranking"}
          onClick={() => setTab("ranking")}
          icon={<Trophy className="size-4" />}
        >
          Ranking de candidatos
        </TabButton>
        <TabButton
          active={tab === "cargar"}
          onClick={() => setTab("cargar")}
          icon={<Upload className="size-4" />}
        >
          Cargar CVs
        </TabButton>
      </div>

      {tab === "ranking" ? (
        <RankingView
          vacanteId={vacante.id}
          cargando={cargando}
          refetchTrigger={refetchTrigger}
        />
      ) : (
        <CvUploader
          vacanteId={vacante.id}
          onCompletado={() => {
            setRefetchTrigger((prev) => prev + 1)
            setTab("ranking")
          }}
        />
      )}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
        active
          ? "border-brand text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {children}
    </button>
  )
}
