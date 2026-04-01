import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Link,
  Database,
  Coins,
  AlertTriangle,
  ShieldCheck,
  ExternalLink,
  Copy,
  ChevronDown,
  ChevronUp,
  Activity,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { API_BASE } from '../config';
import { View } from '../types';

type ProvenanceProps = {
  setActiveView: (view: View) => void;
};

type Provenance = {
  readingId: string;
  deviceId: string;
  timestamp: string;
  integrity: {
    storedHash: string | null;
    recomputedHash: string;
    intact: boolean | null;
    verdict: 'INTACT' | 'TAMPERED' | 'NO_HASH';
  };
  blockchain: {
    anchorStatus: string;
    txHash: string | null;
    network: string;
  };
  carbonCredit: {
    batchId: string;
    date: string;
    dhiHours: number;
    tokens: number;
    status: string;
    mintTxHash: string | null;
  } | null;
  aiClassification: { label: string; confidence: number; overriddenByHeuristic?: boolean } | null;
  emissions: { estimatedCO2eqKg: number; method: string } | null;
};

type LedgerEntry = {
  _id: string;
  deviceId: string;
  timestamp: string;
  dataHash: string | null;
  anchorStatus: string;
  sourceClassification: { label: string; confidence: number } | null;
};

const POLY_AMOY_EXPLORER = 'https://amoy.polygonscan.com/tx/';

function shortHash(h: string | null) {
  if (!h) return '—';
  return h.slice(0, 10) + '…' + h.slice(-10);
}

// ------------------------------------------------------------------
// Sub-components
// ------------------------------------------------------------------

const StatusPill = ({ ok, label }: { ok: boolean | null; label: string }) => {
  const base = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border';
  if (ok === true)
    return <span className={`${base} bg-emerald-50 text-emerald-700 border-emerald-200`}><CheckCircle className="w-3.5 h-3.5" />{label}</span>;
  if (ok === false)
    return <span className={`${base} bg-rose-50 text-rose-700 border-rose-200`}><XCircle className="w-3.5 h-3.5" />{label}</span>;
  return <span className={`${base} bg-amber-50 text-amber-700 border-amber-200`}><AlertTriangle className="w-3.5 h-3.5" />{label}</span>;
};

