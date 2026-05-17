import { Trophy, Zap, LogOut, Bell, Menu, X } from 'lucide-react'
import { useState } from 'react'

function EloRankBadge({ elo, rank }) {
  const rankLabel = typeof rank === 'object' ? rank.label : rank
  const rankColor = typeof rank === 'object' ? rank.color : 'bronze'

  const tierStyles = {
    bronze: 'bg-[#cd7f32]/10 border-[#cd7f32]/30 text-[#cd7f32] glow-bronze',
    silver: 'bg-[#c0c0c0]/10 border-[#c0c0c0]/30 text-[#c0c0c0] glow-silver',
    gold: 'bg-[#ffd700]/10 border-[#ffd700]/30 text-[#ffd700] glow-gold',
    platinum: 'bg-[#00ced1]/10 border-[#00ced1]/30 text-[#00ced1] glow-platinum',
    diamond: 'bg-[#b026ff]/20 border-[#b026ff]/40 text-[#b026ff] glow-diamond'
  }
  const currentStyle = tierStyles[rankColor] || tierStyles.bronze

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${currentStyle}`}>
      <Trophy className="w-4 h-4" />
      <span className="font-display font-bold text-sm tracking-wide">
        {elo} Elo
      </span>
      <span className="text-zinc-400 text-xs opacity-60">•</span>
      <span className="font-medium text-xs uppercase tracking-wider opacity-80">
        {rankLabel}
      </span>
    </div>
  )
}

function UserAvatar({ firstName, lastName }) {
  const initials = `${firstName[0]}${lastName[0]}`
  return (
    <div className="relative">
      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-neon-lime/30 to-neon-violet/30 flex items-center justify-center border border-zinc-700/50 text-sm font-bold text-zinc-200 font-display">
        {initials}
      </div>
      {/* Online dot */}
      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-zinc-950" />
    </div>
  )
}

export default function DashboardHeader({ user, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-neon-lime to-neon-lime-dim flex items-center justify-center glow-lime">
              <Zap className="w-5 h-5 text-zinc-950" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-lg leading-tight tracking-tight text-zinc-100">
                PADEL<span className="text-neon-lime">ARENA</span>
              </span>
              <span className="text-[10px] tracking-[0.2em] text-zinc-500 uppercase font-medium -mt-0.5">
                Competitive Hub
              </span>
            </div>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-5">
            <EloRankBadge elo={user.elo} rank={user.rank} />

            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-zinc-800/60 transition-colors group" id="notifications-btn">
              <Bell className="w-5 h-5 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-neon-violet rounded-full border-2 border-zinc-950 animate-pulse" />
            </button>

            {/* Profile */}
            <div className="flex items-center gap-3 pl-3 border-l border-zinc-800/60">
              <UserAvatar firstName={user.firstName} lastName={user.lastName} />
              <div className="hidden lg:flex flex-col">
                <span className="text-sm font-semibold text-zinc-200 leading-tight">
                  {user.firstName} {user.lastName[0]}.
                </span>
                <span className="text-xs text-zinc-500">{user.city}</span>
              </div>
            </div>

            <button 
              onClick={onLogout}
              className="p-2 rounded-lg hover:bg-zinc-800/60 transition-colors group cursor-pointer" 
              id="logout-btn"
            >
              <LogOut className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-zinc-800/60"
            onClick={() => setMobileOpen(!mobileOpen)}
            id="mobile-menu-btn"
          >
            {mobileOpen ? <X className="w-5 h-5 text-zinc-300" /> : <Menu className="w-5 h-5 text-zinc-300" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="md:hidden pb-4 pt-2 border-t border-zinc-800/40 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <UserAvatar firstName={user.firstName} lastName={user.lastName} />
              <div>
                <p className="font-semibold text-zinc-200 text-sm">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-zinc-500">{user.city}</p>
              </div>
            </div>
            <EloRankBadge elo={user.elo} rank={user.rank} />
          </div>
        )}
      </div>
    </header>
  )
}
