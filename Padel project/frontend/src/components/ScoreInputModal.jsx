import { useState } from 'react'
import { X, Check, Clock, RefreshCcw, Plus, Minus } from 'lucide-react'

export default function ScoreInputModal({ match, onClose, onSubmitScore, onProposeRematch, currentUser }) {
  // Set scores state
  const [s1Us, setS1Us] = useState(6)
  const [s1Them, setS1Them] = useState(4)
  const [s2Us, setS2Us] = useState(6)
  const [s2Them, setS2Them] = useState(3)
  const [s3Us, setS3Us] = useState(0)
  const [s3Them, setS3Them] = useState(0)
  
  const [isIncomplete, setIsIncomplete] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  // Identify teams
  // In demo: currentUser is Team 1.
  const myPartnerName = "Lucas M." // Mock partner
  const opponentNames = match.players ? match.players.filter(p => p.team === 2).map(p => p.name).join(' & ') : "Sofia R. & Marc T."

  // Determine if a 3rd set is required
  const wonS1Us = s1Us > s1Them
  const wonS2Us = s2Us > s2Them
  const needsSet3 = (wonS1Us && !wonS2Us) || (!wonS1Us && wonS2Us)

  const handleIncrement = (setter, val) => {
    if (val < 10) setter(val + 1)
  }

  const handleDecrement = (setter, val) => {
    if (val > 0) setter(val - 1)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Format the scores into standard string representation e.g. "6-4 / 6-3" or "6-4 / 3-6 / 6-2"
    let team1ScoreStr = `${s1Us}-${s1Them} / ${s2Us}-${s2Them}`
    let team2ScoreStr = `${s1Them}-${s1Us} / ${s2Them}-${s2Us}`
    
    if (needsSet3) {
      team1ScoreStr += ` / ${s3Us}-${s3Them}`
      team2ScoreStr += ` / ${s3Them}-${s3Us}`
    }

    onSubmitScore(match.id, { team1: team1ScoreStr, team2: team2ScoreStr }, isIncomplete)
    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4 animate-fade-in">
        <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl text-center space-y-5">
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center glow-lime">
              <Check className="w-7 h-7 text-emerald-400" />
            </div>
          </div>
          <div>
            <h2 className="font-display font-bold text-xl text-zinc-100 mb-1">Score Transmis !</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Le score a été envoyé en attente de validation des 3 autres joueurs (Consensus 4/4).
            </p>
            {isIncomplete && (
              <p className="text-xs font-semibold text-zinc-500 mt-2 bg-zinc-800/50 py-1.5 px-3 rounded-md">
                ⚠️ Match incomplet — Enregistré comme Amical (Aucun impact Elo).
              </p>
            )}
          </div>

          <div className="pt-2 space-y-3">
            <button
              onClick={() => {
                onClose()
                if (onProposeRematch) onProposeRematch(match)
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-neon-violet text-white font-bold tracking-wide uppercase transition-all hover:opacity-90 glow-violet cursor-pointer"
            >
              <RefreshCcw className="w-4 h-4" />
              Proposer une revanche
            </button>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-lg border border-zinc-700 text-zinc-300 font-semibold tracking-wide uppercase hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    )
  }

  const ScoreCounter = ({ value, onInc, onDec }) => (
    <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg p-1.5">
      <button 
        type="button" 
        onClick={onDec}
        className="w-8 h-8 rounded-md bg-zinc-900 border border-zinc-800 hover:border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <span className="w-6 text-center font-display font-extrabold text-lg text-zinc-200">{value}</span>
      <button 
        type="button" 
        onClick={onInc}
        className="w-8 h-8 rounded-md bg-zinc-900 border border-zinc-800 hover:border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-950/50 flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-zinc-100">Saisir le Score</h2>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mt-0.5">Saisie simplifiée par Sets</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-6">
          
          {/* Perspective header to avoid inversions */}
          <div className="grid grid-cols-2 gap-4 text-center border-b border-zinc-800/50 pb-4 bg-zinc-950/20 p-3 rounded-xl border border-zinc-800/40">
            <div>
              <span className="block text-[10px] text-neon-lime font-bold uppercase tracking-wider">Votre Équipe</span>
              <span className="block text-xs font-semibold text-zinc-300 mt-1 truncate">Vous & {myPartnerName}</span>
            </div>
            <div className="border-l border-zinc-800">
              <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Adversaires</span>
              <span className="block text-xs font-semibold text-zinc-300 mt-1 truncate">{opponentNames}</span>
            </div>
          </div>

          <div className="space-y-4">
            {/* Set 1 */}
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 w-12">Set 1</span>
              <ScoreCounter value={s1Us} onInc={() => handleIncrement(setS1Us, s1Us)} onDec={() => handleDecrement(setS1Us, s1Us)} />
              <span className="font-display font-extrabold text-zinc-700">VS</span>
              <ScoreCounter value={s1Them} onInc={() => handleIncrement(setS1Them, s1Them)} onDec={() => handleDecrement(setS1Them, s1Them)} />
            </div>

            {/* Set 2 */}
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 w-12">Set 2</span>
              <ScoreCounter value={s2Us} onInc={() => handleIncrement(setS2Us, s2Us)} onDec={() => handleDecrement(setS2Us, s2Us)} />
              <span className="font-display font-extrabold text-zinc-700">VS</span>
              <ScoreCounter value={s2Them} onInc={() => handleIncrement(setS2Them, s2Them)} onDec={() => handleDecrement(setS2Them, s2Them)} />
            </div>

            {/* Set 3 (Conditional) */}
            {needsSet3 && (
              <div className="flex items-center justify-between gap-4 p-2.5 rounded-lg bg-neon-lime/5 border border-neon-lime/10 animate-slide-in">
                <span className="text-xs font-bold uppercase tracking-widest text-neon-lime w-12">Set 3</span>
                <ScoreCounter value={s3Us} onInc={() => handleIncrement(setS3Us, s3Us)} onDec={() => handleDecrement(setS3Us, s3Us)} />
                <span className="font-display font-extrabold text-neon-lime">VS</span>
                <ScoreCounter value={s3Them} onInc={() => handleIncrement(setS3Them, s3Them)} onDec={() => handleDecrement(setS3Them, s3Them)} />
              </div>
            )}
          </div>

          <label className="flex items-start gap-3 p-3 rounded-xl border border-zinc-800 bg-zinc-950/40 cursor-pointer hover:border-zinc-700 transition-colors">
            <div className="relative flex items-center mt-0.5">
              <input
                type="checkbox"
                checked={isIncomplete}
                onChange={(e) => setIsIncomplete(e.target.checked)}
                className="peer appearance-none w-4 h-4 border-2 border-zinc-600 rounded bg-zinc-900 checked:bg-amber-500 checked:border-amber-500 transition-all cursor-pointer"
              />
              <Clock className="w-3 h-3 text-zinc-900 absolute left-0.5 top-0.5 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" strokeWidth={3} />
            </div>
            <div className="flex-1">
              <span className="block text-sm font-semibold text-zinc-200">Match incomplet</span>
              <span className="block text-[10px] text-zinc-500 mt-0.5 leading-tight">
                Temps imparti dépassé. Le match sera classé "Amical" pour ne pas pénaliser l'Elo.
              </span>
            </div>
          </label>

          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-gradient-to-r from-neon-lime to-emerald-500 text-zinc-950 font-bold tracking-wide uppercase transition-all hover:opacity-90 glow-lime cursor-pointer"
          >
            Transmettre le score
          </button>
        </form>
      </div>
    </div>
  )
}
