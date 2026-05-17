import { useState } from 'react'
import { Trophy, MapPin, Swords, Medal, Crown } from 'lucide-react'

const getTierStyle = (tierColor) => {
  const styles = {
    bronze: 'bg-[#cd7f32]/20 border-[#cd7f32]/50 text-[#cd7f32]',
    silver: 'bg-[#c0c0c0]/20 border-[#c0c0c0]/50 text-[#c0c0c0]',
    gold: 'bg-[#ffd700]/20 border-[#ffd700]/50 text-[#ffd700]',
    platinum: 'bg-[#00ced1]/20 border-[#00ced1]/50 text-[#00ced1]',
    diamond: 'bg-[#b026ff]/30 border-[#b026ff]/60 text-[#b026ff] glow-diamond'
  }
  return styles[tierColor] || styles.bronze
}

const getTierTextGlow = (tierColor) => {
  const styles = {
    bronze: 'text-glow-bronze text-[#cd7f32]',
    silver: 'text-glow-silver text-[#c0c0c0]',
    gold: 'text-glow-gold text-[#ffd700]',
    platinum: 'text-glow-platinum text-[#00ced1]',
    diamond: 'text-glow-diamond text-[#b026ff]'
  }
  return styles[tierColor] || styles.bronze
}

export default function Leaderboard({ players, currentUser }) {
  const [activeTab, setActiveTab] = useState('Général')

  // Sort and filter players
  const filteredPlayers = players.filter(p => {
    if (activeTab === 'Par Région' && currentUser?.region) {
      return p.region === currentUser.region
    }
    if (activeTab === 'Par Club' && currentUser?.club) {
      return p.club === currentUser.club
    }
    return true
  }).sort((a, b) => b.elo - a.elo)

  return (
    <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800/60 overflow-hidden backdrop-blur-sm flex flex-col h-[600px]">
      {/* Header & Tabs */}
      <div className="p-5 border-b border-zinc-800/60 shrink-0 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neon-lime/15 border border-neon-lime/30 flex items-center justify-center glow-lime">
            <Trophy className="w-5 h-5 text-neon-lime" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-xl text-zinc-100 tracking-wide">
              CLASSEMENT <span className="text-neon-lime text-glow-lime">ARENA</span>
            </h2>
            <p className="text-xs text-zinc-500 uppercase tracking-widest mt-0.5">Top Joueurs Padel</p>
          </div>
        </div>

        <div className="flex bg-zinc-950/60 p-1 rounded-xl border border-zinc-800/40">
          {['Général', 'Par Région', 'Par Club'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-[11px] font-bold tracking-wider uppercase transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-zinc-800 text-zinc-100 shadow-md border border-zinc-700/30'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-zinc-950/40 border-b border-zinc-800/40 text-[10px] font-bold text-zinc-500 uppercase tracking-widest shrink-0">
        <div className="col-span-1 text-center">Pos</div>
        <div className="col-span-4">Joueur</div>
        <div className="col-span-3 text-center">Score Elo</div>
        <div className="col-span-2 text-center">Win %</div>
        <div className="col-span-2">Club</div>
      </div>

      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1.5">
        {filteredPlayers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-2">
            <Swords className="w-8 h-8 opacity-50" />
            <p className="text-sm">Aucun joueur trouvé pour ce filtre.</p>
          </div>
        ) : (
          filteredPlayers.map((player, index) => {
            const isTop1 = index === 0
            const isTop2 = index === 1
            const isTop3 = index === 2
            const isCurrentUser = currentUser && player.id === currentUser.id
            
            const rankLabel = typeof player.rank === 'object' ? player.rank.label : player.rank
            const rankColor = typeof player.rank === 'object' ? player.rank.color : 'bronze'

            return (
              <div
                key={player.id}
                className={`grid grid-cols-12 gap-4 items-center px-4 py-3 rounded-xl border transition-all duration-300 hover:bg-zinc-800/80 ${
                  isTop1 ? 'bg-gradient-to-r from-[#ffd700]/10 to-transparent border-[#ffd700]/30 shadow-[inset_0_0_20px_rgba(255,215,0,0.05)]' :
                  isTop2 ? 'bg-gradient-to-r from-[#c0c0c0]/10 to-transparent border-[#c0c0c0]/20' :
                  isTop3 ? 'bg-gradient-to-r from-[#cd7f32]/10 to-transparent border-[#cd7f32]/20' :
                  isCurrentUser ? 'bg-zinc-800/60 border-neon-violet/30' :
                  'bg-zinc-900/40 border-zinc-800/40'
                }`}
              >
                {/* Position */}
                <div className="col-span-1 flex justify-center">
                  {isTop1 ? <Crown className="w-5 h-5 text-[#ffd700] drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]" /> :
                   isTop2 ? <Medal className="w-5 h-5 text-[#c0c0c0]" /> :
                   isTop3 ? <Medal className="w-5 h-5 text-[#cd7f32]" /> :
                   <span className="text-sm font-bold text-zinc-600">{index + 1}</span>}
                </div>

                {/* Player Identity */}
                <div className="col-span-4 flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-xs font-bold font-display ${
                    isTop1 ? 'bg-[#ffd700]/20 text-[#ffd700] border border-[#ffd700]/40' :
                    'bg-zinc-800 border border-zinc-700/50 text-zinc-300'
                  }`}>
                    {player.firstName[0]}{player.lastName[0]}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-bold truncate ${isCurrentUser ? 'text-neon-violet' : 'text-zinc-200'}`}>
                      {player.firstName} {player.lastName}
                    </p>
                    {isCurrentUser && <span className="text-[9px] uppercase font-bold text-neon-violet tracking-widest">Vous</span>}
                  </div>
                </div>

                {/* Elo & Badge */}
                <div className="col-span-3 flex flex-col items-center justify-center">
                  <span className={`text-sm font-display font-extrabold ${getTierTextGlow(rankColor)}`}>
                    {player.elo}
                  </span>
                  <div className={`mt-0.5 px-1.5 py-[1px] text-[8px] font-black uppercase tracking-widest rounded border ${getTierStyle(rankColor)}`}>
                    {rankLabel}
                  </div>
                </div>

                {/* Win Rate */}
                <div className="col-span-2 flex justify-center">
                  <span className={`text-xs font-semibold ${
                    player.winRate >= 65 ? 'text-emerald-400' :
                    player.winRate >= 50 ? 'text-zinc-300' : 'text-red-400'
                  }`}>
                    {player.winRate}%
                  </span>
                </div>

                {/* Club */}
                <div className="col-span-2 flex items-center min-w-0">
                  <MapPin className="w-3 h-3 text-zinc-600 shrink-0 mr-1" />
                  <span className="text-[10px] text-zinc-400 truncate">{player.club}</span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
