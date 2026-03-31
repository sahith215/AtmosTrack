import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Link,
  Database,
  Cpu,
  Coins,
  AlertTriangle,
  ShieldCheck,
  ExternalLink,
  Copy,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { API_BASE } from '../config';
import type { View } from '../App';

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

// const API_BASE = 'http://localhost:5000'; // Removed local override - it's already imported

const POLY_AMOY_EXPLORER = 'https://amoy.polygonscan.com/tx/';

function shortHash(h: string) {
  return h.slice(0, 10) + '…' + h.slice(-10);
}

const StatusPill = ({ ok, label }: { ok: boolean | null; label: string }) => {
  const base = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border';
  if (ok === true)
    return <span className={`${base} bg-emerald-50 text-emerald-700 border-emerald-200`}><CheckCircle className="w-3.5 h-3.5" />{label}</span>;
  if (ok === false)
    return <span className={`${base} bg-rose-50 text-rose-700 border-rose-200`}><XCircle className="w-3.5 h-3.5" />{label}</span>;
  return <span className={`${base} bg-amber-50 text-amber-700 border-amber-200`}><AlertTriangle className="w-3.5 h-3.5" />{label}</span>;
};

const Section = ({
  icon: Icon,
  title,
  color,
  children,
}: {
  icon: React.ElementType;
  title: string;
  color: string;
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
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

const Row = ({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) => (
  <div className="flex items-start justify-between gap-3 text-sm">
    <span className="text-slate-500 shrink-0">{label}</span>
    <span className={`text-right text-slate-800 ${mono ? 'font-mono text-xs break-all' : 'font-medium'}`}>{value}</span>
  </div>
);

const DataProvenance: React.FC<ProvenanceProps> = ({ setActiveView }) => {
  const { token } = useAuth();
  const { showToast } = useToast();

  const [readingId, setReadingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Provenance | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lookup = async () => {
    if (!readingId.trim()) { showToast('Enter a Reading ID', 'error'); return; }
    if (!token) { showToast('Not authenticated', 'error'); return; }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/readings/${readingId.trim()}/provenance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Lookup failed');
      setResult(data.provenance);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard', 'info');
  };

  return (
    <div className="pt-20 px-4 pb-12 min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => setActiveView('admin')}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 mb-4 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white shadow-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Data Provenance Explorer</h1>
              <p className="text-sm text-slate-500">Full lineage: ingest → SHA-256 → Polygon → DHI → carbon credit</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 text-violet-700 border border-violet-200 text-[11px] font-semibold mt-1">
            IIT Research Grade • Tamper Detection • Blockchain Verified
          </div>
        </div>

        {/* Lookup box */}
        <div className="bg-white rounded-3xl shadow-lg border border-violet-100 p-5 mb-6">
          <label className="block text-xs font-semibold text-slate-600 mb-2">Reading MongoDB ID</label>
          <div className="flex gap-2">
            <input
              value={readingId}
              onChange={e => setReadingId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && lookup()}
              placeholder="68xxxxxxxxxxxxxxxxxxxxxxxx"
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-400/50 focus:border-violet-400 transition"
            />
            <motion.button
              onClick={lookup}
              disabled={loading}
              whileTap={{ scale: 0.97 }}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-violet-200 border-t-white rounded-full animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              {loading ? 'Looking up…' : 'Trace'}
            </motion.button>
          </div>
          {error && (
            <p className="mt-2 text-xs text-rose-600 flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5 shrink-0" /> {error}
            </p>
          )}
          <p className="mt-2 text-[11px] text-slate-400">
            Tip: Copy a Reading ID from the Carbon Hub or from a downloaded CSV export.
          </p>
        </div>

        {/* Result panels */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Overview bar */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] text-slate-400 uppercase tracking-wide">Reading ID</p>
                  <p className="text-sm font-mono text-slate-100 mt-0.5">{String(result.readingId)}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusPill
                    ok={result.integrity.intact}
                    label={result.integrity.verdict === 'INTACT' ? 'Data Intact' : result.integrity.verdict === 'TAMPERED' ? 'TAMPERED' : 'No Hash'}
                  />
                  <StatusPill
                    ok={result.blockchain.anchorStatus === 'ANCHORED'}
                    label={result.blockchain.anchorStatus}
                  />
                  {result.carbonCredit && (
                    <StatusPill ok={true} label={`${result.carbonCredit.tokens} tokens`} />
                  )}
                </div>
              </div>

              {/* 1. Data Integrity */}
              <Section icon={ShieldCheck} title="1. Data Integrity (SHA-256)" color="bg-emerald-500">
                <Row label="Timestamp" value={new Date(result.timestamp).toLocaleString()} />
                <Row label="Device" value={result.deviceId} />
                <Row
                  label="Stored hash"
                  value={
                    result.integrity.storedHash ? (
                      <span className="flex items-center gap-1.5">
                        {shortHash(result.integrity.storedHash)}
                        <button onClick={() => copy(result.integrity.storedHash!)} className="text-slate-400 hover:text-slate-700">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ) : '—'
                  }
                  mono
                />
                <Row
                  label="Recomputed hash"
                  value={
                    <span className="flex items-center gap-1.5">
                      {shortHash(result.integrity.recomputedHash)}
                      <button onClick={() => copy(result.integrity.recomputedHash)} className="text-slate-400 hover:text-slate-700">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  }
                  mono
                />
                <Row
                  label="Verdict"
                  value={
                    <StatusPill
                      ok={result.integrity.intact}
                      label={
                        result.integrity.verdict === 'INTACT'
                          ? '✅ Data has not been tampered with'
                          : result.integrity.verdict === 'TAMPERED'
                          ? '🚨 Hash mismatch — TAMPERING DETECTED'
                          : '⚠️ No hash stored (pre-blockchain reading)'
                      }
                    />
                  }
                />
              </Section>

              {/* 2. Blockchain Anchor */}
              <Section icon={Link} title="2. Blockchain Anchor (Polygon Amoy)" color="bg-violet-500">
                <Row label="Network" value={result.blockchain.network} />
                <Row label="Anchor status" value={
                  <StatusPill
                    ok={result.blockchain.anchorStatus === 'ANCHORED'}
                    label={result.blockchain.anchorStatus}
                  />
                } />
                {result.blockchain.txHash ? (
                  <>
                    <Row
                      label="Transaction hash"
                      value={
                        <span className="flex items-center gap-1.5">
                          {shortHash(result.blockchain.txHash)}
                          <button onClick={() => copy(result.blockchain.txHash!)} className="text-slate-400 hover:text-slate-700">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      }
                      mono
                    />
                    <a
                      href={`${POLY_AMOY_EXPLORER}${result.blockchain.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-violet-700 font-semibold hover:underline"
                    >
                      View on Polygonscan <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </>
                ) : (
                  <p className="text-xs text-slate-400">Not yet anchored — will be anchored in the next batch.</p>
                )}
              </Section>

              {/* 3. Carbon Credit */}
              <Section icon={Coins} title="3. Carbon Credit (DHI Batch)" color="bg-amber-500">
                {result.carbonCredit ? (
                  <>
                    <Row label="Batch ID" value={result.carbonCredit.batchId} mono />
                    <Row label="Date" value={result.carbonCredit.date} />
                    <Row label="DHI hours" value={`${result.carbonCredit.dhiHours.toFixed(4)} hrs`} />
                    <Row label="Tokens issued" value={<span className="font-bold text-amber-700">{result.carbonCredit.tokens} AtmosCredits</span>} />
                    <Row label="Status" value={<StatusPill ok={result.carbonCredit.status === 'MINTED'} label={result.carbonCredit.status} />} />
                    {result.carbonCredit.mintTxHash && (
                      <Row
                        label="Mint tx"
                        value={
                          <a
                            href={`${POLY_AMOY_EXPLORER}${result.carbonCredit.mintTxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-amber-700 hover:underline font-mono text-xs"
                          >
                            {shortHash(result.carbonCredit.mintTxHash)}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        }
                      />
                    )}
                  </>
                ) : (
                  <p className="text-xs text-slate-400">
                    This reading has not yet been included in a DHI batch. Batches are computed daily.
                  </p>
                )}
              </Section>

              {/* 4. AI Classification */}
              <Section icon={Cpu} title="4. AI Classification Audit" color="bg-sky-500">
                {result.aiClassification ? (
                  <>
                    <Row label="Label" value={result.aiClassification.label} />
                    <Row
                      label="Confidence"
                      value={
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 rounded-full"
                              style={{ width: `${result.aiClassification.confidence}%` }}
                            />
                          </div>
                          <span>{result.aiClassification.confidence}%</span>
                        </div>
                      }
                    />
                    {result.aiClassification.overriddenByHeuristic && (
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        Heuristic override applied — sensor conditions overruled low ML confidence. Label adjusted from original prediction.
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-slate-400">No AI classification recorded for this reading.</p>
                )}
              </Section>

              {/* 5. Emissions */}
              <Section icon={Database} title="5. Emissions Estimate" color="bg-rose-400">
                {result.emissions ? (
                  <>
                    <Row label="Estimated CO₂eq" value={`${result.emissions.estimatedCO2eqKg} kg`} />
                    <Row label="Estimation method" value={result.emissions.method} />
                    <p className="text-[11px] text-slate-400">
                      Based on MG811 CO₂ concentration (ppm) converted via volumetric mass estimation.
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-slate-400">No emissions data recorded.</p>
                )}
              </Section>

              {/* Timeline */}
              <Section icon={Clock} title="Data Journey Timeline" color="bg-slate-600">
                <ol className="relative border-l border-slate-200 space-y-4 ml-2">
                  {[
                    { label: 'Sensor ingested', sub: new Date(result.timestamp).toLocaleString(), done: true },
                    { label: 'SHA-256 fingerprint computed', sub: result.integrity.storedHash ? shortHash(result.integrity.storedHash) : 'None', done: !!result.integrity.storedHash },
                    { label: 'Anchored on Polygon Amoy', sub: result.blockchain.txHash ? shortHash(result.blockchain.txHash) : 'Pending', done: result.blockchain.anchorStatus === 'ANCHORED' },
                    { label: 'Included in DHI batch', sub: result.carbonCredit ? `Batch ${result.carbonCredit.batchId}` : 'Pending daily computation', done: !!result.carbonCredit },
                    { label: 'Carbon credit minted', sub: result.carbonCredit?.mintTxHash ? 'Minted on-chain' : 'Pending', done: result.carbonCredit?.status === 'MINTED' },
                  ].map(({ label, sub, done }) => (
                    <li key={label} className="ml-4">
                      <div className={`absolute w-3 h-3 rounded-full -left-1.5 border border-white ${done ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                      <p className="text-xs font-semibold text-slate-800">{label}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{sub}</p>
                    </li>
                  ))}
                </ol>
              </Section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DataProvenance;
