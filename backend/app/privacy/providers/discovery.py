import os
import time
import re
from typing import List, Dict, Any, Optional, Tuple
import httpx

from app.core.config import settings
from app.privacy.schemas import (
    PrivacyFinding, ExposureCategory, VerificationStatus, PrivacyRiskLevel, RemediationActionType
)
from app.db.database import get_db_connection

class BaseDiscoveryProvider:
    def __init__(self, provider_id: str, provider_name: str, supported_identifiers: List[str]):
        self.provider_id = provider_id
        self.provider_name = provider_name
        self.supported_identifiers = supported_identifiers

    def is_configured(self) -> bool:
        raise NotImplementedError

    def search(self, identifier_type: str, normalized_value: str, metadata: Dict[str, Any]) -> Tuple[List[Dict[str, Any]], bool, str]:
        """
        Executes discovery query.
        Returns: (findings_raw, success, note_or_error)
        """
        raise NotImplementedError


class PublicSearchDiscoveryAdapter(BaseDiscoveryProvider):
    """
    Legitimate public search provider adapter (e.g. Google Custom Search or SerpApi).
    Respects terms of service, queries safe index summaries, and flags results as UNVERIFIED_INDEX.
    """
    def __init__(self):
        super().__init__(
            provider_id="public_web_search",
            provider_name="Public Web Search Provider",
            supported_identifiers=["email", "phone"]
        )

    def is_configured(self) -> bool:
        key = settings.DISCOVERY_SEARCH_API_KEY
        prov = settings.DISCOVERY_SEARCH_PROVIDER
        return bool(prov and key and key.strip())

    def search(self, identifier_type: str, normalized_value: str, metadata: Dict[str, Any]) -> Tuple[List[Dict[str, Any]], bool, str]:
        if not self.is_configured():
            return [], False, "Public Search API unconfigured. Skipping external web index search."

        # Real HTTP search call when configured
        provider = settings.DISCOVERY_SEARCH_PROVIDER.lower().strip()
        key = settings.DISCOVERY_SEARCH_API_KEY.strip()
        results = []

        try:
            if provider == "serpapi":
                url = f"https://serpapi.com/search.json?q=\"{normalized_value}\"&api_key={key}"
                with httpx.Client(timeout=10.0) as client:
                    res = client.get(url)
                    if res.status_code == 200:
                        data = res.json()
                        for item in data.get("organic_results", [])[:5]:
                            results.append({
                                "source_name": item.get("title", "Public Web Page"),
                                "source_url": item.get("link", ""),
                                "snippet": item.get("snippet", ""),
                                "source_type": "PUBLIC_WEB",
                                "category": ExposureCategory.SEARCH_INDEX
                            })
                        return results, True, f"Found {len(results)} search index mentions."
                    return [], False, f"SerpApi returned HTTP {res.status_code}"
            else:
                return [], False, f"Unsupported search provider: {provider}"
        except Exception as e:
            return [], False, f"Search provider error: {str(e)[:120]}"


class ExposureCheckDiscoveryAdapter(BaseDiscoveryProvider):
    """
    Approved exposure/breach checking provider adapter (e.g. HaveIBeenPwned / BreachDirectory).
    Strictly checks exposure records without storing or probing passwords.
    """
    def __init__(self):
        super().__init__(
            provider_id="exposure_check_api",
            provider_name="Breach & Exposure Notification Provider",
            supported_identifiers=["email"]
        )

    def is_configured(self) -> bool:
        key = settings.EXPOSURE_CHECK_API_KEY
        prov = settings.EXPOSURE_CHECK_PROVIDER
        return bool(prov and key and key.strip())

    def search(self, identifier_type: str, normalized_value: str, metadata: Dict[str, Any]) -> Tuple[List[Dict[str, Any]], bool, str]:
        if identifier_type != "email":
            return [], False, "Exposure check provider only supports email identifiers."

        if not self.is_configured():
            return [], False, "Breach notification provider unconfigured. Skipping external breach check."

        prov = settings.EXPOSURE_CHECK_PROVIDER.lower().strip()
        key = settings.EXPOSURE_CHECK_API_KEY.strip()
        results = []

        try:
            if "hibp" in prov or "pwned" in prov:
                url = f"https://haveibeenpwned.com/api/v3/breachedaccount/{normalized_value}?truncateResponse=false"
                headers = {
                    "hibp-api-key": key,
                    "user-agent": "CyberShield-AI-AIES-Project"
                }
                with httpx.Client(timeout=10.0) as client:
                    res = client.get(url, headers=headers)
                    if res.status_code == 200:
                        breaches = res.json()
                        for b in breaches:
                            results.append({
                                "source_name": b.get("Title", b.get("Name", "Data Breach")),
                                "source_url": f"https://haveibeenpwned.com/PwnedWebsites#{b.get('Name')}",
                                "snippet": f"Breach occurred {b.get('BreachDate', 'Unknown')}. Compromised data: {', '.join(b.get('DataClasses', []))}.",
                                "source_type": "BREACH_REPORTER",
                                "category": ExposureCategory.BREACH_DATABASE,
                                "pwn_count": b.get("PwnCount", 0)
                            })
                        return results, True, f"Found {len(results)} breach database records."
                    elif res.status_code == 404:
                        return [], True, "Zero breach records found in database."
                    return [], False, f"HIBP returned HTTP {res.status_code}"
            else:
                return [], False, f"Unsupported exposure provider: {prov}"
        except Exception as e:
            return [], False, f"Exposure check error: {str(e)[:120]}"


