import { useState } from 'react';
import { Lock, Crown, TrendingUp, Flame, Trophy, Users, MapPin, BarChart3, Zap, Target } from 'lucide-react';

// Simulated SVG Elo curve chart
function EloChart({ data }) {
  const maxElo = Math.max(...data.map(d => d.elo));
  const minElo = Math.min(...data.map(d => d.elo));
  const range = maxElo - minElo || 100;
  const chartH = 160;
  const chartW = 100; // percent
  const padY = 16;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = chartH - padY - ((d.elo - minElo) / range) * (chartH - 2 * padY);
    return { x, y, ...d };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = pathD + ` L ${points[points.length - 1].x} ${chartH} L ${points[0].x} ${chartH} Z`;

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 100 ${chartH}`} preserveAspectRatio="none" className="w-full h-40 sm:h-48">
        <defs>
          <linearGradient id="eloGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="50%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#a3e635" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
          <line key={i} x1="0" y1={padY + pct * (chartH - 2 * padY)} x2="100" y2={padY + pct * (chartH - 2 * padY)} stroke="#3f3f46" strokeWidth="0.3" strokeDasharray="1,1" />
        ))}
        {/* Area fill */}
        <path d={areaD} fill="url(#eloGrad)" />
        {/* Line */}
        <path d={pathD} fill="none" stroke="url(#lineGrad)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dot on last point */}
        <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="1.8" fill="#a3e635" stroke="#09090b" strokeWidth="0.6" />
      </svg>
      {/* X-axis labels */}
      <div className="flex justify-between px-1 -mt-1">
        {data.filter((_, i) => i % Math.max(1, Math.floor(data.length / 5)) === 0 || i === data.length - 1).map((d, i) => (
          <span key={i} className="text-[9px] text-zinc-600 font-medium">{d.label}</span>
        ))}
      </div>
      {/* Y-axis labels */}
      <div className="absolute top-0 right-1 flex flex-col justify-between h-40 sm:h-48 py-3 pointer-events-none">
        <span className="text-[9px] text-zinc-500 font-bold">{maxElo}</span>
        <span className="text-[9px] text-zinc-500 font-bold">{minElo}</span>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subtext, accent = 'lime' }) {
  const accents = {
    lime: 'bg-neon-lime/10 border-neon-lime/20 text-neon-lime',
    violet: 'bg-neon-violet/10 border-neon-violet/20 text-neon-violet',
    white: 'bg-zinc-800/60 border-zinc-700/30 text-white',
  };
  return (
    <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800/60 space-y-2 hover:border-zinc-700 transition-colors">
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${accents[accent]}`}>
          {icon}
        </div>
        <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">{label}</span>
      </div>
      <p className="text-2xl font-display font-extrabold text-white tracking-tight">{value}</p>
      {subtext && <p className="text-xs text-zinc-500 font-medium">{subtext}</p>}
    </div>
  );
}

function FormBadge({ result }) {
  if (result === 'W') {
    return <span className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-[10px] font-black">V</span>;
  }
  return <span className="w-7 h-7 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 text-[10px] font-black">D</span>;
}

// Lock overlay for non-Elite users
function LockedOverlay({ onUpgrade }) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl bg-zinc-950/85 backdrop-blur-md">
      <div className="flex flex-col items-center gap-5 px-6 text-center max-w-sm">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.15)]">
          <Lock className="w-10 h-10 text-amber-400" />
        </div>
        <h3 className="font-display font-extrabold text-xl text-white uppercase tracking-tight">
          Statistiques Élite
        </h3>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Cette section est réservée aux membres <span className="text-neon-violet font-bold">Élite</span>. 
          Analysez vos performances, suivez votre progression Elo et identifiez vos meilleurs coéquipiers.
        </p>
        <button 
          onClick={onUpgrade}
          className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-neon-violet to-neon-violet-deep text-white font-black uppercase tracking-widest text-xs transition-all hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] animate-pulse-button cursor-pointer"
        >
          <Crown className="w-4 h-4" />
          Débloquer vos Statistiques Élite
        </button>
      </div>
    </div>
  );
}

