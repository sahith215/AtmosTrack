import React from 'react';
import { Wind, MapPin, Activity, TrendingUp, ArrowRight, Play, Cpu, Globe, ShieldCheck } from 'lucide-react';

interface HomeProps {
  setActiveView: (view: string) => void;
}

const Home: React.FC<HomeProps> = ({ setActiveView }) => {
  const features = [
    {
      icon: MapPin,
      title: 'Interactive Mapping',
      description: 'Explore real-time air quality data across India with our interactive sensor map interface.',
      color: 'from-blue-500 to-cyan-500',
      bg: 'from-blue-50 to-cyan-50',
      border: 'border-blue-100',
    },
    {
      icon: Activity,
      title: 'Real-time Monitoring',
      description: 'Get live updates from DHT11, MQ135, MG811, and MPU6050 sensors deployed in the field.',
      color: 'from-orange-500 to-amber-500',
      bg: 'from-orange-50 to-amber-50',
      border: 'border-orange-100',
    },
    {
      icon: TrendingUp,
      title: 'Health Insights',
      description: 'Personalized health recommendations and CO₂ monitoring based on live air quality readings.',
      color: 'from-purple-500 to-violet-500',
      bg: 'from-purple-50 to-violet-50',
      border: 'border-purple-100',
    },
    {
      icon: Cpu,
      title: 'ESP32 Hardware',
      description: 'Powered by real ESP32 IoT nodes deploying a full multi-sensor suite with GPS tracking.',
      color: 'from-emerald-500 to-teal-500',
      bg: 'from-emerald-50 to-teal-50',
      border: 'border-emerald-100',
    },
    {
      icon: Globe,
      title: 'Carbon Credits',
      description: 'Earn CCT tokens based on Daily Health Impact (DHI) hours and mint them on Polygon blockchain.',
      color: 'from-green-500 to-lime-500',
      bg: 'from-green-50 to-lime-50',
      border: 'border-green-100',
    },
    {
      icon: ShieldCheck,
      title: 'Data Integrity',
      description: 'Every reading is SHA-256 hashed and anchored on-chain for immutable audit trails.',
      color: 'from-rose-500 to-pink-500',
      bg: 'from-rose-50 to-pink-50',
      border: 'border-rose-100',
    },
  ];

  const stats = [
    { value: '5+', label: 'Sensor Types' },
    { value: '30s', label: 'Sample Rate' },
    { value: 'Live', label: 'Blockchain Anchor' },
    { value: 'CCT', label: 'Carbon Tokens' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-orange-50/60 pt-16">

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background orbs */}
        <div className="absolute top-16 left-8 w-72 h-72 bg-orange-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-32 right-16 w-96 h-96 bg-amber-100/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-orange-100/30 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-24 relative z-10">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-100 rounded-full text-orange-700 font-semibold text-xs mb-8 border border-orange-200">
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              Live Air Quality Monitoring · India
            </div>

            {/* Heading */}
            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-[1.08] tracking-tight">
              <span className="bg-gradient-to-r from-orange-600 via-amber-500 to-emerald-500 bg-clip-text text-transparent">
                Track the Air.
              </span>
              <br />
              <span className="bg-gradient-to-r from-emerald-500 via-amber-500 to-orange-600 bg-clip-text text-transparent">
                Own the Data.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
              AtmosTrack turns raw ESP32 sensor streams into verifiable,
              blockchain-anchored air quality intelligence — with real-time health
              advisories, carbon credit minting, and export automation built in.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setActiveView('dashboard')}
                className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 hover:scale-[1.02] transition-all duration-200"
              >
                <Play className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
                Explore Dashboard
              </button>
              <button
                onClick={() => setActiveView('map')}
                className="group inline-flex items-center justify-center gap-2 bg-white text-gray-700 px-8 py-4 rounded-2xl font-bold border border-cream-200 hover:border-orange-200 hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
              >
                View Map
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ────────────────────────────────────────────────── */}
      <section className="border-y border-cream-200 bg-white/60 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">
                  {s.value}
                </div>
                <div className="text-sm text-gray-500 mt-1 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ──────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              Comprehensive Air Quality{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">
                Intelligence
              </span>
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Advanced monitoring technology meets intuitive design to deliver actionable environmental insights.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className={`group bg-gradient-to-br ${feature.bg} rounded-2xl p-6 border ${feature.border} hover:shadow-lg hover:scale-[1.02] transition-all duration-300 flex flex-col`}
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className={`w-11 h-11 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mt-auto">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ────────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-orange-50 to-amber-50/60 border-t border-cream-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-10 md:p-14 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
            {/* bg accent */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-xs font-semibold mb-4 border border-orange-500/30">
                <Wind className="h-3 w-3" />
                Ready to start?
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
                Start Monitoring Today
              </h2>
              <p className="text-slate-400 max-w-md text-sm leading-relaxed">
                Join the AtmosTrack network and get access to live sensor data, carbon credit tracking, 
                blockchain-anchored audit trails, and AI-powered health insights.
              </p>
            </div>

            <div className="relative z-10 flex flex-col gap-3 shrink-0">
              <button
                onClick={() => setActiveView('dashboard')}
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg hover:shadow-orange-500/30 hover:scale-[1.02] transition-all"
              >
                Get Started Now
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setActiveView('map')}
                className="inline-flex items-center justify-center gap-2 bg-white/10 text-white px-8 py-3.5 rounded-xl font-semibold border border-white/20 hover:bg-white/20 transition-all text-sm"
              >
                Explore the Map
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
