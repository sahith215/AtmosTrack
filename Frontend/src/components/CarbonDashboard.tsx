import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Wallet, RefreshCw, ArrowRightCircle, Info, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import VerifyEmailModal from '../components/VerifyEmailModal';

type WalletState = {
  address: string | null;
  chainId: string | null;
};

type Batch = {
  _id: string;
  batchId: string;
  deviceId: string;
  date: string;
  dhiHours: number;
  tokens: number;
  status: 'PENDING' | 'MINTED';
  txHash?: string;
};

type OffsetPlan = {
  deviceId: string;
  date: string;
  emissionsTonnes: number;
  offsetPercent: number;
};

const API_BASE = 'http://localhost:5000';

// helper: always return today in local time as YYYY-MM-DD
const todayISO = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const CarbonDashboard: React.FC = () => {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    chainId: null,
  });
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [offsetPlan, setOffsetPlan] = useState<OffsetPlan>({
    deviceId: 'ATMOSTRACK-01',
    date: todayISO(),
    emissionsTonnes: 1,
    offsetPercent: 100,
  });
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [showCreditsGuide, setShowCreditsGuide] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const { user, token } = useAuth();
  const { showToast } = useToast();

  // --- My Impact aggregates (from all batches) ---
  const totalDhi = batches.reduce((sum, b) => sum + b.dhiHours, 0);
  const totalTokens = batches.reduce((sum, b) => sum + b.tokens, 0);
  const mintedCount = batches.filter((b) => b.status === 'MINTED').length;
  const pendingCount = batches.length - mintedCount;

  // Guard: require login + verified email before any carbon actions
  const requireVerified = () => {
    if (!user || !token) {
      showToast('Please log in to use carbon credits.', 'error');
      return false;
    }
    if (!user.emailVerified) {
      showToast(
        'Please verify your email to compute DHI or mint credits.',
        'error',
      );
      setShowVerifyModal(true);
      return false;
    }
    return true;
  };

  // WALLET
  const connectWallet = async () => {
    const anyWindow = window as any;
    if (!anyWindow.ethereum) {
      alert('MetaMask not detected – please install it.');
      return;
    }
    try {
      const accounts: string[] = await anyWindow.ethereum.request({
        method: 'eth_requestAccounts',
      });
      const chainId: string = await anyWindow.ethereum.request({
        method: 'eth_chainId',
      });
      setWallet({ address: accounts[0], chainId });
    } catch (err) {
      console.error('Wallet connect error:', err);
    }
  };

  // BATCHES: load from backend
  const fetchBatches = async () => {
    if (!requireVerified()) return;

    setLoadingBatches(true);
    try {
      const res = await axios.get(`${API_BASE}/api/carbon/batches`, {
        params: { deviceId: offsetPlan.deviceId },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const list = res.data?.batches ?? [];
      setBatches(list);
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        const msg =
          (err.response.data as any)?.error || 'Email verification required.';
        showToast(msg, 'error');
        setShowVerifyModal(true);
      } else {
        console.error('fetchBatches error:', err);
      }
    } finally {
      setLoadingBatches(false);
    }
  };

  useEffect(() => {
    fetchBatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // CREATE BATCH
  const createDailyBatch = async () => {
    if (!requireVerified()) return;

    try {
      const res = await axios.post(
        `${API_BASE}/api/carbon/credit-batch`,
        {
          deviceId: offsetPlan.deviceId,
          date: offsetPlan.date, // always YYYY-MM-DD
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.data?.batch) {
        const newBatch: Batch = res.data.batch;
        setBatches((prev) => {
          const withoutDup = prev.filter((b) => b.batchId !== newBatch.batchId);
          return [newBatch, ...withoutDup];
        });
        setTxStatus('Computed DHI and tokens for that day.');
      } else if (res.data?.message) {
        setTxStatus(res.data.message);
      } else {
        setTxStatus('No batch created for this day.');
      }
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        const msg =
          (err.response.data as any)?.error ||
          'Email verification required to compute DHI.';
        showToast(msg, 'error');
        setShowVerifyModal(true);
      } else {
        console.error('createDailyBatch error:', err);
        setTxStatus('Failed to compute DHI.');
      }
    }
  };

  // MINT BATCH (calls backend mint-onchain)
  const mintBatch = async (batch: Batch) => {
    if (!requireVerified()) return;

    if (!wallet.address) {
      alert('Connect wallet first.');
      return;
    }

    try {
      const res = await axios.post(
        `${API_BASE}/api/carbon/mint-onchain`,
        {
          batchId: batch.batchId,
          walletAddress: wallet.address,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const updated: Batch | undefined = res.data?.batch;
      if (updated) {
        setBatches((prev) =>
          prev.map((b) => (b.batchId === updated.batchId ? updated : b)),
        );
        setTxStatus(
          `Simulated mint for batch ${updated.date} → status ${updated.status}${
            updated.txHash ? ` (tx: ${updated.txHash})` : ''
          }`,
        );
      } else if (res.data?.alreadyMinted) {
        setTxStatus(`Batch ${batch.date} is already minted.`);
      } else {
        setTxStatus('Mint response did not include a batch.');
      }
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        const msg =
          (err.response.data as any)?.error ||
          'Email verification required to mint tokens.';
        showToast(msg, 'error');
        setShowVerifyModal(true);
      } else {
        console.error('mintBatch error:', err);
        setTxStatus('Mint failed – check server logs.');
      }
    }
  };

  // OFFSET CALC
  const requiredTokens = () => {
    const { emissionsTonnes, offsetPercent } = offsetPlan;
    return ((emissionsTonnes * offsetPercent) / 100).toFixed(2);
  };

  const handleOffsetChange = (
    field: keyof OffsetPlan,
    value: string | number,
  ) => {
    setOffsetPlan((prev) => ({
      ...prev,
      [field]:
        field === 'emissionsTonnes' || field === 'offsetPercent'
          ? Number(value)
          : value,
    }));
  };

  // PLACEHOLDER RETIRE
  const simulateRetire = () => {
    if (!requireVerified()) return;

    if (!wallet.address) {
      alert('Connect wallet first.');
      return;
    }
    setTxStatus(
      `Simulated retirement of ${requiredTokens()} CCT tokens from ${wallet.address} (Polygon).`,
    );
  };

  return (
    <>
      <VerifyEmailModal
        open={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
      />

      <div className="pt-16 p-6 space-y-8 animate-fade-in min-h-screen bg-gradient-to-br from-cream-50 to-orange-50 relative">
        {/* POPUP OVERLAY */}
        {showCreditsGuide && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="relative w-[90%] max-w-4xl max-h-[80vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row">
              {/* Accent side strip */}
              <div className="hidden lg:flex w-2 bg-gradient-to-b from-orange-500 via-amber-400 to-emerald-500" />

              <div className="flex-1 p-6 sm:p-8 overflow-y-auto">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold mb-2">
                      <Info className="w-3 h-3" />
                      AtmosTrack Carbon Credit Guide
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                      How credits and DHI work in AtmosTrack
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      A quick walkthrough of the math behind your Daily Impact
                      Hours (DHI), CCT tokens and how this page fits into the
                      bigger story.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCreditsGuide(false)}
                    className="ml-4 rounded-full p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content grid */}
                <div className="grid md:grid-cols-2 gap-6 mt-4 text-sm text-gray-700">
                  <div className="space-y-4">
                    <div className="bg-cream-50 border border-cream-200 rounded-2xl p-4">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        1. Device‑Hours → DHI
                      </h3>
                      <p>
                        AtmosTrack samples your device roughly every 30 seconds
                        and checks how long it has been actively measuring and
                        improving air quality for a given day.
                      </p>
                      <p className="mt-2 text-xs text-gray-500">
                        DHI (h) ≈ number of valid readings × 30s ÷ 3600, capped
                        and sanity‑checked by the span between the first and
                        last reading of the day.
                      </p>
                    </div>

                    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        2. DHI → CCT tokens
                      </h3>
                      <p>
                        For AtmosTrack demo economics, each hour of DHI mints a
                        small amount of Carbon Cleaning Tokens (CCT).
                      </p>
                      <p className="mt-2 text-xs text-gray-600">
                        Tokens = DHI × 0.1   So a 4.95‑hour batch creates about
                        0.49 CCT tokens.
                      </p>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        3. Emissions → Required tokens
                      </h3>
                      <p>
                        In the Offset Planner, you enter your emissions in
                        tonnes of CO₂e and choose how much you want to offset.
                      </p>
                      <p className="mt-2 text-xs text-gray-600">
                        Required CCT = (Emissions in tCO₂e × Offset %) ÷ 100  
                        Example: 1 tCO₂e at 100% offset → 1.00 required CCT.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        4. This table = your daily batches
                      </h3>
                      <p>
                        Every row in the “Credit Batches” table on the right is
                        one calendar day for a specific device. DHI shows how
                        long you had climate‑positive activity, and Tokens shows
                        how much CCT that day can mint.
                      </p>
                      <p className="mt-2 text-xs text-gray-600">
                        Status <span className="font-semibold">PENDING</span>{' '}
                        means it can still be minted.{' '}
                        <span className="font-semibold">MINTED</span> means it
                        has been converted into CCT on‑chain (simulated in this
                        prototype).
                      </p>
                    </div>

                    <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        5. Retiring tokens = claiming the offset
                      </h3>
                      <p>
                        When you “retire” CCT, those tokens are locked and can
                        no longer be traded. In AtmosTrack, retirement is what
                        lets you claim an emissions offset for a given period.
                      </p>
                      <p className="mt-2 text-xs text-gray-600">
                        In this demo, the “Retire tokens” button just simulates
                        retirement for your connected Polygon wallet, so you can
                        try the UX without real on‑chain costs.
                      </p>
                    </div>

                    <div className="bg-slate-900 text-slate-100 rounded-2xl p-4">
                      <h3 className="font-semibold mb-1">How to use this page</h3>
                      <ol className="list-decimal list-inside space-y-1 text-xs sm:text-[13px]">
                        <li>
                          Connect your MetaMask wallet (Polygon) at the top.
                        </li>
                        <li>
                          In Offset Planner, pick your device + date, enter
                          emissions and offset %.
                        </li>
                        <li>
                          Click “Compute DHI & Tokens” to generate or refresh
                          that day’s batch.
                        </li>
                        <li>
                          In Credit Batches, review DHI(h) and Tokens, then hit
                          “Mint” to simulate CCT creation.
                        </li>
                        <li>
                          Finally, press “Retire tokens” once you have enough
                          CCT to cover your required amount.
                        </li>
                      </ol>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-gray-500">
                    All numbers here are demo‑economics to illustrate how a
                    device can stream verifiable climate impact into tokenized
                    carbon credits.
                  </p>
                  <button
                    onClick={() => setShowCreditsGuide(false)}
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] transition"
                  >
                    Got it – back to batches
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            Carbon Credits & Tokenization
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Turn AtmosTrack’s real‑time impact into verifiable, tokenized carbon
            credits that can be retired on‑chain.
          </p>
        </div>

        {/* Wallet status */}
        <div className="max-w-4xl mx-auto mb-4">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-cream-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-md">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800">
                  {wallet.address
                    ? `Wallet: ${wallet.address.slice(
                        0,
                        6,
                      )}...${wallet.address.slice(-4)}`
                    : 'Wallet not connected'}
                </div>
                <div className="text-xs text-gray-500">
                  Network: {wallet.chainId ?? '—'} (target: Polygon)
                </div>
              </div>
            </div>
            <button
              onClick={connectWallet}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg text-sm font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
            >
              {wallet.address ? 'Reconnect' : 'Connect MetaMask'}
            </button>
          </div>
        </div>

        {/* Main layout: calculator + batches */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Offset & batch calculator */}
          <div className="space-y-6">
            {/* My Impact summary card */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-cream-200 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">
                  My Impact (all batches)
                </div>
                <div className="mt-1 text-sm text-gray-700">
                  Total DHI:{' '}
                  <span className="font-semibold">
                    {totalDhi.toFixed(2)} h
                  </span>{' '}
                  • Tokens:{' '}
                  <span className="font-semibold">
                    {totalTokens.toFixed(2)} CCT
                  </span>
                </div>
              </div>
              <div className="text-right text-xs text-gray-500">
                <div>
                  Minted:{' '}
                  <span className="font-semibold text-emerald-600">
                    {mintedCount}
                  </span>
                </div>
                <div>
                  Pending:{' '}
                  <span className="font-semibold text-amber-600">
                    {pendingCount}
                  </span>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-800">
              Offset Planner
            </h2>

            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-cream-200 space-y-4">
              <p className="text-sm text-gray-600 mb-2">
                Use your measured emissions and choose how much to offset.
                AtmosTrack converts this to CCT tokens and daily DHI batches.
              </p>

              {/* Device + date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Device ID
                  </label>
                  <input
                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 text-sm"
                    value={offsetPlan.deviceId}
                    onChange={(e) =>
                      handleOffsetChange('deviceId', e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date (for DHI batch)
                  </label>
                  <input
                    type="date"
                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 text-sm"
                    value={offsetPlan.date}
                    onChange={(e) => handleOffsetChange('date', e.target.value)}
                  />
                </div>
              </div>

              {/* Emissions + offset % */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Emissions (tCO₂e)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 text-sm"
                    value={offsetPlan.emissionsTonnes}
                    onChange={(e) =>
                      handleOffsetChange('emissionsTonnes', e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Offset %
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={5}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 text-sm"
                    value={offsetPlan.offsetPercent}
                    onChange={(e) =>
                      handleOffsetChange('offsetPercent', e.target.value)
                    }
                  />
                </div>
              </div>

              {/* Required tokens + actions */}
              <div className="mt-2 bg-cream-50 border border-cream-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500">
                    Required CCT tokens
                  </div>
                  <div className="text-2xl font-bold text-orange-600">
                    {requiredTokens()}
                  </div>
                </div>
                <button
                  onClick={createDailyBatch}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg text-sm font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 flex items-center gap-2"
                >
                  <ArrowRightCircle className="w-4 h-4" />
                  Compute DHI & Tokens
                </button>
              </div>

              <button
                onClick={simulateRetire}
                className="w-full mt-3 p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2 text-sm"
              >
                Retire tokens (demo only)
              </button>

              {txStatus && (
                <p className="mt-3 text-xs text-gray-700 bg-white border border-cream-200 rounded-lg px-3 py-2">
                  {txStatus}
                </p>
              )}
            </div>
          </div>

          {/* Batches panel */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Credit Batches
            </h2>

            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-cream-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Daily impact batches
                  </h3>
                  <p className="text-sm text-gray-500">
                    Each batch groups Device‑Hours of Impact for a date and
                    becomes a candidate for minting CCT tokens.
                  </p>
                </div>
                <button
                  onClick={fetchBatches}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-1"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>

              {loadingBatches ? (
                <p className="text-sm text-gray-500">Loading batches…</p>
              ) : batches.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No batches yet. Compute one from the Offset Planner on the
                  left.
                </p>
              ) : (
                <div className="overflow-x-auto mt-3">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 font-medium text-gray-600">
                          Date
                        </th>
                        <th className="text-left py-2 px-3 font-medium text-gray-600">
                          Device
                        </th>
                        <th className="text-left py-2 px-3 font-medium text-gray-600">
                          DHI (h)
                        </th>
                        <th className="text-left py-2 px-3 font-medium text-gray-600">
                          Tokens
                        </th>
                        <th className="text-left py-2 px-3 font-medium text-gray-600">
                          Status
                        </th>
                        <th className="text-left py-2 px-3 font-medium text-gray-600">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {batches.map((b) => (
                        <tr key={b._id} className="border-b border-gray-100">
                          <td className="py-2 px-3 text-gray-800">{b.date}</td>
                          <td className="py-2 px-3 text-gray-600">
                            {b.deviceId}
                          </td>
                          <td className="py-2 px-3 text-gray-600">
                            {b.dhiHours.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-gray-600">
                            {b.tokens.toFixed(2)}
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-3 py-1 rounded-full text-[11px] font-semibold ${
                                b.status === 'MINTED'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {b.status}
                            </span>
                            {b.txHash && (
                              <div className="mt-1 text-[10px] text-gray-400">
                                tx: {b.txHash.slice(0, 10)}…
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            <button
                              disabled={b.status === 'MINTED'}
                              onClick={() => mintBatch(b)}
                              className={`px-3 py-1 rounded-lg text-[11px] font-semibold border ${
                                b.status === 'MINTED'
                                  ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                                  : 'text-white bg-orange-500 border-orange-500 hover:bg-orange-600'
                              }`}
                            >
                              {b.status === 'MINTED' ? 'Minted' : 'Mint'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Education teaser card under batches */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-5 shadow-xl border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-800/70 border border-slate-600 text-[11px] font-semibold text-slate-200 mb-2">
                  <Info className="w-3 h-3 text-amber-300" />
                  New to carbon credits?
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Not sure what these batches and tokens mean?
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md">
                  Learn how AtmosTrack translates your device’s cleaning time
                  into carbon credits and how to use DHI, tokens, and retirement
                  to plan real offsets.
                </p>
              </div>
              <button
                onClick={() => setShowCreditsGuide(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 text-xs font-semibold shadow-md hover:shadow-lg hover:scale-[1.03] transition"
              >
                Learn about AtmosTrack credits
                <ArrowRightCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CarbonDashboard;
