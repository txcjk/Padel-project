import { Check, X, Sparkles, UserPlus } from 'lucide-react'

export default function MatchInvitationBanner({ invitations, onConfirm, onDecline }) {
  if (!invitations || invitations.length === 0) return null

  return (
    <div className="space-y-3 mb-6">
      {invitations.map(inv => {
        const match = inv.matches
        const creatorName = match?.profiles?.first_name 
          ? `${match.profiles.first_name} ${match.profiles.last_name ? match.profiles.last_name[0] + '.' : ''}`
          : 'Un joueur'
        
        const dateStr = match?.scheduled_at 
          ? new Date(match.scheduled_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
          : 'Date inconnue'
        
        const timeStr = match?.scheduled_at 
          ? new Date(match.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          : ''

        return (
          <div 
            key={inv.id}
            className="p-4 rounded-xl bg-gradient-to-r from-neon-lime/10 via-zinc-900 to-zinc-950 border border-neon-lime/30 shadow-[0_0_20px_rgba(163,230,53,0.05)] animate-slide-in flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-neon-lime/10 border border-neon-lime/25 flex items-center justify-center shrink-0 glow-lime">
                <UserPlus className="w-5 h-5 text-neon-lime" />
              </div>
              <div className="min-w-0">
                <span className="flex items-center gap-1.5 text-xs font-bold text-neon-lime uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" /> Invitation au Match
                </span>
                <p className="text-sm font-medium text-zinc-200 mt-0.5 leading-tight">
                  <strong className="text-white">{creatorName}</strong> vous a ajouté au match du <strong className="text-white">{dateStr} {timeStr}</strong> au club <strong className="text-neon-lime">{match?.club || 'Padel Club'}</strong>.
                </p>
              </div>
            </div>
            <div className="flex gap-2.5 shrink-0">
              <button
                onClick={() => onConfirm(inv.id, inv.match_id)}
                className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-neon-lime hover:bg-neon-lime/90 text-zinc-950 text-xs font-bold tracking-wide uppercase shadow-[0_0_10px_rgba(163,230,53,0.2)] transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Accepter
              </button>
              <button
                onClick={() => onDecline(inv.id, inv.match_id)}
                className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 text-xs font-bold tracking-wide uppercase transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
                Décliner
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
