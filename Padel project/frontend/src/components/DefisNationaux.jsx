import { Trophy, Compass, Swords, Sparkles, Check } from 'lucide-react';

export default function DefisNationaux({ challenges = [] }) {
  return (
    <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/60 space-y-5 backdrop-blur-sm relative overflow-hidden group">
      {/* Background radial highlight */}
      <div className="absolute -top-10 -left-10 w-28 h-28 bg-neon-lime/5 rounded-full filter blur-[35px] pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-neon-violet/5 rounded-full filter blur-[40px] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-neon-violet/15 border border-neon-violet/30 flex items-center justify-center glow-violet shrink-0">
          <Trophy className="w-4 h-4 text-neon-violet" />
        </div>
        <div>
          <h3 className="font-display font-extrabold text-sm text-zinc-150 uppercase tracking-wider">
            DÉFIS NATIONAUX
          </h3>
          <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold mt-0.5">
            Objectifs hebdomadaires de progression
          </p>
        </div>
      </div>

      {/* Challenges List */}
      <div className="space-y-3.5">
        {challenges.map((c) => {
          const isDone = c.progress >= c.target;
          
          return (
            <div 
              key={c.id} 
              className={`p-3.5 rounded-xl border transition-all duration-300 ${
                isDone 
                  ? 'bg-zinc-950/60 border-neon-lime/30 text-zinc-100 shadow-[inset_0_0_15px_rgba(163,230,53,0.03)]' 
                  : 'bg-zinc-950/40 border-zinc-850/80 text-zinc-300 hover:border-zinc-805'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <p className={`text-xs font-bold leading-snug ${isDone ? 'text-zinc-200 line-through opacity-75' : 'text-zinc-200'}`}>
                    {c.label}
                  </p>
                  <p className="text-[10px] font-semibold text-zinc-500">
                    Progression : <span className={`font-mono font-bold ${isDone ? 'text-neon-lime' : 'text-zinc-300'}`}>{c.progress}</span> / {c.target} {c.unit}s
                  </p>
                </div>

                {isDone ? (
                  <div className="w-5 h-5 rounded-full bg-neon-lime text-zinc-950 flex items-center justify-center border border-zinc-900 shadow-md shrink-0 animate-scale-up">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-zinc-800 flex items-center justify-center shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 animate-pulse" />
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mt-3 w-full h-1.5 rounded-full bg-zinc-900 border border-zinc-850/60 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ease-out rounded-full ${
                    isDone 
                      ? 'bg-gradient-to-r from-neon-lime to-emerald-400' 
                      : 'bg-gradient-to-r from-neon-violet to-indigo-500'
                  }`}
                  style={{ width: `${Math.min(100, c.percentage)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Reward description */}
      <div className="pt-1.5 flex items-center gap-2 border-t border-zinc-850/60 text-[9px] text-zinc-500 font-semibold uppercase tracking-wider">
        <Sparkles className="w-3.5 h-3.5 text-neon-violet shrink-0" />
        <span>Complétez les défis pour gagner en notoriété !</span>
      </div>
    </div>
  );
}
