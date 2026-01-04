import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Wallet, RefreshCw, ArrowRightCircle } from 'lucide-react';

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
};

type OffsetPlan = {
  deviceId: string;
  date: string;
  emissionsTonnes: number;
  offsetPercent: number;
};

const API_BASE = 'http://localhost:5000';

const CarbonDashboard: React.FC = () => {
  const [wallet, setWallet] = useState<WalletState>({ address: null, chainId: null });
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [offsetPlan, setOffsetPlan] = useState<OffsetPlan>({
    deviceId: 'ATMOSTRACK-01',
    date: new Date().toISOString().slice(0, 10),
    emissionsTonnes: 1,
    offsetPercent: 100,
  });
  const [txStatus, setTxStatus] = useState<string | null>(null);

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

  // BATCHES
  const fetchBatches = async () => {
    setLoadingBatches(true);
    try {
      // TODO: replace with real list endpoint when you add it
      console.log('fetchBatches: add GET /api/carbon/batches later');
    } catch (err) {
      console.error('fetchBatches error:', err);
    } finally {
      setLoadingBatches(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  // CREATE BATCH
  const createDailyBatch = async () => {
    try {
      const res = await axios.post(`${API_BASE}/api/carbon/credit-batch`, {
        deviceId: offsetPlan.deviceId,
        date: offsetPlan.date,
      });
      console.log(res.data);
      setTxStatus('Computed DHI and tokens for that day.');
      fetchBatches();
    } catch (err) {
      console.error('createDailyBatch error:', err);
      setTxStatus('Failed to compute DHI.');
    }
  };

  // OFFSET CALC
  const requiredTokens = () => {
    const { emissionsTonnes, offsetPercent } = offsetPlan;
    return ((emissionsTonnes * offsetPercent) / 100).toFixed(2);
  };

  const handleOffsetChange = (field: keyof OffsetPlan, value: string | number) => {
    setOffsetPlan((prev) => ({
      ...prev,
      [field]:
        field === 'emissionsTonnes' || field === 'offsetPercent' ? Number(value) : value,
    }));
  };

  // PLACEHOLDER RETIRE
  const simulateRetire = () => {
    if (!wallet.address) {
      alert('Connect wallet first.');
      return;
    }
    setTxStatus(
      `Simulated retirement of ${requiredTokens()} CCT tokens from ${wallet.address} (Polygon).`,
    );
  };

  return (
    <div className="pt-16 p-6 space-y-8 animate-fade-in min-h-screen bg-gradient-to-br from-cream-50 to-orange-50">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-3">
          Carbon Credits & Tokenization
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Turn AtmosTrack’s real‑time impact into verifiable, tokenized carbon credits that
          can be retired on‑chain.
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
                  ? `Wallet: ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`
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
          <h2 className="text-2xl font-bold text-gray-800">Offset Planner</h2>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-cream-200 space-y-4">
            <p className="text-sm text-gray-600 mb-2">
              Use your measured emissions and choose how much to offset. AtmosTrack converts
              this to CCT tokens and daily DHI batches.
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
                  onChange={(e) => handleOffsetChange('deviceId', e.target.value)}
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
                  onChange={(e) => handleOffsetChange('emissionsTonnes', e.target.value)}
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
                  onChange={(e) => handleOffsetChange('offsetPercent', e.target.value)}
                />
              </div>
            </div>

            {/* Required tokens + actions */}
            <div className="mt-2 bg-cream-50 border border-cream-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500">Required CCT tokens</div>
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
          <h2 className="text-2xl font-bold text-gray-800">Credit Batches</h2>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-cream-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Daily impact batches
                </h3>
                <p className="text-sm text-gray-500">
                  Each batch groups Device‑Hours of Impact for a date and becomes a candidate
                  for minting CCT tokens.
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
                No batches yet. Compute one from the Offset Planner on the left.
              </p>
            ) : (
              <div className="overflow-x-auto mt-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 font-medium text-gray-600">Date</th>
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
                    </tr>
                  </thead>
                  <tbody>
                    {batches.map((b) => (
                      <tr key={b._id} className="border-b border-gray-100">
                        <td className="py-2 px-3 text-gray-800">{b.date}</td>
                        <td className="py-2 px-3 text-gray-600">{b.deviceId}</td>
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarbonDashboard;
