// Cliente HTTP del backend Haire. Traduce las respuestas del backend (snake_case)
// a los tipos que ya consume la UI (Vacante, Candidato) para no tocar los componentes.

import { getToken, cerrarSesion } from "@/lib/auth"
import type { Vacante, Candidato } from "@/lib/mock-data"
import type { UsuarioSesion } from "@/lib/auth"

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000"

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = true,
): Promise<T> {
  const headers = new Headers(options.headers)
  if (auth) {
    const token = getToken()
    if (token) headers.set("Authorization", `Bearer ${token}`)
  }
  // No fijar Content-Type si es FormData (el navegador pone el boundary)
  const esFormData = options.body instanceof FormData
  if (!esFormData && options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  let resp: Response
  try {
    const signal = options.signal ?? AbortSignal.timeout(60000)
    resp = await fetch(`${BASE_URL}${path}`, { ...options, headers, signal })
  } catch (err: any) {
    if (err?.name === "TimeoutError") {
      throw new ApiError(408, "La solicitud tardó demasiado tiempo en responder.")
    }
    throw new ApiError(0, "No se pudo conectar con el servidor. ¿El backend está corriendo?")
  }

  if (resp.status === 401 && auth) {
    cerrarSesion()
  }

  if (!resp.ok) {
    let detalle = `Error ${resp.status}`
    try {
      const j = await resp.json()
      if (j?.detail) detalle = typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail)
    } catch {
      /* respuesta sin JSON */
    }
    throw new ApiError(resp.status, detalle)
  }

  if (resp.status === 204) return undefined as T
  return (await resp.json()) as T
}

// ----------------------------- Mapeos -----------------------------
interface VacanteApi {
  id_vacante: string
  titulo_puesto: string
  descripcion: string | null
  experiencia_minima_anios: number
  estado_activo: boolean
  fecha_creacion: string | null
  requerimientos: { id_habilidad: string; nombre: string; es_obligatoria: boolean }[]
  total_candidatos: number
}

interface CandidatoApi {
  id: string
  id_vacante: string
  id_curriculum: string
  nombre: string
  correo: string | null
  telefono: string | null
  porcentaje: number
  es_recomendado: boolean
  justificacion: string | null
  requeridas: { nombre: string; cumple: boolean; obligatoria: boolean }[]
  adicionales: string[]
}

function mapVacante(v: VacanteApi): Vacante {
  return {
    id: v.id_vacante,
    titulo: v.titulo_puesto,
    descripcion: v.descripcion ?? "",
    experienciaMinima: v.experiencia_minima_anios,
    estado: v.estado_activo ? "activa" : "cerrada",
    fechaCreacion: v.fecha_creacion ?? new Date().toISOString(),
    requerimientos: v.requerimientos.map((r) => ({
      nombre: r.nombre,
      obligatoria: r.es_obligatoria,
    })),
    candidatos: v.total_candidatos,
  }
}

function mapCandidato(c: CandidatoApi): Candidato {
  return {
    id: c.id,
    vacanteId: c.id_vacante,
    nombre: c.nombre,
    correo: c.correo ?? "",
    telefono: c.telefono,
    porcentaje: Math.round(c.porcentaje),
    esRecomendado: c.es_recomendado,
    justificacion: c.justificacion ?? "",
    requeridas: c.requeridas,
    adicionales: c.adicionales,
  }
}

// ----------------------------- API -----------------------------
export const api = {
  async login(correo: string, password: string): Promise<{ token: string; usuario: UsuarioSesion }> {
    const data = await request<{ access_token: string; usuario: UsuarioSesion }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify({ correo, password }) },
      false,
    )
    return { token: data.access_token, usuario: data.usuario }
  },

  async listarVacantes(): Promise<Vacante[]> {
    const data = await request<VacanteApi[]>("/vacantes")
    return data.map(mapVacante)
  },

  async getVacante(id: string): Promise<Vacante> {
    return mapVacante(await request<VacanteApi>(`/vacantes/${id}`))
  },

  async crearVacante(payload: {
    titulo_puesto: string
    descripcion?: string
    experiencia_minima_anios: number
    requerimientos: { nombre: string; es_obligatoria: boolean }[]
  }): Promise<Vacante> {
    return mapVacante(
      await request<VacanteApi>("/vacantes", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    )
  },

  async getCandidatosDeVacante(idVacante: string): Promise<Candidato[]> {
    const data = await request<CandidatoApi[]>(`/vacantes/${idVacante}/candidatos`)
    return data.map(mapCandidato)
  },

  async getCandidato(idEvaluacion: string): Promise<Candidato> {
    return mapCandidato(await request<CandidatoApi>(`/candidatos/${idEvaluacion}`))
  },

  // Sube un PDF y devuelve el id del curriculum creado.
  async uploadCv(idVacante: string, archivo: File): Promise<{ id_curriculum: string }> {
    const form = new FormData()
    form.append("id_vacante", idVacante)
    form.append("archivo", archivo)
    const data = await request<{ curriculum: { id_curriculum: string } }>("/cv/upload", {
      method: "POST",
      body: form,
    })
    return { id_curriculum: data.curriculum.id_curriculum }
  },

  // Analiza un curriculum ya subido (llamada a Groq en el backend).
  async analizarCv(idCurriculum: string): Promise<void> {
    await request(`/cv/${idCurriculum}/analizar`, { method: "POST" })
  },
}
