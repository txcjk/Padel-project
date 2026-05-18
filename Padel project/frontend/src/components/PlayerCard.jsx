import { Crown, Medal } from 'lucide-react'
// Note: Crown is only used for rank #1 badge, not for Elite indicator

// FIFA Tier definitions with internal metallic material styles
const rankStyles = {
  bronze: {
    bgInner: 'from-[#412920] via-[#221511] to-[#120b09]',
    bgOuter: 'from-[#cd7f32] via-[#8c5a47] to-[#452b17]',
    metalOverlay: 'from-[#cd7f32]/8 via-transparent to-[#8c5a47]/6',
    shimmerColor: 'from-transparent via-[#cd7f32]/10 to-transparent',
    borderAccent: 'border-[#cd7f32]/20',
    textColor: 'text-[#cd7f32]',
    glow: '',
    label: 'Bronze'
  },
  silver: {
    bgInner: 'from-zinc-800 via-zinc-900 to-zinc-700',
    bgOuter: 'from-[#e0e5ec] via-[#8a95a5] to-[#4a5568]',
    metalOverlay: 'from-zinc-400/12 via-transparent to-zinc-300/10',
    shimmerColor: 'from-transparent via-white/15 to-transparent',
    borderAccent: 'border-zinc-400/30',
    textColor: 'text-[#e0e5ec]',
    glow: '',
    label: 'Argent'
  },
  gold: {
    bgInner: 'from-[#4d3f0c] via-[#1f1905] to-[#0c0a02]',
    bgOuter: 'from-[#ffe066] via-[#d4af37] to-[#7a6214]',
    metalOverlay: 'from-amber-400/10 via-transparent to-yellow-600/8',
    shimmerColor: 'from-transparent via-amber-300/12 to-transparent',
    borderAccent: 'border-amber-500/20',
    textColor: 'text-[#ffe066]',
    glow: '',
    label: 'Or'
  },
  platinum: {
    bgInner: 'from-[#0a3030] via-[#041616] to-[#010a0a]',
    bgOuter: 'from-[#00ffff] via-[#00a3a3] to-[#004d4d]',
    metalOverlay: 'from-cyan-400/10 via-transparent to-teal-500/8',
    shimmerColor: 'from-transparent via-cyan-300/12 to-transparent',
    borderAccent: 'border-cyan-500/20',
    textColor: 'text-[#00ffff]',
    glow: '',
    label: 'Platine'
  },
  diamond: {
    bgInner: 'from-[#2f1557] via-[#15072b] to-[#0a0316]',
    bgOuter: 'from-[#d47fff] via-[#a020f0] to-[#4b0082]',
    metalOverlay: 'from-purple-400/12 via-transparent to-violet-500/10',
    shimmerColor: 'from-transparent via-purple-300/15 to-transparent',
    borderAccent: 'border-purple-500/25',
    textColor: 'text-[#d47fff]',
    glow: '',
    label: 'Diamant'
  }
}

const CLIP = 'polygon(50% 0%, 100% 12%, 100% 85%, 50% 100%, 0% 85%, 0% 12%)'

