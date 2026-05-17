import { MapPin, Shield, Flame, Zap, Award, TrendingUp, Hand, Crosshair } from 'lucide-react'

function FairPlayBar({ score }) {
  const color =
    score >= 80 ? 'bg-emerald-500' :
    score >= 70 ? 'bg-amber-500' :
    'bg-red-500'
  const glowColor =
    score >= 80 ? 'shadow-emerald-500/30' :
    score >= 70 ? 'shadow-amber-500/30' :
    'shadow-red-500/30'
  const label =
    score >= 80 ? 'Exemplaire' :
    score >= 70 ? 'Correct' :
    'Attention'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Trust Score</span>
        <div className="flex items-center gap-1.5">
          <Shield className={`w-3.5 h-3.5 ${score >= 80 ? 'text-emerald-400' : score >= 70 ? 'text-amber-400' : 'text-red-400'}`} />
          <span className={`text-sm font-bold ${score >= 80 ? 'text-emerald-400' : score >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
            {score}%
          </span>
          <span className="text-[10px] text-zinc-500 ml-1">— {label}</span>
        </div>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} shadow-lg ${glowColor} transition-all duration-700 ease-out`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

function Badge({ label, color }) {
  const styles =
    color === 'violet'
      ? 'bg-neon-violet/15 text-purple-300 border-neon-violet/30'
      : 'bg-neon-lime/10 text-lime-300 border-neon-lime/25'
  const icon =
    color === 'violet'
      ? <Flame className="w-3 h-3" />
      : <Zap className="w-3 h-3" />

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${styles} transition-transform hover:scale-105`}>
      {icon}
      {label}
    </span>
  )
}

function StatItem({ icon: Icon, label, value, accent }) {
  return (
    <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/20">
      <Icon className={`w-4 h-4 ${accent || 'text-zinc-400'}`} />
      <span className={`text-lg font-bold font-display ${accent || 'text-zinc-200'}`}>{value}</span>
      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</span>
    </div>
  )
}

const rankStyles = {
  bronze: 'bg-[#cd7f32]/20 border-[#cd7f32]/50 text-[#cd7f32] glow-bronze',
  silver: 'bg-[#c0c0c0]/20 border-[#c0c0c0]/50 text-[#c0c0c0] glow-silver',
  gold: 'bg-[#ffd700]/20 border-[#ffd700]/50 text-[#ffd700] glow-gold',
  platinum: 'bg-[#00ced1]/20 border-[#00ced1]/50 text-[#00ced1] glow-platinum',
  diamond: 'bg-[#b026ff]/30 border-[#b026ff]/60 text-[#b026ff] glow-diamond'
}

export default function PlayerCard({ user }) {
  const savedTier =
    user.matchesSaved >= 10 ? { label: 'Or', color: 'text-amber-400' } :
    user.matchesSaved >= 5 ? { label: 'Argent', color: 'text-zinc-300' } :
    { label: 'Bronze', color: 'text-amber-600' }
    
  // Handle the new rank object or fallback
  const rankLabel = typeof user.rank === 'object' ? user.rank.label : user.rank
  const rankColorKey = typeof user.rank === 'object' ? user.rank.color : 'bronze'
  const rankBadgeClass = rankStyles[rankColorKey] || rankStyles.bronze

  // Default missing gamification fields to graceful fallbacks
  const playStyleIcon = user.playStyle === 'Attaquant' ? '⚔️' : user.playStyle === 'Défenseur' ? '🛡️' : '🧠'
  
  return (
    <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800/60 overflow-hidden backdrop-blur-sm">
      {/* Top gradient accent */}
      <div className="h-1 bg-gradient-to-r from-neon-lime via-emerald-400 to-neon-violet" />

      <div className="p-5 space-y-5">
        {/* Avatar + Identity */}
        <div className="flex items-start gap-4">
          <div className="relative shrink-0 mt-1">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center border border-zinc-700/40 text-xl font-bold text-zinc-200 font-display">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div className={`absolute -bottom-2 -right-3 px-2 py-0.5 rounded-md border text-[10px] font-black uppercase tracking-wider ${rankBadgeClass}`}>
              {rankLabel}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-bold text-xl text-zinc-100 truncate">
              {user.firstName} {user.lastName}
            </h2>
            <div className="flex flex-col gap-1 mt-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">🏟️</span>
                <span className="text-xs font-medium text-zinc-400">{user.club || 'Club Inconnu'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-zinc-500" />
                <span className="text-xs text-zinc-500">{user.city}{user.region ? `, ${user.region}` : ''}</span>
              </div>
            </div>
            <div className="mt-2.5">
              <span className={`text-2xl font-display font-extrabold text-glow-${rankColorKey} ${rankStyles[rankColorKey].split(' ')[2]}`}>
                {user.elo}
              </span>
              <span className="text-xs text-zinc-500 ml-1.5">Elo Points</span>
            </div>
          </div>
        </div>

        {/* Gamification Pills (Caractéristiques) */}
        <div className="flex items-center gap-2 pt-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-800/50 border border-zinc-700/50">
             <span className="text-[11px] font-semibold text-zinc-300">👋 {user.hand || 'Droitier'}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-800/50 border border-zinc-700/50">
             <span className="text-[11px] font-semibold text-zinc-300">{playStyleIcon} {user.playStyle || 'Stratège'}</span>
          </div>
        </div>

        {/* Stats mini-grid */}
        <div className="grid grid-cols-3 gap-2">
          <StatItem icon={TrendingUp} label="Elo" value={user.elo} accent="text-neon-lime" />
          <StatItem icon={Shield} label="Fair-Play" value={`${user.fairPlay}%`} accent="text-emerald-400" />
          <StatItem icon={Award} label="Sauvés" value={user.matchesSaved} accent="text-neon-violet" />
        </div>

        {/* Fair-Play bar */}
        <FairPlayBar score={user.fairPlay} />

        {/* Punctuality */}
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-zinc-500 uppercase tracking-wider">Ponctualité</span>
          <span className="text-sm font-semibold text-emerald-400">{user.punctuality}%</span>
        </div>

        {/* Badges */}
        <div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2 font-medium">Badges de Reconnaissance</p>
          <div className="flex flex-wrap gap-2">
            {user.badges.map((b, i) => (
              <Badge key={i} label={b.label} color={b.color} />
            ))}
          </div>
        </div>

        {/* Saved tier badge */}
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-zinc-800/50 border border-zinc-700/30">
          <Award className={`w-5 h-5 ${savedTier.color}`} />
          <div>
            <p className={`text-sm font-bold ${savedTier.color}`}>Sauveur {savedTier.label}</p>
            <p className="text-[10px] text-zinc-500">{user.matchesSaved} matchs sauvés au total</p>
          </div>
        </div>
      </div>
    </div>
  )
}
