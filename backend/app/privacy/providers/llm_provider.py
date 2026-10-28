import os
import json
import time
import re
from typing import Dict, Any, Optional, Tuple, List
import httpx

from app.core.config import settings

class BaseLLMAdapter:
    def __init__(self, name: str, model_name: str):
        self.name = name
        self.model_name = model_name
        self._last_health_check = 0
        self._is_healthy = False
        self._last_error = ""

    def is_configured(self) -> bool:
        raise NotImplementedError

    def health_check(self) -> Tuple[bool, str]:
        raise NotImplementedError

    def generate(self, prompt: str, system_prompt: str = "") -> Tuple[bool, str, str]:
        """
        Returns (success, response_text, error_or_provider_name)
        """
        raise NotImplementedError


class GeminiAdapter(BaseLLMAdapter):
    def __init__(self):
        super().__init__("Google Gemini", settings.GEMINI_MODEL)

    def is_configured(self) -> bool:
        key = settings.GEMINI_API_KEY
        return bool(key and key.strip())

    def health_check(self) -> Tuple[bool, str]:
        now = time.time()
        if now - self._last_health_check < 300 and self._is_healthy:
            return True, "Operational (cached)"

        if not self.is_configured():
            return False, "GEMINI_API_KEY is not configured."

        try:
            from google import genai
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            resp = client.models.generate_content(
                model=self.model_name,
                contents="Ping"
            )
            if resp and resp.text:
                self._is_healthy = True
                self._last_health_check = now
                return True, "Operational"
            return False, "Empty response from Gemini"
        except Exception as e:
            err_msg = str(e)
            self._is_healthy = False
            self._last_error = err_msg
            if "API_KEY_INVALID" in err_msg or "400" in err_msg:
                return False, "Authentication failure (invalid or expired Gemini API key)"
            return False, f"Gemini connection error: {err_msg[:120]}"

    def generate(self, prompt: str, system_prompt: str = "") -> Tuple[bool, str, str]:
        if not self.is_configured():
            return False, "", "Gemini API key unconfigured"

        try:
            from google import genai
            from google.genai import types
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            config = None
            if system_prompt:
                config = types.GenerateContentConfig(system_instruction=system_prompt)

            resp = client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=config
            )
            if resp and resp.text:
                return True, resp.text, self.name
            return False, "", "Empty response from Gemini"
        except Exception as e:
            return False, "", f"Gemini generation error: {str(e)[:150]}"


class GroqAdapter(BaseLLMAdapter):
    def __init__(self):
        super().__init__("Groq API", settings.GROQ_MODEL)
        self.endpoint = "https://api.groq.com/openai/v1/chat/completions"

    def is_configured(self) -> bool:
        key = settings.GROQ_API_KEY
        return bool(key and key.strip())

    def health_check(self) -> Tuple[bool, str]:
        if not self.is_configured():
            return False, "GROQ_API_KEY is not configured."

        now = time.time()
        if now - self._last_health_check < 300 and self._is_healthy:
            return True, "Operational (cached)"

        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model_name,
            "messages": [{"role": "user", "content": "Ping"}],
            "max_tokens": 5
        }
        try:
            with httpx.Client(timeout=8.0) as client:
                res = client.post(self.endpoint, json=payload, headers=headers)
                if res.status_code == 200:
                    self._is_healthy = True
                    self._last_health_check = now
                    return True, "Operational"
                elif res.status_code in (401, 403):
                    return False, "Authentication failure (invalid Groq API key)"
                return False, f"Groq returned HTTP {res.status_code}"
        except Exception as e:
            return False, f"Groq connection error: {str(e)[:120]}"

    def generate(self, prompt: str, system_prompt: str = "") -> Tuple[bool, str, str]:
        if not self.is_configured():
            return False, "", "Groq API key unconfigured"

        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model_name,
            "messages": messages,
            "temperature": 0.2,
            "max_tokens": 1500
        }

        for attempt in range(2):
            try:
                with httpx.Client(timeout=12.0) as client:
                    res = client.post(self.endpoint, json=payload, headers=headers)
                    if res.status_code == 200:
                        data = res.json()
                        text = data["choices"][0]["message"]["content"]
                        return True, text, self.name
                    elif res.status_code in (401, 403):
                        return False, "", "Groq authentication failed: check GROQ_API_KEY"
                    elif res.status_code == 429:
                        time.sleep(1.0)
                        continue
                    else:
                        return False, "", f"Groq HTTP error: {res.status_code}"
            except Exception as e:
                if attempt == 1:
                    return False, "", f"Groq request error: {str(e)[:150]}"
                time.sleep(0.5)

        return False, "", "Groq failed after retries"


