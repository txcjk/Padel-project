import { AlertTriangle, Clock, MapPin, Users, Zap, Award, ChevronRight } from 'lucide-react'

function SavedBadge({ count }) {
  const tier =
    count >= 10 ? { label: 'Or', bg: 'bg-amber-500/15', border: 'border-amber-500/30', text: 'text-amber-400', icon: 'text-amber-400' } :
    count >= 5  ? { label: 'Argent', bg: 'bg-zinc-400/10', border: 'border-zinc-400/25', text: 'text-zinc-300', icon: 'text-zinc-300' } :
    { label: 'Bronze', bg: 'bg-amber-700/15', border: 'border-amber-700/30', text: 'text-amber-600', icon: 'text-amber-600' }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${tier.bg} ${tier.border} ${tier.text}`}>
      <Award className={`w-3 h-3 ${tier.icon}`} />
      Sauveur {tier.label} — {count} matchs
    </div>
  )
}

function UrgentMatchCard({ match, onSaveMatch }) {
  return (
    <div className="group relative flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl bg-zinc-800/50 border border-neon-violet/20 hover:border-neon-violet/40 transition-all duration-300 hover:bg-zinc-800/70">
      {/* Left accent */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-gradient-to-b from-neon-violet to-purple-600" />

      {/* Time block */}
      <div className="flex flex-col items-center min-w-[60px] pl-2">
        <span className="text-lg font-display font-extrabold text-neon-violet text-glow-violet">
          {match.time}
        </span>
        <span className="text-[10px] text-zinc-500 uppercase">{match.date}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          <span className="text-sm font-semibold text-zinc-200 truncate">{match.club}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-neon-lime" />
            <span className="text-xs text-zinc-400">Elo {match.eloRequired}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3 text-zinc-500" />
            <span className="text-xs text-zinc-400">
              {match.playersJoined}/{match.playersNeeded}
            </span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={() => onSaveMatch && onSaveMatch(match.id)}
        className="animate-pulse-button shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-neon-violet to-neon-violet-deep text-white text-sm font-bold tracking-wide transition-all hover:shadow-lg hover:shadow-purple-600/30 cursor-pointer"
        id={`save-match-${match.id}`}
      >
        <AlertTriangle className="w-4 h-4" />
        SAUVER LE MATCH
        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
      </button>
    </div>
  )
}

export default function LastAlert({ matches, savedCount, onSaveMatch }) {
  if (!matches || matches.length === 0) return null

  return (
    <div className="rounded-2xl overflow-hidden animate-pulse-violet">
      {/* Gradient border effect */}
      <div className="bg-gradient-to-r from-neon-violet/20 via-purple-900/30 to-neon-violet/20 border border-neon-violet/25 rounded-2xl">
        <div className="bg-zinc-950/90 backdrop-blur-sm rounded-2xl p-5 space-y-4">

          {/* Header row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-neon-violet/15 border border-neon-violet/30">
                <AlertTriangle className="w-5 h-5 text-neon-violet" />
              </div>
              <div>
                <h2 className="font-display font-extrabold text-base tracking-wide text-zinc-100">
                  ALERTE <span className="text-neon-violet text-glow-violet">LAST</span>
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-3 h-3 text-zinc-500" />
                  <span className="text-[11px] text-zinc-500">
                    {matches.length} match{matches.length > 1 ? 's' : ''} dans les 2 prochaines heures
                  </span>
                </div>
              </div>
            </div>
            <SavedBadge count={savedCount} />
          </div>

          {/* Urgent matches list */}
          <div className="space-y-3">
            {matches.map((m) => (
              <UrgentMatchCard key={m.id} match={m} onSaveMatch={onSaveMatch} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
