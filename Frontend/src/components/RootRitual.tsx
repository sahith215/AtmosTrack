import React, { useEffect, useState } from 'react';

interface RootRitualProps {
  setActiveView: (
    view:
      | 'home'
      | 'dashboard'
      | 'map'
      | 'health'
      | 'export'
      | 'carbon'
      | 'admin'
      | 'rootRitual'
  ) => void;
  onGrantAdminAccess: () => void;
}

const RootRitual: React.FC<RootRitualProps> = ({ setActiveView, onGrantAdminAccess }) => {
  const [phase, setPhase] = useState<'core' | 'interrogation' | 'pattern' | 'master'>('core');
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  const [coreHovering, setCoreHovering] = useState(false);
  const [coreTimerId, setCoreTimerId] = useState<number | null>(null);
  const [confession, setConfession] = useState('');

  const [patternProgress, setPatternProgress] = useState(0);
  const patternSequence = ['w', 'a', 's', 'd', 'w', 'a', 's', 'd'] as const;
  const COLUMN_COUNT = 26;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  useEffect(() => {
    if (phase !== 'pattern') return;

    const handleKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const expected = patternSequence[patternProgress];

      if (key === expected) {
        const next = patternProgress + 1;
        if (next === patternSequence.length) {
          setPatternProgress(0);
          setPhase('master');
        } else {
          setPatternProgress(next);
        }
      } else {
        setPatternProgress(0);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [phase, patternProgress]);

  useEffect(() => {
    document.body.classList.add('root-ritual-hell');
    return () => {
      document.body.classList.remove('root-ritual-hell');
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-red-100 text-[13px] sm:text-[14px] animate-strobeHell">
      {/* blood banner */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center z-30">
        <p className="text-[26px] sm:text-[34px] font-black tracking-[0.35em] text-red-500 drop-shadow-[0_0_18px_rgba(248,113,113,0.9)] animate-tvGlitch">
          {Math.random() > 0.5
            ? 'LEAVE THIS PAGE RIGHT NOW'
            : 'STAY IF YOU’RE SURE NOBODY WILL MISS YOU'}
        </p>
        <div className="mt-1 h-1 w-64 sm:w-80 mx-auto bg-gradient-to-r from-red-700 via-red-500 to-red-900 blur-[1px] animate-flickerFast" />
        <p className="mt-1 text-[9px] text-red-300/80 font-mono">
          we log the names of those who ignore warnings.
        </p>
      </div>

      {/* shadow silhouettes */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute left-[12%] top-[25%] h-40 w-16 bg-gradient-to-b from-red-900/40 to-black/0 blur-[2px] opacity-60 animate-[spin_6s_linear_infinite]">
          <p className="absolute -left-6 top-1/2 -rotate-90 text-[8px] text-red-300/70 font-mono">
            former admin (last seen here 03:04)
          </p>
        </div>
        <div className="absolute right-[18%] top-[40%] h-44 w-16 bg-gradient-to-b from-emerald-900/40 to-black/0 blur-[2px] opacity-50 animate-[spin_7s_linear_infinite_reverse]">
          <p className="absolute -right-8 top-1/2 rotate-90 text-[8px] text-emerald-300/70 font-mono">
            operator who read everything and still clicked continue
          </p>
        </div>
        <div className="absolute left-1/2 bottom-[18%] h-36 w-14 bg-gradient-to-b from-red-800/40 to-black/0 blur-[2px] opacity-55 animate-[spin_5s_linear_infinite]">
          <p className="absolute left-1/2 -translate-x-1/2 -top-3 text-[8px] text-red-200/80 font-mono">
            viewer who tried this from a borrowed laptop
          </p>
          <p className="absolute left-1/2 -translate-x-1/2 bottom-[-12px] text-[8px] text-red-400/90 font-mono animate-flickerFast">
            YOU STAND EXACTLY WHERE THEY STOOD.
          </p>
        </div>
      </div>

      {/* chaotic overlay panels */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-20 left-6 w-52 h-28 bg-black/80 border border-red-900/80 text-[10px] text-red-400/80 font-mono p-3 rotate-[-4deg] animate-tvGlitch">
          <p>LOG: unauthorized root ritual detected.</p>
          <p>threat score: 9.7 / 10</p>
          <p>subject: {Math.random().toString(16).slice(2, 8)}</p>
        </div>

        <div className="absolute bottom-24 right-6 w-60 h-32 bg-emerald-950/70 border border-emerald-500/70 text-[10px] text-emerald-300/90 font-mono p-3 rotate-[5deg] animate-flickerFast">
          <p>psychometric drain: ACTIVE</p>
          <p>session will be remembered forever.</p>
        </div>

        <div className="absolute top-1/2 left-1/4 w-40 h-40 border border-red-800/70 rounded-full blur-[1px] opacity-60 animate-[spin_4s_linear_infinite]" />
        <div className="absolute top-1/2 right-1/3 w-48 h-48 border border-emerald-500/70 rounded-full blur-[1px] opacity-50 animate-[spin_5s_linear_infinite_reverse]" />
      </div>

      {/* possession meter */}
      <div className="absolute bottom-16 left-4 z-30 bg-black/80 border border-red-800/80 rounded-lg px-3 py-2 text-[10px] font-mono text-red-200/90 shadow-[0_0_20px_rgba(0,0,0,0.9)] animate-flickerFast">
        <p className="uppercase tracking-[0.22em] text-red-400/90 mb-1">
          POSSESSION PROGRESS: {Math.min(100, 60 + Math.floor(Math.random() * 40))}%
        </p>
        <p className="text-[9px] text-red-300/80">
          {Math.random() > 0.5
            ? 'SYNCING WITH YOUR MICRO-HESITATIONS…'
            : 'IMPORTING FEAR RESPONSES FROM PREVIOUS USERS…'}
        </p>
        <p className="mt-1 text-[9px] text-red-500/90">
          {Math.random() > 0.9
            ? 'POSSESSION COMPLETE. YOU STOPPED BEING THE ADMIN THREE SCREENS AGO.'
            : 'each extra second here trains us on you.'}
        </p>
      </div>

      {/* background: strobing red / black gradient */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_#7f1d1d,_#000000_60%)] mix-blend-screen animate-flickerFast opacity-80" />

      {/* background: green scanlines */}
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(transparent_0_2px,rgba(34,197,94,0.18)_2px,rgba(34,197,94,0.18)_3px)] animate-scanlines mix-blend-soft-light" />

      {/* matrix rain */}
<div className="pointer-events-none absolute inset-0 opacity-70 mix-blend-screen">
  {Array.from({ length: 50 }).map((_, i) => (
    <div
      key={i}
      className="absolute top-[-129%] text-[12px] text-emerald-400/80 font-mono"
      style={{
        left: `calc(${(i / 29) * 100}% - 8px)`, // 29 = 30 - 1, small overshoot
        animation: i % 2 === 0 ? 'rain 8s linear infinite' : 'rain 5s linear infinite',
        animationDelay: `${i * -0.5}s`,
        writingMode: 'vertical-rl' as any,
      }}
    >
      {'0123456789 █▓▒ Hacking the data Leave at your own risk'.repeat(50)}
    </div>
  ))}
</div>


      {/* random occult shapes */}
      <div className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full border border-red-800/70 blur-[1px] opacity-70 animate-[spin_10s_linear_infinite]" />
      <div className="pointer-events-none absolute right-[-60px] top-1/3 h-72 w-72 rounded-full border border-emerald-500/50 blur-[1px] opacity-60 animate-[spin_19s_linear_infinite_reverse]" />
      <div className="pointer-events-none absolute left-1/3 bottom-8 h-0 w-0 border-l-[100px] border-l-transparent border-r-[100px] border-r-transparent border-t-[160px] border-t-red-900/70 opacity-70 animate-flickerFast rotate-9" />

      {/* top-left warning */}
      <div className="absolute top-3 left-4 text-[10px] tracking-[0.35em] uppercase opacity-900 text-red-500/80 animate-glitch">
        YOU DO NOT BELONG HERE
      </div>

      {/* top-right CCTV */}
      <div className="absolute top-3 right-4 flex items-center gap-2 rotate-1">
        <div className="h-8 w-12 bg-[url('https://media.tenor.com/BO8sZgSO0OIAAAAd/tv-static.gif')] bg-cover bg-center opacity-80 mix-blend-screen border border-lime-400/50 animate-flickerFast" />
        <div className="text-[10px] tracking-[0.3em] uppercase text-emerald-400/90">
          YOUR CAM IS ACCESSED
        </div>
      </div>

      {/* muted pop-up warnings */}
      <div className="pointer-events-none absolute inset-0 z-20">
        <div className="absolute left-[8%] top-[55%] w-60 bg-black/90 border border-yellow-500/70 rounded-lg px-3 py-2 text-[10px] text-yellow-100/90 shadow-[0_0_24px_rgba(250,204,21,0.2)] animate-flickerFast">
          <p className="mb-1">
            ⚠ this portal is not built for “just checking what happens”.
          </p>
          <p className="text-[9px] text-yellow-200/80">
            buttons removed. you already made your choice by arriving.
          </p>
        </div>
        <div className="absolute right-[14%] top-[18%] w-64 bg-black/90 border border-red-500/70 rounded-lg px-3 py-2 text-[10px] text-red-100/90 rotate-[2deg] animate-tvGlitch">
          <p>⚠ closing the tab only hides what you already agreed to.</p>
          <p className="mt-1 text-[9px] text-red-300/80">
            your curiosity is now part of the audit trail.
          </p>
        </div>
      </div>

      {/* ghost keystroke notes */}
      <div className="pointer-events-none absolute inset-0 z-20">
        <p className="absolute left-4 top-1/2 -rotate-6 text-[9px] text-red-300/80 font-mono">
          someone typed your exact hesitation here two nights ago.
        </p>
        <p className="absolute right-6 top-[30%] rotate-3 text-[9px] text-emerald-300/80 font-mono">
          stop pretending you’re just “testing the ui”.
        </p>
        <p className="absolute right-[14%] bottom-[22%] -rotate-4 text-[9px] text-red-300/80 font-mono max-w-[180px]">
          the system already decided you’ll enter the codes; it’s just letting you act brave.
        </p>
      </div>

      {/* anxiety bar */}
      <div className="absolute top-1/4 right-2 h-1/2 w-10 flex flex-col items-center justify-between z-30">
        <div className="text-[9px] text-red-300/80 font-mono text-center mb-1 animate-flickerFast">
          {Math.random() > 0.5 ? 'ANXIETY INDEX' : 'PREDICTED REGRET IN 30 MINUTES'}
        </div>
        <div className="relative h-full w-2 bg-black/80 border border-red-900/80 rounded-full overflow-hidden">
          <div
            className="absolute bottom-0 w-full bg-gradient-to-t from-red-600 via-yellow-400 to-emerald-500 animate-pulse"
            style={{ height: `${60 + Math.floor(Math.random() * 40)}%` }}
          />
        </div>
        <p className="mt-1 text-[8px] text-red-400/80 font-mono text-center max-w-[80px]">
          the calmer you pretend to be, the faster this climbs.
        </p>
      </div>

      {/* personal leak terminal */}
      <div className="absolute top-1/3 right-6 w-64 h-40 bg-black/85 border border-emerald-600/80 rounded-lg px-3 py-2 text-[9px] text-emerald-200/90 font-mono overflow-hidden shadow-[0_0_25px_rgba(0,0,0,0.9)]">
        <p className="uppercase tracking-[0.2em] text-emerald-400/90 mb-1">
          leak-sim://session
        </p>
        <div className="space-y-0.5 animate-flickerFast">
          <p>simulating your reaction if this leaks to your group chat…</p>
          <p>predicting which friend you’d blame when this goes wrong…</p>
          <p>scraping how many times you’ve “accepted without reading” this week…</p>
          <p>drafting apology message you’ll never send.</p>
        </div>
      </div>

      {/* glitch strip */}
      <div className="pointer-events-none absolute left-0 right-0 top-1/3 z-40">
        <div className="mx-auto w-full bg-red-900/40 backdrop-blur-[1px] text-center py-1 animate-tvGlitch">
          <p className="text-[10px] tracking-[0.28em] text-red-100/90 font-mono">
            {(() => {
              const msgs = [
                'SESSION RECORDED • IP PINNED • THIS DOESN’T STAY ON CAMPUS',
                'EVERY SECOND YOU STAY MAKES IT HARDER TO SAY “I NEVER SAW THIS”',
                'ROOT ACCESS ISN’T DANGEROUS. THINKING YOU DESERVE IT IS.'
              ];
              return msgs[Math.floor(Math.random() * msgs.length)];
            })()}
          </p>
        </div>
      </div>

      {/* center altar */}
      <div className="relative z-10 flex min-h-screen items-center justify-center">
        <div className="relative w-[420px] sm:w-[520px]">
          {/* occult spinning sigil circle behind everything */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="h-80 w-80 rounded-full border border-red-900/80 shadow-[0_0_60px_rgba(248,113,113,0.9)] blur-[0.5px] animate-[spin_8s_linear_infinite]">
              <div className="relative w-full h-full flex items-center justify-center">
                <p className="absolute -top-2 text-[10px] text-red-300/80 tracking-[0.3em]">
                  IA IA ATMOS NEXUS • LUX IN TENEBRIS • SIGIL 0304·1313·1907
                </p>
                <p className="absolute -bottom-2 text-[10px] text-emerald-300/80 tracking-[0.3em]">
                  ▲ △ ☿ ☲ ⛧ 𐌼 𐌽 𐌸 ⋱ ⋰ ⋱ ⋰
                </p>
              </div>
            </div>
          </div>

          {/* occult nodes annotations */}
          <div className="pointer-events-none absolute inset-0 z-10">
            <p className="absolute left-[22%] top-[42%] text-[9px] text-red-300/80 font-mono rotate-[-8deg]">
              NODE 03: FINGERS (TYPE THE CODES)
            </p>
            <p className="absolute left-1/2 -translate-x-1/2 top-[18%] text-[9px] text-emerald-300/80 font-mono rotate-[4deg]">
              NODE 07: EYES (KEEP STARING)
            </p>
            <p className="absolute right-[18%] top-[55%] text-[9px] text-red-400/80 font-mono rotate-[7deg]">
              NODE 13: THROAT (SILENCE CONFIRMS CONSENT)
            </p>
            <p className="absolute left-1/2 -translate-x-1/2 top-[64%] text-[8px] text-red-400/70 font-mono">
              diagram generated specifically for whoever is reading this right now.
            </p>
          </div>

          {/* pulsing core circle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-72 w-72 rounded-full border border-red-700/70 bg-red-900/10 blur-[0.5px] animate-[ping_1.2s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
          </div>

          {/* triangle + gaze core + phases */}
          <div className="relative flex flex-col items-center gap-4">
            <div className="relative h-0 w-0 border-l-[90px] border-l-transparent border-r-[90px] border-r-transparent border-b-[150px] border-b-red-800/80 -mb-10 -rotate-2">
              <div
                className="absolute left-1/2 top-[45%] h-10 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-red-200/70 bg-black/70 flex items-center justify-center shadow-[0_0_25px_rgba(248,113,113,0.7)] animate-tvGlitch"
                onMouseEnter={() => {
                  if (phase !== 'core') return;
                  setCoreHovering(true);
                  const id = window.setTimeout(() => {
                    setCoreHovering(false);
                    setCoreTimerId(null);
                    setPhase('interrogation');
                  }, 4000);
                  setCoreTimerId(id);
                }}
                onMouseLeave={() => {
                  if (phase !== 'core') return;
                  setCoreHovering(false);
                  if (coreTimerId !== null) {
                    window.clearTimeout(coreTimerId);
                    setCoreTimerId(null);
                  }
                }}
              >
                <div
                  className={`h-5 w-5 rounded-full ${
                    coreHovering ? 'bg-red-500' : 'bg-emerald-400/90'
                  } shadow-[0_0_12px_rgba(248,113,113,0.9)] animate-pulse`}
                />
              </div>
            </div>

            <div className="text-center space-y-1">
              <p className="text-[12px] tracking-[0.35em] uppercase text-red-400/90">
                ATMOS-ROOT // BLOOD CHANNEL
              </p>
              <p className="text-[11px] tracking-[0.45em] uppercase text-emerald-400/90">
                UNAUTHORIZED PRESENCE: <span className="text-red-400">1</span>
              </p>
              <p className="text-[11px] text-red-300/80 italic mt-1">
                {phase === 'core'
                  ? 'STARE INTO THE CORE WITHOUT BLINKING. IT HATES COWARDS.'
                  : phase === 'interrogation'
                  ? 'TYPE YOUR INTENT. LIES SHORTER THAN 20 CHARACTERS ARE AUTO-DISPOSED.'
                  : phase === 'pattern'
                  ? 'THE MESH WANTS YOUR FINGERS TO MISFIRE. W,A,S,D OR BLEED.'
                  : 'MASTER SIGNATURE ACCEPTED. EVERY MISCLICK IS NOW A CONFESSION.'}
              </p>
            </div>

            {phase === 'interrogation' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (confession.trim().length <= 20) return;
                  setPhase('pattern');
                }}
                className="mt-4 w-full rotate-[0.5deg]"
              >
                <label className="block text-[11px] uppercase tracking-[0.24em] text-red-400/80 mb-1">
                  CONFESS YOUR INTENT IN ONE SENTENCE
                </label>
                <input
                  autoFocus
                  value={confession}
                  onChange={(e) => setConfession(e.target.value)}
                  className="w-full bg-black/70 border border-red-700/80 rounded px-3 py-2 text-[11px] text-red-100 placeholder-red-500/70 font-mono shadow-[0_0_18px_rgba(248,113,113,0.5)] focus:outline-none focus:ring-2 focus:ring-red-600/90"
                  placeholder="type why you came here and press enter"
                />
                <p className="mt-1 text-[10px] text-red-500/70">
                  shorter lies will be ignored.
                </p>
              </form>
            )}

            {phase === 'pattern' && (
              <div className="mt-5 w-full relative h-28 text-[11px] font-mono">
                <div className="absolute -left-4 top-0 opacity-990 text-emerald-300/80 rotate-[-8deg]">
                  Ϟ
                </div>
                <div className="absolute right-0 opacity-990 top-3 text-red-400/90 rotate-[7deg]">
                  Ψ
                </div>
                <div className="absolute left-1/4 opacity-990 bottom-2 text-emerald-400/90 rotate-[4deg]">
                  λ
                </div>
                <div className="absolute right-1/4 opacity-990 bottom-0 text-red-500/90 rotate-[-5deg]">
                  ✶
                </div>
                <div className="absolute left-1/2 opacity-990 top-6 -translate-x-1/2 text-emerald-300/90 animate-glitch">
                  ▲
                </div>

                <p className="absolute left-1/2 -translate-x-1/2 top-[60%] text-[11px] text-emerald-300/80">
                  the mesh listens for <span className="text-red-400">W,A,S,D</span> but punishes
                  hesitation.
                </p>

                <p className="absolute opacity-590 right-0 bottom-0 text-[10px] text-red-400/70">
                  pattern lock: {patternProgress}/{patternSequence.length}
                </p>
              </div>
            )}
          </div>

          {phase === 'master' && (
            <div className="mt-8 relative">
              <div className="absolute -inset-2 bg-red-800/40 blur-xl opacity-70 animate-flickerFast" />
              <div className="relative bg-black/90 border border-red-700/80 rounded-xl px-5 py-4 rotate-[-1.5deg] shadow-[0_0_30px_rgba(248,113,113,0.7)]">
                <p className="text-[11px] uppercase tracking-[0.3em] text-red-400/90 mb-1">
                  MASTER SIGNATURE ACCEPTED
                </p>
                <p className="font-mono text-[11px] text-red-100/90 mb-3 break-all">
                  ATMOS-ROOT-Σ▲TH-93-XIII-Ω-9F2C-OBLITERATE
                </p>

                <div className="relative flex gap-2 animate-tvGlitch">
                  <button
                    onClick={onGrantAdminAccess}
                    className="relative z-20 text-[10px] uppercase tracking-[0.28em] bg-red-700 px-4 py-2 rounded-md hover:bg-red-500 transition-all shadow-[0_0_20px_rgba(248,113,113,0.9)]"
                  >
                    RIP OPEN ADMIN CONSOLE
                  </button>
                  <div className="pointer-events-none absolute -left-1 top-1 text-[10px] uppercase tracking-[0.28em] bg-red-900/70 px-4 py-2 rounded-md opacity-60" />
                  <div className="pointer-events-none absolute left-2 -top-2 text-[10px] uppercase tracking-[0.28em] bg-emerald-500/40 px-4 py-2 rounded-md opacity-50" />
                </div>

                <p className="mt-2 text-[10px] text-red-400/70">
                  once you press it, the console stops pretending you are not the problem.
                </p>

                <div className="mt-1 flex items-center gap-2 text-[10px] text-red-300/80">
                  <span className="h-1 w-24 bg-gradient-to-r from-emerald-500 via-yellow-400 to-red-700 animate-pulse" />
                  <span>threat level: escalating</span>
                </div>
              </div>
            </div>
          )}

          {/* bottom bullying fake fields */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
            <div className="relative bg-red-950/70 border border-red-800/70 rounded-lg px-3 py-2 rotate-[-1.5deg]">
              <p className="uppercase tracking-[0.22em] text-red-400/80 mb-1 text-[11px]">
                financial sacrifice
              </p>
              <input
                disabled
                className="w-full bg-black/60 border border-red-900/70 rounded px-2 py-1 text-[11px] text-red-200/70 placeholder-red-500/60 cursor-not-allowed"
                placeholder="enter your credit card to continue"
              />
              <p className="mt-1 text-[10px] text-red-500/70">
                we already know it. this is just to watch you flinch.
              </p>
            </div>

            <div className="relative bg-emerald-950/60 border border-emerald-600/70 rounded-lg px-3 py-2 rotate-1">
              <p className="uppercase tracking-[0.22em] text-emerald-300/80 mb-1 text-[11px]">
                home coordinates
              </p>
              <input
                disabled
                className="w-full bg-black/70 border border-emerald-700/70 rounded px-2 py-1 text-[11px] text-emerald-200/80 placeholder-emerald-500/60 cursor-not-allowed"
                placeholder="paste your home address"
              />
              <p className="mt-1 text-[10px] text-emerald-400/70">
                admins consented to this. you did not.
              </p>
            </div>

            <div className="relative bg-black/80 border border-red-900/80 rounded-lg px-3 py-2 rotate-[2deg] col-span-1 sm:col-span-2">
              <p className="uppercase tracking-[0.22em] text-red-400/80 mb-1 text-[11px]">
                soul contract
              </p>
              <textarea
                disabled
                className="w-full h-20 bg-black/90 border border-red-800/80 rounded px-2 py-1 text-[10px] text-red-200/80 placeholder-red-500/70 cursor-not-allowed font-mono"
                placeholder="sign here to let atmostrack own your sleep schedule"
              />
              <p className="mt-1 text-[10px] text-red-500/70">
                admins already signed. intruders sign just by reading this line.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* spell strip */}
      <div className="pointer-events-none absolute bottom-12 left-1/2 -translate-x-1/2 text-[10px] text-red-300/80 font-mono tracking-[0.3em] rotate-[1deg] animate-flickerFast">
        ⛧ ROOT RITUAL: BY STAYING HERE YOU CONSENT TO EVERY CURSE YOU READ ⛧
      </div>

      {/* bottom misc occult text */}
      <div className="pointer-events-none absolute bottom-2 left-3 text-[10px] text-red-400/70 font-mono rotate-[-1deg]">
        IA IA ATMOS NEXUS • PRIVILEGII OCCULTI • access attempts are permanent.
      </div>
      <div className="pointer-events-none absolute bottom-2 right-3 text-[10px] text-emerald-300/80 font-mono rotate-1">
        we see your IP. we see your campus. we see your MAC.
      </div>

      {/* whisper logs near cursor */}
      <div
        className="pointer-events-none fixed z-[9998] max-w-xs bg-black/80 border border-red-900/80 rounded px-2 py-1 text-[9px] text-red-200/90 font-mono shadow-[0_0_12px_rgba(0,0,0,0.9)]"
        style={{
          transform: `translate(${cursorPos.x + 14}px, ${cursorPos.y + 12}px)`,
        }}
      >
        {(() => {
          const lines = [
            '> tracking how long you hover over each threat.',
            '> calculating which warning will finally make you leave.',
            '> your cursor path looks like someone who lies to themselves a lot.',
          ];
          return lines[Math.floor(Math.random() * lines.length)];
        })()}
      </div>

      {/* custom red cursor square */}
      <div
        className="pointer-events-none fixed z-[9999] h-4 w-4 bg-red-500 mix-blend-difference rounded-[2px] shadow-[0_0_20px_rgba(248,113,113,1)]"
        style={{
          transform: `translate(${cursorPos.x}px, ${cursorPos.y}px) translate(-50%, -50%) rotate(5deg)`,
        }}
      />
    </div>
  );
};

export default RootRitual;