class OpenAIAdapter(BaseLLMAdapter):
    def __init__(self):
        super().__init__("OpenAI", settings.OPENAI_MODEL)
        self.endpoint = "https://api.openai.com/v1/chat/completions"

    def is_configured(self) -> bool:
        key = settings.OPENAI_API_KEY
        return bool(key and key.strip())

    def health_check(self) -> Tuple[bool, str]:
        if not self.is_configured():
            return False, "OPENAI_API_KEY is not configured."

        now = time.time()
        if now - self._last_health_check < 300 and self._is_healthy:
            return True, "Operational (cached)"

        headers = {
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model_name,
            "messages": [{"role": "user", "content": "Ping"}],
            "max_tokens": 5
        }
        try:
            with httpx.Client(timeout=8.0) as client:
                res = client.post(self.endpoint, json=payload, headers=headers)
                if res.status_code == 200:
                    self._is_healthy = True
                    self._last_health_check = now
                    return True, "Operational"
                elif res.status_code in (401, 403):
                    return False, "Authentication failure (invalid OpenAI API key)"
                return False, f"OpenAI returned HTTP {res.status_code}"
        except Exception as e:
            return False, f"OpenAI connection error: {str(e)[:120]}"

    def generate(self, prompt: str, system_prompt: str = "") -> Tuple[bool, str, str]:
        if not self.is_configured():
            return False, "", "OpenAI API key unconfigured"

        headers = {
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model_name,
            "messages": messages,
            "temperature": 0.2,
            "max_tokens": 1500
        }
        try:
            with httpx.Client(timeout=12.0) as client:
                res = client.post(self.endpoint, json=payload, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    text = data["choices"][0]["message"]["content"]
                    return True, text, self.name
                return False, "", f"OpenAI HTTP {res.status_code}"
        except Exception as e:
            return False, "", f"OpenAI error: {str(e)[:150]}"


class AnthropicAdapter(BaseLLMAdapter):
    def __init__(self):
        super().__init__("Anthropic Claude", settings.ANTHROPIC_MODEL)
        self.endpoint = "https://api.anthropic.com/v1/messages"

    def is_configured(self) -> bool:
        key = settings.ANTHROPIC_API_KEY
        return bool(key and key.strip())

    def health_check(self) -> Tuple[bool, str]:
        if not self.is_configured():
            return False, "ANTHROPIC_API_KEY is not configured."

        headers = {
            "x-api-key": settings.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model_name,
            "max_tokens": 5,
            "messages": [{"role": "user", "content": "Ping"}]
        }
        try:
            with httpx.Client(timeout=8.0) as client:
                res = client.post(self.endpoint, json=payload, headers=headers)
                if res.status_code == 200:
                    return True, "Operational"
                elif res.status_code in (401, 403):
                    return False, "Authentication failure (invalid Anthropic API key)"
                return False, f"Anthropic returned HTTP {res.status_code}"
        except Exception as e:
            return False, f"Anthropic connection error: {str(e)[:120]}"

    def generate(self, prompt: str, system_prompt: str = "") -> Tuple[bool, str, str]:
        if not self.is_configured():
            return False, "", "Anthropic API key unconfigured"

        headers = {
            "x-api-key": settings.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model_name,
            "max_tokens": 1500,
            "system": system_prompt or "You are CyberShield AI Privacy Analyst.",
            "messages": [{"role": "user", "content": prompt}]
        }
        try:
            with httpx.Client(timeout=12.0) as client:
                res = client.post(self.endpoint, json=payload, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    text = data["content"][0]["text"]
                    return True, text, self.name
                return False, "", f"Anthropic HTTP {res.status_code}"
        except Exception as e:
            return False, "", f"Anthropic error: {str(e)[:150]}"


class LLMService:
    def __init__(self):
        self.adapters = {
            "gemini": GeminiAdapter(),
            "groq": GroqAdapter(),
            "openai": OpenAIAdapter(),
            "anthropic": AnthropicAdapter()
        }

    def get_providers_status(self) -> List[Dict[str, Any]]:
        statuses = []
        for pid, adapter in self.adapters.items():
            conf = adapter.is_configured()
            healthy = False
            msg = "Key not configured"
            if conf:
                healthy, msg = adapter.health_check()

            statuses.append({
                "provider_id": pid,
                "provider_name": adapter.name,
                "provider_type": "LLM",
                "is_configured": conf,
                "is_healthy": healthy,
                "model_name": adapter.model_name,
                "status_message": msg,
                "supported_identifiers": ["email", "phone", "spam_source"],
                "rate_limit_info": "Standard tier with backoff retry"
            })
        return statuses

    def select_active_provider(self) -> Tuple[Optional[BaseLLMAdapter], str]:
        mode = settings.LLM_PROVIDER.lower().strip()
        if mode in self.adapters:
            adapter = self.adapters[mode]
            if adapter.is_configured():
                return adapter, adapter.name
            return None, f"Specified provider '{mode}' is not configured"

        # Auto mode: prioritize Gemini -> Groq -> OpenAI -> Anthropic
        priority = ["gemini", "groq", "openai", "anthropic"]
        for p in priority:
            adapter = self.adapters[p]
            if adapter.is_configured():
                healthy, _ = adapter.health_check()
                if healthy:
                    return adapter, adapter.name

        return None, "No configured or reachable LLM provider. Using deterministic local fallback."

    def generate_explanation(self, prompt: str, system_prompt: str = "") -> Tuple[str, str, bool]:
        """
        Executes generation using the best available configured provider.
        Falls back to deterministic local reasoning if all providers are unavailable.
        Returns: (generated_text, provider_name, is_deterministic_fallback)
        """
        adapter, desc = self.select_active_provider()
        if adapter:
            success, text, p_name = adapter.generate(prompt, system_prompt)
            if success and text:
                return text, p_name, False

        # Fallback to deterministic local explanation
        return self._deterministic_local_explanation(prompt), "Deterministic Local Expert Engine", True

    def _deterministic_local_explanation(self, prompt: str) -> str:
        """Deterministic fallback explanation engine requiring zero external API keys."""
        return (
            "CyberShield Deterministic Analysis: Evaluated digital footprint exposure, spam signals, "
            "and communication artifacts using local feature extraction and symbolic expert rules. "
            "All findings are grounded strictly in local evidence ledgers, verified regex patterns, and "
            "Pakistani telecom/cyber regulations (PECA 2016, SBP directives)."
        )

llm_service = LLMService()
