import React, { useState } from 'react';
import { 
  Eye, ShieldAlert, ShieldCheck, Tag, ZoomIn, 
  Layers, AlertTriangle, CheckCircle2, Info, Crosshair
} from 'lucide-react';

export default function VisualForensicsCanvas({ visionResult, imageSource }) {
  const [selectedRegionId, setSelectedRegionId] = useState(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('ALL');
  const [showCoordinates, setShowCoordinates] = useState(false);

  if (!visionResult) return null;

  const regions = visionResult.suspicious_regions || [];
  const layoutType = visionResult.layout_type || 'UNKNOWN_PAGE';
  const visualPhishProb = visionResult.visual_phishing_probability !== undefined 
    ? Math.round(visionResult.visual_phishing_probability * 100) 
    : 0;
  const legitimateLikelihood = visionResult.is_legitimate_likelihood !== undefined
    ? Math.round(visionResult.is_legitimate_likelihood * 100)
    : 100 - visualPhishProb;

  const categoryColors = {
    CREDENTIAL_PROMPT: {
      border: 'border-red-500',
      bg: 'bg-red-500/15',
      badge: 'bg-red-50 text-red-800 border-red-200',
      label: 'Credential Input / Login Prompt'
    },
    IMPERSONATED_BRAND: {
      border: 'border-indigo-500',
      bg: 'bg-indigo-500/15',
      badge: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      label: 'Impersonated Brand Entity'
    },
    COERCIVE_TIMER: {
      border: 'border-amber-500',
      bg: 'bg-amber-500/15',
      badge: 'bg-amber-50 text-amber-800 border-amber-200',
      label: 'Urgent / Coercive Countdown'
    },
    DECEPTIVE_CTA: {
      border: 'border-purple-500',
      bg: 'bg-purple-500/15',
      badge: 'bg-purple-50 text-purple-800 border-purple-200',
      label: 'Deceptive Action Button'
    },
    SUSPICIOUS_DOMAIN_DISPLAY: {
      border: 'border-orange-500',
      bg: 'bg-orange-500/15',
      badge: 'bg-orange-50 text-orange-800 border-orange-200',
      label: 'Suspicious Domain / Host Header'
    }
  };

  const filteredRegions = regions.filter(r => {
    if (activeCategoryFilter === 'ALL') return true;
    return r.category === activeCategoryFilter;
  });

  const selectedRegion = regions.find(r => r.region_id === selectedRegionId);

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 space-y-5" data-testid="visual-forensics-canvas">
      {/* Header bar: Layout classification and Visual Risk Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-100">
            <Crosshair className="w-5 h-5 text-teal-700" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Explainable Visual Phishing Forensics
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-stone-100 text-stone-700 border border-stone-300">
                {layoutType}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Grounded OCR spatial bounding boxes & layout classification. No decorative heatmaps used.
            </p>
          </div>
        </div>

        {/* Dual Probabilities Bar */}
        <div className="flex items-center space-x-4 bg-stone-50 px-3 py-2 rounded-xl border border-stone-200 text-xs">
          <div>
            <div className="text-[10px] text-slate-500 font-mono">Visual Phishing</div>
            <div className={`font-bold font-mono ${visualPhishProb >= 60 ? 'text-red-700' : 'text-slate-700'}`}>
              {visualPhishProb}%
            </div>
          </div>
          <div className="h-6 w-px bg-stone-300" />
          <div>
            <div className="text-[10px] text-slate-500 font-mono">Legitimate Fit</div>
            <div className={`font-bold font-mono ${legitimateLikelihood >= 70 ? 'text-emerald-700' : 'text-slate-700'}`}>
              {legitimateLikelihood}%
            </div>
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-500 mr-1">Filter Regions:</span>
          {['ALL', 'CREDENTIAL_PROMPT', 'IMPERSONATED_BRAND', 'COERCIVE_TIMER', 'DECEPTIVE_CTA'].map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono cursor-pointer transition-colors ${
                activeCategoryFilter === cat
                  ? 'bg-teal-900 text-white font-bold'
                  : 'bg-stone-100 hover:bg-stone-200 text-slate-700'
              }`}
            >
              {cat === 'ALL' ? `All (${regions.length})` : cat.replace('_', ' ')}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowCoordinates(!showCoordinates)}
          className="text-[11px] text-teal-800 hover:text-teal-950 font-semibold underline cursor-pointer"
        >
          {showCoordinates ? 'Hide Bounding Coordinates' : 'Show Normalized Coords'}
        </button>
      </div>

      {/* Main Canvas + Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Interactive Image Viewer with Overlaid Bounding Boxes (7 cols) */}
        <div className="lg:col-span-7 space-y-2">
          <div className="relative rounded-xl border border-stone-300 bg-stone-900 overflow-hidden shadow-inner flex items-center justify-center min-h-[300px]">
            {imageSource ? (
              <img
                src={imageSource}
                alt="Analyzed Screenshot"
                className="w-full h-auto object-contain block max-h-[500px]"
              />
            ) : (
              <div className="w-full aspect-[4/3] bg-stone-900 flex flex-col items-center justify-center p-6 text-stone-400 font-mono text-xs">
                <Layers className="w-8 h-8 text-stone-600 mb-2" />
                <span>Screenshot Canvas Projection</span>
                <span className="text-[10px] text-stone-500 mt-1">
                  Layout: {layoutType} • {regions.length} spatial regions detected
                </span>
              </div>
            )}

            {/* Overlaid Normalized Spatial Bounding Boxes */}
            <div className="absolute inset-0 pointer-events-none">
              {filteredRegions.map((r) => {
                const box = r.bounding_box || r.box || [0, 0, 0, 0];
                const [ymin, xmin, ymax, xmax] = box;
                const topPct = (ymin * 100).toFixed(2);
                const leftPct = (xmin * 100).toFixed(2);
                const widthPct = ((xmax - xmin) * 100).toFixed(2);
                const heightPct = ((ymax - ymin) * 100).toFixed(2);

                const colorCfg = categoryColors[r.category] || {
                  border: 'border-yellow-500',
                  bg: 'bg-yellow-500/15'
                };
                const isSelected = selectedRegionId === r.region_id;
                const displayText = r.extracted_text || r.detected_text || r.label || '';

                return (
                  <div
                    key={r.region_id}
                    onClick={() => setSelectedRegionId(r.region_id)}
                    style={{
                      top: `${topPct}%`,
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                      height: `${heightPct}%`,
                    }}
                    className={`absolute pointer-events-auto border-2 rounded transition-all cursor-pointer ${
                      colorCfg.border
                    } ${colorCfg.bg} ${
                      isSelected
                        ? 'ring-4 ring-teal-400 ring-offset-1 z-20 scale-[1.02]'
                        : 'hover:border-white hover:ring-2 hover:ring-white/80 z-10'
                    }`}
                    title={`${r.category}: ${displayText}`}
                  >
                    <span className="absolute -top-3.5 left-0 px-1 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-900 text-white shadow-xs whitespace-nowrap">
                      {r.region_id}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>Click any highlighted region to inspect grounded forensics</span>
            <span className="font-mono text-[10px]">
              Engine: {visionResult.ocr_engine || 'Native WinRT / Tesseract OCR'}
            </span>
          </div>
        </div>

        {/* Right Column: Region Details Inspector (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {selectedRegion ? (
            <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-3 animate-fade-in text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-900 text-sm">
                  Region: {selectedRegion.region_id}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  categoryColors[selectedRegion.category]?.badge || 'bg-stone-100 text-slate-800'
                }`}>
                  {selectedRegion.category}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                  OCR Text Extracted:
                </span>
                <div className="p-2 rounded bg-white border border-stone-200 font-mono text-slate-800 text-[11px]">
                  "{selectedRegion.extracted_text || selectedRegion.detected_text || selectedRegion.label || '[No readable text]'}"
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                  Grounded Forensic Rationale:
                </span>
                <p className="text-slate-700 leading-relaxed bg-white p-2.5 rounded border border-stone-200">
                  {selectedRegion.grounded_rationale || selectedRegion.evidence_explanation || 'No rationale available.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-white rounded border border-stone-200">
                  <span className="text-slate-500 block text-[10px]">Severity Level</span>
                  <span className={`font-bold font-mono ${
                    selectedRegion.severity === 'CRITICAL' ? 'text-red-700' : 'text-amber-700'
                  }`}>
                    {selectedRegion.severity}
                  </span>
                </div>
                <div className="p-2 bg-white rounded border border-stone-200">
                  <span className="text-slate-500 block text-[10px]">Model Confidence</span>
                  <span className="font-bold font-mono text-slate-800">
                    {Math.round(selectedRegion.confidence * 100)}%
                  </span>
                </div>
              </div>

              {showCoordinates && (
                <div className="p-2 rounded bg-stone-900 text-emerald-400 font-mono text-[10px] space-y-0.5">
                  <div>Normalized Box [ymin, xmin, ymax, xmax]:</div>
                  <div>[{(selectedRegion.bounding_box || selectedRegion.box || [0,0,0,0]).map(n => Number(n).toFixed(3)).join(', ')}]</div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 rounded-xl border border-dashed border-stone-300 bg-stone-50 text-center space-y-2 text-xs text-slate-500">
              <Info className="w-5 h-5 text-slate-400 mx-auto" />
              <div className="font-semibold text-slate-700">No Region Selected</div>
              <p className="text-[11px]">
                Click on any bounding box on the left or select a finding below to inspect technical evidence.
              </p>
            </div>
          )}

          {/* Forensic Summary Card */}
          <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/60 text-xs space-y-1">
            <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
              Forensic Layout Analysis:
            </span>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              {visionResult.forensics_summary || 'Layout analysis complete.'}
            </p>
          </div>
        </div>
      </div>

      {/* Verbatim OCR Extracted Text Inspection */}
      {visionResult.extracted_text && (
        <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
              Verbatim OCR-Extracted Screenshot Text:
            </span>
            <span className="font-mono text-[10px] text-slate-500">
              {visionResult.extracted_text.length} characters • {visionResult.extracted_urls?.length || 0} URL(s)
            </span>
          </div>
          <pre className="p-3 rounded-lg bg-white border border-stone-200 text-slate-800 font-mono text-[11px] whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
            {visionResult.extracted_text}
          </pre>
          {visionResult.extracted_urls && visionResult.extracted_urls.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-semibold text-slate-500">Extracted URLs:</span>
              {visionResult.extracted_urls.map((u, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded bg-teal-50 border border-teal-200 text-teal-900 font-mono text-[10px]">
                  {u}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Region List Table */}
      {regions.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-stone-50 text-slate-600 uppercase tracking-wider text-[10px] font-semibold border-b border-stone-200">
              <tr>
                <th className="py-2.5 px-3">ID</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Extracted Content</th>
                <th className="py-2.5 px-3">Grounded Rationale</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {regions.map((r) => (
                <tr 
                  key={r.region_id} 
                  className={`hover:bg-stone-50/80 transition-colors ${
                    selectedRegionId === r.region_id ? 'bg-teal-50/60 font-semibold' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{r.region_id}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                      categoryColors[r.category]?.badge || 'bg-stone-100 text-slate-800'
                    }`}>
                      {r.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-800 max-w-[180px] truncate">
                    {r.extracted_text || r.detected_text || r.label || '--'}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 text-[11px] max-w-[280px]">
                    {r.grounded_rationale || r.evidence_explanation || '--'}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] font-bold">
                    <span className={r.severity === 'CRITICAL' ? 'text-red-700' : 'text-amber-700'}>
                      {r.severity}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <button
                      type="button"
                      onClick={() => setSelectedRegionId(r.region_id)}
                      className="px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 text-slate-700 font-medium text-[11px] cursor-pointer"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>
            Clean Visual Forensics: No anomalous credential inputs, brand impersonation, or timer cues detected.
          </span>
        </div>
      )}
    </div>
  );
}
