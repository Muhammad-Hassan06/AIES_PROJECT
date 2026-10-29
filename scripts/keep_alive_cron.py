#!/usr/bin/env python3
"""
CyberShield AI — Standalone Render Free Tier Keep-Alive Script

Usage:
    python scripts/keep_alive_cron.py https://your-service.onrender.com
    
Or set RENDER_URL in your environment:
    export RENDER_URL="https://your-service.onrender.com"
    python scripts/keep_alive_cron.py --loop --interval 600
"""

import sys
import time
import os
import argparse
import urllib.request
import urllib.error

def ping(base_url: str) -> bool:
    clean_url = base_url.strip().rstrip("/")
    endpoints = [f"{clean_url}/api/health", f"{clean_url}/"]
    
    for endpoint in endpoints:
        try:
            req = urllib.request.Request(
                endpoint,
                headers={"User-Agent": "CyberShield-CronKeepAlive/1.0"}
            )
            with urllib.request.urlopen(req, timeout=25) as resp:
                code = resp.getcode()
                if 200 <= code < 300:
                    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] ✅ Keep-alive success: {endpoint} returned HTTP {code}")
                    return True
        except urllib.error.HTTPError as e:
            print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] ⚠️ HTTP error on {endpoint}: {e.code}")
        except Exception as e:
            print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] ❌ Request failed on {endpoint}: {e}")
            
    return False

def main():
    parser = argparse.ArgumentParser(description="CyberShield AI Render Free Tier Keep-Alive Ping")
    parser.add_argument("url", nargs="?", default=os.getenv("RENDER_URL", ""), help="Base URL of Render service")
    parser.add_argument("--loop", action="store_true", help="Run indefinitely in a loop")
    parser.add_argument("--interval", type=int, default=600, help="Loop interval in seconds (default: 600s / 10min)")
    args = parser.parse_args()

    if not args.url:
        print("Error: No URL provided. Pass the URL as an argument or set RENDER_URL environment variable.")
        print("Example: python scripts/keep_alive_cron.py https://my-service.onrender.com")
        sys.exit(1)

    if args.loop:
        print(f"🔄 Starting keep-alive daemon for {args.url} (every {args.interval}s)...")
        while True:
            ping(args.url)
            time.sleep(args.interval)
    else:
        success = ping(args.url)
        sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
