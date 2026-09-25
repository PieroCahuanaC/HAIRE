"""Extracción y normalización de texto de PDFs (equivalente a PdfPig del backend viejo).

Ver docs/referencia-backend-viejo.md: abrir el PDF en memoria, concatenar el texto
de cada página, y colapsar todo el whitespace para que el LLM lo lea mejor.
"""
from __future__ import annotations

import io
import re

from pypdf import PdfReader

_WHITESPACE = re.compile(r"\s+")


def extraer_texto_de_pdf(pdf_bytes: bytes) -> str:
    """Extrae el texto de un PDF en memoria y normaliza el whitespace."""
    lector = PdfReader(io.BytesIO(pdf_bytes))
    partes: list[str] = []
    for pagina in lector.pages:
        try:
            texto = pagina.extract_text() or ""
            if texto:
                partes.append(texto)
        except Exception:
            continue
    crudo = " ".join(partes)
    return _WHITESPACE.sub(" ", crudo).strip()
