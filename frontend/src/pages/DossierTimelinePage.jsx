import React, { useState, useEffect } from 'react';
import { 
  FolderClock, Clock, Calendar, ShieldAlert, Download, 
  Plus, Trash2, CheckCircle2, AlertCircle, FileText, 
  ExternalLink, Hash, RefreshCw, ChevronDown, ChevronRight,
  ShieldCheck, AlertTriangle
} from 'lucide-react';
import { 
  listDossiers, createDossier, getDossier, deleteDossier, 
  addDossierEvent, exportDossier, listInvestigations 
} from '../services/api';
import { useToast } from '../context/ToastContext';

export default function DossierTimelinePage({ onSelectCase }) {
  const { addToast } = useToast();
  const [dossiers, setDossiers] = useState([]);
  const [activeDossier, setActiveDossier] = useState(null);
  const [allCases, setAllCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [addEventModalOpen, setAddEventModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportReportData, setExportReportData] = useState(null);

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPrimarySubject, setNewPrimarySubject] = useState('');
  const [selectedCaseIds, setSelectedCaseIds] = useState([]);

  // New Event form state
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventType, setEventType] = useState('MESSAGE_RECEIVED');
  const [timestampType, setTimestampType] = useState('EXACT_RECORDED');
  const [eventTimestamp, setEventTimestamp] = useState(new Date().toISOString().slice(0, 16));

  const fetchDossiers = async () => {
    setLoading(true);
    try {
      const [dList, cList] = await Promise.all([
        listDossiers(50).catch(() => []),
        listInvestigations(50).catch(() => [])
      ]);
      setDossiers(dList);
      setAllCases(cList);

      if (dList.length > 0) {
        const fullDossier = await getDossier(dList[0].dossier_id);
        setActiveDossier(fullDossier);
      }
    } catch (err) {
      console.error('Failed to load dossiers', err);
      addToast('Failed to load investigation dossiers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDossiers();
  }, []);

  const handleSelectDossier = async (dossierId) => {
    try {
      const full = await getDossier(dossierId);
      setActiveDossier(full);
    } catch (err) {
      addToast('Could not load dossier details', 'error');
    }
  };

  const handleCreateDossier = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      addToast('Please enter a dossier title', 'error');
      return;
    }
    try {
      const created = await createDossier({
        title: newTitle,
        description: newDesc,
        primary_subject: newPrimarySubject,
        case_ids: selectedCaseIds
      });
      addToast(`Dossier ${created.dossier_id} created`, 'success');
      setCreateModalOpen(false);
      setNewTitle('');
      setNewDesc('');
      setSelectedCaseIds([]);
      await fetchDossiers();
      const full = await getDossier(created.dossier_id);
      setActiveDossier(full);
    } catch (err) {
      addToast('Failed to create dossier', 'error');
    }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!activeDossier) return;
    if (!eventTitle.trim()) {
      addToast('Please enter an event title', 'error');
      return;
    }
    try {
      await addDossierEvent(activeDossier.dossier_id, {
        event_title: eventTitle,
        event_description: eventDesc,
        event_type: eventType,
        timestamp_type: timestampType,
        timestamp_value: new Date(eventTimestamp).toISOString()
      });
      addToast('Timeline event recorded', 'success');
      setAddEventModalOpen(false);
      setEventTitle('');
      setEventDesc('');
      const updated = await getDossier(activeDossier.dossier_id);
      setActiveDossier(updated);
    } catch (err) {
      addToast('Failed to record event', 'error');
    }
  };

  const handleDeleteDossier = async (dossierId) => {
    if (!window.confirm('Are you sure you want to delete this dossier?')) return;
    try {
      await deleteDossier(dossierId);
      addToast('Dossier deleted', 'info');
      setActiveDossier(null);
      await fetchDossiers();
    } catch (err) {
      addToast('Failed to delete dossier', 'error');
    }
  };

  const handleExport = async () => {
    if (!activeDossier) return;
    try {
      const rep = await exportDossier(activeDossier.dossier_id);
      setExportReportData(rep);
      setExportModalOpen(true);
    } catch (err) {
      addToast('Failed to generate export report', 'error');
    }
  };

  const downloadReportFile = (format) => {
    if (!exportReportData) return;
    const content = format === 'json' 
      ? JSON.stringify(exportReportData, null, 2)
      : exportReportData.markdown_report;
    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CyberShield_Dossier_${exportReportData.dossier_id}.${format === 'json' ? 'json' : 'md'}`;
    a.click();
    URL.revokeObjectURL(url);
    addToast(`Downloaded dossier in ${format.toUpperCase()} format`, 'success');
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-teal-50 text-teal-800 border border-teal-100">
            <FolderClock className="w-6 h-6 text-teal-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Scam Timeline & Evidence Dossier
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Organize related messages, URLs, screenshots, and complaints into chronological case files with tamper-evident cryptographic fingerprints.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-teal-900 hover:bg-teal-950 text-white text-xs font-bold cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Investigation Dossier</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Dossier List (4 cols) + Interactive Timeline & Details (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Dossier Library (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Investigation Dossiers ({dossiers.length})
            </span>
            <button
              type="button"
              onClick={fetchDossiers}
              className="p-1 hover:bg-stone-100 rounded-lg text-slate-500 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-700' : ''}`} />
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-stone-200">
              Loading dossiers...
            </div>
          ) : dossiers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-stone-200 space-y-2">
              <FolderClock className="w-6 h-6 text-slate-300 mx-auto" />
              <div>No dossiers created yet.</div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="text-teal-700 font-semibold hover:underline"
              >
                Create your first dossier
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {dossiers.map((d) => {
                const isSelected = activeDossier?.dossier_id === d.dossier_id;
                return (
                  <div
                    key={d.dossier_id}
                    onClick={() => handleSelectDossier(d.dossier_id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-teal-50/70 border-teal-300 ring-1 ring-teal-200 shadow-xs'
                        : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-teal-900 bg-teal-100/60 px-2 py-0.5 rounded-md">
                        {d.dossier_id}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(d.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="font-bold text-slate-900 text-sm mt-1.5 truncate">
                      {d.title}
                    </div>
                    <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {d.description || 'No description provided.'}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-600 pt-2 mt-2 border-t border-stone-100">
                      <span>{d.case_ids?.length || 0} Linked Cases</span>
                      <span>{d.events_count || 0} Timeline Events</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Timeline & Dossier Details (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {activeDossier ? (
            <div className="space-y-5">
              
              {/* Dossier Header Info */}
              <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-teal-100 text-teal-900">
                        {activeDossier.dossier_id}
                      </span>
                      <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                        {activeDossier.title}
                      </h2>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {activeDossier.description || 'Comprehensive evidence dossier containing linked messages, URLs, screenshots, and complaints.'}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleExport}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 hover:bg-teal-100 text-xs font-bold cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Dossier</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteDossier(activeDossier.dossier_id)}
                      className="p-1.5 rounded-xl border border-stone-200 hover:bg-red-50 hover:text-red-700 text-slate-400 cursor-pointer"
                      title="Delete Dossier"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Metadata Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <div className="text-[10px] text-slate-500 font-mono">Linked Cases</div>
                    <div className="font-bold text-slate-900 text-sm mt-0.5">
                      {activeDossier.case_ids?.length || 0}
                    </div>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <div className="text-[10px] text-slate-500 font-mono">Primary Subject</div>
                    <div className="font-bold text-slate-900 text-sm mt-0.5 truncate">
                      {activeDossier.primary_subject || 'General Scam'}
                    </div>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <div className="text-[10px] text-slate-500 font-mono">Recorded Events</div>
                    <div className="font-bold text-slate-900 text-sm mt-0.5">
                      {(activeDossier.timeline_events || []).filter(e => e.timestamp_type === 'EXACT_RECORDED').length}
                    </div>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <div className="text-[10px] text-slate-500 font-mono">Inferred Sequences</div>
                    <div className="font-bold text-slate-900 text-sm mt-0.5">
                      {(activeDossier.timeline_events || []).filter(e => e.timestamp_type === 'INFERRED_ORDERING').length}
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Chronological Timeline View */}
              <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-teal-700" />
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-900">
                      Chronological Investigation Timeline
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAddEventModalOpen(true)}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Event</span>
                  </button>
                </div>

                {/* Timeline Stream */}
                {(!activeDossier.timeline_events || activeDossier.timeline_events.length === 0) ? (
                  <div className="p-8 text-center text-xs text-slate-400 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                    <Clock className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                    <div className="font-semibold text-slate-600">No events on timeline yet</div>
                    <p className="text-[11px]">Add an event manually or link cases to populate the timeline automatically.</p>
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
                    {activeDossier.timeline_events.map((evt, idx) => {
                      const isExact = evt.timestamp_type === 'EXACT_RECORDED';
                      return (
                        <div key={evt.event_id || idx} className="relative group text-xs">
                          {/* Circle on timeline axis */}
                          <div className={`absolute -left-[27px] top-1.5 w-3.5 h-3.5 rounded-full border-2 bg-white ${
                            isExact ? 'border-emerald-600 ring-2 ring-emerald-100' : 'border-blue-500 ring-2 ring-blue-100'
                          }`} />

                          <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-white transition-all space-y-2 shadow-2xs">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <span className="font-bold text-slate-900 text-sm">
                                {evt.event_title}
                              </span>

                              {/* Timestamp Badge */}
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                                  isExact
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-blue-50 text-blue-800 border-blue-200'
                                }`}>
                                  {isExact ? 'EXACT RECORDED' : 'INFERRED ORDERING'}
                                </span>
                                <span className="font-mono text-[11px] text-slate-500">
                                  {new Date(evt.timestamp_value).toLocaleString()}
                                </span>
                              </div>
                            </div>

                            <p className="text-slate-700 leading-relaxed text-xs">
                              {evt.event_description}
                            </p>

                            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500">
                              <span className="px-2 py-0.5 rounded bg-stone-100 border border-stone-200 font-mono text-[10px]">
                                {evt.event_type}
                              </span>
                              {evt.evidence_ref && (
                                <span className="text-teal-800 font-mono">
                                  Ref: {evt.evidence_ref}
                                </span>
                              )}
                              {evt.source_case_id && (
                                <button
                                  type="button"
                                  onClick={() => onSelectCase && onSelectCase({ case_id: evt.source_case_id })}
                                  className="text-teal-700 font-semibold hover:underline flex items-center space-x-1"
                                >
                                  <span>Case {evt.source_case_id}</span>
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-12 text-center text-xs text-slate-400 space-y-2">
              <FolderClock className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-sm font-bold text-slate-700">Select or Create a Dossier</div>
              <p className="max-w-md mx-auto text-slate-500">
                Choose an investigation dossier from the left or create a new one to assemble messages, URLs, screenshots, and chronological event sequences.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Dossier */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Create New Investigation Dossier
            </h3>

            <form onSubmit={handleCreateDossier} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Dossier Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bank Alfalah OTP Lure Campaign — Oct 2026"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Primary Subject / Brand</label>
                <input
                  type="text"
                  placeholder="e.g. Bank Alfalah / Easypaisa"
                  value={newPrimarySubject}
                  onChange={(e) => setNewPrimarySubject(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Scope / Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of the incident under investigation..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Link Investigated Cases</label>
                <div className="max-h-32 overflow-y-auto space-y-1.5 p-2 rounded-xl border border-stone-200 bg-stone-50">
                  {allCases.map(c => (
                    <label key={c.case_id} className="flex items-center space-x-2 text-[11px] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCaseIds.includes(c.case_id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedCaseIds([...selectedCaseIds, c.case_id]);
                          else setSelectedCaseIds(selectedCaseIds.filter(id => id !== c.case_id));
                        }}
                        className="accent-teal-700"
                      />
                      <span className="font-mono font-bold">{c.case_id}</span>
                      <span className="text-slate-500 truncate">({c.input_type || 'Case'})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-stone-200 text-slate-700 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-teal-900 hover:bg-teal-950 text-white font-bold"
                >
                  Create Dossier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Timeline Event */}
      {addEventModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900">
              Add Timeline Event
            </h3>

            <form onSubmit={handleAddEvent} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Victim entered OTP on deceptive portal"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Timestamp Type</label>
                  <select
                    value={timestampType}
                    onChange={(e) => setTimestampType(e.target.value)}
                    className="w-full p-2 rounded-xl border border-stone-300 bg-stone-50 text-xs"
                  >
                    <option value="EXACT_RECORDED">EXACT_RECORDED</option>
                    <option value="INFERRED_ORDERING">INFERRED_ORDERING</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Event Type</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full p-2 rounded-xl border border-stone-300 bg-stone-50 text-xs"
                  >
                    <option value="MESSAGE_RECEIVED">MESSAGE_RECEIVED</option>
                    <option value="URL_CLICKED">URL_CLICKED</option>
                    <option value="CREDENTIALS_ENTERED">CREDENTIALS_ENTERED</option>
                    <option value="CALL_RECEIVED">CALL_RECEIVED</option>
                    <option value="SCREENSHOT_CAPTURED">SCREENSHOT_CAPTURED</option>
                    <option value="REPORT_FILED">REPORT_FILED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Timestamp Value</label>
                <input
                  type="datetime-local"
                  value={eventTimestamp}
                  onChange={(e) => setEventTimestamp(e.target.value)}
                  className="w-full p-2 rounded-xl border border-stone-300 bg-stone-50 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Evidentiary Note</label>
                <textarea
                  rows={2}
                  placeholder="Details of this step..."
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  className="w-full p-2 rounded-xl border border-stone-300 bg-stone-50 text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setAddEventModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-stone-200 text-slate-700 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-teal-900 hover:bg-teal-950 text-white font-bold"
                >
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Export Dossier Report */}
      {exportModalOpen && exportReportData && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 text-xs max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Forensic Dossier Export Report
                </h3>
                <span className="font-mono text-[10px] text-teal-800 font-bold">
                  Dossier ID: {exportReportData.dossier_id}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => downloadReportFile('md')}
                  className="px-2.5 py-1 rounded-lg bg-teal-900 hover:bg-teal-950 text-white font-bold cursor-pointer"
                >
                  Download .MD
                </button>
                <button
                  type="button"
                  onClick={() => downloadReportFile('json')}
                  className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-slate-800 font-bold border border-stone-300 cursor-pointer"
                >
                  Download JSON
                </button>
                <button
                  type="button"
                  onClick={() => setExportModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* SHA-256 Hash pill */}
            <div className="p-2.5 rounded-xl bg-stone-900 text-emerald-400 font-mono text-[10px] flex items-center justify-between">
              <span className="font-bold flex items-center space-x-1">
                <Hash className="w-3.5 h-3.5" />
                <span>SHA-256 Evidentiary Fingerprint:</span>
              </span>
              <span className="truncate max-w-[320px]">{exportReportData.evidentiary_integrity_hash}</span>
            </div>

            {/* Report Markdown Preview */}
            <div className="flex-1 overflow-y-auto p-4 rounded-xl border border-stone-200 bg-stone-50 font-mono text-slate-800 text-[11px] whitespace-pre-wrap leading-relaxed shadow-inner">
              {exportReportData.markdown_report}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
