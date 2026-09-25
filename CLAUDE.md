# Contexto del proyecto — Haire

Este archivo es la fuente de verdad del estado del proyecto para cualquier sesión de
Claude Code. Léelo completo antes de proponer o ejecutar cualquier cambio. Si algo en
el código contradice lo que dice aquí, pregunta antes de asumir cuál es correcto.

---

## Qué es Haire

Plataforma web donde un reclutador crea una vacante con requisitos, sube entre 10 y 30
CVs en PDF de golpe, un LLM (Groq) analiza cada CV y calcula un % de compatibilidad
contra los requisitos de la vacante, y el reclutador ve un ranking de candidatos
ordenado por puntaje con una recomendación destacada del más adecuado y su justificación.

Es un proyecto académico de la Universidad Católica de Santa María (Arequipa, Perú),
curso de Gestión de Proyectos, con Acta de Constitución que define un alcance completo
a 12 semanas. Estamos ejecutando primero una PoC de 48 horas con un alcance recortado
(ver sección "Alcance del MVP de 48h" abajo) antes de continuar con el resto.

---

## A dónde queremos llegar (objetivo inmediato: 48h)

Al final de la PoC de 48h, un evaluador externo debe poder entrar a una URL pública y:

1. Loguearse
2. Crear una vacante (título, habilidades requeridas, años de experiencia mínima)
3. Arrastrar 10-30 CVs en PDF a la vez
4. Ver que cada CV se procesa con IA real (no simulada) y muestra su % de compatibilidad
5. Ver una tabla de candidatos ordenada por puntaje
6. Ver una recomendación destacada del candidato más adecuado, con justificación generada
   por la IA

Todo esto desplegado — frontend y backend con URLs reales, no solo corriendo en local.

---

## Alcance del MVP de 48h — qué entra y qué NO

**Entra:**
- Login básico
- Crear vacante (formulario mínimo: título + habilidades + experiencia)
- Subir 10-30 CVs a la vez (drag & drop, procesados en paralelo controlado)
- Análisis por IA real de cada uno → habilidades detectadas + % de compatibilidad
- Tabla de candidatos ordenada por puntaje
- Recomendación destacada del candidato más adecuado con justificación de la IA
- Deploy real con URL pública

**NO entra en esta fase (es parte del Acta completo, se hace en las 12 semanas después):**
- Transcripción de audio / diarización de entrevistas
- Integración con Microsoft Teams
- Exportar el reporte en PDF
- Sugerencias de dinámicas de entrevista (individual/grupal/técnica)
- Filtros avanzados en la tabla de candidatos
- Dashboard con gráficos agregados de todas las vacantes
- Tests automatizados / CI-CD elaborado

Si en algún momento una tarea que te pido se sale de esta lista de "entra", dímelo — es
señal de que me estoy desviando del alcance de la PoC.

---

## Plan de fases de la PoC de 48h (por bloques de horas)

**Bloque 1 — Horas 0 a 6: Cimientos en paralelo** (los 5 devs trabajan simultáneo, sin pisarse)
- Kevin: repo en GitHub + Supabase creado (proyecto + bucket de Storage) + estructura de carpetas backend/frontend vacías pero corriendo en local
- Piero: tablas mínimas en Supabase — `usuarios`, `vacantes`, `postulantes`, `curriculum`, `evaluaciones` (5 tablas; el resto se agrega si sobra tiempo)
- Gómez: cuenta Groq + prompt de extracción probado a mano (Postman/curl), sin backend todavía — solo validar que el modelo responde bien
- Arenas: scaffold del frontend (Vite+React+Tailwind+shadcn) + pantalla de login copiando el diseño de la mockup
- Dev 5: `.env.example`, Docker compose local, documentación de cómo levantar el proyecto — y apoya a quien se atrase

> Checkpoint hora 6: todos pueden correr el proyecto en su máquina y ven las mismas tablas en Supabase.

**Bloque 2 — Horas 6 a 20: Backend funcional**
- Piero: `POST /auth/login`, `POST /vacantes`, `GET /vacantes`
- Gómez: `POST /cv/upload` (guarda en Storage) + `POST /cv/{id}/analizar` (extrae texto con pypdf + manda a Groq + valida el JSON con Pydantic)
- Dev 5: apoya a Piero/Gómez en lo que se trabe; arma el endpoint de scoring simple (compara habilidades del CV contra requisitos de la vacante)
- Arenas: frontend — pantalla de crear vacante + pantalla de upload de CV (con mocks por ahora)
- Kevin: deploy temprano — backend en Render, frontend en Vercel, aunque esté vacío, para no dejar el deploy para el final

