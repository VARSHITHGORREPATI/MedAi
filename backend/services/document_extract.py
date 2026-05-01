"""
Extract plain text from uploaded documents (PDF, DOCX, TXT) for chat / parsing.
"""

from __future__ import annotations

import io
import logging
import zipfile
from typing import Optional, Tuple

logger = logging.getLogger(__name__)

MAX_EXTRACT_CHARS = 48_000


def _truncate(text: str) -> str:
    text = text.strip()
    if len(text) > MAX_EXTRACT_CHARS:
        return text[:MAX_EXTRACT_CHARS] + "\n\n[…truncated for length…]"
    return text


def _extract_pdf(raw: bytes) -> str:
    from pypdf import PdfReader

    reader = PdfReader(io.BytesIO(raw))
    parts: list[str] = []
    for page in reader.pages:
        t = page.extract_text()
        if t:
            parts.append(t)
    return "\n".join(parts).strip()


def _extract_docx(raw: bytes) -> str:
    import docx

    document = docx.Document(io.BytesIO(raw))
    return "\n".join(p.text for p in document.paragraphs if p.text).strip()


def extract_document_text(
    filename: Optional[str],
    content_type: Optional[str],
    raw: bytes,
) -> Tuple[str, str]:
    """
    Returns (text, warning_message). warning_message is empty when OK.
    """
    if not raw:
        return "", "The file was empty."

    name = (filename or "").lower()
    ctype = (content_type or "").lower()

    try:
        if "text/plain" in ctype or name.endswith(".txt"):
            text = raw.decode("utf-8", errors="replace")
            return _truncate(text), ""

        if "pdf" in ctype or name.endswith(".pdf"):
            text = _extract_pdf(raw)
            if not text:
                return "", "No text could be read from this PDF (it may be scanned images only)."
            return _truncate(text), ""

        if (
            "wordprocessingml" in ctype
            or name.endswith(".docx")
        ):
            # ZIP magic for docx
            if not zipfile.is_zipfile(io.BytesIO(raw)):
                return "", "This does not look like a valid .docx file."
            text = _extract_docx(raw)
            if not text:
                return "", "The Word document had no readable paragraphs."
            return _truncate(text), ""

        if name.endswith(".doc") and "word" in ctype:
            return (
                "",
                "Legacy .doc format is not supported. Please save as .docx or PDF and upload again.",
            )

    except Exception as exc:
        logger.exception("Document extraction failed: %s", exc)
        return "", f"Could not read this file: {exc}"

    return "", f"Unsupported file type ({content_type or 'unknown'}). Use PDF, DOCX, or TXT."
