import asyncio
import logging
import os
import httpx
from typing import Optional

logger = logging.getLogger("cybershield.keep_alive")

class RenderKeepAliveManager:
    """
    Self-ping keep-alive service for Render Free tier deployments.
    Render web services on the free tier spin down after 15 minutes of inactivity.
    By sending an outbound HTTP request to the service's public Render URL every 10-12 minutes,
    Render's edge router registers incoming traffic and resets the 15-minute sleep timer.
    """
    def __init__(self):
        self._task: Optional[asyncio.Task] = None
        # Default 600s (10 min) interval ensures request arrives well before the 15 min idle cutoff
        self._interval: int = int(os.getenv("KEEP_ALIVE_INTERVAL_SECONDS", "600"))
        # Initial delay before the first ping to let uvicorn finish binding
        self._initial_delay: int = int(os.getenv("KEEP_ALIVE_INITIAL_DELAY_SECONDS", "45"))

    def get_target_url(self) -> Optional[str]:
        # 1. Explicit user override
        explicit_url = os.getenv("KEEP_ALIVE_URL")
        if explicit_url:
            return explicit_url.strip().rstrip("/")
        
        # 2. Render automatically injects RENDER_EXTERNAL_URL (e.g. https://my-app.onrender.com)
        render_url = os.getenv("RENDER_EXTERNAL_URL")
        if render_url:
            return render_url.strip().rstrip("/")
            
        # 3. Render hostname fallback (e.g. my-app.onrender.com)
        render_host = os.getenv("RENDER_EXTERNAL_HOSTNAME")
        if render_host:
            return f"https://{render_host.strip()}"
            
        return None

    async def _ping_loop(self, base_url: str):
        target_endpoint = f"{base_url}/api/health"
        fallback_endpoint = f"{base_url}/"
        logger.info(f"[KeepAlive] Started worker targeting {target_endpoint} (interval={self._interval}s)")
        print(f"[CyberShield AI] Render keep-alive worker active targeting: {target_endpoint} (interval={self._interval}s)")

        try:
            await asyncio.sleep(self._initial_delay)
        except asyncio.CancelledError:
            return

        async with httpx.AsyncClient(timeout=20.0) as client:
            while True:
                try:
                    # Attempt primary /api/health endpoint
                    resp = await client.get(
                        target_endpoint,
                        headers={"User-Agent": "CyberShield-Render-KeepAlive/1.0"}
                    )
                    if resp.status_code == 404:
                        # Fallback to root if API prefix is different
                        resp = await client.get(
                            fallback_endpoint,
                            headers={"User-Agent": "CyberShield-Render-KeepAlive/1.0"}
                        )
                    logger.debug(f"[KeepAlive] Heartbeat ping successful: status {resp.status_code}")
                except asyncio.CancelledError:
                    logger.info("[KeepAlive] Keep-alive worker task cancelled.")
                    break
                except Exception as exc:
                    logger.warning(f"[KeepAlive] Heartbeat ping to {target_endpoint} warning: {exc}")

                try:
                    await asyncio.sleep(self._interval)
                except asyncio.CancelledError:
                    break

    def start(self) -> Optional[asyncio.Task]:
        target_url = self.get_target_url()
        if not target_url:
            logger.info("[KeepAlive] Inactive (No KEEP_ALIVE_URL or RENDER_EXTERNAL_URL configured).")
            return None

        self._task = asyncio.create_task(self._ping_loop(target_url))
        return self._task

    async def stop(self):
        if self._task and not self._task.done():
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            logger.info("[KeepAlive] Stopped keep-alive worker.")

# Singleton instance
keep_alive_manager = RenderKeepAliveManager()
