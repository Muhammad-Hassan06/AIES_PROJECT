const RAW_BASE = import.meta.env.VITE_API_BASE_URL;
const API_BASE = RAW_BASE ? `${RAW_BASE.replace(/\/+$/, '')}/api` : '/api';

export async function createInvestigation(payload) {
  const res = await fetch(`${API_BASE}/investigations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to create investigation');
  }
  return res.json();
}

export async function listInvestigations(limit = 50) {
  const res = await fetch(`${API_BASE}/investigations?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch investigations list');
  return res.json();
}

export async function getInvestigation(caseId) {
  const res = await fetch(`${API_BASE}/investigations/${caseId}`);
  if (!res.ok) throw new Error(`Failed to load case ${caseId}`);
  return res.json();
}

export async function deleteInvestigation(caseId) {
  const res = await fetch(`${API_BASE}/investigations/${caseId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete investigation');
  return res.json();
}

export async function getModelMetrics() {
  const res = await fetch(`${API_BASE}/models/metrics`);
  if (!res.ok) throw new Error('Failed to load model metrics');
  return res.json();
}

export async function getRulesCatalog() {
  const res = await fetch(`${API_BASE}/rules`);
  if (!res.ok) throw new Error('Failed to load expert rules catalog');
  return res.json();
}

export async function getDashboardStats() {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error('Failed to load dashboard stats');
  return res.json();
}

export async function getHealthStatus() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Failed to fetch health status');
  return res.json();
}

export async function analyzeUrlDirect(url) {
  const res = await fetch(`${API_BASE}/analyze/url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error('URL analysis failed');
  return res.json();
}

export async function analyzeMessageDirect(text) {
  const res = await fetch(`${API_BASE}/analyze/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error('Message analysis failed');
  return res.json();
}

// ---------------- Grounded RAG ----------------

export async function queryRAG(query, language = 'en') {
  const res = await fetch(`${API_BASE}/rag/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, language }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Knowledge base query failed');
  }
  return res.json();
}

export async function getRAGCorpus() {
  const res = await fetch(`${API_BASE}/rag/corpus`);
  if (!res.ok) throw new Error('Failed to fetch knowledge base corpus');
  return res.json();
}

export async function getRAGEvaluation() {
  const res = await fetch(`${API_BASE}/rag/evaluation`);
  if (!res.ok) throw new Error('Failed to run RAG evaluation benchmark');
  return res.json();
}

// ---------------- Investigator Agent ----------------

export async function runAgentInvestigation(goal, caseData = null, caseId = null) {
  const res = await fetch(`${API_BASE}/agent/investigate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goal, case_data: caseData, case_id: caseId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Investigator Agent execution failed');
  }
  return res.json();
}

export async function chatAgentCase(caseContext, question) {
  const res = await fetch(`${API_BASE}/agent/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ case_context: caseContext, question }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Case follow-up chat failed');
  }
  return res.json();
}

// ---------------- Threat Trends & Batch Scan ----------------

export async function getThreatTrends(days = 30) {
  const res = await fetch(`${API_BASE}/stats/trends?days=${days}`);
  if (!res.ok) throw new Error('Failed to fetch threat trends');
  return res.json();
}

export async function runBatchScan(items) {
  const res = await fetch(`${API_BASE}/batch/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Batch scan failed');
  }
  return res.json();
}
