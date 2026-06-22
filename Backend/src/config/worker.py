"""
Celery Worker Configuration
Handles background tasks: SMS, email, push notifications, report generation.

Start the worker on the server:
    celery -A config.worker worker --loglevel=info --concurrency=4
"""
import logging
import os
import sys

# Ensure src/ is on the path when running the worker directly
_src = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
if _src not in sys.path:
    sys.path.insert(0, _src)

from celery import Celery
from config.settings import settings

logger = logging.getLogger(__name__)


def _redis_reachable(url: str) -> bool:
    """Return True if Redis is accepting connections at *url*."""
    try:
        import redis as _redis
        client = _redis.from_url(url, socket_connect_timeout=2, socket_timeout=2)
        client.ping()
        return True
    except Exception:
        return False


celery_app = Celery(
    "crm_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["tasks.background"],
)

celery_app.conf.update(
    # Serialisation
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    # Timezone
    timezone="Asia/Kolkata",
    enable_utc=True,
    # Reliability
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    # Prevent a single slow task from starving the worker
    task_soft_time_limit=60,    # raises SoftTimeLimitExceeded after 60 s
    task_time_limit=120,        # hard-kills after 120 s
    # Result expiry
    result_expires=3600,
    # Retry policy defaults
    task_max_retries=3,
    task_default_retry_delay=30,
)

# If Redis is not available (e.g. local dev without Redis), run tasks synchronously
# so the app still functions instead of crashing with connection errors.
if not _redis_reachable(settings.CELERY_BROKER_URL):
    logger.warning(
        "Redis not reachable at %s — Celery running in eager (synchronous) mode. "
        "Start Redis to enable background task processing.",
        settings.CELERY_BROKER_URL,
    )
    celery_app.conf.task_always_eager = True
    celery_app.conf.task_eager_propagates = False
