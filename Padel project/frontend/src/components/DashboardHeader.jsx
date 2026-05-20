import { Trophy, Zap, LogOut, Bell, Menu, X, Crown, Settings, MessageSquare } from 'lucide-react'
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

function UserAvatar({ firstName, lastName, avatar }) {
  const initials = (firstName && lastName) ? `${firstName[0]}${lastName[0]}` : 'JD'
  return (
    <div className="relative">
      {avatar ? (
        <img 
          src={avatar} 
          alt={`${firstName} ${lastName}`} 
          className="w-11 h-11 rounded-full object-cover border border-zinc-700/50"
        />
      ) : (
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-neon-lime/30 to-neon-violet/30 flex items-center justify-center border border-zinc-700/50 text-sm font-bold text-zinc-200 font-display">
          {initials}
        </div>
      )}
      {/* Online dot */}
      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-zinc-950" />
    </div>
  )
}

export default function DashboardHeader({ user, onLogout, onUpgradeClick, onProfileClick, isAdmin, onAdminClick, onNavigateTab }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([
    {
      id: 'n1',
      title: 'Victoire Classée Validée !',
      description: 'Le score de votre match à 4Padels Bordeaux est validé. +16 Elo !',
      time: 'Il y a 10 min',
      type: 'elo',
      read: false,
      tab: 'dashboard'
    },
    {
      id: 'n2',
      title: 'Inscription validée !',
      description: 'Votre binôme avec Lucas M. pour le Bordeaux Master Cup est inscrit.',
      time: 'Il y a 2 h',
      type: 'tournament',
      read: false,
      tab: 'tournaments'
    },
    {
      id: 'n3',
      title: 'Nouveau Message',
      description: 'Lucas M. : "Je serai là 10 minutes en avance pour m\'échauffer."',
      time: 'Il y a 1 j',
      type: 'chat',
      read: true,
      tab: 'chat'
    }
  ])

  const unreadCount = notifications.filter(n => !n.read).length

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const handleNotificationClick = (notif) => {
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n))
    setShowNotifications(false)
    if (onNavigateTab) {
      onNavigateTab(notif.tab)
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <a 
            href="/"
            onClick={(e) => {
              e.preventDefault()
              if (onNavigateTab) {
                onNavigateTab('dashboard')
              }
            }}
            className="hover:scale-105 active:scale-95 transition-all duration-200 ease-in-out block shrink-0 drop-shadow-[0_0_8px_rgba(163,230,53,0.15)] hover:drop-shadow-[0_0_15px_rgba(163,230,53,0.3)] cursor-pointer"
          >
            <img 
              src="/logo.png" 
              alt="elomatch - Competitive Padel Hub" 
              className="h-[7.0875rem] w-auto md:h-[7.79625rem] object-contain"
              loading="eager"
            />
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-5">
            {/* Upgrade CTA */}
            <button 
              onClick={onUpgradeClick}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-neon-violet-deep to-neon-violet hover:from-neon-violet hover:to-neon-violet-deep border border-neon-violet/30 hover:border-neon-violet/50 text-white font-bold text-xs uppercase tracking-wider glow-violet cursor-pointer transition-all duration-300 hover:scale-105"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Devenir Élite</span>
            </button>

            <EloRankBadge elo={user.elo} rank={user.rank} />

            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg hover:bg-zinc-800/60 transition-colors group cursor-pointer" 
                id="notifications-btn" 
                aria-label="Notifications"
              >
                <Bell className={`w-5 h-5 transition-colors ${showNotifications ? 'text-neon-lime animate-[pulse_1.5s_infinite]' : 'text-zinc-400 group-hover:text-zinc-200'}`} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-neon-violet rounded-full border-2 border-zinc-950 animate-pulse" />
                )}
              </button>

              {showNotifications && (
                <>
                  {/* Overlay click to close */}
                  <div className="fixed inset-0 z-40 cursor-default" onClick={() => setShowNotifications(false)} />
                  
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 shadow-[0_10px_40px_rgba(0,0,0,0.6)] z-50 animate-fade-in space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                      <span className="font-display font-black text-xs uppercase tracking-wider text-white">Notifications</span>
                      {unreadCount > 0 && (
                        <button 
                          onClick={handleMarkAllRead}
                          className="text-[10px] font-bold uppercase tracking-wider text-neon-lime hover:underline cursor-pointer bg-transparent border-none outline-none"
                        >
                          Tout marquer comme lu
                        </button>
                      )}
                    </div>
                    
                    <div className="max-h-64 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                      {notifications.length > 0 ? (
                        notifications.map(n => (
                          <div 
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex gap-3 text-left ${
                              n.read 
                                ? 'bg-zinc-900/10 border-transparent hover:bg-zinc-900/40 text-zinc-400' 
                                : 'bg-zinc-900/50 border-zinc-850 hover:bg-zinc-900 text-zinc-200 shadow-[0_0_15px_rgba(163,230,53,0.02)]'
                            }`}
                          >
                            {/* Icon Indicator */}
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${
                              n.type === 'elo' 
                                ? 'bg-neon-lime/10 border-neon-lime/20 text-neon-lime glow-lime' 
                                : n.type === 'tournament'
                                ? 'bg-neon-violet/10 border-neon-violet/20 text-neon-violet glow-violet'
                                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            }`}>
                              {n.type === 'elo' && <Trophy className="w-4 h-4" />}
                              {n.type === 'tournament' && <Crown className="w-4 h-4" />}
                              {n.type === 'chat' && <MessageSquare className="w-4 h-4" />}
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0 space-y-0.5">
                              <div className="flex justify-between items-center gap-2">
                                <span className={`text-xs font-bold truncate ${n.read ? 'text-zinc-300' : 'text-white'}`}>
                                  {n.title}
                                </span>
                                <span className="text-[8px] text-zinc-500 font-medium whitespace-nowrap shrink-0">{n.time}</span>
                              </div>
                              <p className="text-[10px] leading-relaxed text-zinc-400 font-semibold line-clamp-2">
                                {n.description}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-zinc-500 text-xs font-semibold">
                          Aucune notification récente.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Admin Panel Button */}
            {isAdmin && (
              <button 
                onClick={onAdminClick}
                className="p-2 rounded-lg hover:bg-zinc-800/60 transition-colors group cursor-pointer border border-neon-violet/30 hover:border-neon-violet/80 glow-violet"
                aria-label="Administration"
                title="Panneau d'Administration"
              >
                <Settings className="w-5 h-5 text-neon-violet group-hover:text-white transition-colors animate-[spin_10s_linear_infinite]" />
              </button>
            )}

            {/* Profile */}
            <button 
              onClick={onProfileClick}
              className="flex items-center gap-3 pl-3 border-l border-zinc-800/60 hover:opacity-80 transition-opacity text-left focus:outline-none cursor-pointer"
              aria-label="Modifier le profil"
            >
              <UserAvatar firstName={user.firstName} lastName={user.lastName} avatar={user.avatar} />
              <div className="hidden lg:flex flex-col">
                <span className="text-sm font-semibold text-zinc-200 leading-tight">
                  {user.firstName} {user.lastName ? user.lastName[0] + '.' : ''}
                </span>
                {user.playerTag && (
                  <span className="text-[10px] font-bold text-zinc-400 tracking-wide font-mono mt-0.5 leading-none">
                    {user.playerTag}
                  </span>
                )}
                <span className="text-[10px] text-zinc-500 font-medium mt-0.5 leading-none">{user.city}</span>
              </div>
            </button>

            <button 
              onClick={onLogout}
              className="p-2 rounded-lg hover:bg-zinc-800/60 transition-colors group cursor-pointer" 
              id="logout-btn"
              aria-label="Se déconnecter"
            >
              <LogOut className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-zinc-800/60"
            onClick={() => setMobileOpen(!mobileOpen)}
            id="mobile-menu-btn"
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            {mobileOpen ? <X className="w-5 h-5 text-zinc-300" /> : <Menu className="w-5 h-5 text-zinc-300" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="md:hidden pb-4 pt-2 border-t border-zinc-800/40 animate-fade-in space-y-4">
            <button 
              onClick={() => { setMobileOpen(false); onProfileClick(); }}
              className="flex items-center gap-3 w-full text-left hover:opacity-80 transition-opacity focus:outline-none cursor-pointer"
            >
              <UserAvatar firstName={user.firstName} lastName={user.lastName} avatar={user.avatar} />
              <div className="flex flex-col">
                <span className="text-base font-semibold text-zinc-200">{user.firstName} {user.lastName}</span>
                {user.playerTag && (
                  <span className="text-xs font-bold text-zinc-400 tracking-wide font-mono leading-none">
                    {user.playerTag}
                  </span>
                )}
                <span className="text-xs text-zinc-500 font-medium">{user.city}</span>
              </div>
            </button>
            <div className="flex items-center gap-4">
              <EloRankBadge elo={user.elo} rank={user.rank} />
              <button 
                onClick={() => { setMobileOpen(false); onUpgradeClick(); }}
                className="flex flex-1 justify-center items-center gap-1.5 px-3 py-1.5 rounded-full bg-neon-violet/10 border border-neon-violet/30 text-neon-violet font-bold text-xs uppercase tracking-wider glow-violet cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5" /> Élite
              </button>
              {isAdmin && (
                <button 
                  onClick={() => { setMobileOpen(false); onAdminClick(); }}
                  className="p-1.5 rounded-lg bg-neon-violet/10 border border-neon-violet/30 text-neon-violet cursor-pointer"
                  title="Administration"
                >
                  <Settings className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
