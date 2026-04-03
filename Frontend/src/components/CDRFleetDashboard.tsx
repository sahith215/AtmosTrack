import React, { useState } from 'react';
import { 
  TrendingUp, 
  Zap, 
  ShieldCheck, 
  Factory, 
  BarChart3, 
  Globe, 
  Layers, 
  Coins,
  Cpu,
  ChevronRight,
  Activity,
  Box
} from 'lucide-react';

const CDRFleetDashboard: React.FC = () => {
  const [skidCount, setSkidCount] = useState(1);
  
  // Operational Metrics
  const tonsPerSkid = 250;
  const revenuePerSkid = 4500000;
  const opexPerSkid = 1500000;
  const netSurplusPerSkid = 3000000;
  const citizenYieldPerSkid = netSurplusPerSkid * 0.075;

  const totalTons = skidCount * tonsPerSkid;
  const totalRevenue = skidCount * revenuePerSkid;
  const totalNet = skidCount * netSurplusPerSkid;
  const totalYield = skidCount * citizenYieldPerSkid;

  return (
    <div className="pt-16 min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 to-orange-50/30 animate-fade-in">
      
      {/* ── HEADER SECTION ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-800 p-8 md:p-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] -mr-48 -mt-48" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-2xl text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-black uppercase tracking-widest mb-6 font-mono">
                <Activity className="w-3.5 h-3.5" />
                Fleet Operations Floor
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-6">
                CDR Fleet <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                  Command Console
                </span>
              </h1>
              <p className="text-lg text-slate-400 leading-relaxed mb-8">
                Monitoring and managing the deployment of AtmosTrack Carbon Removal Modules across 
                industrial kiln sites. Verified real-time mineralization and fleet output at scale.
              </p>
              
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/5 border border-white/10">
                  <Box className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm text-white font-bold tracking-tight">Active Deployment: LIET Node 01</span>
                </div>
                <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/5 border border-white/10">
                  <ShieldCheck className="w-5 h-5 text-orange-400" />
                  <span className="text-sm text-white font-bold tracking-tight">dMRV Status: Verified</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 w-full md:w-72">
              {[
                { label: 'Unit CapEx', value: '₹9 Lakh', icon: Cpu, color: 'text-orange-400' },
                { label: 'Annual Net', value: '₹30 Lakh', icon: Coins, color: 'text-emerald-400' },
                { label: 'Efficiency', value: '95.0%', icon: BarChart3, color: 'text-teal-400' },
              ].map((m) => (
                <div key={m.label} className="bg-slate-800/50 border border-white/5 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <m.icon className={`w-4 h-4 ${m.color}`} />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{m.label}</span>
                  </div>
                  <p className="text-xl font-black text-white">{m.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── EXPANSION SIMULATOR ──────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-12">
        <div className="bg-white/80 backdrop-blur-md rounded-[3rem] border border-cream-200 shadow-xl overflow-hidden">
          <div className="p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-12 mb-12">
              <div className="max-w-xl">
                <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Fleet Expansion Projection</h2>
                <p className="text-gray-500 leading-relaxed text-sm">
                  Simulate the operational and carbon impact of horizontally scaling the AtmosTrack 
                  modular fleet across national cement manufacturing clusters.
                </p>
              </div>
              <div className="w-full md:w-80 p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex flex-col items-center">
                <label className="text-[10px] font-black text-emerald-800 mb-4 uppercase tracking-widest font-mono">Managed Fleet Size</label>
                <input 
                  type="range" 
                  min="1" 
                  max="500" 
                  value={skidCount} 
                  onChange={(e) => setSkidCount(parseInt(e.target.value))}
                  className="w-full h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 mb-4"
                />
                <div className="text-4xl font-black text-emerald-600 flex items-baseline gap-2">
                  {skidCount} 
                  <span className="text-sm font-bold text-emerald-400">SKIDS</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'Fleet CO₂ Removal', value: totalTons.toLocaleString(), unit: 'TONS/YR', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Gross Revenue', value: `₹${(totalRevenue / 10000000).toFixed(2)}`, unit: 'Cr/YR', color: 'text-slate-900', bg: 'bg-slate-50' },
                { label: 'Net Surplus', value: `₹${(totalNet / 10000000).toFixed(2)}`, unit: 'Cr/YR', color: 'text-orange-600', bg: 'bg-orange-50' },
                { label: 'Citizen Pool Yield', value: `₹${(totalYield / 10000000).toFixed(2)}`, unit: 'Cr/YR', color: 'text-blue-600', bg: 'bg-blue-50' },
              ].map((m) => (
                <div key={m.label} className={`${m.bg} rounded-3xl p-8 border border-black/5 flex flex-col items-center text-center`}>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{m.label}</p>
                  <p className={`text-3xl font-black ${m.color} mb-1`}>{m.value}</p>
                  <p className="text-[10px] font-bold text-gray-400">{m.unit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── OPERATIONAL MOATS SECTION ─────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 bg-white rounded-[3rem] p-10 border border-cream-200 shadow-xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center">
                <Factory className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="text-xl font-black text-gray-900 uppercase">Operational Moats</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: 'Physicochemical Lock-in', desc: 'Each module is calibrated to specific plant exhaust chemistry, creating significant technical switching costs.' },
                { title: 'Sorbent-Waste Symbiosis', desc: 'Utilizing host plant waste material as the mineralization agent maintains 0raw material Opex.' },
                { title: 'Multi-Sensor dMRV', desc: '15 redundant industrial sensors ensure institutional-grade verification for on-chain carbon credits.' },
                { title: 'Modular Portability', desc: 'Skid-based design allows for rapid relocation or replacement without site-wide industrial downtime.' },
              ].map((m) => (
                <div key={m.title} className="p-5 rounded-2xl bg-gray-50 border border-gray-100">
                  <p className="text-sm font-black text-orange-600 mb-1">{m.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 rounded-[3rem] p-10 text-white flex flex-col shadow-2xl relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-[60px]" />
            <h3 className="text-xl font-black mb-8 flex items-center gap-3 font-mono">
              <Layers className="w-5 h-5 text-orange-400" />
              FLEET ROADMAP
            </h3>
            <div className="space-y-8 flex-1">
              {[
                { phase: 'Phase 1', title: 'Cluster Demo', desc: 'Initial deployment at LIET Cement Hub. 250t net removal.' },
                { phase: 'Phase 2', title: 'Regional Scale', desc: '15-module expansion across the AP industrial corridor.' },
                { phase: 'Phase 3', title: 'National Hubs', desc: 'Full integration with Top 10 Indian cement conglomerates.' },
              ].map((s) => (
                <div key={s.phase} className="relative pl-6 border-lborder-slate-800">
                  <div className="absolute left-[-1px] top-0 w-2 h-2 rounded-full bg-orange-500" />
                  <p className="text-[10px] font-black text-slate-500 uppercase mb-1">{s.phase}</p>
                  <p className="text-sm font-bold text-white mb-1">{s.title}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
            <button
               onClick={() => window.print()}
               className="mt-10 w-full flex items-center justify-between px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/10"
            >
              Export Fleet Status
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </section>

    </div>
  );
};

export default CDRFleetDashboard;
