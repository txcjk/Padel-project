import { Compass, Map, Swords, Sparkles, Check } from 'lucide-react';

export default function BadgesGrid({ stats = {}, isElite = false }) {
  // Extract and default achievement stats
  const clubsCount = stats.clubsCount || 0;
  const regionsCount = stats.regionsCount || 0;
  const hasDefeatedHighElo = stats.hasDefeatedHighElo || false;

  // Compute status
  const badges = [
    {
      id: 'routard',
      label: 'Le Routard',
      description: 'Disputer des matchs dans au moins 3 clubs différents.',
      icon: Compass,
      unlocked: clubsCount >= 3,
      progress: `${Math.min(clubsCount, 3)}/3 clubs`,
      accentClass: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400',
      activeGlow: 'glow-amber',
    },
    {
      id: 'conquerant',
      label: 'Le Conquérant',
      description: 'Jouer des matchs dans au moins 2 régions de France.',
      icon: Map,
      unlocked: regionsCount >= 2,
      progress: `${Math.min(regionsCount, 2)}/2 régions`,
      accentClass: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400',
      activeGlow: 'glow-emerald',
    },
    {
      id: 'chasseur_elo',
      label: "Chasseur d'Elo",
      description: 'Remporter un match contre un adversaire ayant +150 points Elo de plus.',
      icon: Swords,
      unlocked: hasDefeatedHighElo,
      progress: hasDefeatedHighElo ? 'Débloqué' : 'Non accompli',
      accentClass: 'from-sky-500/20 to-indigo-500/10 border-sky-500/30 text-sky-400',
      activeGlow: 'glow-sky',
    }
  ];

  return (
    <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/60 space-y-4 backdrop-blur-sm relative overflow-hidden group">
      
      {/* Decorative gradient backgrounds */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-neon-violet/5 rounded-full filter blur-[40px] pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-neon-lime/5 rounded-full filter blur-[30px] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display font-extrabold text-sm text-zinc-150 uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-neon-violet" />
          Explorer Pack Badges
        </h3>
        {isElite && (
          <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-neon-violet/10 border border-neon-violet/25 text-neon-violet glow-violet">
            Glow Élite Actif
          </span>
        )}
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-3 gap-3">
        {badges.map((b) => {
          const Icon = b.icon;
          
          return (
            <div 
              key={b.id}
              className={`relative flex flex-col items-center justify-between p-3.5 rounded-xl border text-center transition-all duration-300 ${
                b.unlocked 
                  ? `bg-gradient-to-b ${b.accentClass} ${b.activeGlow} scale-[1.02] shadow-lg`
                  : 'bg-zinc-950/40 border-zinc-800/60 text-zinc-550'
              } ${
                isElite && b.unlocked
                  ? 'border-neon-violet shadow-[0_0_15px_rgba(168,85,247,0.45)] ring-1 ring-neon-violet/30 animate-pulse-slow'
                  : ''
              }`}
              title={b.description}
            >
              {/* Badge Icon */}
              <div className="relative mb-2">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-transform duration-500 hover:rotate-6 ${
                  b.unlocked 
                    ? 'bg-zinc-900/60 border-white/10'
                    : 'bg-zinc-900/20 border-zinc-850 text-zinc-650'
                }`}>
                  <Icon className={`w-5.5 h-5.5 ${b.unlocked ? '' : 'opacity-40'}`} />
                </div>
                {b.unlocked && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-neon-lime text-zinc-950 flex items-center justify-center border border-zinc-900 shadow-md">
                    <Check className="w-2.5 h-2.5 stroke-[4]" />
                  </div>
                )}
              </div>

              {/* Title & Info */}
              <div className="space-y-1 w-full min-w-0">
                <p className={`text-[10px] font-black uppercase tracking-wider truncate ${b.unlocked ? 'text-white' : 'text-zinc-550'}`}>
                  {b.label}
                </p>
                <p className={`text-[8px] font-mono font-bold tracking-tight ${b.unlocked ? 'text-neon-lime' : 'text-zinc-600'}`}>
                  {b.progress}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