export default function PlayerCard({ user }) {
  const rankColorKey = typeof user.rank === 'object' ? user.rank.color : 'bronze'
  const style = rankStyles[rankColorKey] || rankStyles.bronze
  
  const playStyleShort = user.playStyle === 'Attaquant' ? 'ATT' : user.playStyle === 'Défenseur' ? 'DEF' : 'STR'
  const handInitial = user.hand === 'Gaucher' ? 'G' : 'D'
  const isElite = user.isElite === true
  const rankNum = Number(user.globalRank || 12)

  return (
    <div className="w-full max-w-[320px] mx-auto group relative">

      {/* Wrapper External Card (Border Gradient) */}
      <div 
        className={`relative p-[3px] bg-gradient-to-br ${style.bgOuter} transition-all duration-500 hover:scale-[1.03] z-10`}
        style={{ clipPath: CLIP }}
      >
        {/* Inner Card */}
        <div 
          className={`relative w-full aspect-[1/1.4] bg-gradient-to-br ${style.bgInner} ${style.borderAccent} flex flex-col justify-between p-4 pb-8 overflow-hidden`}
          style={{ clipPath: CLIP }}
        >
          {/* Internal Metallic Reflection Overlay — Elite only */}
          {isElite && (
            <div 
              className={`absolute inset-0 bg-gradient-to-br ${style.metalOverlay} pointer-events-none z-0`}
              style={{ clipPath: CLIP }}
            />
          )}

          {/* Animated Internal Shimmer Sweep — Elite only */}
          {isElite && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]" style={{ clipPath: CLIP }}>
              <div className={`absolute inset-0 bg-gradient-to-r ${style.shimmerColor} animate-card-shimmer`} />
            </div>
          )}

          {/* Elite Text Badge — top-right corner, clean typography */}
          {isElite && (
            <div className="absolute top-[15%] right-[10%] z-20">
              <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400">
                ÉLITE
              </span>
            </div>
          )}

          {/* 1. TOP HEADER: Centered Elo Rating */}
          <div className="flex flex-col items-center pt-3 z-10">
            <span className={`text-5xl font-display font-black tracking-tight ${style.textColor} drop-shadow-[0_3px_5px_rgba(0,0,0,0.9)]`}>
              {user.elo}
            </span>
            <span className="text-[11px] font-black text-white uppercase tracking-widest mt-0.5 drop-shadow-md">
              {style.label}
            </span>
          </div>

          {/* 2. MIDDLE CONTENT: Left Stats + Player Tag | Right Photo */}
          <div className="relative flex justify-between items-center h-[42%] mt-1 px-4 z-10">
            {/* Left side: vertical stats */}
            <div className="flex flex-col items-center gap-1.5 bg-black/40 px-2.5 py-2 rounded-xl border border-white/10 backdrop-blur-sm shadow-lg">
              <div className="flex flex-col items-center">
                <span className="text-xs font-black text-white leading-none">{playStyleShort}</span>
                <span className="text-[7px] font-bold text-white/50 tracking-wider uppercase">POS</span>
              </div>
              <div className="h-[1px] w-6 bg-white/20"></div>
              <div className="flex flex-col items-center">
                <span className="text-xs font-black text-white leading-none">{handInitial}</span>
                <span className="text-[7px] font-bold text-white/50 tracking-wider uppercase">MAIN</span>
              </div>
              <div className="h-[1px] w-6 bg-white/20"></div>
              <span className="text-base leading-none">🇫🇷</span>
            </div>

            {/* Right side: Photo container */}
            <div className="w-[68%] h-full flex justify-center items-end relative overflow-hidden">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.firstName} 
                  className="w-full h-full object-cover object-top"
                  style={{ WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)' }}
                />
              ) : (
                <div 
                  className="w-full h-full flex flex-col items-center justify-end pb-2"
                  style={{ WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)' }}
                >
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center border-4 border-white/20 shadow-2xl">
                    <span className="text-3xl font-black font-display text-white tracking-tighter drop-shadow-lg">
                      {user.firstName ? user.firstName[0] : 'J'}{user.lastName ? user.lastName[0] : 'P'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. NAME & CLUB — clean, no overlapping badges */}
          <div className="relative z-10 text-center px-2 mt-1">
            <h2 className="font-display font-black text-lg uppercase tracking-widest text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] truncate">
              {user.firstName} {user.lastName}
            </h2>
            <div className="flex items-center justify-center gap-1 mt-0.5 opacity-90 drop-shadow-md">
              <span className="text-[10px]">🏟️</span>
              <span className="text-[9px] font-extrabold text-white uppercase tracking-widest truncate max-w-[170px]">
                {user.club || 'Club Inconnu'}
              </span>
            </div>
          </div>

          {/* 4. BOTTOM SECTION: FIFA Stats Grid */}
          <div className="relative z-10 px-4 mt-1">
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/40 to-transparent mb-2"></div>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-center">
              <div className="flex flex-col items-center">
                <span className="text-[13px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{(user.elo ?? 1000)}</span>
                <span className="text-[8px] font-black text-white/50 uppercase tracking-widest leading-none">Score Elo</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[13px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{(user.fairPlay ?? 95)}%</span>
                <span className="text-[8px] font-black text-white/50 uppercase tracking-widest leading-none">Fair-Play</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[13px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{(user.punctuality ?? 98)}%</span>
                <span className="text-[8px] font-black text-white/50 uppercase tracking-widest leading-none">Ponctuel</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[13px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{(user.matchesSaved ?? 2)}</span>
                <span className="text-[8px] font-black text-white/50 uppercase tracking-widest leading-none">Sauvetages</span>
              </div>
            </div>

            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/40 to-transparent mt-2 mb-2"></div>
            
            {/* Rank Achievement Badge */}
            <div className="flex items-center justify-center gap-2 mt-2 z-10">
              {rankNum === 1 ? (
                <>
                  <Crown className="w-5 h-5 text-[#ffd700] filter drop-shadow-[0_0_4px_rgba(255,215,0,0.6)] animate-bounce" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#ffd700] drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.8)]">#1 Général</span>
                </>
              ) : rankNum === 2 ? (
                <>
                  <Medal className="w-5 h-5 text-[#c0c0c0] filter drop-shadow-[0_0_3px_rgba(192,192,192,0.4)]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300 drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.8)]">#2 Général</span>
                </>
              ) : rankNum === 3 ? (
                <>
                  <Medal className="w-5 h-5 text-[#cd7f32] filter drop-shadow-[0_0_3px_rgba(205,127,50,0.4)]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#cd7f32] drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.8)]">#3 Général</span>
                </>
              ) : (
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.8)]">
                  #{rankNum} Général
                </span>
              )}
            </div>

            {/* Player ID — discreet serial number at card bottom */}
            {user.playerTag && (
              <div className="text-center mt-1">
                <span className="text-[9px] font-mono text-zinc-600 tracking-wider">
                  {user.playerTag}
                </span>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