const Section = ({ icon: Icon, title, color, children, defaultOpen = true }: any) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl ${color} flex items-center justify-center text-white`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="font-semibold text-sm text-slate-800">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="px-5 py-4 space-y-3"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Row = ({ label, value, mono = false }: any) => (
  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-3 text-sm border-b border-gray-50 pb-2 last:border-0 last:pb-0">
    <span className="text-slate-500 shrink-0 text-xs sm:text-sm">{label}</span>
    <span className={`text-left sm:text-right text-slate-800 ${mono ? 'font-mono text-xs break-all bg-slate-100 px-2 py-0.5 rounded' : 'font-medium'}`}>{value}</span>
  </div>
);


// ------------------------------------------------------------------
// Main View
// ------------------------------------------------------------------

const ProvenanceDashboard = ({ setActiveView }: { setActiveView: (v: View) => void }) => {
  const { token } = useAuth();
  const { showToast } = useToast();

  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [stats, setStats] = useState({ totalMinted: 0, activeAnchors: 0 });
  const [loading, setLoading] = useState(true);

  // Inspector state
  const [manualLookupId, setManualLookupId] = useState('');
  const [traceLoading, setTraceLoading] = useState(false);
  const [traceResult, setTraceResult] = useState<Provenance | null>(null);

  const fetchLedger = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/ledger`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setLedger(data.ledger);
        setStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
    const interval = setInterval(fetchLedger, 30000); // Polling every 30s
    return () => clearInterval(interval);
  }, [token]);

  const loadTrace = async (id: string) => {
    if (!id.trim()) return;
    setTraceLoading(true);
    setTraceResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/readings/${id.trim()}/provenance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Lookup failed');
      setTraceResult(data.provenance);
      setManualLookupId(id); // Keep input synced
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setTraceLoading(false);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard', 'info');
  };

  return (
    <div className="pt-20 px-4 sm:px-6 lg:px-12 pb-12 min-h-screen bg-gradient-to-br from-cream-50 via-orange-50/60 to-amber-50">
      <div className="max-w-[1440px] mx-auto pl-12 pr-4 lg:pr-8">
        
        {/* Header & Stats Strip */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div>
             <button
              onClick={() => setActiveView('admin')}
              className="inline-flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-800 font-bold uppercase tracking-wider mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Exit Secure Area
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center shadow-lg border border-slate-700 text-orange-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  Data <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Provenance Explorer</span>
                </h1>
                <p className="text-sm text-gray-500 font-medium">
                  Treasury management, cryptographic verification, and deep timeline traces.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="bg-white rounded-2xl border border-orange-200/50 p-4 shadow-sm min-w-[160px]">
              <div className="text-[10px] text-gray-500 uppercase tracking-wide font-bold mb-1 flex items-center gap-1.5"><Coins className="w-3.5 h-3.5 text-amber-500"/> Total Tokens Issued</div>
              <div className="text-2xl font-black text-gray-900">{stats.totalMinted.toLocaleString()}</div>
            </div>
            <div className="bg-slate-900 rounded-2xl border border-slate-700 p-4 shadow-sm min-w-[160px]">
              <div className="text-[10px] text-slate-400 uppercase tracking-wide font-bold mb-1 flex items-center gap-1.5"><Link className="w-3.5 h-3.5 text-sky-400"/> Polygon Anchors</div>
              <div className="text-2xl font-black text-white">{stats.activeAnchors.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Master Details Split */}
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* LEFT: Live Ledger Master List */}
          <div className="flex-1 bg-white rounded-3xl shadow-lg border border-orange-100 overflow-hidden flex flex-col min-h-[500px]">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" /> Live Cryptographic Ledger
              </h2>
              <div className="relative w-full sm:w-64">
                 <input
                   value={manualLookupId}
                   onChange={e => setManualLookupId(e.target.value)}
                   onKeyDown={e => e.key === 'Enter' && loadTrace(manualLookupId)}
                   placeholder="Trace Reading ID..."
                   className="w-full pl-4 pr-10 py-2 bg-white border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition shadow-inner"
                 />
                 <button onClick={() => loadTrace(manualLookupId)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-orange-500 bg-white">
                   <Search className="w-4 h-4" />
                 </button>
              </div>
            </div>

            <div className="overflow-x-auto flex-1 custom-scroll max-h-[600px]">
               <table className="min-w-full text-left">
                  <thead className="bg-white sticky top-0 z-10 border-b border-gray-100 text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                    <tr>
                      <th className="px-5 py-3">Timestamp</th>
                      <th className="px-5 py-3">Device (ID)</th>
                      <th className="px-5 py-3">SHA-256 Digest</th>
                      <th className="px-5 py-3">Classification</th>
                      <th className="px-5 py-3">Anchor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {ledger.map(row => {
                      const isActive = traceResult?.readingId === row._id;
                      return (
                        <tr 
                          key={row._id} 
                          onClick={() => loadTrace(row._id)}
                          className={`cursor-pointer transition group text-sm ${isActive ? 'bg-orange-50 border-l-4 border-orange-500' : 'hover:bg-slate-50 border-l-4 border-transparent'}`}
                        >
                          <td className="px-5 py-3 whitespace-nowrap text-xs text-gray-600">
                             {new Date(row.timestamp).toLocaleTimeString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap text-xs text-gray-800 font-semibold uppercase">
                             {row.deviceId.split('-')[1] || row.deviceId}
                             <div className="text-[10px] text-gray-400 font-mono mt-0.5" title={row._id}>{row._id.slice(-6)}</div>
                          </td>
                          <td className="px-5 py-3 text-xs font-mono text-slate-500">
                             {shortHash(row.dataHash)}
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                             {row.sourceClassification ? (
                               <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 text-[10px] font-bold">
                                 {row.sourceClassification.label} ({row.sourceClassification.confidence}%)
                               </span>
                             ) : <span className="text-xs text-gray-400">—</span>}
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                             <StatusPill ok={row.anchorStatus === 'ANCHORED'} label={row.anchorStatus} />
                          </td>
                        </tr>
                      )
                    })}
                    {!loading && ledger.length === 0 && (
                      <tr><td colSpan={5} className="py-8 text-center text-sm text-gray-500">No recent ledger entries found.</td></tr>
                    )}
                  </tbody>
               </table>
            </div>
          </div>

          {/* RIGHT: Deep Trace Inspector Pane */}
          <div className="w-full lg:w-[450px] shrink-0">
             {traceLoading ? (
               <div className="bg-white rounded-3xl p-8 border border-orange-100 flex flex-col items-center justify-center text-center h-[500px] shadow-sm">
                   <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-4" />
                   <p className="text-sm font-semibold text-gray-500 animate-pulse">Running full provenance trace...</p>
               </div>
             ) : traceResult ? (
               <div className="bg-white rounded-3xl border border-orange-100 shadow-xl overflow-hidden animate-fade-in flex flex-col h-full max-h-[700px]">
                 <div className="bg-slate-900 border-b border-slate-800 p-5 shrink-0 flex items-start justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Trace Inspector Focus</p>
                      <p className="text-xs text-orange-400 font-mono mt-1 break-all pr-4">{traceResult.readingId}</p>
                    </div>
                    <StatusPill ok={traceResult.integrity.intact} label={traceResult.integrity.verdict === 'INTACT' ? 'VERIFIED' : 'TAMPERED'} />
                 </div>

                 <div className="p-4 overflow-y-auto custom-scroll flex-1">
                   {/* Timeline Flow Graphic */}
                   <div className="mb-6 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">Data Journey</h4>
                      <div className="relative border-l-2 border-orange-200 ml-2 space-y-5">
                         {[
                            { step: 'Ingestion & DB Entry', val: new Date(traceResult.timestamp).toLocaleTimeString(), icon: Database, done: true },
                            { step: 'SHA-256 Integrty Hash', val: traceResult.integrity.storedHash ? 'Computed' : 'Missing', icon: ShieldCheck, done: !!traceResult.integrity.storedHash },
                            { step: 'On-chain Blockchain Anchor', val: traceResult.blockchain.txHash ? 'Amoy Network' : 'Pending', icon: Link, done: traceResult.blockchain.anchorStatus === 'ANCHORED' },
                            { step: 'Carbon Token Minting', val: traceResult.carbonCredit ? `${traceResult.carbonCredit.tokens} minted` : 'Pending Batch', icon: Coins, done: !!traceResult.carbonCredit }
                         ].map((item, i) => (
                           <div key={i} className="ml-5 relative">
                             <div className={`absolute -left-[27px] top-0 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${item.done ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                               <item.icon className="w-3 h-3" />
                             </div>
                             <p className="text-sm font-bold text-gray-800 leading-tight">{item.step}</p>
                             <p className="text-[11px] font-mono text-gray-500 mt-0.5">{item.val}</p>
                           </div>
                         ))}
                      </div>
                   </div>

                   {/* Detailed Sections Reuse existing styling but lighter */}
                   <Section icon={ShieldCheck} title="Integrity Diagnostics" color="bg-emerald-500" defaultOpen={true}>
                      <Row label="Stored Hash" mono value={
                          <span className="flex items-center gap-2">
                             {shortHash(traceResult.integrity.storedHash)}
                             {traceResult.integrity.storedHash && <Copy onClick={() => copy(traceResult.integrity.storedHash!)} className="w-3.5 h-3.5 text-slate-400 hover:text-slate-700 cursor-pointer"/>}
                          </span>
                      } />
                      <Row label="Recomputed Hash" mono value={
                          <span className="flex items-center gap-2">
                             {shortHash(traceResult.integrity.recomputedHash)}
                             {traceResult.integrity.recomputedHash && <Copy onClick={() => copy(traceResult.integrity.recomputedHash!)} className="w-3.5 h-3.5 text-slate-400 hover:text-slate-700 cursor-pointer"/>}
                          </span>
                      } />
                   </Section>

                   <Section icon={Link} title="Blockchain Anchor" color="bg-violet-500" defaultOpen={false}>
                     <Row label="Network" value={traceResult.blockchain.network} />
                     <Row label="Tx Hash" mono value={traceResult.blockchain.txHash ? (
                        <a href={`${POLY_AMOY_EXPLORER}${traceResult.blockchain.txHash}`} target="_blank" rel="noreferrer" className="text-violet-600 hover:underline flex items-center gap-1">
                           {shortHash(traceResult.blockchain.txHash)} <ExternalLink className="w-3 h-3"/>
                        </a>
                     ) : 'None'} />
                   </Section>

                   <Section icon={Coins} title="Carbon Credit Allocation" color="bg-amber-500" defaultOpen={false}>
                      {traceResult.carbonCredit ? (
                         <>
                           <Row label="Tokens" value={<span className="font-bold text-amber-600">{traceResult.carbonCredit.tokens} Tokens</span>} />
                           <Row label="DHI Hours" value={`${traceResult.carbonCredit.dhiHours.toFixed(2)}`} />
                           <Row label="Batch ID" mono value={traceResult.carbonCredit.batchId} />
                         </>
                      ) : <p className="text-xs text-gray-400 italic">Not yet batched.</p>}
                   </Section>
                 </div>
               </div>
             ) : (
                <div className="bg-white rounded-3xl p-8 border border-orange-100 flex flex-col items-center justify-center text-center h-[500px] shadow-sm">
                   <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mb-4">
                     <Search className="w-8 h-8 text-orange-300" />
                   </div>
                   <h3 className="text-gray-900 font-bold mb-1">Select a Ledger Entry</h3>
                   <p className="text-sm text-gray-500">Click a row on the left to perform a deep cryptographic trace & verify provenance.</p>
                </div>
             )}
          </div>

        </div>
      </div>
    </div>
  );
};


// ------------------------------------------------------------------
// Main Component exported to App.tsx
// ------------------------------------------------------------------
const DataProvenance: React.FC<ProvenanceProps> = ({ setActiveView }) => {
  return <ProvenanceDashboard setActiveView={setActiveView} />;
};

export default DataProvenance;