> Checkpoint hora 20: subir un CV por Postman y recibir un JSON con habilidades extraídas, de verdad, contra Groq.

**Bloque 3 — Horas 20 a 34: Conectar todo** (todo el equipo en el mismo flujo, el corazón de la demo)
- Frontend conectado al backend real (no más mocks): login real, crear vacante real, subir CV real
- Pantalla de resultado mostrando el % de compatibilidad y las habilidades detectadas (reusar el diseño de "Análisis de IA del Candidato" de la mockup)
- Lista simple de candidatos por vacante, ordenada por puntaje

> Checkpoint hora 34: flujo completo de principio a fin funcionando en local: login → crear vacante → subir 2 CVs → ver ranking.

**Bloque 4 — Horas 34 a 44: Deploy final + pulido visual**
- Deploy de la versión conectada (no la vacía del bloque 2)
- Revisar que funcione desde otro dispositivo/red, no solo la wifi del equipo
- Ajustes de UI rápidos: que se vea ordenado, sin que tenga que ser perfecto
- Probar con 3-4 CVs reales distintos para asegurar que no se rompe con casos comunes

**Bloque 5 — Horas 44 a 48: Cierre**
- Script de demo: orden exacto de clicks, qué CV usar
- Usuario y vacante de prueba ya precargados en la BD (para no perder tiempo creándolos en vivo)
- Captura/video de respaldo por si la URL falla en el momento

---

>>>>>>> 33aed38fd30f646db7ace28bd874752d26989b55
## Stack tecnológico decidido

