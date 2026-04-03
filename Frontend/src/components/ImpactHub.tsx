import React, { useState } from 'react';
import {
  ArrowRightCircle, Info, X,
  BadgePercent, Activity, GitBranch, BarChart3,
  Network, Shield, Building2, Factory, Users,
  Briefcase, Lock, Database, TrendingUp,
  CheckCircle, ArrowDown, Flame, Package,
  Zap, Leaf, Boxes, FileCheck
} from 'lucide-react';

const ImpactHub: React.FC = () => {
  const [activePage, setActivePage] = useState<'hub' | 'entitlement' | 'device' | 'lifecycle' | 'revenue' | 'ecosystem' | 'scale'>('hub');
  const [showCreditsGuide, setShowCreditsGuide] = useState(false);

  const renderNavCard = (
    title: string, desc: string, target: 'entitlement' | 'device' | 'lifecycle' | 'revenue' | 'ecosystem' | 'scale',
    Icon: any, pillText: string, pillColor: string
  ) => (
    <div
      onClick={() => setActivePage(target)}
      className="bg-white/80 rounded-2xl border border-cream-200 p-6 cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all relative group"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shadow">
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
      </div>
      <p className="text-sm text-gray-500 mb-5">{desc}</p>
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold ${pillColor}`}>
        {pillText}
      </div>
      <ArrowRightCircle className="absolute bottom-6 right-6 w-5 h-5 text-gray-300 group-hover:text-orange-500 transition-colors" />
    </div>
  );

  const BackButton = () => (
    <div
      onClick={() => setActivePage('hub')}
      className="mb-6 inline-flex items-center text-sm text-gray-500 hover:text-gray-900 cursor-pointer transition-colors"
    >
      ← Impact Hub
    </div>
  );

  return (
    <>
      <div className="pt-16 min-h-screen bg-gradient-to-br from-cream-50 via-orange-50/40 to-amber-50 animate-fade-in relative leading-relaxed">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

          {/* Guide Modal mapped globally */}
          {showCreditsGuide && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row">
                <div className="hidden lg:flex w-2 bg-gradient-to-b from-orange-500 via-amber-400 to-emerald-500" />
                <div className="flex-1 p-6 sm:p-8 overflow-y-auto">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold mb-2 border border-amber-100">
                        <Info className="w-3 h-3" />
                        Carbon Mineralization Guide
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Decentralized Carbon Mineralization</h2>
                    </div>
                    <button onClick={() => setShowCreditsGuide(false)} className="rounded-full p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-700">
                    <div className="bg-cream-50 border border-cream-200 rounded-2xl p-5">
                      <h3 className="font-bold text-gray-900 mb-2">1. How CO₂ Removal Works</h3>
                      <p className="leading-relaxed">The CDR module at a cement plant captures CO₂ from industrial exhaust through accelerated mineralization. 15 sensors measure the removal in real time.</p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
                      <h3 className="font-bold text-gray-900 mb-2">2. How Credits Are Generated</h3>
                      <p className="leading-relaxed">Every verified ton of CO₂ removed = 1 Carbon Removal Unit (CRU). Sold to corporations at ₹18,000/ton, generating ₹45,00,000 gross per year.</p>
                    </div>
                    <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5">
                      <h3 className="font-bold text-gray-900 mb-2">3. Your Entitlement</h3>
                      <p className="leading-relaxed">₹3,000 fee = 0.333% of one module. This entitles you to a ₹1,500 annual lease payout from Year 2, representing a 50% annual yield.</p>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
                      <h3 className="font-bold text-gray-900 mb-2">4. What is dMRV?</h3>
                      <p className="leading-relaxed">Digital Monitoring, Reporting & Verification. 15 industrial sensors automatically validate every ton removed — no manual audits or greenwashing possible.</p>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <button onClick={() => setShowCreditsGuide(false)} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-bold shadow-md hover:scale-[1.02] transition">
                      Understood
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PAGE 0: HUB */}
          {activePage === 'hub' && (
            <div className="animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-end flex-wrap sm:justify-between gap-4 mb-8">
                <div>
                  <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none">
                    Carbon <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Hub</span>
                  </h1>
                  <p className="text-sm text-gray-500 mt-2">AtmosTrack's complete carbon intelligence platform</p>
                </div>
                <button onClick={() => setShowCreditsGuide(true)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-amber-300 text-xs font-bold border border-slate-700 hover:scale-[1.02] transition shrink-0 shadow-lg">
                  <Info className="w-4 h-4" /> How Credits Work
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                {[
                  { label: "Verified Removal · YTD", val: "247.3 tons", c: "text-emerald-600" },
                  { label: "Capacity Lessors", val: "147", c: "text-orange-600" },
                  { label: "Gross · Single Module", val: "₹45,00,000", c: "text-purple-600" },
                  { label: "7.5% Allocated · Year 2", val: "₹2,25,000", c: "text-amber-600" }
                ].map((s, i) => (
                  <div key={i} className="bg-white/80 backdrop-blur-md rounded-2xl border border-cream-200 p-6 text-center shadow-sm">
                    <div className={`text-2xl sm:text-3xl font-black ${s.c} mb-1`}>{s.val}</div>
                    <div className="text-[11px] text-gray-500 font-bold tracking-wide uppercase">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {renderNavCard('My Entitlement', 'View your ₹3,000 fractional capacity share, annual lease payout of ₹1,500, and download your impact certificate.', 'entitlement', BadgePercent, '0.333% Module Share', 'bg-amber-50 text-amber-700 border border-amber-200')}
                {renderNavCard('Device & Module Health', 'Live dMRV sensor telemetry, process flow status, SOx levels, reactor health, and 15-sensor operational overview.', 'device', Activity, '● OPERATIONAL', 'bg-emerald-50 text-emerald-700 border border-emerald-200')}
                {renderNavCard('Credit Lifecycle', 'Track the 6-stage automated pipeline from sensor verification to credit retirement and capacity reconciliation.', 'lifecycle', GitBranch, 'Stage 3: dMRV Validation', 'bg-cyan-50 text-cyan-700 border border-cyan-200')}
                {renderNavCard('Revenue & Allocation', 'See the full revenue waterfall, 92.5% platform split, 7.5% citizen pool, and 5-year margin projections.', 'revenue', BarChart3, '₹45,00,000 Annual Revenue', 'bg-emerald-50 text-emerald-700 border border-emerald-200')}
                {renderNavCard('Ecosystem & Stakeholders', 'See how AtmosTrack, industrial hosts, citizens, and institutional buyers interact — who pays who, what flows where, and how value circulates across the platform.', 'ecosystem', Network, '4 Stakeholder Model', 'bg-purple-50 text-purple-700 border border-purple-200')}
                {renderNavCard('Scale & Defensibility', '3-phase national deployment roadmap, 3 operational moats that prevent replication, and risk mitigation framework across site volatility, gas impurity, regulation, and carbon price.', 'scale', Shield, '500+ Cement Plants · ICM 2026', 'bg-slate-100 text-slate-700 border border-slate-300')}
              </div>

              <div className="bg-slate-900 rounded-2xl p-6 border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-600 text-[11px] font-semibold text-slate-200 mb-2">
                    <Info className="w-3 h-3 text-amber-300" />
                    Protocol Economics
                  </div>
                  <h3 className="text-lg font-semibold text-white">How fractional capacity generates yield</h3>
                  <p className="text-sm text-slate-400 mt-1 max-w-md">Learn how physical CO₂ removal in industrial modules translates into verifiable citizen lease payouts.</p>
                </div>
                <button onClick={() => setShowCreditsGuide(true)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-900 text-xs font-bold shadow-md hover:scale-[1.02] transition">
                  Explore Patent System
                  <ArrowRightCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* PAGE 1: ENTITLEMENT */}
          {activePage === 'entitlement' && (
            <div className="animate-fade-in">
              <BackButton />
              <div className="mb-6">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">My Entitlement</h1>
                <p className="text-sm text-gray-500 mt-1">Your fractional capacity share in AtmosTrack CDR Module ATMSTRK-MOD-001</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl p-6 text-white shadow-lg flex flex-col justify-between min-h-[240px]">
                  <div className="flex justify-between items-start text-xs font-bold tracking-widest opacity-80">
                    <div>ATMOSTRACK</div>
                    <div>CAPACITY ENTITLEMENT</div>
                  </div>
                  <div className="my-8">
                    <div className="text-5xl font-black mb-1">0.333%</div>
                    <div className="text-sm font-medium opacity-90">Fractional Share · ATMSTRK-MOD-001</div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-medium mb-3">
                      <div>Lessor ID: ACL-2026-0147</div>
                      <div>Active Since: Jan 2026</div>
                    </div>
                    <div className="border-t border-white/20 pt-3 text-[10px] font-bold tracking-wide">
                      SERVICE TERM: 5 YEARS · STATUS: ACTIVE
                    </div>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-md border border-cream-200 rounded-2xl p-6 shadow-sm flex flex-col justify-center">
                  {[
                    ['Acquisition Fee', '₹3,000', 'One-time'],
                    ['Annual Lease Fee', '₹1,500', 'From Year 2'],
                    ['Annual Yield', <span key="ay" className="text-emerald-600 font-bold">50%</span>, ''],
                    ['Cumulative CO₂ Impact', '0.833 tons', 'verified'],
                    ['Entitlement Status', <span key="es" className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700">ACTIVE</span>, '']
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between items-center py-3 border-b border-cream-200 last:border-0 last:pb-0">
                      <div className="text-sm font-medium text-gray-700">{row[0]}</div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-bold text-gray-900">{row[1]}</div>
                        <div className="text-[11px] text-gray-400 w-16 text-right leading-none">{row[2]}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-cream-200 p-6 mb-8 shadow-sm">
                <h3 className="font-bold text-gray-900 text-lg mb-6">5-Year Payout Schedule</h3>
                <div className="flex flex-col sm:flex-row justify-between items-center relative pt-4 pb-2 px-4 gap-4 sm:gap-0">
                  <div className="hidden sm:block absolute top-7 left-12 right-12 h-px bg-gray-200 -z-10"></div>
                  {[
                    { y: 'Year 1', c: 'bg-gray-100 text-gray-400 border-gray-200', l: 'commissioning' },
                    { y: 'Year 2', c: 'bg-emerald-500 text-white border-emerald-500', l: '₹1,500' },
                    { y: 'Year 3', c: 'bg-emerald-500 text-white border-emerald-500', l: '₹1,500' },
                    { y: 'Year 4', c: 'bg-amber-100 text-amber-600 border-amber-200', l: '₹1,500' },
                    { y: 'Year 5', c: 'bg-amber-100 text-amber-600 border-amber-200', l: '₹1,500' },
                    { y: 'Year 6', c: 'bg-amber-100 text-amber-600 border-amber-200', l: '₹1,500 + Final Validation' },
                  ].map((n, i) => (
                    <div key={i} className="flex flex-col items-center flex-1 relative w-full sm:w-auto">
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold ${n.c}`}>
                        {i + 1}
                      </div>
                      <div className="text-xs font-medium text-gray-900 mt-2">{n.y}</div>
                      <div className="text-[11px] text-gray-500 text-center">{n.l}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-cream-200 p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 text-lg">Impact Certificate</h3>
                <p className="text-sm text-gray-500 mb-6">Generate your verified removal certificate</p>
                <div className="bg-cream-50 border-2 border-dashed border-orange-200 rounded-xl p-6 mb-6">
                  <div className="text-center text-xs font-bold tracking-widest text-orange-600 mb-4 uppercase">Certificate of Removal Validation</div>
                  <div className="text-center text-sm font-medium text-gray-700 mb-6 font-serif italic">Issuer: AtmosTrack Impact Hub</div>
                  <div className="max-w-2xl mx-auto divide-y divide-gray-200">
                    {[
                      ['Certificate ID', 'ATMS-CERT-2026-004'],
                      ['Holder', 'ACL-2026-0147'],
                      ['Module ID', 'ATMSTRK-MOD-001'],
                      ['Share %', '0.333%'],
                      ['CO₂ Impact', '0.833 tons'],
                      ['Issue Date', 'April 3, 2026'],
                    ].map((row, i) => (
                      <div key={i} className="flex justify-between py-2.5 text-sm">
                        <span className="text-gray-500">{row[0]}</span>
                        <span className="font-semibold text-gray-900">{row[1]}</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-center text-[10px] text-gray-400 mt-6 font-bold tracking-tight">PURO.EARTH-ALIGNED · dMRV VERIFIED · TAMPER-EVIDENT</div>
                </div>
                <div className="flex gap-4">
                  <button className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 shadow-md hover:scale-[1.02] transition">
                    Generate Certificate
                  </button>
                  <button className="px-6 py-2.5 rounded-xl text-xs font-bold text-orange-600 bg-white border border-orange-200 hover:bg-orange-50 transition shadow-sm">
                    Share Certificate
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PAGE 2: DEVICE */}
          {activePage === 'device' && (
            <div className="animate-fade-in">
              <BackButton />
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-3xl font-black text-gray-900 tracking-tight">Device & Module Health</h1>
                  <p className="text-sm text-gray-500 mt-1">Live dMRV telemetry · 15 industrial sensors · 300s intervals</p>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full shrink-0">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Operational</span>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                  { v: '18.7%', c: 'text-orange-600', l: 'Flue Gas CO₂ Delta', s: 'Target: ≥15%' },
                  { v: '0.68 t/day', c: 'text-emerald-600', l: 'Net Sequestration Rate', s: 'Capacity: 0.76 t/day' },
                  { v: '312 ppm', c: 'text-amber-600', l: 'SOx Concentration', s: 'Limit: 800 ppm · Guard: ACTIVE' },
                  { v: '9.2', c: 'text-purple-600', l: 'Mineralization Reactor', s: 'Optimal range: 8.5–10.5' },
                ].map((st, i) => (
                  <div key={i} className="bg-white/80 rounded-2xl border border-cream-200 p-6 shadow-sm">
                    <div className={`text-2xl sm:text-3xl font-black ${st.c} mb-1`}>{st.v}</div>
                    <div className="text-xs font-bold text-gray-700">{st.l}</div>
                    <div className="text-[10px] text-gray-400 mt-1">{st.s}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-cream-200 p-6 shadow-sm">
                  <h3 className="font-bold text-gray-900 text-lg mb-4">4-Stage Process Flow</h3>
                  <div className="space-y-1">
                    {[
                      { n: 1, name: 'Pre-Conditioning & SOx Stripping', status: 'NORMAL', sc: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                      { n: 2, name: 'Vacuum-Swing Adsorption (VSA)', status: 'NORMAL', sc: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                      { n: 3, name: 'Accelerated Mineralization', status: 'NORMAL', sc: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                      { n: 4, name: 'Aggregate Output & dMRV', status: 'MONITORING', sc: 'bg-amber-50 text-amber-700 border-amber-200' },
                    ].map((step, i) => (
                      <div key={i} className="flex items-center gap-4 py-3 border-b border-cream-200 last:border-0 hover:bg-cream-50/50 transition px-2 rounded-xl">
                        <div className={`w-9 h-9 rounded-full flex justify-center items-center font-bold text-xs shrink-0 ${step.status === 'NORMAL' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {step.n}
                        </div>
                        <div className="font-semibold text-gray-900 text-sm flex-1">{step.name}</div>
                        <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${step.sc}`}>
                          {step.status}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-3.5 text-xs text-amber-800 flex gap-2 items-start">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <p><span className="font-bold">Stage 4 Note:</span> Guard bed at 78% capacity. Predictive replacement scheduled in 14 days.</p>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-cream-200 p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-900 text-lg">All Active Sensors (15 total)</h3>
                    <div className="text-xs text-orange-600 font-bold cursor-pointer hover:underline uppercase tracking-tight">View all</div>
                  </div>
                  <div className="overflow-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="border-b border-gray-200 text-[11px] uppercase text-gray-400 font-bold tracking-widest">
                          <th className="pb-3 px-2">Sensor</th>
                          <th className="pb-3 px-2">Reading</th>
                          <th className="pb-3 px-2">Unit</th>
                          <th className="pb-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ['Thermal Input', '63', '°C', '✓ Normal', 'bg-emerald-50 text-emerald-700 border-emerald-200'],
                          ['Vacuum Pressure', '0.31', 'bar', '✓ Normal', 'bg-emerald-50 text-emerald-700 border-emerald-200'],
                          ['ORC Efficiency', '94', '%', '✓ Normal', 'bg-emerald-50 text-emerald-700 border-emerald-200'],
                          ['Kiln Dust Feed', '2.1', 't/day', '✓ Normal', 'bg-emerald-50 text-emerald-700 border-emerald-200'],
                          ['Aggregate Output', '2.9', 't/day', '✓ Normal', 'bg-emerald-50 text-emerald-700 border-emerald-200'],
                          ['Guard Bed Health', '78', '%', '⚠ Monitor', 'bg-amber-50 text-amber-700 border-amber-200'],
                        ].map((row, i) => (
                          <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                            <td className="py-3 px-2 font-medium text-gray-900">{row[0]}</td>
                            <td className="py-3 px-2 font-mono text-gray-600">{row[1]}</td>
                            <td className="py-3 px-2 text-gray-500">{row[2]}</td>
                            <td className="py-3 text-right">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${row[4]}`}>{row[3]}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-cream-200 p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 text-lg mb-6">Module Specifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                  {[
                    ['Footprint', '4m × 3m × 2.5m Skid'],
                    ['Thermal Input', '≥60°C Waste Heat (ORC)'],
                    ['Reagent Input', '~2.2 t/day Kiln Dust'],
                    ['Gross Capture', '280 tons CO₂/year'],
                    ['Net Removal', '250 tons CO₂/year (LCA-adjusted)'],
                    ['Impurity Guard', 'Multi-Stage Zeolite SOx/NOx'],
                    ['Host Site', 'Cement Plant Alpha'],
                    ['Module ID', 'ATMSTRK-MOD-001'],
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between py-3.5 border-b border-gray-100 last:border-0">
                      <span className="text-sm font-medium text-gray-600">{row[0]}</span>
                      <span className="text-sm font-bold text-gray-900">{row[1]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CHANGE 3: Industrial Symbiosis */}
              <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-cream-200 p-6 shadow-sm mt-8">
                <div className="mb-8">
                  <h3 className="font-bold text-gray-900 text-lg">Industrial Symbiosis</h3>
                  <p className="text-sm text-gray-500 mt-1">How the module integrates with the host cement plant</p>
                </div>

                <div className="flex flex-col lg:flex-row items-stretch gap-2">
                  {/* Left Column - INPUTS */}
                  <div className="flex-1 bg-orange-50 border border-orange-100 rounded-2xl p-5 text-center">
                    <h4 className="text-xs font-black uppercase tracking-widest text-orange-700 mb-4">Host Site Inputs</h4>
                    <div className="flex items-center gap-3 bg-white rounded-xl p-3 mb-2 border border-orange-100 shadow-sm">
                      <Flame className="w-5 h-5 text-orange-500" />
                      <div className="text-left">
                        <div className="text-xs font-bold text-gray-900">60°C Flue Gas</div>
                        <div className="text-[10px] text-gray-500">200mm diameter pipe</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white rounded-xl p-3 mb-2 border border-orange-100 shadow-sm">
                      <Package className="w-5 h-5 text-amber-600" />
                      <div className="text-left">
                        <div className="text-xs font-bold text-gray-900">Kiln Dust Feed</div>
                        <div className="text-[10px] text-gray-500">~2.2 t/day · CaO-rich</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white rounded-xl p-3 mb-2 border border-orange-100 shadow-sm">
                      <Zap className="w-5 h-5 text-yellow-500" />
                      <div className="text-left">
                        <div className="text-xs font-bold text-gray-900">Waste Heat</div>
                        <div className="text-[10px] text-gray-500">ORC loop recovery</div>
                      </div>
                    </div>
                  </div>

                  {/* Arrow indicating flow to center */}
                  <div className="hidden lg:flex flex-col items-center justify-center gap-2 px-1">
                    <div className="border-l-2 border-dashed border-gray-300 h-16 mx-auto"></div>
                    <ArrowRightCircle className="w-5 h-5 text-gray-400 rotate-90 lg:rotate-0" />
                    <div className="border-l-2 border-dashed border-gray-300 h-16 mx-auto"></div>
                  </div>

                  {/* Center Column - THE MODULE */}
                  <div className="flex-1 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl p-5 text-white text-center flex flex-col items-center justify-center min-h-[220px] shadow-lg mx-0 lg:mx-2">
                    <div className="white/20 bg-white/20 rounded-full px-3 py-1 text-[10px] font-bold tracking-widest mb-4">PROCESSING</div>
                    <div className="text-xl font-black mb-1 leading-tight">CDR Module</div>
                    <div className="text-[11px] opacity-80 font-mono mb-4 text-orange-50">ATMSTRK-MOD-001</div>
                    <div className="w-full h-px bg-white/20 mb-4"></div>
                    <div className="grid grid-cols-2 gap-2 w-full">
                      {["SOx Guard", "VSA Sorption", "Mineralization", "dMRV Layer"].map((tag, i) => (
                        <div key={i} className="bg-white/20 rounded-lg px-2 py-1.5 text-[9px] font-bold text-center">
                          {tag}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 text-[10px] font-bold text-orange-50/70">95% conversion efficiency</div>
                  </div>

                  {/* Arrow indicating flow to right */}
                  <div className="hidden lg:flex flex-col items-center justify-center gap-2 px-1">
                    <div className="border-l-2 border-dashed border-gray-300 h-16 mx-auto"></div>
                    <ArrowRightCircle className="w-5 h-5 text-gray-400 rotate-90 lg:rotate-0" />
                    <div className="border-l-2 border-dashed border-gray-300 h-16 mx-auto"></div>
                  </div>

                  {/* Right Column - OUTPUTS */}
                  <div className="flex-1 bg-emerald-50 border border-emerald-100 rounded-2xl p-5 text-center">
                    <h4 className="text-xs font-black uppercase tracking-widest text-emerald-700 mb-4">Module Outputs</h4>
                    <div className="flex items-center gap-3 bg-white rounded-xl p-3 mb-2 border border-emerald-100 shadow-sm relative">
                      <Leaf className="w-5 h-5 text-emerald-500" />
                      <div className="text-left flex-1">
                        <div className="text-xs font-bold text-gray-900">250t CO₂/year</div>
                        <div className="text-[10px] text-gray-500">Net verified removal</div>
                      </div>
                      <div className="bg-emerald-50 text-emerald-700 text-[8px] font-black px-1.5 py-0.5 rounded border border-emerald-100">CREDITS</div>
                    </div>
                    <div className="flex items-center gap-3 bg-white rounded-xl p-3 mb-2 border border-emerald-100 shadow-sm relative">
                      <Boxes className="w-5 h-5 text-teal-600" />
                      <div className="text-left flex-1">
                        <div className="text-xs font-bold text-gray-900">3.0 t/day Aggregate</div>
                        <div className="text-[10px] text-gray-500">Green Clinker substitute</div>
                      </div>
                      <div className="bg-teal-50 text-teal-700 text-[8px] font-black px-1.5 py-0.5 rounded border border-teal-100">SOLD</div>
                    </div>
                    <div className="flex items-center gap-3 bg-white rounded-xl p-3 mb-2 border border-emerald-100 shadow-sm relative">
                      <BarChart3 className="w-5 h-5 text-purple-500" />
                      <div className="text-left flex-1">
                        <div className="text-xs font-bold text-gray-900">₹18L/year</div>
                        <div className="text-[10px] text-gray-500">Aggregate revenue</div>
                      </div>
                      <div className="bg-purple-50 text-purple-700 text-[8px] font-black px-1.5 py-0.5 rounded border border-purple-100">REVENUE</div>
                    </div>
                    <div className="flex items-center gap-3 bg-white rounded-xl p-3 mb-2 border border-emerald-100 shadow-sm relative">
                      <FileCheck className="w-5 h-5 text-blue-500" />
                      <div className="text-left flex-1">
                        <div className="text-xs font-bold text-gray-900">ESG Certificate</div>
                        <div className="text-[10px] text-gray-500">Institutional reporting</div>
                      </div>
                      <div className="bg-blue-50 text-blue-700 text-[8px] font-black px-1.5 py-0.5 rounded border border-blue-100">VERIFIED</div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between mt-6 border border-slate-700">
                  <div className="text-sm font-black text-white px-2 italic uppercase tracking-tighter">Industrial Symbiosis Model</div>
                  <div className="flex flex-wrap justify-center gap-3">
                    {[
                      { l: "Zero External Energy", c: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
                      { l: "Waste → Value", c: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
                      { l: "2 Revenue Streams", c: "bg-blue-500/20 text-blue-300 border-blue-500/30" }
                    ].map((p, i) => (
                      <div key={i} className={`rounded-full px-3 py-1 text-[10px] font-bold border ${p.c}`}>
                        {p.l}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PAGE 3: LIFECYCLE */}
          {activePage === 'lifecycle' && (
            <div className="animate-fade-in">
              <BackButton />
              <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-black text-gray-900 tracking-tight">Credit Lifecycle</h1>
                  <p className="text-sm text-gray-500 mt-1">Automated 6-stage pipeline from physical sequestration to verified credit retirement</p>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-cream-200 p-7 shadow-sm mb-8">
                <h3 className="font-bold text-gray-900 text-lg">Lifecycle State Machine</h3>
                <p className="text-xs text-gray-500 mb-8 mt-1">Each transition gated by dMRV sensor verification</p>
                <div className="space-y-0">
                  {[
                    { n: 1, name: 'MODULE ACTIVE', state: 'COMPLETE', t: 'Host site commissioned · 100+ sensors online · XRD baseline validated', c: 'bg-emerald-500 text-white', pc: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                    { n: 2, name: 'OPERATIONAL BATCH', state: 'COMPLETE', t: '≥20 tCO₂ threshold reached · Batch ID: ATMSTRK-BATCH-2026-047 generated', c: 'bg-emerald-500 text-white', pc: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                    { n: 3, name: 'dMRV VALIDATED', state: 'ACTIVE', t: 'Cross-referenced with third-party audit · Encrypted sensor logs verified', c: 'bg-orange-500 text-white ring-2 ring-orange-200 animate-pulse', pc: 'bg-orange-50 text-orange-700 border-orange-200' },
                    { n: 4, name: 'ASSET LIQUIDATION', state: 'PENDING', t: 'Market-ready · Institutional offtaker selection', c: 'bg-gray-100 text-gray-400', pc: 'bg-gray-50 text-gray-500 border-gray-200' },
                    { n: 5, name: 'CREDIT RETIREMENT', state: 'PENDING', t: 'Certificate of Permanent Removal generated · Batch locked', c: 'bg-gray-100 text-gray-400', pc: 'bg-gray-50 text-gray-500 border-gray-200' },
                    { n: 6, name: 'CAPACITY RECONCILIATION', state: 'PENDING', t: '7.5% pool distributed to 147 capacity lessors · Lease fees appended to ledgers', c: 'bg-gray-100 text-gray-400', pc: 'bg-gray-50 text-gray-500 border-gray-200' },
                  ].map((s, i) => (
                    <div key={i} className="flex items-start gap-4 py-5 border-b border-cream-200 last:border-0">
                      <div className={`w-9 h-9 rounded-full flex justify-center items-center font-bold text-xs shrink-0 ${s.c}`}>
                        {s.n}
                      </div>
                      <div className="flex-1 px-1">
                        <div className={`font-bold text-sm ${s.state === 'PENDING' ? 'text-gray-400' : 'text-gray-900'} mb-1`}>{s.name}</div>
                        <div className="text-xs text-gray-500 leading-relaxed">{s.t}</div>
                        {s.state === 'ACTIVE' && (
                          <div className="mt-3">
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                              <div className="bg-orange-500 h-full rounded-full transition-all duration-1000" style={{ width: '73%' }}></div>
                            </div>
                            <div className="text-[10px] font-bold text-orange-600 mt-1.5 uppercase tracking-wider">Validation: 73% complete</div>
                          </div>
                        )}
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold border shrink-0 ${s.pc}`}>{s.state}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white/80 backdrop-blur-md rounded-2xl p-7 shadow-sm border border-cream-200 flex flex-col">
                  <h3 className="font-bold text-gray-900 text-lg mb-6">Current Removal Batch</h3>
                  <div className="space-y-0 text-sm mb-6 flex-1">
                    {[
                      ['Batch ID', 'ATMSTRK-BATCH-2026-047'],
                      ['Module', 'ATMSTRK-MOD-001'],
                      ['Gross CO₂ Captured', '22.4 tons'],
                      ['Scope 1,2,3 Emissions', '-2.4 tons'],
                      ['Net Verified Removal', <span key="nvr" className="text-emerald-600 font-bold">20.0 tons</span>],
                      ['Market Value', '₹3,60,000'],
                      ['Status', <span key="stat" className="font-bold text-orange-600">IN PROGRESS</span>]
                    ].map((row, i) => (
                      <div key={i} className="flex justify-between py-3 border-b border-gray-100 last:border-0">
                        <span className="text-gray-500">{row[0]}</span>
                        <span className="font-semibold text-gray-900">{row[1]}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mb-6 pt-4 border-t border-gray-50">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs font-bold text-gray-700 uppercase tracking-tight">dMRV Validation Progress</span>
                      <span className="text-xs font-black text-orange-600">73%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
                      <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full" style={{ width: '73%' }}></div>
                    </div>
                  </div>

                  <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex gap-3 items-start">
                    <Info className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-orange-800 leading-relaxed">
                      Batch will auto-transition to Asset Liquidation once third-party audit cross-reference is complete. <span className="font-bold">Est. 2 days.</span>
                    </p>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-md rounded-2xl p-7 shadow-sm border border-cream-200 flex flex-col">
                  <h3 className="font-bold text-gray-900 text-lg mb-6">Credit Offtake</h3>
                  <div className="space-y-0 text-sm mb-8 flex-1">
                    {[
                      ['Target Price', '₹18,000 / ton CRU'],
                      ['Batch Volume', '20.0 tons net'],
                      ['Batch Value', '₹3,60,000'],
                      ['Offtaker Type', 'Corporate CSR Compliance'],
                      ['Contract Type', 'Forward Offtake Agreement'],
                      ['Floor Price', '₹18,000 / ton (fixed)']
                    ].map((row, i) => (
                      <div key={i} className="flex justify-between py-3 border-b border-gray-100 last:border-0">
                        <span className="text-gray-500">{row[0]}</span>
                        <span className="font-semibold text-gray-900">{row[1]}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="bg-orange-50 border-l-4 border-orange-500 rounded-r-xl px-4 py-3 flex justify-between items-center shadow-sm">
                      <span className="text-xs font-bold text-orange-900">AtmosTrack Platform — 92.5%</span>
                      <span className="text-xs font-black text-orange-700">₹3,33,000</span>
                    </div>
                    <div className="bg-emerald-50 border-l-4 border-emerald-500 rounded-r-xl px-4 py-3 flex justify-between items-center shadow-sm">
                      <span className="text-xs font-bold text-emerald-900">Citizen Capacity Pool — 7.5%</span>
                      <span className="text-xs font-black text-emerald-700">₹27,000</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-center">
                    <p className="text-[10px] font-mono text-slate-500">
                      ₹27,000 ÷ 150 entitlements = <span className="text-slate-900 font-bold">₹180 per lessor</span> from this batch
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-md rounded-2xl p-7 shadow-sm border border-cream-200">
                <h3 className="font-bold text-gray-900 text-lg mb-6">Recent Removal Batches</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-gray-200 text-[11px] uppercase text-gray-400 font-black tracking-widest">
                        <th className="pb-4 px-3">Batch ID</th>
                        <th className="pb-4 px-3">Net Removal</th>
                        <th className="pb-4 px-3">Value</th>
                        <th className="pb-4 px-3">Status</th>
                        <th className="pb-4 text-right px-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { id: 'ATMSTRK-BATCH-2026-046', net: '19.8 t', val: '₹3,56,400', status: 'RETIRED', stClass: 'bg-emerald-50 text-emerald-700 border-emerald-200', action: <span className="text-orange-500 font-bold hover:underline cursor-pointer">View Certificate</span> },
                        { id: 'ATMSTRK-BATCH-2026-045', net: '20.2 t', val: '₹3,63,600', status: 'ALLOCATED', stClass: 'bg-blue-50 text-blue-700 border-blue-200', action: <span className="text-blue-500 font-bold hover:underline cursor-pointer">Track</span> },
                        { id: 'ATMSTRK-BATCH-2026-047', net: '20.0 t', val: '₹3,60,000', status: 'dMRV VALIDATING', stClass: 'bg-amber-50 text-amber-700 border-amber-200', action: <div className="flex items-center gap-2 justify-end"><div className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></div><span className="text-amber-500 font-bold">In Progress</span></div> }
                      ].map((row, i) => (
                        <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition">
                          <td className="py-4 px-3 font-mono text-gray-600">{row.id}</td>
                          <td className="py-4 px-3 font-black text-emerald-600">{row.net}</td>
                          <td className="py-4 px-3 font-bold text-gray-900">{row.val}</td>
                          <td className="py-4 px-3">
                            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold border ${row.stClass}`}>{row.status}</span>
                          </td>
                          <td className="py-4 text-right px-3 text-xs">{row.action}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* PAGE 4: REVENUE */}
          {activePage === 'revenue' && (
            <div className="animate-fade-in">
              <BackButton />
              <div className="mb-6">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Revenue & Allocation</h1>
                <p className="text-sm text-gray-500 mt-1">Single module economics · Puro.earth-aligned · ICM 2026 ready</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                {[
                  { label: "Gross Revenue", val: "₹45,00,000", c: "text-emerald-600" },
                  { label: "Operational Load", val: "₹15,00,000", c: "text-red-500" },
                  { label: "Net Surplus", val: "₹30,00,000", c: "text-orange-600" },
                  { label: "5-Year Cumulative", val: "₹1,34,25,000", c: "text-purple-600" }
                ].map((s, i) => (
                  <div key={i} className="bg-white/80 rounded-2xl border border-cream-200 p-6 text-center shadow-sm">
                    <div className={`text-2xl font-black ${s.c} tracking-tight`}>{s.val}</div>
                    <div className="text-[11px] text-gray-500 mt-1 font-bold uppercase tracking-wider">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-cream-200 p-7 shadow-sm">
                  <h3 className="font-bold text-gray-900 text-lg mb-8">Credit Liquidation Engine</h3>
                  <div className="space-y-6 border-b border-gray-100 pb-8 mb-8">
                    <div>
                      <div className="flex justify-between text-sm font-semibold mb-2">
                        <span className="text-gray-600">Gross Revenue</span>
                        <span className="text-gray-900">₹45,00,000</span>
                      </div>
                      <div className="w-full bg-emerald-500 h-2.5 rounded-full shadow-sm"></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm font-semibold mb-2">
                        <span className="text-gray-600">Operational Load (deduction)</span>
                        <span className="text-red-500">(₹15,00,000)</span>
                      </div>
                      <div className="w-1/3 bg-red-400 h-2.5 rounded-full shadow-sm"></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm font-black mb-2">
                        <span className="text-gray-900 uppercase">Net Surplus</span>
                        <span className="text-gray-900 text-lg tracking-tight">₹30,00,000</span>
                      </div>
                      <div className="w-2/3 bg-orange-500 h-2.5 rounded-full shadow-md"></div>
                    </div>
                  </div>

                  <div className="text-2xl font-black text-emerald-600 mb-8 tracking-tight">Net Margin: 66.7%</div>

                  <h3 className="font-bold text-gray-900 text-lg mb-6">Performance-Based Allocation</h3>
                  <div className="space-y-4 mb-8">
                    <div className="bg-orange-50/50 rounded-2xl px-5 py-4 border-l-4 border-orange-500 flex justify-between items-center shadow-sm">
                      <span className="text-sm font-bold text-orange-900">AtmosTrack Platform</span>
                      <span className="text-sm font-black text-orange-700 uppercase tracking-tight">92.5% · ₹27,75,000/yr</span>
                    </div>
                    <div className="bg-emerald-50/50 rounded-2xl px-5 py-4 border-l-4 border-emerald-500 flex justify-between items-center shadow-sm">
                      <span className="text-sm font-bold text-emerald-900">Citizen Capacity Pool</span>
                      <span className="text-sm font-black text-emerald-700 uppercase tracking-tight">7.5% · ₹2,25,000/yr</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-gray-500 font-mono bg-slate-50 p-4 rounded-2xl border border-slate-200 leading-relaxed shadow-inner">
                    <span className="font-bold text-slate-400">Yield Calculation:</span><br />
                    ₹2,25,000 ÷ 150 entitlements<br />
                    = <span className="text-emerald-600 font-bold">₹1,500</span> per lessor / year<br />
                    = <span className="text-orange-600 font-bold">50% yield</span> on ₹3,000 acquisition fee
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-cream-200 p-7 shadow-sm flex flex-col">
                  <h3 className="font-bold text-gray-900 text-lg mb-6">Capital Recovery & 5-Year Outlook</h3>

                  <div className="mb-10 bg-orange-50/30 p-5 rounded-3xl border border-orange-100">
                    <div className="text-[11px] text-orange-700 font-black uppercase tracking-widest mb-2">Capital Recovery Horizon</div>
                    <div className="flex items-baseline gap-2 mb-4">
                      <div className="text-4xl font-black text-orange-600 tracking-tighter">~2 months</div>
                      <div className="text-xs text-orange-400 font-bold">₹4,50,000 net exposure</div>
                    </div>
                    <div className="w-full bg-orange-100/50 rounded-full h-4 mb-3 overflow-hidden shadow-inner p-1">
                      <div className="bg-gradient-to-r from-orange-400 to-amber-500 h-full rounded-full shadow-sm" style={{ width: '17%' }}></div>
                    </div>
                    <div className="text-[11px] text-gray-500 font-semibold italic text-center">Payback achieved Month 2 of operational status</div>
                  </div>

                  <div className="flex-1 overflow-x-auto mb-6">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="border-b border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-400">
                          <th className="pb-3 whitespace-nowrap">Year</th>
                          <th className="pb-3">Platform Surplus</th>
                          <th className="pb-3 text-right">Citizen Pool</th>
                          <th className="pb-3 text-right px-2">Cumulative</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ['1', '₹23,25,000', '₹1,50,000', '₹23,25,000'],
                          ['2', '₹27,75,000', '₹2,25,000', '₹51,00,000'],
                          ['3', '₹27,75,000', '₹2,25,000', '₹78,75,000'],
                          ['4', '₹27,75,000', '₹2,25,000', '₹1,06,50,000'],
                          ['5', '₹27,75,000', '₹2,25,000', '₹1,34,25,000'],
                        ].map((row, i) => (
                          <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition">
                            <td className="py-3 font-black text-slate-400">Y{row[0]}</td>
                            <td className="py-3 font-mono text-gray-600 text-xs">{row[1]}</td>
                            <td className="py-3 font-mono text-emerald-600 text-right text-xs">{row[2]}</td>
                            <td className="py-3 font-black text-gray-900 text-right px-2">{row[3]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-slate-900 rounded-2xl p-5 text-white text-xs mt-auto border border-slate-700 shadow-xl">
                    <div className="flex items-center gap-3">
                      <Activity className="w-6 h-6 text-amber-400 shrink-0" />
                      <p className="leading-relaxed">
                        <span className="font-black text-amber-300 uppercase tracking-widest">10-unit cluster projection:</span><br />
                        ~₹2.03 crore net margin per year · Aligned with Indian Carbon Market (ICM) 2026 launch
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PAGE 5: ECOSYSTEM & STAKEHOLDERS */}
          {activePage === 'ecosystem' && (
            <div className="animate-fade-in">
              <BackButton />
              <div className="mb-6">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none">Ecosystem & Stakeholders</h1>
                <p className="text-sm text-gray-500 mt-2">4-stakeholder value circulation model — who pays who, what flows where</p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl p-5 text-white text-center shadow-lg">
                  <Building2 className="w-8 h-8 mx-auto mb-2 text-white" />
                  <div className="text-lg font-black leading-tight">AtmosTrack</div>
                  <div className="text-[10px] opacity-80 uppercase font-black tracking-widest mb-3">Platform Operator</div>
                  <div className="space-y-1">
                    {["Deploys Modules", "Issues Credits", "Manages dMRV"].map((pill, i) => (
                      <div key={i} className="bg-white/20 rounded-full px-2 py-1 text-[9px] font-bold">{pill}</div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-800 rounded-2xl p-5 text-white text-center shadow-lg border border-slate-700">
                  <Factory className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <div className="text-lg font-black leading-tight">Industrial Host</div>
                  <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-3">Cement Plant</div>
                  <div className="space-y-1">
                    {["Provides Waste Heat", "Supplies Kiln Dust", "Hosts Module"].map((pill, i) => (
                      <div key={i} className="bg-slate-700 rounded-full px-2 py-1 text-[9px] font-bold text-slate-300">{pill}</div>
                    ))}
                  </div>
                </div>

                <div className="bg-emerald-600 rounded-2xl p-5 text-white text-center shadow-lg">
                  <Users className="w-8 h-8 mx-auto mb-2 text-white" />
                  <div className="text-lg font-black leading-tight">Citizens</div>
                  <div className="text-[10px] opacity-80 uppercase font-black tracking-widest mb-3">Capacity Lessors</div>
                  <div className="space-y-1">
                    {["Pay ₹3,000 Fee", "Own 0.333% Share", "Earn ₹1,500/year"].map((pill, i) => (
                      <div key={i} className="bg-white/20 rounded-full px-2 py-1 text-[9px] font-bold">{pill}</div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-700 rounded-2xl p-5 text-white text-center shadow-lg">
                  <Briefcase className="w-8 h-8 mx-auto mb-2 text-white" />
                  <div className="text-lg font-black leading-tight overflow-hidden text-ellipsis whitespace-nowrap px-1">Institutional Buyers</div>
                  <div className="text-[10px] opacity-80 uppercase font-black tracking-widest mb-3">Corporate CSR</div>
                  <div className="space-y-1">
                    {["Buy CRUs", "₹18,000/ton", "ESG Compliance"].map((pill, i) => (
                      <div key={i} className="bg-white/20 rounded-full px-2 py-1 text-[9px] font-bold">{pill}</div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-cream-200 p-8 shadow-sm mb-8">
                <div className="mb-10 text-center lg:text-left">
                  <h3 className="font-bold text-gray-900 text-lg">How Value Flows</h3>
                  <p className="text-sm text-gray-500 mt-1">Every rupee and every ton tracked automatically</p>
                </div>

                <div className="relative">
                  {/* ROW 1 — INPUTS TO PLATFORM */}
                  <div className="flex flex-col lg:flex-row justify-around items-center lg:items-end gap-12 lg:gap-4 mb-2">
                    <div className="flex flex-col items-center">
                      <div className="text-xs font-bold text-slate-700 mb-2">Industrial Host</div>
                      <div className="w-px h-12 bg-slate-400"></div>
                      <ArrowDown className="w-4 h-4 text-slate-400 -mt-1" />
                      <div className="bg-slate-100 border border-slate-200 rounded-full px-3 py-1 text-[10px] font-bold text-slate-600 mt-2 shadow-sm">
                        Waste Heat + Kiln Dust
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="text-xs font-bold text-emerald-700 mb-2">147 Citizens</div>
                      <div className="w-px h-12 bg-emerald-400"></div>
                      <ArrowDown className="w-4 h-4 text-emerald-400 -mt-1" />
                      <div className="bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1 text-[10px] font-bold text-emerald-700 mt-2 shadow-sm">
                        ₹4,41,000 Acquisition
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="text-xs font-bold text-blue-700 mb-2">Institutional Buyers</div>
                      <div className="w-px h-12 bg-blue-400"></div>
                      <ArrowDown className="w-4 h-4 text-blue-400 -mt-1" />
                      <div className="bg-blue-50 border border-blue-200 rounded-full px-3 py-1 text-[10px] font-bold text-blue-700 mt-2 shadow-sm">
                        ₹45,00,000/year
                      </div>
                    </div>
                  </div>

                  {/* ROW 2 — THE PLATFORM (center) */}
                  <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-6 text-white text-center shadow-xl mx-0 lg:mx-8 my-6">
                    <div className="text-base font-black uppercase tracking-widest mb-3 underline decoration-white/20 underline-offset-4">AtmosTrack Platform Engine</div>
                    <div className="flex flex-wrap justify-center gap-2 lg:gap-4 mt-2">
                      {["250t CO₂ Removed", "Credit Lifecycle Engine", "Automated dMRV"].map((item, i) => (
                        <div key={i} className="bg-white/20 rounded-full px-4 py-1.5 text-[10px] font-black">{item}</div>
                      ))}
                    </div>
                  </div>

                  {/* ROW 3 — OUTPUTS FROM PLATFORM */}
                  <div className="flex flex-col lg:flex-row justify-around items-center lg:items-start gap-12 lg:gap-4 mt-2">
                    <div className="flex flex-col items-center">
                      <ArrowDown className="w-4 h-4 text-slate-400" />
                      <div className="w-px h-12 bg-slate-400 -mt-1"></div>
                      <div className="bg-slate-100 rounded-full px-3 py-1 text-[10px] font-bold text-slate-700 mt-2 shadow-sm border border-slate-200">
                        Eco-Aggregate + ESG Report
                      </div>
                      <div className="text-xs font-bold text-slate-700 mt-2 italic opacity-60">Industrial Host</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <ArrowDown className="w-4 h-4 text-emerald-400" />
                      <div className="w-px h-12 bg-emerald-400 -mt-1"></div>
                      <div className="bg-emerald-50 rounded-full px-3 py-1 text-[10px] font-bold text-emerald-700 mt-2 shadow-sm border border-emerald-200">
                        ₹1,500/year Lease Payout
                      </div>
                      <div className="text-xs font-bold text-emerald-700 mt-2 italic opacity-60">Each Citizen</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <ArrowDown className="w-4 h-4 text-blue-400" />
                      <div className="w-px h-12 bg-blue-400 -mt-1"></div>
                      <div className="bg-blue-50 rounded-full px-3 py-1 text-[10px] font-bold text-blue-700 mt-2 shadow-sm border border-blue-200">
                        Verified CRUs · Compliance Cert
                      </div>
                      <div className="text-xs font-bold text-blue-700 mt-2 italic opacity-60">Institutional Buyers</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-cream-200 p-8 shadow-sm mb-8">
                <h3 className="font-bold text-gray-900 text-lg mb-6">Economics Per Stakeholder</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        <th className="pb-4 px-2">Stakeholder</th>
                        <th className="pb-4 px-2">Gives</th>
                        <th className="pb-4 px-2">Receives</th>
                        <th className="pb-4 text-right px-2">Net Position</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { s: 'AtmosTrack', g: 'Module deployment + dMRV ops', r: '92.5% of ₹30L surplus = ₹27,75,000/yr', n: 'OPERATOR', nc: 'bg-orange-50 text-orange-700 border-orange-100' },
                        { s: 'Industrial Host', g: 'Waste heat + kiln dust', r: 'Eco-aggregate sales + ESG certificate', n: 'HOST', nc: 'bg-slate-50 text-slate-700 border-slate-200' },
                        { s: 'Citizens (each)', g: '₹3,000 one-time', r: '₹1,500/year = 50% annual yield', n: 'LESSOR', nc: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                        { s: 'Institutional Buyers', g: '₹18,000 per ton CRU', r: 'Verified permanent removal + compliance', n: 'OFFTAKER', nc: 'bg-blue-50 text-blue-700 border-blue-100' }
                      ].map((row, i) => (
                        <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition">
                          <td className="py-4 px-2 font-black text-gray-900">{row.s}</td>
                          <td className="py-4 px-2 text-gray-600 leading-relaxed max-w-[200px]">{row.g}</td>
                          <td className="py-4 px-2 text-gray-600 leading-relaxed max-w-[250px]">{row.r}</td>
                          <td className="py-4 text-right px-2">
                            <div className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-black border ${row.nc}`}>{row.n}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-slate-900 rounded-2xl p-8 flex flex-col md:flex-row gap-8 items-center justify-between border border-slate-700 shadow-2xl">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-bold uppercase tracking-widest mb-3">
                    Circular Economy Callout
                  </div>
                  <h4 className="text-xl font-black text-white mb-2 tracking-tight">No External Energy Required</h4>
                  <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
                    The module runs entirely on industrial waste streams. Kiln dust and waste heat that would otherwise be liabilities become the primary reagents for CO₂ mineralization — creating a self-sustaining circular economy loop.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-4">
                  {[
                    { v: "₹0", l: "External Energy Cost", c: "text-amber-400" },
                    { v: "2.1 months", l: "Capital Recovery", c: "text-emerald-400" },
                    { v: "50%", l: "Citizen Annual Yield", c: "text-orange-400" }
                  ].map((st, i) => (
                    <div key={i} className="bg-slate-800 rounded-2xl p-5 text-center border border-slate-700 min-w-[120px] shadow-lg">
                      <div className={`text-2xl font-black ${st.c} tracking-tighter mb-1`}>{st.v}</div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">{st.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PAGE 6: SCALE & DEFENSIBILITY */}
          {activePage === 'scale' && (
            <div className="animate-fade-in">
              <BackButton />
              <div className="mb-6">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none">Scale & Defensibility</h1>
                <p className="text-sm text-gray-500 mt-2">3-phase national roadmap · operational moats · risk mitigation</p>
              </div>

              <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-cream-200 p-8 shadow-sm mb-8">
                <div className="mb-8 overflow-hidden">
                  <h3 className="font-bold text-gray-900 text-lg">National Deployment Roadmap</h3>
                  <p className="text-sm text-gray-500 mt-1">India has 500+ cement plants. Each one is a qualified host site.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Phase I */}
                  <div className="bg-orange-50 border-2 border-orange-200 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 bg-orange-500 text-white px-4 py-2 rounded-bl-3xl text-[10px] font-black tracking-widest uppercase shadow-md">Phase I · NOW</div>
                    <div className="mt-6 mb-4">
                      <h4 className="text-xl font-black text-gray-900 leading-tight">Single Site Pilot</h4>
                    </div>
                    <div className="space-y-3 mb-8">
                      {[
                        ['Deployment', 'Single 4×3m skid'],
                        ['Capacity', '250 tCO₂/year'],
                        ['Capital', '₹9,0,000'],
                        ['Validation', 'Stoichiometric + dMRV link']
                      ].map((row, i) => (
                        <div key={i} className="flex justify-between items-baseline py-2 border-b border-orange-100 last:border-0">
                          <span className="text-[11px] font-bold text-orange-700 uppercase">{row[0]}</span>
                          <span className="text-xs font-bold text-gray-900 text-right">{row[1]}</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-orange-500 rounded-2xl p-4 text-center text-white shadow-lg transform group-hover:scale-[1.03] transition-all">
                      <div className="text-[10px] font-black opacity-80 uppercase tracking-widest mb-1">Target Outcome</div>
                      <div className="text-sm font-black leading-none">₹45,00,000 gross revenue/yr</div>
                    </div>
                  </div>

                  {/* Phase II */}
                  <div className="bg-emerald-50 border-2 border-emerald-200 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 bg-emerald-600 text-white px-4 py-2 rounded-bl-3xl text-[10px] font-black tracking-widest uppercase shadow-md">Phase II · YEAR 2-3</div>
                    <div className="mt-6 mb-4">
                      <h4 className="text-xl font-black text-gray-900 leading-tight">10-Unit Modular Grid</h4>
                    </div>
                    <div className="space-y-3 mb-8">
                      {[
                        ['Deployment', '10-unit cluster'],
                        ['Capacity', '2,500 tCO₂/year'],
                        ['Capital', '₹90,0,000'],
                        ['Proof Point', '92.5% platform margin']
                      ].map((row, i) => (
                        <div key={i} className="flex justify-between items-baseline py-2 border-b border-emerald-100 last:border-0">
                          <span className="text-[11px] font-bold text-emerald-700 uppercase">{row[0]}</span>
                          <span className="text-xs font-bold text-gray-900 text-right">{row[1]}</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-emerald-600 rounded-2xl p-4 text-center text-white shadow-lg transform group-hover:scale-[1.03] transition-all">
                      <div className="text-[10px] font-black opacity-80 uppercase tracking-widest mb-1">Target Outcome</div>
                      <div className="text-sm font-black leading-none">~₹2.03 crore net margin/yr</div>
                    </div>
                  </div>

                  {/* Phase III */}
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 bg-blue-700 text-white px-4 py-2 rounded-bl-3xl text-[10px] font-black tracking-widest uppercase shadow-md">Phase III · YEAR 4-5</div>
                    <div className="mt-6 mb-4">
                      <h4 className="text-xl font-black text-gray-900 leading-tight">National Integration</h4>
                    </div>
                    <div className="space-y-3 mb-8">
                      {[
                        ['Target', '500+ cement plants'],
                        ['Capacity', '1,25,000+ tCO₂/year'],
                        ['Registry', 'ICM 2026 aligned'],
                        ['Goal', 'Primary CDR supply for India']
                      ].map((row, i) => (
                        <div key={i} className="flex justify-between items-baseline py-2 border-b border-blue-100 last:border-0">
                          <span className="text-[11px] font-bold text-blue-700 uppercase">{row[0]}</span>
                          <span className="text-xs font-bold text-gray-900 text-right">{row[1]}</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-blue-700 rounded-2xl p-4 text-center text-white shadow-lg transform group-hover:scale-[1.03] transition-all">
                      <div className="text-[10px] font-black opacity-80 uppercase tracking-widest mb-1">Target Outcome</div>
                      <div className="text-sm font-black leading-none px-2">First-mover on Indian Carbon Market</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-cream-200 p-8 shadow-sm mb-8">
                <div className="mb-10">
                  <h3 className="font-bold text-gray-900 text-lg">Why AtmosTrack Cannot Be Copied</h3>
                  <p className="text-sm text-gray-500 mt-1">Three interlocking defensibility layers that compound with every deployment</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Moat 1 */}
                  <div className="bg-white border border-cream-200 rounded-3xl p-7 shadow-sm hover:shadow-xl hover:bg-orange-50/10 transition-all group border-b-4 border-b-orange-400">
                    <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Lock className="w-7 h-7 text-orange-600" />
                    </div>
                    <h4 className="text-lg font-black text-gray-900 mb-3 leading-tight">Physicochemical Lock-in</h4>
                    <p className="text-sm text-gray-500 leading-relaxed flex-1 min-h-[100px]">
                      Modules engineered for specific CaO/MgO alkalinity ratios and ≥60°C thermal gradients. Creates a natural monopoly at qualified sites — competitors cannot use the same waste streams efficiently.
                    </p>
                    <div className="bg-orange-50 border border-orange-100 rounded-full px-4 py-1.5 text-[10px] font-black text-orange-700 mt-6 inline-block shadow-sm">
                      Site-Specific Chemistry
                    </div>
                  </div>

                  {/* Moat 2 */}
                  <div className="bg-white border border-cream-200 rounded-3xl p-7 shadow-sm hover:shadow-xl hover:bg-purple-50/10 transition-all group border-b-4 border-b-purple-400">
                    <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Database className="w-7 h-7 text-purple-600" />
                    </div>
                    <h4 className="text-lg font-black text-gray-900 mb-3 leading-tight">Proprietary dMRV Data Moat</h4>
                    <p className="text-sm text-gray-500 leading-relaxed flex-1 min-h-[100px]">
                      Real-time telemetry from 100+ sensors per module creates an industrial dataset unmatchable by software-only entrants. Enables predictive maintenance and optimized mineralization kinetics.
                    </p>
                    <div className="bg-purple-50 border border-purple-100 rounded-full px-4 py-1.5 text-[10px] font-black text-purple-700 mt-6 inline-block shadow-sm">
                      Proprietary Dataset
                    </div>
                  </div>

                  {/* Moat 3 */}
                  <div className="bg-white border border-cream-200 rounded-3xl p-7 shadow-sm hover:shadow-xl hover:bg-blue-50/10 transition-all group border-b-4 border-b-blue-400">
                    <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <TrendingUp className="w-7 h-7 text-blue-600" />
                    </div>
                    <h4 className="text-lg font-black text-gray-900 mb-3 leading-tight font-sans">Network Effects & Regulatory Pre-emption</h4>
                    <p className="text-sm text-gray-500 leading-relaxed flex-1 min-h-[100px]">
                      100,000+ individual capacity lessors create a decentralized liquidity pool. By aligning with Puro.earth from inception, AtmosTrack is positioned for ICM 2026 launch.
                    </p>
                    <div className="bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5 text-[10px] font-black text-blue-700 mt-6 inline-block shadow-sm">
                      First-Mover · ICM 2026
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-cream-200 p-8 shadow-sm mb-8">
                <div className="mb-8">
                  <h3 className="font-bold text-gray-900 text-lg">Risk Mitigation Framework</h3>
                  <p className="text-sm text-gray-500 mt-1">Every identified risk has an automated technical contingency</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        <th className="pb-4 px-2">Risk</th>
                        <th className="pb-4 px-2">Category</th>
                        <th className="pb-4 px-2">Contingency</th>
                        <th className="pb-4 text-right px-2">Protection</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { risk: "Host Site Shutdown", cat: "Operational", cc: "bg-slate-100 text-slate-700", con: "Modular Portability Protocol — skid redeployed in 15-21 days. Service term paused.", prot: "HIGH", pc: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                        { risk: "Sorbent Degradation", cat: "Technical", cc: "bg-amber-50 text-amber-700 border-amber-100", con: "Siemens S7-1500 PLC runs real-time Health-Score Algorithm. 10% sinking fund coverage.", prot: "HIGH", pc: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                        { risk: "Regulatory Scrutiny", cat: "Regulatory", cc: "bg-red-50 text-red-700 border-red-100", con: "SLA structure (not shareholder agreement). Each ₹3,000 mapped to a serial-numbered module.", prot: "HIGH", pc: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                        { risk: "Carbon Price Volatility", cat: "Market", cc: "bg-blue-50 text-blue-700 border-blue-100", con: "40% capacity pre-sold via forward contracts. Green Clinker revenue covers 100% of OPEX.", prot: "HIGH", pc: "bg-emerald-50 text-emerald-700 border-emerald-200" }
                      ].map((row, i) => (
                        <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                          <td className="py-5 px-2 font-black text-gray-900 leading-tight max-w-[120px]">{row.risk}</td>
                          <td className="py-5 px-2">
                            <div className={`px-2.5 py-1 rounded-full text-[9px] font-black ${row.cc}`}>{row.cat}</div>
                          </td>
                          <td className="py-5 px-2 text-xs text-gray-600 leading-relaxed max-w-[280px]">{row.con}</td>
                          <td className="py-5 text-right px-2">
                            <div className={`inline-block px-3 py-1 rounded-full text-[9px] font-black border ${row.pc}`}>{row.prot}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-slate-900 rounded-2xl p-8 mb-4 border border-slate-700 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="relative z-10">
                  <h4 className="text-xl font-black text-white mb-8 tracking-tight italic">The Defensibility Flywheel</h4>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 lg:gap-12">
                    {[
                      { i: CheckCircle, ic: "text-emerald-400", t: "Verified Hardware Performance", st: "drives transparency" },
                      { i: Shield, ic: "text-orange-400", t: "High-Integrity Credits", st: "satisfies institutional buyers" },
                      { i: TrendingUp, ic: "text-blue-400", t: "Compounding Trust", st: "each deployment improves the model" }
                    ].map((item, i) => (
                      <React.Fragment key={i}>
                        <div className="bg-slate-800 rounded-3xl p-6 text-center border border-slate-700 shadow-lg min-w-[200px] hover:border-slate-500 transition-colors">
                          <item.i className={`w-8 h-8 ${item.ic} mx-auto mb-3`} />
                          <div className="text-sm font-black text-white leading-tight mb-1">{item.t}</div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{item.st}</div>
                        </div>
                        {i < 2 && (
                          <div className="hidden sm:block text-orange-400 font-black text-2xl animate-pulse">→</div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="mt-10 text-[10px] text-slate-500 text-center font-bold italic opacity-60 tracking-tight">
                    "Competitors may replicate the interface. They cannot replicate the integrated physics, localized chemistry, and automated verification stack."
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default ImpactHub;
