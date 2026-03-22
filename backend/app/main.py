from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.database import create_tables
from app.core.config import settings
from app.api import auth, persons, invitations


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    yield


app = FastAPI(
    title="FamilyTree API",
    description="Family Tree graph application API",
    version="1.0.0",
    lifespan=lifespan,
)

# Allow all origins in development; in production set FRONTEND_URL explicitly
frontend_url = settings.FRONTEND_URL
if frontend_url == "*":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            frontend_url,
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:5173",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(auth.router, prefix="/api")
app.include_router(persons.router, prefix="/api")
app.include_router(invitations.router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok"}
