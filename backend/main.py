"""Punto de entrada para Vercel (Root Directory = backend/).

Vercel detecta FastAPI cuando encuentra una instancia llamada `app` en un archivo como
main.py en la raíz del proyecto. La aplicación está en app/main.py; aquí solo se reexporta,
sin cambiar nada de su lógica. En local sigue funcionando `uvicorn app.main:app` y también
`uvicorn main:app`.
"""

from app.main import app

__all__ = ["app"]
