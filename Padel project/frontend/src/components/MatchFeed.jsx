import { Trophy, MapPin, Clock, TrendingUp, TrendingDown, Minus, Star, Swords, AlertOctagon, CheckCircle2, XCircle } from 'lucide-react'
import { useState } from 'react'

function EloChangeTag({ change }) {
  if (change > 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs font-bold">
        <TrendingUp className="w-3 h-3" />+{change}
      </span>
    )
  }
  if (change < 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/25 text-red-400 text-xs font-bold">
        <TrendingDown className="w-3 h-3" />{change}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-700/30 border border-zinc-700/30 text-zinc-500 text-xs font-medium">
      <Minus className="w-3 h-3" />Amical
    </span>
  )
}

function MatchCard({ match, onOpenReview, onOpenScore, onEmergencyCancel }) {
  const isRanked = match.type === 'Ranked'
  const isActive = match.status === 'Pending' || match.status === 'Full'
  const [showVote, setShowVote] = useState(false)

  const handleVoteYes = () => {
    setShowVote(false)
    if (onEmergencyCancel) onEmergencyCancel(match.id)
  }

  return (
    <div className={`group p-4 rounded-xl border transition-all duration-300 space-y-3 ${
      isActive 
        ? 'bg-zinc-800/80 border-neon-lime/30 shadow-[0_0_15px_rgba(163,230,53,0.05)]' 
        : 'bg-zinc-900/60 border-zinc-800/50 hover:border-zinc-700/60'
    }`}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
            isRanked
              ? 'bg-neon-lime/10 border border-neon-lime/25'
              : 'bg-zinc-800 border border-zinc-700/40'
          }`}>
            {isRanked
              ? <Trophy className="w-4 h-4 text-neon-lime" />
              : <Swords className="w-4 h-4 text-zinc-500" />
            }
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-zinc-200 truncate">{match.club}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                isRanked
                  ? 'bg-neon-lime/10 text-neon-lime border border-neon-lime/20'
                  : 'bg-zinc-800 text-zinc-500 border border-zinc-700/30'
              }`}>
                {match.type}
              </span>
              {isActive && (
                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                  EN COURS
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <Clock className="w-3 h-3 text-zinc-600" />
              <span className="text-xs text-zinc-500">{match.date} • {match.time}</span>
            </div>
          </div>
        </div>
        {!isActive && <EloChangeTag change={match.eloChange} />}
      </div>

      {/* Score display for Completed matches */}
      {!isActive && match.score && (
        <div className="flex items-center justify-center gap-4 py-3 px-4 rounded-lg bg-zinc-800/40 border border-zinc-700/20">
          <div className="text-center">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">Équipe 1</p>
            <p className="text-sm font-display font-bold text-neon-lime">{match.score.team1}</p>
          </div>
          <div className="text-lg font-display font-extrabold text-zinc-600">VS</div>
          <div className="text-center">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">Équipe 2</p>
            <p className="text-sm font-display font-bold text-zinc-400">{match.score.team2}</p>
          </div>
        </div>
      )}

      {/* Emergency Vote Banner */}
      {showVote && isActive && (
        <div className="p-3 mt-2 rounded-lg bg-red-950/40 border border-red-500/30 animate-fade-in flex flex-col gap-2">
          <div className="flex items-center gap-2 text-red-400">
            <AlertOctagon className="w-4 h-4 shrink-0" />
            <span className="text-xs font-semibold leading-tight">Un joueur demande l'annulation d'urgence. (Vote 4/4 requis). Accepter ?</span>
          </div>
          <div className="flex gap-2 mt-1">
            <button 
              onClick={handleVoteYes}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-bold transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Oui
            </button>
            <button 
              onClick={() => setShowVote(false)}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs font-bold transition-colors cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" /> Non
            </button>
          </div>
        </div>
      )}

      {/* Active Match Actions */}
      {isActive && !showVote && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onOpenScore(match)}
            className="flex-1 py-2 rounded-lg bg-neon-lime/10 border border-neon-lime/30 text-neon-lime text-xs font-bold tracking-wide uppercase hover:bg-neon-lime/20 hover:border-neon-lime/50 transition-all glow-lime cursor-pointer"
          >
            Saisir le score
          </button>
          {isRanked && (
            <button
              onClick={() => setShowVote(true)}
              className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold tracking-wide uppercase hover:bg-red-500/20 hover:border-red-500/40 transition-all cursor-pointer"
            >
              Annuler
            </button>
          )}
        </div>
      )}

      {/* Review CTA */}
      {!isActive && match.needsReview && (
        <button
          onClick={() => onOpenReview(match)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-neon-violet/15 to-purple-900/20 border border-neon-violet/25 text-neon-violet text-xs font-bold tracking-wide hover:border-neon-violet/40 hover:bg-neon-violet/10 transition-all duration-300 group-hover:glow-violet cursor-pointer"
          id={`review-btn-${match.id}`}
        >
          <Star className="w-3.5 h-3.5" />
          NOTER LES JOUEURS
        </button>
      )}
    </div>
  )
}

export default function MatchFeed({ matches, onOpenReview, onOpenScore, onEmergencyCancel }) {
  const activeMatches = matches.filter(m => m.status === 'Pending' || m.status === 'Full')
  const completedMatches = matches.filter(m => m.status === 'Completed' || m.status === 'Cancelled')

  return (
    <div className="space-y-6">
      {/* Active Matches Section */}
      {activeMatches.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-base text-neon-lime tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-neon-lime animate-pulse glow-lime"></span>
              Matchs Actifs
            </h2>
          </div>
          <div className="space-y-3">
            {activeMatches.map((match) => (
              <MatchCard 
                key={match.id} 
                match={match} 
                onOpenScore={onOpenScore} 
                onEmergencyCancel={onEmergencyCancel} 
              />
            ))}
          </div>
        </div>
      )}

      {/* History Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-base text-zinc-100 tracking-wide">
            Historique
          </h2>
          <span className="text-xs text-zinc-500">{completedMatches.length} matchs</span>
        </div>
        <div className="space-y-3">
          {completedMatches.map((match) => (
            <MatchCard 
              key={match.id} 
              match={match} 
              onOpenReview={onOpenReview} 
            />
          ))}
          {completedMatches.length === 0 && (
            <div className="text-center py-6 text-sm text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
              Aucun match historique.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
