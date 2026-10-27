export function getApiBase() {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('cybershield_api_base_url');
    if (custom && custom.trim()) {
      return `${custom.trim().replace(/\/+$/, '')}/api`;
    }
  }
  const raw = import.meta.env.VITE_API_BASE_URL;
  return raw && raw.trim() ? `${raw.trim().replace(/\/+$/, '')}/api` : '/api';
}

async function request(endpoint, options = {}) {
  const base = getApiBase();
  const url = `${base}${endpoint}`;
  let res;

  try {
    res = await fetch(url, options);
  } catch (netErr) {
    throw new Error(
      `Cannot reach backend server at ${base}. If deploying on Vercel, please set your Render backend URL in Settings or VITE_API_BASE_URL in Vercel environment variables.`
    );
  }

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    throw new Error(
      `Backend not connected: server returned HTML instead of API JSON (404/Rewrite). Please enter your live Render backend URL in the Settings tab.`
    );
  }

  if (!res.ok) {
    if (res.status === 405) {
      throw new Error(
        "Backend not connected (405 Method Not Allowed). Vercel is hosting the frontend without a connected backend. Please go to the Settings tab and enter your Render backend URL."
      );
    }
    if (res.status === 404) {
      throw new Error(
        `API endpoint not found (404) at ${url}. Ensure your backend server is running and configured in Settings.`
      );
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export async function createInvestigation(payload) {
  return request('/investigations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function listInvestigations(limit = 50) {
  return request(`/investigations?limit=${limit}`);
}

export async function getInvestigation(caseId) {
  return request(`/investigations/${caseId}`);
}

export async function deleteInvestigation(caseId) {
  return request(`/investigations/${caseId}`, {
    method: 'DELETE',
  });
}

export async function getModelMetrics() {
  return request('/models/metrics');
}

export async function getRulesCatalog() {
  return request('/rules');
}

export async function getDashboardStats() {
  return request('/stats');
}

export async function getHealthStatus() {
  return request('/health');
}

export async function analyzeUrlDirect(url) {
  return request('/analyze/url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
}

export async function analyzeMessageDirect(text) {
  return request('/analyze/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
}

// ---------------- Grounded RAG ----------------

export async function queryRAG(query, language = 'en') {
  return request('/rag/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, language }),
  });
}

export async function getRAGCorpus() {
  return request('/rag/corpus');
}

export async function getRAGEvaluation() {
  return request('/rag/evaluation');
}

// ---------------- Investigator Agent ----------------

export async function runAgentInvestigation(goal, caseData = null, caseId = null) {
  return request('/agent/investigate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goal, case_data: caseData, case_id: caseId }),
  });
}

export async function chatAgentCase(caseContext, question) {
  return request('/agent/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ case_context: caseContext, question }),
  });
}

// ---------------- Threat Trends & Batch Scan ----------------

export async function getThreatTrends(days = 30) {
  return request(`/stats/trends?days=${days}`);
}

export async function runBatchScan(items) {
  return request('/batch/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
}
