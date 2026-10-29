import asyncio
import os
import pytest
from app.core.keep_alive import RenderKeepAliveManager

@pytest.mark.asyncio
async def test_keep_alive_url_resolution(monkeypatch):
    manager = RenderKeepAliveManager()
    
    # 1. Clean env
    monkeypatch.delenv("KEEP_ALIVE_URL", raising=False)
    monkeypatch.delenv("RENDER_EXTERNAL_URL", raising=False)
    monkeypatch.delenv("RENDER_EXTERNAL_HOSTNAME", raising=False)
    assert manager.get_target_url() is None

    # 2. Render hostname
    monkeypatch.setenv("RENDER_EXTERNAL_HOSTNAME", "cybershield.onrender.com")
    assert manager.get_target_url() == "https://cybershield.onrender.com"

    # 3. Render external URL takes precedence over hostname
    monkeypatch.setenv("RENDER_EXTERNAL_URL", "https://auto-render.onrender.com/")
    assert manager.get_target_url() == "https://auto-render.onrender.com"

    # 4. Explicit KEEP_ALIVE_URL takes highest precedence
    monkeypatch.setenv("KEEP_ALIVE_URL", "https://custom-domain.org/")
    assert manager.get_target_url() == "https://custom-domain.org"

@pytest.mark.asyncio
async def test_keep_alive_start_and_stop_inactive(monkeypatch):
    monkeypatch.delenv("KEEP_ALIVE_URL", raising=False)
    monkeypatch.delenv("RENDER_EXTERNAL_URL", raising=False)
    monkeypatch.delenv("RENDER_EXTERNAL_HOSTNAME", raising=False)

    manager = RenderKeepAliveManager()
    task = manager.start()
    assert task is None
    # Stopping should be safe even if not started
    await manager.stop()

@pytest.mark.asyncio
async def test_keep_alive_start_and_stop_active(monkeypatch):
    monkeypatch.setenv("KEEP_ALIVE_URL", "https://mock-test-url.onrender.com")
    monkeypatch.setenv("KEEP_ALIVE_INITIAL_DELAY_SECONDS", "1")
    monkeypatch.setenv("KEEP_ALIVE_INTERVAL_SECONDS", "1")

    manager = RenderKeepAliveManager()
    task = manager.start()
    assert task is not None
    assert not task.done()

    # Wait briefly and then stop
    await asyncio.sleep(0.05)
    await manager.stop()
    assert task.done()
