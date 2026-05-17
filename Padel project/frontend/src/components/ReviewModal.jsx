import { useState } from 'react'
import { X, Star, Shield, Clock, Eye, EyeOff } from 'lucide-react'

function StarRating({ value, onChange, label, icon: Icon }) {
  const [hovered, setHovered] = useState(0)

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-zinc-400" />
        <span className="text-sm font-medium text-zinc-300">{label}</span>
        <span className="text-xs text-zinc-600 ml-auto">
          {value > 0 ? `${value}/5` : '—'}
        </span>
      </div>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="star-btn p-0.5"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star)}
          >
            <Star
              className={`w-7 h-7 transition-colors duration-150 ${
                star <= (hovered || value)
                  ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.4)]'
                  : 'text-zinc-700'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

function PlayerReviewRow({ player, ratings, onRate }) {
  return (
    <div className="p-4 rounded-xl bg-zinc-800/40 border border-zinc-700/30 space-y-4">
      {/* Player identity */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-600 flex items-center justify-center text-xs font-bold text-zinc-300">
          {player.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-200">{player.name}</p>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
            Équipe {player.team}
          </p>
        </div>
      </div>

      {/* Rating criteria */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StarRating
          icon={Clock}
          label="Ponctualité"
          value={ratings.punctuality}
          onChange={(v) => onRate(player.id, 'punctuality', v)}
        />
        <StarRating
          icon={Shield}
          label="Comportement"
          value={ratings.behavior}
          onChange={(v) => onRate(player.id, 'behavior', v)}
        />
      </div>
    </div>
  )
}

export default function ReviewModal({ match, onClose, onSubmit }) {
  const [ratings, setRatings] = useState(
    Object.fromEntries(
      match.players.map(p => [p.id, { punctuality: 0, behavior: 0 }])
    )
  )
  const [submitted, setSubmitted] = useState(false)

  const handleRate = (playerId, criterion, value) => {
    setRatings(prev => ({
      ...prev,
      [playerId]: { ...prev[playerId], [criterion]: value }
    }))
  }

  const allRated = Object.values(ratings).every(r => r.punctuality > 0 && r.behavior > 0)

  const handleSubmit = () => {
    if (!allRated) return
    if (onSubmit) {
      onSubmit(match.id, ratings)
    }
    setSubmitted(true)
    setTimeout(onClose, 1500)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800/80 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden animate-slide-in">
        {/* Top accent */}
        <div className="h-1 bg-gradient-to-r from-neon-lime via-emerald-400 to-neon-violet" />

        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-0">
          <div>
            <h3 className="font-display font-bold text-lg text-zinc-100">
              Notation Post-Match
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              {match.club} — {match.date}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
            id="close-review-modal"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {submitted ? (
            <div className="flex flex-col items-center gap-3 py-8 animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-neon-lime/15 flex items-center justify-center glow-lime">
                <Shield className="w-7 h-7 text-neon-lime" />
              </div>
              <p className="text-lg font-display font-bold text-zinc-100">Merci !</p>
              <p className="text-sm text-zinc-400 text-center">Vos évaluations ont été enregistrées.</p>
            </div>
          ) : (
            <>
              {match.players.map((player) => (
                <PlayerReviewRow
                  key={player.id}
                  player={player}
                  ratings={ratings[player.id]}
                  onRate={handleRate}
                />
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        {!submitted && (
          <div className="p-5 pt-0 space-y-3">
            {/* Anti-revenge notice */}
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700/30">
              <EyeOff className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Les notes resteront <span className="text-zinc-400 font-medium">anonymes</span> et seront révélées dans <span className="text-zinc-400 font-medium">24h</span>, ou lorsque tous les joueurs auront noté.
              </p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!allRated}
              className={`w-full py-3 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 ${
                allRated
                  ? 'bg-gradient-to-r from-neon-lime to-emerald-500 text-zinc-950 hover:shadow-lg hover:shadow-neon-lime/25 hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
              }`}
              id="submit-reviews-btn"
            >
              {allRated ? 'Soumettre les évaluations' : 'Notez tous les joueurs pour continuer'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
