import { useState, useEffect } from 'react'
import { Calendar, MapPin, Trophy, Shield, HelpCircle, Loader2, Sparkles, CheckCircle2, UserPlus, X, Search } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useToast } from './ToastProvider'

export default function CreateMatch({ 
  user, 
  isElite, 
  isDemo, 
  onAddMatch, 
  prefilledData = null, 
  onNavigateToDashboard,
  recentMatches = [],
  onRankedLimitReached
}) {
  const toast = useToast()
  
  const CLUBS = [
    '¡HOLA! PADEL',
    '4Padels Bordeaux', 
    'Big Padel Jet Sports', 
    'Padel Touch Arcachon', 
    'Padel Arena Rouen', 
    'Casa Padel Paris'
  ]

  // Form states
  const [club, setClub] = useState(prefilledData?.club || user?.club || CLUBS[0])
  const [date, setDate] = useState(prefilledData?.date || '')
  const [time, setTime] = useState(prefilledData?.time || '')
  const [matchType, setMatchType] = useState('Ranked') // 'Ranked' | 'Amical'
  const [eloMin, setEloMin] = useState(user?.elo ? Math.max(0, user.elo - 150) : 800)
  const [eloMax, setEloMax] = useState(user?.elo ? user.elo + 150 : 1200)
  const [isLastUrgent, setIsLastUrgent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [createdSuccess, setCreatedSuccess] = useState(false)

  // 4-Slot Composer States
  const [slot2, setSlot2] = useState(null) // Team A, partner
  const [slot3, setSlot3] = useState(null) // Team B, opponent 1
  const [slot4, setSlot4] = useState(null) // Team B, opponent 2

  // Search Modal States
  const [activeSlot, setActiveSlot] = useState(null) // 2 | 3 | 4
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)

  // Trigger search on query change
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch(searchQuery)
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

  const performSearch = async (query) => {
    setSearchLoading(true)
    try {
      if (isDemo) {
        // Mock players for Demo Mode
        const mockPlayers = [
          { id: 'mock-u2', first_name: 'Julien', last_name: 'Martinez', player_tag: 'Julien#8942', elo_rating: 1250, avatar_url: null },
          { id: 'mock-u3', first_name: 'Thomas', last_name: 'Dubois', player_tag: 'Thomas#1029', elo_rating: 1100, avatar_url: null },
          { id: 'mock-u4', first_name: 'Sarah', last_name: 'Lemoine', player_tag: 'Sarah#4728', elo_rating: 1350, avatar_url: null },
          { id: 'mock-u5', first_name: 'Maxime', last_name: 'Laurent', player_tag: 'Maxime#5639', elo_rating: 1520, avatar_url: null },
          { id: 'mock-u6', first_name: 'Lucas', last_name: 'Petit', player_tag: 'Lucas#9012', elo_rating: 980, avatar_url: null },
          { id: 'mock-u7', first_name: 'Amandine', last_name: 'Roussel', player_tag: 'Amandine#3341', elo_rating: 1180, avatar_url: null },
          { id: 'mock-u8', first_name: 'Ludovic', last_name: 'Simon', player_tag: 'Ludo#5127', elo_rating: 1420, avatar_url: null },
          { id: 'mock-u9', first_name: 'Mathieu', last_name: 'Guerin', player_tag: 'Mathieu#6631', elo_rating: 1610, avatar_url: null },
        ]
        const filtered = mockPlayers.filter(p => 
          `${p.first_name} ${p.last_name}`.toLowerCase().includes(query.toLowerCase()) ||
          p.player_tag.toLowerCase().includes(query.toLowerCase())
        )
        setSearchResults(filtered)
      } else {
        // Live Supabase query
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, player_tag, elo_rating, avatar_url')
          .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,player_tag.ilike.%${query}%`)
          .limit(10)

        if (error) throw error
        setSearchResults(data || [])
      }
    } catch (err) {
      console.error('Erreur recherche joueurs:', err)
      toast.error('Impossible de rechercher les joueurs.')
    } finally {
      setSearchLoading(false)
    }
  }

  const isPlayerAlreadySelected = (playerId) => {
    if (playerId === user?.id) return true
    if (slot2?.id === playerId) return true
    if (slot3?.id === playerId) return true
    if (slot4?.id === playerId) return true
    return false
  }

  const handleSelectPlayer = (player) => {
    if (activeSlot === 2) setSlot2(player)
    else if (activeSlot === 3) setSlot3(player)
    else if (activeSlot === 4) setSlot4(player)
    
    setShowSearchModal(false)
    setActiveSlot(null)
    setSearchQuery('')
    setSearchResults([])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!date || !time) {
      toast.error('Veuillez remplir la date et l\'heure du match.')
      return
    }

    setLoading(true)
    const scheduledAt = new Date(`${date}T${time}`).toISOString()

    try {
      // --- Ranked match limit check for non-Elite users ---
      if (matchType === 'Ranked' && !isElite) {
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const rankedThisMonth = (recentMatches || []).filter(m => {
          if (m.type !== 'Ranked') return false
          const matchDate = new Date(m.rawDate || m.date)
          return matchDate >= startOfMonth && (m.status === 'Completed' || m.status === 'Full' || m.status === 'Pending' || m.status === 'Pending_Validation')
        }).length

        if (rankedThisMonth >= 1) {
          if (onRankedLimitReached) {
            onRankedLimitReached()
          } else {
            toast.error('Limite mensuelle atteinte ! Les membres Standard sont limités à 1 match Ranked par mois. Passez Élite pour jouer en illimité dès aujourd\'hui.')
          }
          setLoading(false)
          return
        }
      }

      if (isDemo) {
        // --- Demo Mode Logic ---
        const simulatedMatch = {
          id: `demo-${crypto.randomUUID()}`,
          club,
          date: new Date(scheduledAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
          rawDate: scheduledAt,
          time: new Date(scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          type: matchType,
          status: (slot2 && slot3 && slot4) ? 'Full' : 'Pending',
          score: null,
          eloChange: 0,
          needsReview: false,
          is_last_urgent: isLastUrgent,
          eloMin: parseInt(eloMin),
          eloMax: parseInt(eloMax),
          creator: {
            id: user?.id || 'demo-u1',
            first_name: user?.firstName || 'Alexandre',
            last_name: user?.lastName || 'Dupont',
            elo_rating: user?.elo || 1420
          },
          players: [
            { id: user?.id || 'demo-u1', name: `${user?.firstName || 'Alexandre'} ${user?.lastName ? user.lastName[0] + '.' : 'D.'}`, team: 1 },
            ...(slot2 ? [{ id: slot2.id, name: `${slot2.first_name} ${slot2.last_name ? slot2.last_name[0] + '.' : ''}`, team: 1, status: 'pending_confirmation' }] : []),
            ...(slot3 ? [{ id: slot3.id, name: `${slot3.first_name} ${slot3.last_name ? slot3.last_name[0] + '.' : ''}`, team: 2, status: 'pending_confirmation' }] : []),
            ...(slot4 ? [{ id: slot4.id, name: `${slot4.first_name} ${slot4.last_name ? slot4.last_name[0] + '.' : ''}`, team: 2, status: 'pending_confirmation' }] : []),
          ],
          myTeam: 1
        }

        if (onAddMatch) {
          onAddMatch(simulatedMatch)
        }
        
        setCreatedSuccess(true)
        toast.success('Match créé avec succès (Mode Démo) !')
      } else {
        // --- Live Supabase Logic ---
        // Determine correct initial match status
        const isMatchFull = slot2 && slot3 && slot4
        const initialStatus = isMatchFull ? 'Full' : 'Pending'

        // 2. Insert match
        const { data: matchData, error: matchErr } = await supabase
          .from('matches')
          .insert({
            creator_id: user.id,
            match_type: matchType,
            club: club,
            scheduled_at: scheduledAt,
            is_last_urgent: isLastUrgent,
            elo_min: parseInt(eloMin),
            elo_max: parseInt(eloMax),
            status: initialStatus
          })
          .select()
          .single()

        if (matchErr) throw matchErr

        // 3. Multi-row insertion for all players in match_participations
        const participations = [
          {
            match_id: matchData.id,
            player_id: user.id,
            team: 1,
            joined_via_last: false,
            status: 'confirmed'
          }
        ]

        if (slot2) {
          participations.push({
            match_id: matchData.id,
            player_id: slot2.id,
            team: 1,
            joined_via_last: false,
            status: 'pending_confirmation'
          })
        }

        if (slot3) {
          participations.push({
            match_id: matchData.id,
            player_id: slot3.id,
            team: 2,
            joined_via_last: false,
            status: 'pending_confirmation'
          })
        }

        if (slot4) {
          participations.push({
            match_id: matchData.id,
            player_id: slot4.id,
            team: 2,
            joined_via_last: false,
            status: 'pending_confirmation'
          })
        }

        const { error: partErr } = await supabase
          .from('match_participations')
          .insert(participations)

        if (partErr) throw partErr

        setCreatedSuccess(true)
        toast.success('Votre match et ses invitations ont été publiés avec succès !')
        
        if (onAddMatch) {
          onAddMatch(matchData)
        }
      }
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Une erreur est survenue lors de la création.')
    } finally {
      setLoading(false)
    }
  }

  const availableResults = searchResults.filter(p => !isPlayerAlreadySelected(p.id))

  if (createdSuccess) {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-8 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 text-center space-y-6 animate-fade-in shadow-[0_0_50px_rgba(163,230,53,0.05)]">
        <div className="w-20 h-20 mx-auto rounded-full bg-neon-lime/10 border border-neon-lime/30 flex items-center justify-center glow-lime">
          <CheckCircle2 className="w-10 h-10 text-neon-lime" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display font-extrabold text-2xl text-white tracking-tight uppercase">Match publié avec succès !</h2>
          <p className="text-zinc-400 text-sm max-w-md mx-auto leading-relaxed">
            Votre match est désormais visible sur le mur principal de Padel Arena. Les autres joueurs invités ont reçu une notification pour confirmer leur participation.
          </p>
        </div>
        
        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => {
              setCreatedSuccess(false)
              setDate('')
              setTime('')
              setSlot2(null)
              setSlot3(null)
              setSlot4(null)
              setIsLastUrgent(false)
            }}
            className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-sm cursor-pointer transition-colors"
          >
            Créer un autre match
          </button>
          
          <button
            onClick={onNavigateToDashboard}
            className="px-5 py-2.5 rounded-xl bg-neon-lime hover:bg-neon-lime/90 text-zinc-950 font-bold text-sm cursor-pointer glow-lime transition-all"
          >
            Retourner au Tableau de Bord
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto mt-6 animate-slide-in relative">
      {/* Premium header card */}
      <div className="p-6 rounded-t-2xl bg-gradient-to-r from-zinc-900 to-zinc-900/90 border-t border-x border-zinc-800/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-lime/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neon-lime/10 border border-neon-lime/20 flex items-center justify-center text-neon-lime animate-pulse">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-lg uppercase tracking-wider text-white">Lancer une Partie</h2>
            <p className="text-xs text-zinc-500 font-medium">Recherchez des partenaires ou adversaires à votre niveau</p>
          </div>
        </div>
      </div>

      {/* Main Form Form */}
      <form onSubmit={handleSubmit} className="p-6 rounded-b-2xl bg-zinc-900/60 border border-zinc-800/60 space-y-6">
        
        {/* Match Type Switcher */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest font-black text-zinc-500 flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-neon-lime" /> Type de Match
          </label>
          <div className="grid grid-cols-2 gap-3 p-1 rounded-xl bg-zinc-950/80 border border-zinc-800/60">
            <button
              type="button"
              onClick={() => setMatchType('Ranked')}
              className={`py-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                matchType === 'Ranked'
                  ? 'bg-neon-lime text-zinc-950 glow-lime font-black'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              🚀 Match Classé (Elo)
            </button>
            <button
              type="button"
              onClick={() => setMatchType('Amical')}
              className={`py-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                matchType === 'Amical'
                  ? 'bg-neon-violet text-white glow-violet font-black border border-neon-violet/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              🤝 Match Amical (Casual)
            </button>
          </div>
          {matchType === 'Ranked' && (
            <p className="text-[10px] text-zinc-500 font-semibold leading-relaxed flex items-center gap-1">
              <span>{isElite ? '👑 Mode Élite : Créations illimitées.' : '⚠️ Mode Standard : Limité à 1 match Classé par mois.'}</span>
            </p>
          )}
        </div>

        {/* 4-SLOT MATCH COMPOSER LOBBY */}
        <div className="space-y-4 p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 shadow-inner">
          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-neon-lime animate-pulse" /> COMPOSITION DES ÉQUIPES (LOBBY SQUAD)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* TEAM A */}
            <div className="space-y-3 p-4 rounded-xl bg-zinc-900/40 border border-neon-lime/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-neon-lime/2 rounded-full blur-xl pointer-events-none" />
              <span className="block text-[10px] font-black uppercase text-neon-lime tracking-widest mb-1">
                ÉQUIPE A (NÉON VERT)
              </span>
              
              <div className="space-y-3">
                {/* SLOT 1 (LOCKED WITH CREATOR) */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/80 border border-zinc-800/60 shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {user?.avatar ? (
                        <img src={user.avatar} alt="Avatar" className="w-9 h-9 rounded-full object-cover border border-neon-lime/30" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-neon-lime/10 border border-neon-lime/30 flex items-center justify-center font-bold text-neon-lime text-xs">
                          {user?.firstName ? user.firstName[0] : 'U'}
                        </div>
                      )}
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-zinc-950 flex items-center justify-center border border-zinc-800">
                        <span className="text-[7px] text-neon-lime font-black">C</span>
                      </div>
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-white leading-tight">
                        {user?.firstName} {user?.lastName} (Vous)
                      </span>
                      <span className="block text-[9px] text-zinc-500 font-mono">
                        {user?.playerTag || `${user?.firstName}#0000`}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-neon-lime/15 border border-neon-lime/25 text-[9px] font-mono font-bold text-neon-lime">
                    {user?.elo || 1000} Elo
                  </span>
                </div>

                {/* SLOT 2 (PARTNER) */}
                {slot2 ? (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/80 border border-zinc-800/60 shadow-[0_2px_8px_rgba(0,0,0,0.2)] group animate-fade-in">
                    <div className="flex items-center gap-3">
                      {slot2.avatar_url ? (
                        <img src={slot2.avatar_url} alt="Avatar" className="w-9 h-9 rounded-full object-cover border border-neon-lime/30" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-neon-lime/5 border border-neon-lime/20 flex items-center justify-center font-bold text-neon-lime/80 text-xs">
                          {slot2.first_name ? slot2.first_name[0] : 'P'}
                        </div>
                      )}
                      <div>
                        <span className="block text-xs font-bold text-white leading-tight font-display">
                          {slot2.first_name} {slot2.last_name}
                        </span>
                        <span className="block text-[9px] text-zinc-500 font-mono">
                          {slot2.player_tag}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-neon-lime/15 border border-neon-lime/25 text-[9px] font-mono font-bold text-neon-lime">
                        {slot2.elo_rating} Elo
                      </span>
                      <button
                        type="button"
                        onClick={() => setSlot2(null)}
                        className="p-1 rounded bg-zinc-800 hover:bg-red-500/20 hover:text-red-400 text-zinc-500 cursor-pointer transition-colors"
                        title="Retirer le joueur"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setActiveSlot(2); setShowSearchModal(true); }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-dashed border-zinc-800 hover:border-neon-lime/40 bg-zinc-900/10 hover:bg-neon-lime/2 text-zinc-500 hover:text-neon-lime text-xs font-bold uppercase transition-all duration-300 cursor-pointer shadow-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Ajouter un partenaire</span>
                  </button>
                )}
              </div>
            </div>

            {/* TEAM B */}
            <div className="space-y-3 p-4 rounded-xl bg-zinc-900/40 border border-neon-violet/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-neon-violet/2 rounded-full blur-xl pointer-events-none" />
              <span className="block text-[10px] font-black uppercase text-neon-violet tracking-widest mb-1">
                ÉQUIPE B (VIOLET ÉLECTRIQUE)
              </span>
              
              <div className="space-y-3">
                {/* SLOT 3 (OPPONENT 1) */}
                {slot3 ? (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/80 border border-zinc-800/60 shadow-[0_2px_8px_rgba(0,0,0,0.2)] group animate-fade-in">
                    <div className="flex items-center gap-3">
                      {slot3.avatar_url ? (
                        <img src={slot3.avatar_url} alt="Avatar" className="w-9 h-9 rounded-full object-cover border border-neon-violet/30" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-neon-violet/5 border border-neon-violet/20 flex items-center justify-center font-bold text-neon-violet/80 text-xs">
                          {slot3.first_name ? slot3.first_name[0] : 'O'}
                        </div>
                      )}
                      <div>
                        <span className="block text-xs font-bold text-white leading-tight font-display">
                          {slot3.first_name} {slot3.last_name}
                        </span>
                        <span className="block text-[9px] text-zinc-500 font-mono">
                          {slot3.player_tag}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-neon-violet/15 border border-neon-violet/25 text-[9px] font-mono font-bold text-neon-violet">
                        {slot3.elo_rating} Elo
                      </span>
                      <button
                        type="button"
                        onClick={() => setSlot3(null)}
                        className="p-1 rounded bg-zinc-800 hover:bg-red-500/20 hover:text-red-400 text-zinc-500 cursor-pointer transition-colors"
                        title="Retirer le joueur"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setActiveSlot(3); setShowSearchModal(true); }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-dashed border-zinc-800 hover:border-neon-violet/40 bg-zinc-900/10 hover:bg-neon-violet/2 text-zinc-500 hover:text-neon-violet text-xs font-bold uppercase transition-all duration-300 cursor-pointer shadow-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Ajouter un adversaire 1</span>
                  </button>
                )}

                {/* SLOT 4 (OPPONENT 2) */}
                {slot4 ? (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/80 border border-zinc-800/60 shadow-[0_2px_8px_rgba(0,0,0,0.2)] group animate-fade-in">
                    <div className="flex items-center gap-3">
                      {slot4.avatar_url ? (
                        <img src={slot4.avatar_url} alt="Avatar" className="w-9 h-9 rounded-full object-cover border border-neon-violet/30" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-neon-violet/5 border border-neon-violet/20 flex items-center justify-center font-bold text-neon-violet/80 text-xs">
                          {slot4.first_name ? slot4.first_name[0] : 'O'}
                        </div>
                      )}
                      <div>
                        <span className="block text-xs font-bold text-white leading-tight font-display">
                          {slot4.first_name} {slot4.last_name}
                        </span>
                        <span className="block text-[9px] text-zinc-500 font-mono">
                          {slot4.player_tag}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-neon-violet/15 border border-neon-violet/25 text-[9px] font-mono font-bold text-neon-violet">
                        {slot4.elo_rating} Elo
                      </span>
                      <button
                        type="button"
                        onClick={() => setSlot4(null)}
                        className="p-1 rounded bg-zinc-800 hover:bg-red-500/20 hover:text-red-400 text-zinc-500 cursor-pointer transition-colors"
                        title="Retirer le joueur"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setActiveSlot(4); setShowSearchModal(true); }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-dashed border-zinc-800 hover:border-neon-violet/40 bg-zinc-900/10 hover:bg-neon-violet/2 text-zinc-500 hover:text-neon-violet text-xs font-bold uppercase transition-all duration-300 cursor-pointer shadow-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Ajouter un adversaire 2</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Club selection */}
        <div className="space-y-2">
          <label htmlFor="club-select" className="text-[10px] uppercase tracking-widest font-black text-zinc-500 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-zinc-500" /> Club Partenaire
          </label>
          <select
            id="club-select"
            value={club}
            onChange={(e) => setClub(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-zinc-950/80 border border-zinc-800/60 text-zinc-200 font-semibold text-sm focus:outline-none focus:border-neon-lime transition-colors"
          >
            {CLUBS.map((c) => (
              <option key={c} value={c} className="bg-zinc-950">{c}</option>
            ))}
          </select>
        </div>

        {/* Date and Time inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="date-input" className="text-[10px] uppercase tracking-widest font-black text-zinc-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" /> Date du Match
            </label>
            <input
              id="date-input"
              type="date"
              value={date}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-950/80 border border-zinc-800/60 text-zinc-200 font-semibold text-sm focus:outline-none focus:border-neon-lime transition-colors"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="time-input" className="text-[10px] uppercase tracking-widest font-black text-zinc-500">
              Heure de Début
            </label>
            <input
              id="time-input"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-950/80 border border-zinc-800/60 text-zinc-200 font-semibold text-sm focus:outline-none focus:border-neon-lime transition-colors"
              required
            />
          </div>
        </div>

        {/* Elo Target Filter */}
        <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800/40 space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-[10px] uppercase tracking-widest font-black text-zinc-500 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-zinc-500" /> Restriction de Niveau Elo
            </label>
            <span className="text-xs font-mono font-bold text-neon-lime">{eloMin} - {eloMax} Elo</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="elo-min" className="text-[9px] text-zinc-500 font-bold">Elo Minimum</label>
              <input
                id="elo-min"
                type="number"
                value={eloMin}
                onChange={(e) => setEloMin(parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-zinc-950/80 border border-zinc-800/60 text-zinc-200 font-mono text-xs focus:outline-none focus:border-neon-lime"
              />
            </div>
            
            <div className="space-y-1">
              <label htmlFor="elo-max" className="text-[9px] text-zinc-500 font-bold">Elo Maximum</label>
              <input
                id="elo-max"
                type="number"
                value={eloMax}
                onChange={(e) => setEloMax(parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-zinc-950/80 border border-zinc-800/60 text-zinc-200 font-mono text-xs focus:outline-none focus:border-neon-lime"
              />
            </div>
          </div>
        </div>

        {/* Last urgent SOS Switch */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-neon-violet/5 border border-neon-violet/20 hover:border-neon-violet/30 transition-colors">
          <div className="space-y-0.5 pr-4">
            <span className="text-xs font-extrabold uppercase text-neon-violet tracking-wide flex items-center gap-1.5">
              🚨 Option "Last" SOS
            </span>
            <p className="text-[10px] text-zinc-400 font-semibold leading-relaxed">
              Il manque 1 joueur en urgence à moins de 24h ? Cochez cette case pour envoyer une notification flash aux joueurs à proximité.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsLastUrgent(!isLastUrgent)}
            className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
              isLastUrgent ? 'bg-neon-violet' : 'bg-zinc-800'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                isLastUrgent ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Submit CTA */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-neon-lime hover:bg-neon-lime/90 disabled:bg-zinc-800 text-zinc-950 font-black text-sm uppercase tracking-wider cursor-pointer shadow-[0_0_20px_rgba(163,230,53,0.15)] flex items-center justify-center gap-2 hover:scale-[1.01] transition-all duration-300"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Publication en cours...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Publier le Match</span>
            </>
          )}
        </button>
      </form>

      {/* PLAYER SEARCH MODAL (OVERLAY OVER THE WHOLE CARD) */}
      {showSearchModal && (
        <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md rounded-2xl z-50 flex flex-col p-6 animate-fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
            <div>
              <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
                <Search className="w-4 h-4 text-neon-lime" />
                Rechercher un Joueur
              </h3>
              <p className="text-[10px] text-zinc-500 font-medium mt-0.5">
                {activeSlot === 2 ? 'Équipe A - Partenaire' : `Équipe B - Adversaire ${activeSlot === 3 ? '1' : '2'}`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowSearchModal(false)
                setActiveSlot(null)
                setSearchQuery('')
                setSearchResults([])
              }}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/50 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Saisissez un nom ou un tag (ex: Ludo#5127)..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-neon-lime text-white text-xs font-semibold placeholder:text-zinc-600 focus:outline-none transition-colors"
            />
          </div>

          {/* RESULTS CONTAINER */}
          <div className="mt-4 flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {searchLoading ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-3">
                <Loader2 className="w-6 h-6 text-neon-lime animate-spin" />
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Recherche en cours...</span>
              </div>
            ) : searchQuery.trim().length < 2 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="w-8 h-8 text-zinc-700 mb-2" />
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider max-w-xs leading-normal">
                  Saisissez au moins 2 caractères pour démarrer la recherche en direct
                </span>
              </div>
            ) : availableResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <HelpCircle className="w-8 h-8 text-zinc-700 mb-2" />
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider max-w-xs leading-normal">
                  Aucun joueur disponible trouvé pour "{searchQuery}"
                </span>
              </div>
            ) : (
              availableResults.map(p => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => handleSelectPlayer(p)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-neon-lime/40 hover:bg-neon-lime/2 transition-all cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3">
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt="Avatar" className="w-9 h-9 rounded-full object-cover border border-zinc-800 group-hover:border-neon-lime/30" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-zinc-400 group-hover:text-neon-lime text-xs">
                        {p.first_name[0]}
                      </div>
                    )}
                    <div>
                      <span className="block text-xs font-bold text-white group-hover:text-neon-lime transition-colors leading-tight">
                        {p.first_name} {p.last_name}
                      </span>
                      <span className="block text-[9px] text-zinc-500 font-mono mt-0.5">
                        {p.player_tag}
                      </span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded bg-zinc-800 group-hover:bg-neon-lime/10 text-[10px] font-mono font-bold text-zinc-400 group-hover:text-neon-lime transition-all">
                    {p.elo_rating || 1000} Elo
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