class HoleheRegistrationDiscoveryAdapter(BaseDiscoveryProvider):
    """
    Open-Source Intelligence (OSINT) Account Registration Adapter (Holehe).
    Queries public endpoints of 35+ major online services without attempting password recovery
    or account modification to verify if target email is registered.
    """
    def __init__(self):
        super().__init__(
            provider_id="holehe_registration",
            provider_name="Account Registration Intelligence (Holehe OSINT)",
            supported_identifiers=["email"]
        )

    def is_configured(self) -> bool:
        try:
            import holehe
            return True
        except ImportError:
            return False

    def search(self, identifier_type: str, normalized_value: str, metadata: Dict[str, Any]) -> Tuple[List[Dict[str, Any]], bool, str]:
        if identifier_type != "email":
            return [], False, "Holehe registration checking only supports email identifiers."

        if not self.is_configured():
            return [], False, "Holehe OSINT module is not installed."

        try:
            import trio
            import httpx
            from holehe.core import import_submodules, get_functions, launch_module
        except Exception as e:
            return [], False, f"Holehe dependency load error: {e}"

        class DummyArgs:
            onlyused = True
            nocolor = True
            noclear = True
            nopasswordrecovery = True
            csvoutput = False
            timeout = 3

        TARGET_SITES = {
            'adobe', 'amazon', 'atlassian', 'bitmoji', 'codecademy', 'codepen', 'discord',
            'docker', 'ebay', 'eventbrite', 'evernote', 'firefox', 'flickr', 'freelancer',
            'github', 'google', 'gravatar', 'hubspot', 'imgur', 'instagram', 'lastfm',
            'lastpass', 'nike', 'office365', 'patreon', 'pinterest', 'protonmail', 'quora',
            'replit', 'snapchat', 'soundcloud', 'spotify', 'strava', 'tumblr', 'twitter',
            'venmo', 'wattpad', 'wordpress', 'yahoo', 'zoho'
        }

        results = []
        try:
            modules = import_submodules('holehe.modules')
            args = DummyArgs()
            all_funcs = get_functions(modules, args)
            selected_funcs = [f for f in all_funcs if f.__name__.lower() in TARGET_SITES]

            out = []
            async def _run():
                with trio.move_on_after(6.0):
                    client = httpx.AsyncClient(timeout=2.5)
                    async with trio.open_nursery() as nursery:
                        for func in selected_funcs:
                            nursery.start_soon(launch_module, func, normalized_value, client, out)
                    await client.aclose()

            trio.run(_run)

            for item in out:
                if item.get("exists") is True:
                    raw_name = item.get("name", "Platform")
                    display_title = raw_name.capitalize()
                    if raw_name == "twitter": display_title = "Twitter / X"
                    elif raw_name == "office365": display_title = "Microsoft Office 365"
                    elif raw_name == "lastpass": display_title = "LastPass Password Vault"
                    elif raw_name == "github": display_title = "GitHub"

                    results.append({
                        "source_name": display_title,
                        "source_url": f"https://{raw_name}.com",
                        "snippet": f"Account registration signal detected on {display_title}. Associated email address is verified as registered on this platform.",
                        "source_type": "OSINT_REGISTRATION_CHECK",
                        "category": ExposureCategory.ACCOUNT_REGISTRATION,
                        "raw_service": raw_name
                    })

            return results, True, f"Probed {len(out)} platforms. Identified {len(results)} active account registrations."
        except Exception as e:
            return [], False, f"Holehe registration probe error: {str(e)[:120]}"


from app.privacy.fixtures import get_fixture_by_phone, is_synthetic_number

