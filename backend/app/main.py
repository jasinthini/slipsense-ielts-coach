from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.practice_history import router as practice_history_router
from app.routers.auth import router as auth_router
from app.routers.dashboard import (
    require_writing_access,
    router as dashboard_router,
)
from app.routers.writing import router as writing_router


app = FastAPI(title="Band Buddy API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.get("/")
def health_check():
    return {"message": "Band Buddy API is running"}


app.include_router(auth_router)
app.include_router(dashboard_router)

app.include_router(
    writing_router,
    dependencies=[Depends(require_writing_access)],
)

app.include_router(practice_history_router)