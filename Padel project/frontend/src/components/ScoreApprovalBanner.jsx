import { Check, X, ShieldAlert } from 'lucide-react'

export default function ScoreApprovalBanner({ pendingMatches, onApprove, onDispute }) {
  if (!pendingMatches || pendingMatches.length === 0) return null

  return (
    <div className="space-y-3 mb-6">
      {pendingMatches.map(match => (
        <div 
          key={match.id}
          className="p-4 rounded-xl bg-gradient-to-r from-neon-violet/10 via-purple-950/20 to-zinc-950 border border-neon-violet/30 shadow-[0_0_20px_rgba(176,38,255,0.05)] animate-slide-in flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-neon-violet/10 border border-neon-violet/25 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-neon-violet" />
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-bold text-neon-violet uppercase tracking-wider">Validation de Score Requise</span>
              <p className="text-sm font-medium text-zinc-200 mt-0.5 leading-tight">
                Un score de <strong className="text-neon-lime">{match.score.team1}</strong> a été proposé pour votre match au <strong className="text-zinc-100">{match.club}</strong>.
              </p>
            </div>
          </div>
          <div className="flex gap-2.5 shrink-0">
            <button
              onClick={() => onApprove(match.id)}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-xs font-bold tracking-wide uppercase shadow-[0_0_10px_rgba(16,185,129,0.2)] transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Confirmer
            </button>
            <button
              onClick={() => onDispute(match.id)}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 text-xs font-bold tracking-wide uppercase transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
              Contester
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
