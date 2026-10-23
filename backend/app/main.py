import hashlib
import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

import app.models
from app.api.router import api_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator:
    Base.metadata.create_all(bind=engine)
    yield

logger = logging.getLogger(
    __name__
)

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_request_route(
    request:Request,
    call_next,
):
    authorization = (
        request.headers.get(
            "authorization",
            "",
        )
    )

    token_fingerprint = (
        hashlib.sha256(
            authorization.encode(
                "utf-8"
            )
        ).hexdigest()[:10]
        if authorization
        else "none"
    )

    print(
        "\n========== REQUEST START =========="
    )

    print(
        "METHOD:",
        request.method,
    )

    print(
        "PATH:",
        request.url.path,
    )

    print(
        "RAW PATH:",
        request.scope.get(
            "raw_path"
        ),
    )

    print(
        "HOST:",
        request.headers.get(
            "host"
        ),
    )

    print(
        "ORIGIN:",
        request.headers.get(
            "origin"
        ),
    )

    print(
        "TOKEN:",
        token_fingerprint,
    )

    response = await call_next(
        request
    )

    route = request.scope.get(
        "route"
    )

    endpoint = (
        request.scope.get(
            "endpoint"
        )
    )

    print(
        "STATUS:",
        response.status_code,
    )

    print(
        "MATCHED ROYUTE:",
        getattr(
            route,
            "path",
            None,
        ),
    )

    print(
        "ENDPOINT:",
        getattr(
            endpoint,
            "__name__",
            None,
        ),
    )

    print(
        "========== REQUEST END ==========\n"
    )

    return response


"""
@app.middleware("http")
async def log_request_route(
    request:Request,
    call_next,
):
    started_at = (
        time.perf_counter()
    )

    authorization = (
        request.headers.get(
            "authorization",
            "",
        )
    )

    token_fingerprint = (
        hashlib.sha256(
            authorization.encode(
                "utf-8"
            )
        )
        .hexdigest()[:10]
        if authorization
        else "none"
    )

    logger.info(
        "REQUEST START "
        "method=%s path=%s token=%s",
        request.method,
        request.url.path,
        token_fingerprint,
    )

    response = await call_next(
        request
    )

    endpoint = (
        request.scope.get(
            "endpoint"
        )
    )

    route = request.scope.get(
        "route"
    )

    endpoint_name = getattr(
        endpoint,
        "__name__",
        None,
    )

    route_path = getattr(
        route,
        "path",
        None,
    )

    elapsed_ms = (
        time.perf_counter()
        - started_at
    ) * 1000

    logger.info(
        (
            "REQUEST END method=%s path=%s "
            "status=%s route=%s endpoint=%s "
            "token=%s elapsed_ms=%.2f"
        ),
        request.method,
        request.url.path,
        response.status_code,
        route_path,
        endpoint_name,
        token_fingerprint,
        elapsed_ms,
    )

    return response
"""

app.include_router(
    api_router,
    prefix=settings.api_v1_prefix,
)


@app.get(
    "/",
    tags=["System"],
)
def root() -> dict[str, str]:
    return {
        "message": f"{settings.app_name} is running",
        "version": settings.app_version,
    }


@app.get(
    "/health",
    tags=["System"],
)
def health_check() -> dict[str, str]:
    return {
        "status": "healthy",
    }