class LocalVaultDiscoveryAdapter(BaseDiscoveryProvider):
    """
    Local Case Vault Discovery Provider:
    Searches previously logged investigations in the local SQLite vault for prior occurrences
    of the email, phone number, or sender.
    Always available, completely private, offline.
    """
    def __init__(self):
        super().__init__(
            provider_id="local_vault",
            provider_name="Local CyberShield Case Vault",
            supported_identifiers=["email", "phone", "sender"]
        )

    def is_configured(self) -> bool:
        return True

    def search(self, identifier_type: str, normalized_value: str, metadata: Dict[str, Any]) -> Tuple[List[Dict[str, Any]], bool, str]:
        results = []

        # 1. Check Demo / Synthetic Test Fixtures if in Demo Mode
        if settings.DEMO_MODE and identifier_type == "phone":
            fixture = get_fixture_by_phone(normalized_value)
            if fixture:
                results.append({
                    "source_name": f"Synthetic Test Fixture ({fixture['fixture_id']})",
                    "source_url": None,
                    "snippet": f"[DEMO DATA - SYNTHETIC TEST RECORD] Scenario: {fixture['scenario']}. Fictional summary: \"{fixture['message_summary']}\". Illustrative category: {fixture['category']}.",
                    "source_type": "development_fixture",
                    "category": ExposureCategory.SUSPECTED_PHISHING if fixture["severity"] in ("CRITICAL", "HIGH") else ExposureCategory.PROMOTIONAL_SPAM,
                    "is_synthetic": True,
                    "is_verified": False,
                    "fixture_id": fixture["fixture_id"],
                    "case_id": fixture["fixture_id"]
                })
                return results, True, f"Found 1 synthetic test fixture for {fixture['phone_id']} (DEMO MODE active)."

        # 2. Strict query of genuinely logged incident cases in Local Vault
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            clean_digits = "".join(c for c in normalized_value if c.isdigit())
            
            if identifier_type == "phone":
                # Look strictly for cases where this number was the offending sender
                last_digits = clean_digits[-10:] if len(clean_digits) >= 10 else clean_digits
                cursor.execute("""
                    SELECT case_id, timestamp, risk_level, raw_sender, raw_text, summary
                    FROM investigations
                    WHERE raw_sender LIKE ? OR raw_sender LIKE ?
                    LIMIT 20
                """, (f"%{normalized_value}%", f"%{last_digits}%"))
            else:
                needle = f"%{normalized_value}%"
                cursor.execute("""
                    SELECT case_id, timestamp, risk_level, raw_sender, raw_text, summary
                    FROM investigations
                    WHERE raw_sender LIKE ? OR raw_url LIKE ?
                    LIMIT 20
                """, (needle, needle))
                
            rows = cursor.fetchall()
            conn.close()

            for r in rows:
                results.append({
                    "source_name": f"Local Threat Incident Case ({r['case_id']})",
                    "source_url": None,
                    "snippet": f"Identifier registered in prior complaint {r['case_id']} on {r['timestamp']}. Recorded Risk: {r['risk_level']}. Forensic Summary: {r['summary'][:150]}",
                    "source_type": "LOCAL_VAULT",
                    "category": ExposureCategory.SUSPECTED_PHISHING if r["risk_level"] in ("HIGH", "CRITICAL") else ExposureCategory.PUBLIC_DIRECTORY,
                    "case_id": r["case_id"]
                })

            if results:
                return results, True, f"Found {len(results)} prior threat records in local case history."
            else:
                return [], True, "0 results found in the sources checked. No matching records were found in the sources checked. This does not prove that the number has never been exposed or registered elsewhere."
        except Exception as e:
            return [], False, f"Local vault query error: {str(e)[:120]}"


class DiscoveryManager:
    def __init__(self):
        self.providers = [
            LocalVaultDiscoveryAdapter(),
            HoleheRegistrationDiscoveryAdapter(),
            PublicSearchDiscoveryAdapter(),
            ExposureCheckDiscoveryAdapter()
        ]


    def get_providers_status(self) -> List[Dict[str, Any]]:
        statuses = []
        for p in self.providers:
            conf = p.is_configured()
            msg = "Active and available" if conf else "Provider unconfigured (API key missing)"
            statuses.append({
                "provider_id": p.provider_id,
                "provider_name": p.provider_name,
                "provider_type": "DISCOVERY",
                "is_configured": conf,
                "is_healthy": conf,
                "status_message": msg,
                "supported_identifiers": p.supported_identifiers,
                "rate_limit_info": "Complies with provider rate limits"
            })
        return statuses

    def run_discovery_pipeline(
        self,
        identifier_type: str,
        normalized_value: str,
        metadata: Dict[str, Any]
    ) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """
        Executes discovery across all configured providers.
        Honest coverage accounting: tracks checked, unavailable, and skipped.
        """
        all_raw_findings = []
        sources_checked = 0
        sources_unavailable = 0
        notes = []

        is_synth = identifier_type == "phone" and is_synthetic_number(normalized_value)

        for p in self.providers:
            if is_synth and p.provider_id != "local_vault":
                # Fictional test numbers must never be queried with external search or exposure providers
                continue

            if identifier_type not in p.supported_identifiers:
                continue

            if not p.is_configured():
                sources_unavailable += 1
                notes.append(f"{p.provider_name}: Skipped (not configured).")
                continue

            findings, success, note = p.search(identifier_type, normalized_value, metadata)
            if success:
                sources_checked += 1
                all_raw_findings.extend(findings)
                notes.append(f"{p.provider_name}: {note}")
            else:
                sources_unavailable += 1
                notes.append(f"{p.provider_name}: Unavailable ({note}).")

        coverage_level = "Full" if sources_unavailable == 0 and sources_checked > 0 else (
            "Partial" if sources_checked > 0 else "Local-Only"
        )

        coverage_summary = {
            "sources_checked": sources_checked,
            "sources_unavailable": sources_unavailable,
            "coverage_level": coverage_level,
            "provider_notes": notes
        }

        return all_raw_findings, coverage_summary

discovery_manager = DiscoveryManager()
