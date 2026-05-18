import { X, Shield, Swords, Mail, UserPlus, MapPin, Sparkles } from 'lucide-react'
import PlayerCard from './PlayerCard'

export default function PlayerProfileModal({ player, onClose, onChallenge }) {
  if (!player) return null

  // Ensure rank structures are compatible
  const rankLabel = typeof player.rank === 'object' ? player.rank.label : player.rank || 'Bronze'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-850 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col md:flex-row animate-scale-up">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-zinc-950/60 border border-zinc-850 flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* LEFT COLUMN: FIFA Card Presentation */}
        <div className="w-full md:w-[42%] bg-zinc-950/60 p-8 flex items-center justify-center border-b md:border-b-0 md:border-r border-zinc-850">
          <div className="w-full max-w-[280px]">
            <PlayerCard user={player} />
          </div>
        </div>

        {/* RIGHT COLUMN: Player Info & Actions */}
        <div className="flex-1 p-8 flex flex-col justify-between">
          <div className="space-y-6">
            {/* Header info */}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-neon-lime/10 text-neon-lime border border-neon-lime/20 tracking-wider">
                  Profil Public
                </span>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-purple-500/10 text-neon-violet border border-neon-violet/20 tracking-wider">
                  {rankLabel}
                </span>
              </div>
              <h2 className="text-3xl font-display font-extrabold text-white uppercase tracking-wide mt-2">
                {player.firstName} {player.lastName}
              </h2>
              <div className="flex items-center gap-1.5 text-zinc-400 text-sm mt-1">
                <MapPin className="w-4 h-4 text-zinc-500" />
                <span>{player.club || 'Padel Arena'} • {player.region || 'Nouvelle-Aquitaine'}</span>
              </div>
            </div>

            {/* Divider */}
            <div className="h-[1px] w-full bg-zinc-800"></div>

            {/* Detailed Padel Attributes */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-zinc-950/40 rounded-xl border border-zinc-850">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Latéralité</span>
                <p className="text-sm font-extrabold text-zinc-200 mt-0.5">{player.hand || 'Droitier'}</p>
              </div>
              <div className="p-3 bg-zinc-950/40 rounded-xl border border-zinc-850">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Style de jeu</span>
                <p className="text-sm font-extrabold text-zinc-200 mt-0.5">{player.playStyle || 'Stratège'}</p>
              </div>
              <div className="p-3 bg-zinc-950/40 rounded-xl border border-zinc-850">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Taux de Victoire</span>
                <p className="text-sm font-extrabold text-emerald-400 mt-0.5">{player.winRate || 50}%</p>
              </div>
              <div className="p-3 bg-zinc-950/40 rounded-xl border border-zinc-850">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Niveau Général</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-sm font-extrabold text-amber-400">{player.elo || 1000} ELO</span>
                </div>
              </div>
            </div>

            {/* Gamification statement */}
            <div className="p-4 rounded-xl bg-zinc-950/30 border border-zinc-850/60 flex items-start gap-3">
              <Shield className="w-5 h-5 text-neon-lime shrink-0 mt-0.5" />
              <p className="text-xs text-zinc-400 leading-relaxed">
                Ce joueur possède un indice de confiance exceptionnel de <strong className="text-zinc-200">{player.fairPlay || 95}%</strong> en Fair-play et <strong className="text-zinc-200">{player.punctuality || 98}%</strong> de Ponctualité.
              </p>
            </div>
          </div>

          {/* ACTIONS FOOTER */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <button 
              onClick={() => onChallenge(player)}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-neon-lime text-zinc-950 font-bold uppercase text-xs tracking-wider shadow-[0_0_20px_rgba(163,230,53,0.3)] hover:bg-lime-400 hover:shadow-[0_0_25px_rgba(163,230,53,0.4)] transition-all cursor-pointer"
            >
              <Swords className="w-4 h-4" />
              Défier ce Joueur
            </button>
            <button 
              onClick={() => alert(`Demande d'ami envoyée à ${player.firstName} !`)}
              className="px-6 py-3.5 rounded-xl bg-zinc-800 border border-zinc-700/60 text-zinc-200 text-xs font-bold uppercase tracking-wider hover:bg-zinc-700 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Ajouter en Ami
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
