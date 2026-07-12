from fastapi import FastAPI
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from core.bootstrap import initialize_app_state
from routes.upload_routes import router as upload_router
from routes.prediction_routes import router as prediction_router
from routes.alert_routes import router as alert_router
from routes.patient_routes import router as patient_router
from routes.auth_routes import router as auth_router
@asynccontextmanager
async def lifespan(app: FastAPI):
    await initialize_app_state(app)
    yield


app = FastAPI(title="Sepsis Monitoring API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request, exc):
    """Catch-all for unhandled exceptions so every route avoids boilerplate
    try/except blocks. HTTPExceptions are re-raised by FastAPI before reaching
    this handler, so they are unaffected."""
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
    )


@app.get("/")
def root():
    return {"message": "Patient Monitoring Module"}


@app.get("/health")
def health():
    return {
        "status": "ok",
        "database": "connected" if app.state.database_available else "unavailable",
    }


app.include_router(auth_router)
app.include_router(prediction_router)
app.include_router(upload_router)
app.include_router(alert_router)
app.include_router(patient_router)