export default function ProStats({ user, matches = [], isElite = false, onUpgrade }) {
  // Generate mock/demo stats from matches data
  const completedMatches = matches.filter(m => m.status === 'Completed');
  
  // Calculate stats
  const totalGames = completedMatches.length || 14;
  const wins = completedMatches.filter(m => (m.eloChange || 0) > 0).length || 10;
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 71;

  // Current streak (simulated)
  const currentStreak = 4;

  // Form — last 5 results
  const formResults = ['W', 'W', 'L', 'W', 'W'];

  // Elo history (simulated progression)
  const eloHistory = [
    { label: 'Jan', elo: 1000 },
    { label: 'Fév', elo: 1025 },
    { label: 'Mar', elo: 1080 },
    { label: 'Avr', elo: 1055 },
    { label: 'Mai', elo: 1130 },
    { label: 'Jun', elo: 1190 },
    { label: 'Jul', elo: 1175 },
    { label: 'Aoû', elo: 1240 },
    { label: 'Sep', elo: 1310 },
    { label: 'Oct', elo: 1290 },
    { label: 'Nov', elo: 1365 },
    { label: 'Déc', elo: user?.elo || 1420 },
  ];

  // Teammate synergy (simulated)
  const teammates = [
    { name: 'Lucas M.', matches: 8, winRate: 87, club: '4Padels Bordeaux' },
    { name: 'Sofia R.', matches: 5, winRate: 80, club: 'Padel Touch Arcachon' },
    { name: 'Marc T.', matches: 4, winRate: 75, club: 'Big Padel Jet Sports' },
  ];

  // Club performance (simulated)
  const clubStats = [
    { club: '4Padels Bordeaux', wins: 5, losses: 1 },
    { club: 'Padel Touch Arcachon', wins: 3, losses: 2 },
    { club: 'Big Padel Jet Sports', wins: 2, losses: 1 },
  ];

  return (
    <div className="relative">
      {/* Lock overlay for non-Elite */}
      {!isElite && <LockedOverlay onUpgrade={onUpgrade} />}

      <div className={`space-y-6 ${!isElite ? 'filter blur-[6px] select-none pointer-events-none' : ''}`}>
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-display font-extrabold text-lg text-white uppercase tracking-wide flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neon-violet/10 border border-neon-violet/25 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-neon-violet" />
            </div>
            Statistiques de Pro
          </h2>
          <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full bg-neon-violet/10 border border-neon-violet/20 text-neon-violet">
            Élite
          </span>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard 
            icon={<Target className="w-4 h-4" />}
            label="Win Rate"
            value={`${winRate}%`}
            subtext={`${wins}V / ${totalGames - wins}D`}
            accent="lime"
          />
          <StatCard 
            icon={<Flame className="w-4 h-4" />}
            label="Série Actuelle"
            value={`${currentStreak}W`}
            subtext="Série de victoires"
            accent="violet"
          />
          <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800/60 space-y-2 hover:border-zinc-700 transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg border flex items-center justify-center bg-zinc-800/60 border-zinc-700/30">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Forme</span>
            </div>
            <div className="flex gap-1.5 mt-1">
              {formResults.map((r, i) => <FormBadge key={i} result={r} />)}
            </div>
            <p className="text-xs text-zinc-500 font-medium">5 derniers matchs</p>
          </div>
          <StatCard 
            icon={<Trophy className="w-4 h-4" />}
            label="Total Matchs"
            value={totalGames}
            subtext="Matchs joués"
            accent="white"
          />
        </div>

        {/* Elo Progression Chart */}
        <div className="p-5 rounded-xl bg-zinc-900/80 border border-zinc-800/60 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-sm text-zinc-200 uppercase tracking-wide flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-neon-violet" />
              Progression Elo
            </h3>
            <span className="text-xs font-bold text-neon-lime">{user?.elo || 1420} pts</span>
          </div>
          <EloChart data={eloHistory} />
        </div>

        {/* Two-column: Teammate Synergy + Club Performance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Teammate Synergy */}
          <div className="p-5 rounded-xl bg-zinc-900/80 border border-zinc-800/60 space-y-4">
            <h3 className="font-display font-bold text-sm text-zinc-200 uppercase tracking-wide flex items-center gap-2">
              <Users className="w-4 h-4 text-neon-lime" />
              Synergie Coéquipiers
            </h3>
            <div className="space-y-3">
              {teammates.map((t, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-zinc-950/50 border border-zinc-800/40 hover:border-zinc-700/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                      <span className="text-xs font-bold text-zinc-300">#{i + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-200">{t.name}</p>
                      <p className="text-[10px] text-zinc-500">{t.matches} matchs ensemble</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-display font-extrabold text-neon-lime">{t.winRate}%</p>
                    <p className="text-[10px] text-zinc-500">win rate</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Club Performance */}
          <div className="p-5 rounded-xl bg-zinc-900/80 border border-zinc-800/60 space-y-4">
            <h3 className="font-display font-bold text-sm text-zinc-200 uppercase tracking-wide flex items-center gap-2">
              <MapPin className="w-4 h-4 text-neon-violet" />
              Performance par Club
            </h3>
            <div className="space-y-3">
              {clubStats.map((c, i) => {
                const total = c.wins + c.losses;
                const pct = Math.round((c.wins / total) * 100);
                return (
                  <div key={i} className="p-3 rounded-lg bg-zinc-950/50 border border-zinc-800/40 hover:border-zinc-700/50 transition-colors space-y-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-zinc-200 truncate">{c.club}</p>
                      <span className="text-[10px] font-bold text-zinc-500 shrink-0">{total} matchs</span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-neon-lime to-emerald-400 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-emerald-400 font-bold">{c.wins} Victoires</span>
                      <span className="text-xs text-red-400 font-medium">{c.losses} Défaite{c.losses > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
