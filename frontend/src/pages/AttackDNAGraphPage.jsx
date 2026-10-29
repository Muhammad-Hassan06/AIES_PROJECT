import React, { useState, useEffect, useRef } from 'react';
import { 
  Network, Share2, Filter, Search, ShieldAlert, 
  ShieldCheck, Info, ExternalLink, ChevronRight, 
  Layers, CheckCircle2, AlertCircle, RefreshCw, ZoomIn, ZoomOut
} from 'lucide-react';
import { getScamConnectionGraph, getAttackDNACampaigns, getCaseDNA } from '../services/api';

export default function AttackDNAGraphPage({ onSelectCase }) {
  const [graphData, setGraphData] = useState({ nodes: [], edges: [], total_cases: 0 });
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState('ALL');
  const [minConfidence, setMinConfidence] = useState(0.5);
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1.0);

  const svgRef = useRef(null);

  // Fetch graph and campaigns from real backend
  const fetchGraph = async () => {
    setLoading(true);
    setError(null);
    try {
      const [gData, cData] = await Promise.all([
        getScamConnectionGraph(null, minConfidence),
        getAttackDNACampaigns()
      ]);
      setGraphData(gData || { nodes: [], edges: [] });
      setCampaigns(cData?.campaigns || []);
    } catch (err) {
      console.error('Failed to load Attack DNA graph', err);
      setError(err.message || 'Unable to connect to Attack DNA graph API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, [minConfidence]);

  // Node type styles & icons
  const nodeStyles = {
    case: { fill: '#0f766e', stroke: '#115e59', label: 'Investigated Case', radius: 24, textColor: '#ffffff' },
    url: { fill: '#ef4444', stroke: '#b91c1c', label: 'Shared Phishing URL', radius: 18, textColor: '#ffffff' },
    domain: { fill: '#f97316', stroke: '#c2410c', label: 'Registered Domain', radius: 18, textColor: '#ffffff' },
    sender: { fill: '#8b5cf6', stroke: '#6d28d9', label: 'Sender Identity / Phone', radius: 18, textColor: '#ffffff' },
    brand: { fill: '#3b82f6', stroke: '#1d4ed8', label: 'Impersonated Brand', radius: 16, textColor: '#ffffff' },
    lure: { fill: '#eab308', stroke: '#a16207', label: 'Social Engineering Lure', radius: 16, textColor: '#1e293b' }
  };

  // Filtered nodes
  const filteredNodes = (graphData.nodes || []).filter(node => {
    if (filterType !== 'ALL' && node.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchLabel = (node.label || '').toLowerCase().includes(q);
      const matchTitle = (node.title || '').toLowerCase().includes(q);
      if (!matchLabel && !matchTitle) return false;
    }
    return true;
  });

  const nodeMap = new Map();
  filteredNodes.forEach((n, idx) => {
    // Generate deterministic coordinate layout
    // Cases placed along an inner orbit, indicators in an outer orbit
    const total = filteredNodes.length;
    const isCase = n.type === 'case';
    const radius = isCase ? 220 : 380;
    const angle = (idx / Math.max(1, total)) * 2 * Math.PI;
    const cx = 500 + radius * Math.cos(angle);
    const cy = 450 + radius * Math.sin(angle);
    nodeMap.set(n.id, { ...n, cx, cy });
  });

  // Filtered edges
  const filteredEdges = (graphData.edges || []).filter(edge => {
    return nodeMap.has(edge.source) && nodeMap.has(edge.target);
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-800 border border-teal-100">
              <Network className="w-6 h-6 text-teal-700" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Attack DNA — Scam Connection Graph
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Multi-case relationship network. Maps explicit shared indicators, exact matches, and fuzzy similarities across investigated artifacts.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={fetchGraph}
              disabled={loading}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-700' : ''}`} />
              <span>Refresh Graph</span>
            </button>
          </div>
        </div>

        {/* Legend & Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-4 border-t border-stone-100 text-xs items-center">
          
          {/* Search Box */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search indicators, cases, domains..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-stone-200 text-xs bg-stone-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-700"
            />
          </div>

          {/* Node Type Selector */}
          <div className="md:col-span-4 flex items-center space-x-2">
            <span className="text-slate-500 shrink-0 font-medium">Type:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-xs text-slate-700 font-medium cursor-pointer"
            >
              <option value="ALL">All Nodes ({graphData.nodes?.length || 0})</option>
              <option value="case">Cases Only</option>
              <option value="domain">Shared Domains</option>
              <option value="url">Shared URLs</option>
              <option value="sender">Senders & Numbers</option>
              <option value="brand">Impersonated Brands</option>
              <option value="lure">Lure Tokens</option>
            </select>
          </div>

          {/* Confidence Slider */}
          <div className="md:col-span-4 flex items-center space-x-2">
            <span className="text-slate-500 shrink-0 font-medium">Min Conf:</span>
            <input
              type="range"
              min="0.3"
              max="1.0"
              step="0.05"
              value={minConfidence}
              onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
              className="w-full accent-teal-700 cursor-pointer"
            />
            <span className="font-mono font-bold text-slate-800 shrink-0">
              {Math.round(minConfidence * 100)}%
            </span>
          </div>
        </div>

        {/* Node & Edge Types Legend */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-stone-100 text-[11px] text-slate-600">
          <span className="font-semibold text-slate-700">Legend:</span>
          {Object.entries(nodeStyles).map(([type, style]) => (
            <div key={type} className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: style.fill }} />
              <span>{style.label}</span>
            </div>
          ))}
          <div className="h-4 w-px bg-stone-300 mx-1" />
          <div className="flex items-center space-x-1.5">
            <span className="w-4 h-0.5 bg-emerald-600" />
            <span>Exact Match Edge (Solid)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-4 h-0.5 border-t border-dashed border-amber-600" />
            <span>Fuzzy Match Edge (Dashed)</span>
          </div>
        </div>
      </div>

      {/* Main Graph Canvas + Detail Drawer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive SVG Graph (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden relative min-h-[580px] flex flex-col">
          
          {/* Zoom controls floating */}
          <div className="absolute top-4 right-4 z-10 flex items-center space-x-1 bg-white/90 backdrop-blur-xs p-1 rounded-xl border border-stone-200 shadow-xs">
            <button
              type="button"
              onClick={() => setZoomLevel(prev => Math.min(2.0, prev + 0.15))}
              className="p-1.5 hover:bg-stone-100 rounded-lg text-slate-600 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-mono px-1 font-bold text-slate-500">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.15))}
              className="p-1.5 hover:bg-stone-100 rounded-lg text-slate-600 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(1.0)}
              className="px-1.5 py-0.5 hover:bg-stone-100 rounded-md text-[10px] text-slate-600 cursor-pointer"
            >
              Reset
            </button>
          </div>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-teal-700" />
              <span className="text-xs font-mono">Synthesizing Attack DNA Graph...</span>
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-red-600 space-y-2">
              <AlertCircle className="w-8 h-8" />
              <span className="text-xs font-bold">{error}</span>
            </div>
          ) : filteredNodes.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 space-y-2">
              <Info className="w-8 h-8" />
              <span className="text-xs">No graph nodes match current filters.</span>
            </div>
          ) : (
            <div className="flex-1 overflow-auto bg-radial from-stone-50 to-stone-100/60 p-4">
              <svg
                ref={svgRef}
                viewBox="0 0 1000 900"
                className="w-full h-full min-h-[540px] select-none"
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center' }}
              >
                <defs>
                  {/* Subtle Grid Pattern */}
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <circle cx="20" cy="20" r="1" fill="#cbd5e1" opacity="0.6" />
                  </pattern>
                </defs>
                <rect width="1000" height="900" fill="url(#grid)" />

                {/* Edges */}
                <g className="edges">
                  {filteredEdges.map((edge, idx) => {
                    const src = nodeMap.get(edge.source);
                    const tgt = nodeMap.get(edge.target);
                    if (!src || !tgt) return null;

                    const isSelected = selectedEdge === edge;
                    const strokeColor = edge.match_type === 'EXACT' ? '#059669' : '#d97706';
                    const strokeWidth = isSelected ? 3.5 : (edge.match_type === 'EXACT' ? 2 : 1.5);
                    const strokeDash = edge.match_type === 'FUZZY' ? '5,4' : 'none';

                    return (
                      <g key={idx} onClick={() => { setSelectedEdge(edge); setSelectedNode(null); }} className="cursor-pointer">
                        <line
                          x1={src.cx}
                          y1={src.cy}
                          x2={tgt.cx}
                          y2={tgt.cy}
                          stroke={strokeColor}
                          strokeWidth={strokeWidth}
                          strokeDasharray={strokeDash}
                          strokeOpacity={isSelected ? 1.0 : 0.65}
                          className="hover:stroke-teal-900 transition-colors"
                        />
                      </g>
                    );
                  })}
                </g>

                {/* Nodes */}
                <g className="nodes">
                  {filteredNodes.map((n) => {
                    const coords = nodeMap.get(n.id);
                    if (!coords) return null;
                    const style = nodeStyles[n.type] || nodeStyles.domain;
                    const isSelected = selectedNode?.id === n.id;

                    return (
                      <g
                        key={n.id}
                        transform={`translate(${coords.cx}, ${coords.cy})`}
                        onClick={() => { setSelectedNode(n); setSelectedEdge(null); }}
                        className="cursor-pointer group"
                      >
                        {/* Outer Glow on selection */}
                        {isSelected && (
                          <circle
                            r={style.radius + 8}
                            fill="none"
                            stroke="#0f766e"
                            strokeWidth="3"
                            strokeDasharray="4,2"
                            className="animate-spin-slow"
                          />
                        )}

                        {/* Node Circle */}
                        <circle
                          r={style.radius}
                          fill={style.fill}
                          stroke={isSelected ? '#ffffff' : style.stroke}
                          strokeWidth={isSelected ? 3 : 1.5}
                          className="transition-transform group-hover:scale-110 shadow-md"
                        />

                        {/* Node Icon/Letter */}
                        <text
                          textAnchor="middle"
                          dy="0.35em"
                          fill={style.textColor}
                          fontSize={n.type === 'case' ? '10px' : '9px'}
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {n.type === 'case' ? 'CASE' : (n.label || '').slice(0, 3).toUpperCase()}
                        </text>

                        {/* Node Label Below */}
                        <text
                          textAnchor="middle"
                          y={style.radius + 14}
                          fontSize="10px"
                          fontFamily="sans-serif"
                          fontWeight={isSelected ? 'bold' : 'normal'}
                          fill="#1e293b"
                          className="pointer-events-none drop-shadow-xs"
                        >
                          {(n.label || '').length > 20 ? (n.label || '').slice(0, 18) + '...' : n.label}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </svg>
            </div>
          )}

          {/* Footer stats bar */}
          <div className="p-3 bg-stone-50 border-t border-stone-200 text-[11px] text-slate-500 flex items-center justify-between font-mono">
            <span>Graph Nodes: {filteredNodes.length}</span>
            <span>Verified Edges: {filteredEdges.length}</span>
            <span>Campaigns Active: {campaigns.length}</span>
          </div>
        </div>

        {/* Right Column: Node & Campaign Inspector Drawer (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Active Campaign Clusters Card */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-900">
                Verified Scam Campaigns ({campaigns.length})
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-500">
                Strict Sufficiency Gate
              </span>
            </div>

            {campaigns.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs">
                {campaigns.map((camp) => (
                  <div
                    key={camp.campaign_id}
                    className="p-2.5 rounded-xl border border-stone-200 bg-stone-50/70 space-y-1 hover:bg-stone-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 font-mono text-[11px]">
                        {camp.campaign_id}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                        {camp.case_count} Cases
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      <strong>Dominant Brand:</strong> {camp.dominant_brand}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate" title={camp.shared_domains?.join(', ')}>
                      <strong>Shared Domains:</strong> {camp.shared_domains?.join(', ') || 'None'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 text-center text-xs text-slate-500 bg-stone-50 rounded-xl">
                No active multi-case campaigns meeting strict evidentiary sufficiency.
              </div>
            )}
          </div>

          {/* Node / Edge Inspector */}
          {selectedNode ? (
            <div className="bg-white rounded-2xl border border-teal-200 shadow-sm p-5 space-y-4 animate-fade-in text-xs">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <span className="font-bold text-sm text-slate-900">
                  Indicator Inspector
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-50 text-teal-800 border border-teal-200 uppercase">
                  {selectedNode.type}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Indicator Label / Value:
                </span>
                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-mono text-slate-900 font-bold break-all">
                  {selectedNode.label}
                </div>
              </div>

              {selectedNode.title && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Details / Title:
                  </span>
                  <p className="text-slate-700 leading-relaxed bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                    {selectedNode.title}
                  </p>
                </div>
              )}

              {selectedNode.type === 'case' && (
                <div className="space-y-2 pt-2 border-t border-stone-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Risk Score:</span>
                    <span className="font-mono font-bold text-red-700 text-sm">
                      {selectedNode.fraud_score}/100
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Input Type:</span>
                    <span className="capitalize text-slate-800 font-semibold">
                      {selectedNode.input_type || 'Unknown'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectCase && onSelectCase({ case_id: selectedNode.label })}
                    className="w-full mt-3 py-2 px-3 rounded-xl bg-teal-900 hover:bg-teal-950 text-white font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
                  >
                    <span>Open Case Investigation</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : selectedEdge ? (
            <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-5 space-y-3 animate-fade-in text-xs">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <span className="font-bold text-sm text-slate-900">
                  Connection Edge
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                  selectedEdge.match_type === 'EXACT' 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  {selectedEdge.match_type} MATCH
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                  Edge Relationship:
                </span>
                <div className="p-2 bg-stone-50 rounded font-mono font-bold text-slate-800">
                  {selectedEdge.edge_type}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                  Evidence Rationale:
                </span>
                <p className="text-slate-700 bg-stone-50 p-2.5 rounded border border-stone-200">
                  {selectedEdge.evidence}
                </p>
              </div>

              <div className="flex items-center justify-between pt-1 font-mono text-[11px]">
                <span className="text-slate-500">Confidence Score:</span>
                <span className="font-bold text-teal-800">
                  {Math.round(selectedEdge.confidence * 100)}%
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 text-center text-xs text-slate-500 space-y-2">
              <Share2 className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="font-bold text-slate-700">Explore Relationships</div>
              <p className="text-[11px] leading-relaxed">
                Click any node (case, domain, URL, brand) or connecting line to inspect the shared indicator evidence ledger.
              </p>
            </div>
          )}

          {/* Scientific Explainer */}
          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-[11px] text-slate-500 space-y-1">
            <span className="font-bold text-slate-700 block">Campaign Attribution Gate:</span>
            <p className="leading-relaxed">
              CyberShield AI avoids hasty clustering. Two cases are never declared part of the same campaign based on generic brands or common keywords alone; explicit shared cryptographic infrastructure, domain overlap, or identical sender patterns are required.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