- **Backend:** Python 3.11 + FastAPI + SQLAlchemy 2.0 + Pydantic v2. (Decisión ya tomada:
  se descartó continuar con el backend viejo en C#/.NET — ver sección "Historia" abajo)
- **Frontend:** Next.js 16 + React 19 + TailwindCSS 4 + shadcn/ui v4. Ya generado con la
  herramienta v0 de Vercel, con datos mock. Es la base sobre la que se construye todo,
  NO se reemplaza ni se regenera.
- **Base de datos:** Supabase (Postgres + Storage). Las tablas del MVP YA están creadas
  en el proyecto de Supabase real (ver esquema completo abajo).
- **IA:** Groq, modelo `llama-3.3-70b-versatile` (o el vigente al momento del prompt),
  vía su API REST.
- **Deploy:** Frontend en Vercel, backend en Render.

---

## Esquema real de base de datos (ya existe en Supabase)

Tablas activas con RLS habilitado (auth.role() = 'authenticated'):

- `usuarios` (id_usuario, nombres, apellidos, correo, rol, nivel_experiencia, estado,
  fecha_registro)
- `habilidades` (id_habilidad, nombre, categoria_tecnica) — catálogo maestro, lectura pública
- `vacantes` (id_vacante, id_usuario, titulo_puesto, descripcion,
  experiencia_minima_anios, estado_activo, fecha_creacion)
- `vacante_requerimientos` (id_requerimiento, id_vacante, id_habilidad, es_obligatoria)
  — tabla puente N:N
- `postulantes` (id_postulante, nombres, apellidos, correo, telefono, fecha_registro)
- `curriculum` (id_curriculum, id_postulante, id_vacante, archivo_pdf_url,
  peso_archivo_kb, texto_plano_extraido, estado_lectura, fecha_carga) — estado_lectura:
  'pendiente' | 'procesado' | 'error_lectura'
- `curriculum_habilidades` (id_curriculum_habilidad, id_curriculum, id_habilidad,
  nivel_detectado) — tabla puente N:N
- `evaluaciones` (id_evaluacion, id_curriculum, id_vacante, porcentaje_compatibilidad,
  es_recomendado, justificacion_ia, estado_aprobacion, fecha_evaluacion) —
  estado_aprobacion: 'pendiente' | 'preseleccionado' | 'descartado'
- `prompt_logs` (id_log, id_evaluacion, tipo_prompt, prompt_enviado, respuesta_cruda,
  modelo_usado, tiempo_respuesta_ms, fecha) — trazabilidad de cada llamada a Groq

Bucket de Storage: `cv` (privado, PDFs, máx 10MB por archivo).

Los tipos TypeScript en `frontend/lib/mock-data.ts` están modelados 1:1 contra este
esquema — cuando se conecte el frontend a datos reales, los nombres de campos deben
coincidir sin necesidad de mapeo.

---

## Estado actual del repo (actualízalo tú mismo si detectas cambios)

> Última verificación: 1 de julio 2026, tras una sesión de limpieza en la rama
> `refactor/limpieza-repo`. Si encuentras diferencias entre esto y la realidad del
> repo, confía en el repo y avísame de la discrepancia.

- Existía un frontend viejo en `src/` (React + Vite, generado por Lovable) — **debía
  eliminarse** en la limpieza. Verifica si `src/` sigue existiendo; si existe, bórralo.
- Existía un backend en C#/.NET en `backend/` con un endpoint funcional de extracción
  de PDF (PdfPig) y subida a Supabase Storage — **debía eliminarse**, pero su lógica
  debía quedar documentada en `docs/referencia-backend-viejo.md` como referencia para
  reimplementar en Python. Verifica que ese archivo de referencia exista antes de
  asumir que la lógica se perdió.
- El frontend en `frontend/` (Next.js/v0) **se conserva tal cual**, es la base de la UI.
  Tenía estos bugs menores pendientes de arreglo: `ignoreBuildErrors: true` en
  `next.config.mjs`, lockfiles duplicados (npm + pnpm), nombre genérico `"my-project"`
  en `package.json`. Verifica si ya se corrigieron.
- El `backend/` en Python/FastAPI **todavía no se ha construido** — es el siguiente
  bloque de trabajo pendiente.
- Las keys de Supabase estaban hardcodeadas en `appsettings.json` del backend viejo —
  al eliminar esa carpeta el problema debería desaparecer, pero confirma que no quedó
  ninguna key expuesta en otro archivo del repo.

**Antes de proponer cualquier plan, corre estas verificaciones y repórtame el estado
real:**
```
git status
git log --oneline -10
git branch --show-current
ls -la
```

---

## Lo que falta construir (en orden de prioridad)

1. **Backend FastAPI desde cero** — no existe todavía. Necesita:
   - Endpoint de auth (login con JWT)
   - Endpoint de vacantes (crear, listar)
   - Endpoint de upload de CV (recibe PDF, extrae texto con `pypdf`, sube a Supabase
     Storage) — reimplementando la lógica documentada en
     `docs/referencia-backend-viejo.md`
   - Endpoint de análisis (envía texto + requisitos a Groq, valida el JSON de respuesta
     con Pydantic, guarda en `evaluaciones` y `curriculum_habilidades`)
   - Endpoint de recomendación final (compara todas las evaluaciones de una vacante,
     pide a Groq que elija la mejor y genere justificación)
   - Manejo de concurrencia controlada para procesar 10-30 CVs en paralelo sin chocar
     con rate limits de Groq (asyncio con semáforo, no todos a la vez)

2. **Conectar el frontend a datos reales** — reemplazar `frontend/lib/mock-data.ts`
   por llamadas reales al backend y/o directas a Supabase, sin cambiar la forma de los
   tipos (ya coinciden con el esquema).

3. **Autenticación real** — el login actual es un `setTimeout` simulado con credenciales
   hardcodeadas (`rodrigo@haire.com` / `haire2026`). Reemplazar por JWT real contra el
   backend, y agregar protección de rutas (hoy cualquiera navega a `/dashboard` sin
   loguearse).

4. **Deploy** — frontend a Vercel, backend a Render, variables de entorno de producción
   configuradas.

---

## Reglas de trabajo

- No inventes tablas, campos, o endpoints que no estén descritos aquí sin avisarme
  primero.
- No regeneres ni reescribas el frontend de `frontend/` desde cero — se modifica
  incrementalmente sobre lo que ya existe.
- Cualquier credencial (Supabase, Groq) va en `.env`, nunca hardcodeada en el código.
- Si vas a borrar o mover archivos, confirma primero en qué rama de git estás.
- Si algo en el código contradice este documento, avísame — puede que el documento
  esté desactualizado y haya que corregirlo, no asumas que el código está mal.
- Al terminar cualquier tarea de varios pasos, dame un resumen final de qué se hizo,
  qué archivos se tocaron, y qué queda pendiente — no asumas que lo recuerdo de la
  sesión anterior.
