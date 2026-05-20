import { useState, useEffect, useMemo } from 'react'
import { supabase } from './supabaseClient'
import { useToast } from './components/ToastProvider.jsx'
import Auth from './components/Auth'
import DashboardHeader from './components/DashboardHeader.jsx'
import PlayerCard from './components/PlayerCard.jsx'
import LastAlert from './components/LastAlert.jsx'
import ReviewModal from './components/ReviewModal.jsx'
import MatchFeed from './components/MatchFeed.jsx'
import Leaderboard from './components/Leaderboard.jsx'
import ScoreInputModal from './components/ScoreInputModal.jsx'
import GLHFNudgeModal from './components/GLHFNudgeModal.jsx'
import ScoreApprovalBanner from './components/ScoreApprovalBanner.jsx'
import MatchInvitationBanner from './components/MatchInvitationBanner.jsx'
import PlayerProfileModal from './components/PlayerProfileModal.jsx'
import CGU from './components/CGU.jsx'
import PremiumSubscription from './components/PremiumSubscription.jsx'
import OnboardingForm from './components/OnboardingForm.jsx'
import EditProfileModal from './components/EditProfileModal.jsx'
import ProStats from './components/ProStats.jsx'
import RankedLimitModal from './components/RankedLimitModal.jsx'
import AdminPanel from './components/AdminPanel.jsx'
import { LayoutDashboard, PlusCircle, Calendar, MessageSquare, Trophy } from 'lucide-react'
import CreateMatch from './components/CreateMatch.jsx'
import Bookings from './components/Bookings.jsx'
import Chat from './components/Chat.jsx'
import Tournaments from './components/Tournaments.jsx'
import BadgesGrid from './components/BadgesGrid.jsx'
import DefisNationaux from './components/DefisNationaux.jsx'

// Helpers
const getRankFromElo = (elo) => {
  if (elo >= 1800) return { label: 'Diamant', color: 'diamond' }
  if (elo >= 1500) return { label: 'Platine', color: 'platinum' }
  if (elo >= 1200) return { label: 'Or', color: 'gold' }
  if (elo >= 900) return { label: 'Argent', color: 'silver' }
  return { label: 'Bronze', color: 'bronze' }
}

/* ─── Mock data for Demo Mode ───────────────────────── */
const demoUser = {
  id: 'demo-u1',
  firstName: 'Alexandre (Démo)',
  lastName: 'Dupont',
  city: 'Bordeaux',
  region: 'Nouvelle-Aquitaine',
  club: '4Padels Bordeaux',
  hand: 'Droitier',
  playStyle: 'Attaquant',
  avatar: null,
  elo: 1420,
  rank: getRankFromElo(1420),
  fairPlay: 94,
  punctuality: 97,
  matchesSaved: 7,
  badges: [
    { label: 'Pompier du Padel Lvl 2', color: 'violet' },
    { label: 'Joueur Flash', color: 'lime' },
    { label: 'Fiable +50', color: 'lime' },
  ],
}

const generateMockLeaderboard = () => {
  const players = [demoUser]
  const firstNames = ['Léo', 'Gabriel', 'Raphaël', 'Arthur', 'Louis', 'Emma', 'Jade', 'Louise', 'Alice', 'Lina', 'Hugo', 'Jules']
  const lastNames = ['Martin', 'Bernard', 'Thomas', 'Petit', 'Robert', 'Richard', 'Durand', 'Dubois', 'Moreau', 'Laurent']
  const clubs = ['4Padels Bordeaux', 'Big Padel Jet Sports', 'Padel Touch Arcachon', 'Padel Arena Rouen', 'Casa Padel Paris']
  const regions = ['Nouvelle-Aquitaine', 'Île-de-France', 'Normandie']

  for (let i = 0; i < 20; i++) {
    const elo = Math.floor(Math.random() * (1950 - 800 + 1)) + 800
    players.push({
      id: `demo-bot-${i}`,
      firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
      lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
      club: clubs[Math.floor(Math.random() * clubs.length)],
      region: regions[Math.floor(Math.random() * regions.length)],
      elo: elo,
      rank: getRankFromElo(elo),
      winRate: Math.floor(Math.random() * (75 - 40 + 1)) + 40
    })
  }
  return players
}
const demoLeaderboard = generateMockLeaderboard()

const demoUrgentMatches = [
  {
    id: 'demo-m1',
    club: 'Padel Touch Arcachon',
    time: '21:00',
    date: "Aujourd'hui",
    eloRequired: '1300-1500',
    playersJoined: 3,
    playersNeeded: 4,
  },
]

const demoRecentMatches = [
  {
    id: 'demo-r_pending',
    club: 'Padel Touch Arcachon',
    date: "Aujourd'hui",
    time: '18:00',
    type: 'Ranked',
    status: 'Pending_Validation',
    score: { team1: '6-4 / 6-2', team2: '4-6 / 2-6' },
    eloChange: 0,
    needsReview: false,
    players: [
      { id: 'p1', name: 'Lucas M.', team: 1 },
      { id: 'p2', name: 'Sofia R.', team: 1 },
      { id: 'p3', name: 'Marc T.', team: 2 },
    ],
  },
  {
    id: 'demo-r0',
    club: '4Padels Bordeaux',
    date: "Aujourd'hui",
    time: '20:00',
    type: 'Ranked',
    status: 'Full',
    score: null,
    eloChange: 0,
    needsReview: false,
    players: [
      { id: 'p1', name: 'Lucas M.', team: 1 },
      { id: 'p2', name: 'Sofia R.', team: 1 },
      { id: 'p3', name: 'Marc T.', team: 2 },
    ],
  },
  {
    id: 'demo-r1',
    club: '4Padels Bordeaux',
    date: '16 Mai 2026',
    time: '19:00',
    type: 'Ranked',
    status: 'Completed',
    score: { team1: '6-4 / 6-3', team2: '4-6 / 3-6' },
    eloChange: 18,
    needsReview: true,
    players: [
      { id: 'p1', name: 'Lucas M.', team: 1 },
      { id: 'p2', name: 'Sofia R.', team: 1 },
      { id: 'p3', name: 'Marc T.', team: 2 },
    ],
  },
]

// Helper: traduit les erreurs techniques en messages français lisibles
const getFriendlyErrorMessage = (err) => {
  const msg = (err?.message || err?.toString() || '').toLowerCase()
  if (msg.includes('auth session missing') || msg.includes('not authenticated') || msg.includes('jwt expired') || msg.includes('refresh_token'))
    return 'Session expirée. Veuillez vous reconnecter.'
  if (msg.includes('409') || msg.includes('déjà complet') || msg.includes('already exists') || msg.includes('duplicate'))
    return 'Ce match est déjà complet !'
  if (msg.includes('participez déjà'))
    return 'Vous participez déjà à ce match.'
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch') || msg.includes('net::'))
    return 'Connexion réseau perdue. Vérifiez votre connexion Internet.'
  if (msg.includes('permission') || msg.includes('forbidden') || msg.includes('403'))
    return "Vous n'avez pas les droits pour effectuer cette action."
  if (msg.includes('not found') || msg.includes('404'))
    return 'La ressource demandée est introuvable.'
  if (msg.includes('rate limit') || msg.includes('429'))
    return 'Trop de requêtes. Veuillez patienter quelques instants.'
  // Si le message source est déjà explicite en français, le conserver
  if (/^[A-ZÀ-ÖÙ-Ü]/.test(err?.message || '') && err.message.length < 120)
    return err.message
  return 'Une erreur est survenue. Veuillez réessayer dans quelques instants.'
}

export default function App() {
  const toast = useToast()
  const [session, setSession] = useState(null)
  const [isDemo, setIsDemo] = useState(false)
  const [userProfile, setUserProfile] = useState(null)
  const [urgentMatches, setUrgentMatches] = useState([])
  const [recentMatches, setRecentMatches] = useState([])
  const [leaderboardPlayers, setLeaderboardPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [prefilledMatchData, setPrefilledMatchData] = useState(null)
  const [pendingInvitations, setPendingInvitations] = useState([])
  const [activeChatRecipient, setActiveChatRecipient] = useState(null)

  // Review Modal States
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewMatch, setReviewMatch] = useState(null)
  
  // Edge Case Feature States
  const [showGLHFNudge, setShowGLHFNudge] = useState(false)
  const [showScoreModal, setShowScoreModal] = useState(false)
  const [activeScoreMatch, setActiveScoreMatch] = useState(null)
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [showCGU, setShowCGU] = useState(false)
  const [showPremium, setShowPremium] = useState(false)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [showRankedLimit, setShowRankedLimit] = useState(false)
  const [showAdminPanel, setShowAdminPanel] = useState(false)

  // Gamification States
  const [hasConsultedRegion, setHasConsultedRegion] = useState(false)
  const [dbRanks, setDbRanks] = useState(null)

  // Admin access check
  const isAdmin = session?.user?.email === 'ludow3b@gmail.com'

  // Elite status — connected to Supabase is_elite column
  const isElite = userProfile?.isElite === true

  // Fetch real competitive ranks from Supabase in Live mode
  useEffect(() => {
    if (!session || !userProfile || isDemo) return
    // Don't run rank queries if core user data isn't available
    if (!userProfile.elo && userProfile.elo !== 0) return

    const getDbRanks = async () => {
      try {
        const myElo = userProfile.elo ?? 1000
        const myCity = (userProfile.city || '').trim()
        const myRegion = (userProfile.region || '').trim()

        let cityRank = 999
        let regionRank = 999
        let nationalRank = 999

        // City rank — only query if user has a city set
        if (myCity) {
          const { count, error } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('city', myCity)
            .gt('elo_rating', myElo)
          if (!error) cityRank = (count ?? 0) + 1
        }

        // Region rank — only query if user has a region set
        if (myRegion) {
          const { count, error } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('region', myRegion)
            .gt('elo_rating', myElo)
          if (!error) regionRank = (count ?? 0) + 1
        }

        // National rank
        const { count: natCount, error: natErr } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gt('elo_rating', myElo)
        if (!natErr) nationalRank = (natCount ?? 0) + 1

        setDbRanks({ cityRank, regionRank, nationalRank })
      } catch (err) {
        console.warn("Erreur de calcul des rangs DB (non-bloquante):", err?.message || err)
      }
    }

    getDbRanks()
  }, [session, userProfile?.elo, userProfile?.city, userProfile?.region, isDemo])

  // client-side fallbacks for ranks in Demo mode or when DB Ranks are not loaded yet
  const clientRanks = useMemo(() => {
    if (!userProfile) return { cityRank: 11, regionRank: 55, nationalRank: 101 }
    
    const myElo = userProfile.elo ?? 1000
    const myCity = (userProfile.city || '').trim()
    const myRegion = (userProfile.region || '').trim()

    const nationalRank = leaderboardPlayers.filter(p => p.elo > myElo).length + 1

    // Only compute city/region rank if the user actually has one set
    const cityRank = myCity
      ? leaderboardPlayers.filter(p => (p.city || '') === myCity && p.elo > myElo).length + 1
      : 999
    const regionRank = myRegion
      ? leaderboardPlayers.filter(p => (p.region || '') === myRegion && p.elo > myElo).length + 1
      : 999

    return { cityRank, regionRank, nationalRank }
  }, [leaderboardPlayers, userProfile])

  const competitiveRanks = useMemo(() => {
    if (isDemo || !dbRanks) return clientRanks
    return dbRanks
  }, [isDemo, dbRanks, clientRanks])

  const badgeStats = useMemo(() => {
    const completedMatches = recentMatches.filter(m => 
      m.status === 'Completed' || m.status === 'Full' || m.status === 'Pending_Validation'
    )
    
    const distinctClubs = new Set(
      completedMatches.map(m => m.club).filter(Boolean)
    )
    const clubsCount = distinctClubs.size

    const clubToRegion = {
      '4Padels Bordeaux': 'Nouvelle-Aquitaine',
      '4PADEL Bordeaux': 'Nouvelle-Aquitaine',
      '¡HOLA! PADEL': 'Nouvelle-Aquitaine',
      'Padel Touch Arcachon': 'Nouvelle-Aquitaine',
      'Padel Arena Rouen': 'Normandie',
      'Padel Arena': 'Nouvelle-Aquitaine',
      'Padel Horizon': 'Île-de-France',
      'Casa Padel': 'Île-de-France'
    }
    
    const distinctRegions = new Set(
      completedMatches.map(m => {
        if (!m.club) return null
        return clubToRegion[m.club] || 'Nouvelle-Aquitaine'
      }).filter(Boolean)
    )
    if (completedMatches.length > 0 && userProfile?.region) {
      distinctRegions.add(userProfile.region)
    }
    const regionsCount = distinctRegions.size

    const hasDefeatedHighElo = completedMatches.some(m => {
      return m.hasDefeatedHighElo === true || (m.eloChange > 25 && m.type === 'Ranked')
    })

    return {
      clubsCount,
      regionsCount,
      hasDefeatedHighElo
    }
  }, [recentMatches, userProfile])

  const challenges = useMemo(() => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const rankedThisMonth = recentMatches.filter(m => {
      if (m.type !== 'Ranked') return false
      const matchDate = new Date(m.rawDate || m.date)
      return matchDate >= startOfMonth
    }).length
    const challenge1Progress = Math.min(rankedThisMonth, 1)

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const eloGained = recentMatches.reduce((sum, m) => {
      if (m.type !== 'Ranked' || m.eloChange <= 0) return sum
      const matchDate = new Date(m.rawDate || m.date)
      if (matchDate >= sevenDaysAgo) {
        return sum + m.eloChange
      }
      return sum
    }, 0)
    const challenge2Progress = Math.min(eloGained, 30)

    const challenge3Progress = hasConsultedRegion ? 1 : 0

    return [
      {
        id: 'challenge-1',
        label: 'Disputer 1 match Ranked ce mois-ci',
        progress: challenge1Progress,
        target: 1,
        unit: 'match',
        percentage: (challenge1Progress / 1) * 100
      },
      {
        id: 'challenge-2',
        label: 'Accumuler 30 points Elo en mode compétition',
        progress: challenge2Progress,
        target: 30,
        unit: 'Elo',
        percentage: (challenge2Progress / 30) * 100
      },
      {
        id: 'challenge-3',
        label: 'Consulter le sommet du classement de ma Région',
        progress: challenge3Progress,
        target: 1,
        unit: 'visite',
        percentage: (challenge3Progress / 1) * 100
      }
    ]
  }, [recentMatches, hasConsultedRegion])

  const handleSelectPlayer = (player) => {
    const seed = player.id.charCodeAt(0) + player.id.charCodeAt(player.id.length - 1)
    const clubsCount = (seed % 3) + 1
    const regionsCount = (seed % 2) + 1
    const hasDefeatedHighElo = seed % 3 === 0
    
    setSelectedPlayer({
      ...player,
      badgeStats: {
        clubsCount,
        regionsCount,
        hasDefeatedHighElo
      }
    })
  }

  // 1. Elo Decay calculation
  const eloDecayStatus = useMemo(() => {
    if (!userProfile) return { inactiveDays: 0, approachDeadline: false, daysRemaining: 0, mustDecay: false, decayCycles: 0, penaltyElo: 0 }
    
    const limit = isElite ? 60 : 45
    const warningThreshold = isElite ? 45 : 35
    
    // Filter to only Completed/Pending/Full/Pending_Validation Ranked matches
    const rankedMatches = recentMatches.filter(m => 
      m.type === 'Ranked' && 
      (m.status === 'Completed' || m.status === 'Pending' || m.status === 'Full' || m.status === 'Pending_Validation')
    )
    
    if (rankedMatches.length === 0) {
      return { inactiveDays: 0, approachDeadline: false, daysRemaining: limit, mustDecay: false, decayCycles: 0, penaltyElo: 0 }
    }
    
    // Find the most recent Ranked match
    const mostRecentMatch = rankedMatches.reduce((latest, current) => {
      const latestDate = new Date(latest.rawDate || latest.date)
      const currentDate = new Date(current.rawDate || current.date)
      return currentDate > latestDate ? current : latest
    }, rankedMatches[0])
    
    const lastMatchDate = new Date(mostRecentMatch.rawDate || mostRecentMatch.date)
    const diffTime = Math.abs(new Date() - lastMatchDate)
    const inactiveDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    const decayCycles = Math.floor(inactiveDays / limit)
    const penaltyElo = decayCycles * 15
    const mustDecay = decayCycles > 0
    
    const approachDeadline = inactiveDays >= warningThreshold && inactiveDays < limit
    const daysRemaining = Math.max(0, limit - inactiveDays)
    
    return {
      inactiveDays,
      approachDeadline,
      daysRemaining,
      mustDecay,
      decayCycles,
      penaltyElo
    }
  }, [recentMatches, userProfile, isElite])

  const effectiveElo = useMemo(() => {
    if (!userProfile) return 1000
    return Math.max(0, userProfile.elo - eloDecayStatus.penaltyElo)
  }, [userProfile, eloDecayStatus.penaltyElo])

  const effectiveRank = useMemo(() => {
    return getRankFromElo(effectiveElo)
  }, [effectiveElo])

  const effectiveLeaderboardPlayers = useMemo(() => {
    return leaderboardPlayers.map(p => {
      if (p.id === userProfile?.id) {
        return {
          ...p,
          elo: effectiveElo,
          rank: effectiveRank,
          isElite: isElite
        }
      }
      return p
    })
  }, [leaderboardPlayers, userProfile?.id, effectiveElo, effectiveRank, isElite])

  // 2. Lazy Elo Decay Database Sync
  useEffect(() => {
    if (!session || !userProfile || isDemo) return

    const syncEloDecay = async () => {
      const dbDecayApplied = userProfile.decayAppliedCycles ?? 0
      const currentDecayCycles = eloDecayStatus.decayCycles
      
      if (currentDecayCycles > dbDecayApplied) {
        const diffCycles = currentDecayCycles - dbDecayApplied
        const penalty = diffCycles * 15
        const newElo = Math.max(0, userProfile.elo - penalty)
        
        try {
          const { error } = await supabase
            .from('profiles')
            .update({
              elo_rating: newElo,
              decay_applied_cycles: currentDecayCycles
            })
            .eq('id', session.user.id)
            
          if (error) throw error
          
          toast.info(`📉 Pénalité d'inactivité appliquée : -15 Elo (identique pour tous). Jouez un match Classé pour stopper la dégradation !`)
          
          // Re-fetch profile to sync state
          await fetchProfile(session.user.id)
        } catch (err) {
          console.warn("Erreur lors de la synchronisation Elo Decay:", err?.message || err)
        }
      } else if (currentDecayCycles < dbDecayApplied && dbDecayApplied > 0) {
        // If the user played a match, reset decay_applied_cycles in DB
        try {
          const { error } = await supabase
            .from('profiles')
            .update({
              decay_applied_cycles: 0
            })
            .eq('id', session.user.id)
            
          if (error) throw error
          
          // Re-fetch profile to sync state
          await fetchProfile(session.user.id)
        } catch (err) {
          console.warn("Erreur lors du reset des cycles Elo Decay:", err?.message || err)
        }
      }
    }
    
    syncEloDecay()
  }, [eloDecayStatus.decayCycles, userProfile?.decayAppliedCycles, session, isDemo])

  // Listen to Auth changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        setIsDemo(false)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        setIsDemo(false)
      } else {
        setUserProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const registerUserDevice = async (userId) => {
    if (isDemo) return;
    try {
      let deviceUuid = localStorage.getItem('elomatch_device_uuid')
      if (!deviceUuid) {
        deviceUuid = crypto.randomUUID()
        localStorage.setItem('elomatch_device_uuid', deviceUuid)
      }

      const { error } = await supabase
        .from('user_devices')
        .upsert({
          user_id: userId,
          device_uuid: deviceUuid,
          last_login_at: new Date().toISOString()
        }, { onConflict: 'user_id, device_uuid' })

      if (error) {
        console.warn("Erreur lors de l'enregistrement de l'appareil:", error.message)
      }
    } catch (err) {
      console.warn("Impossible d'enregistrer l'appareil:", err.message)
    }
  }

  // Load user data if logged in
  useEffect(() => {
    if (session && session.user) {
      loadSupabaseData(session.user.id)
      registerUserDevice(session.user.id)
    }
  }, [session])

  const loadSupabaseData = async (userId) => {
    setLoading(true)
    await Promise.all([
      fetchProfile(userId),
      fetchUrgentMatches(userId),
      fetchRecentMatches(userId),
      fetchLeaderboard(),
      fetchPendingInvitations(userId)
    ])
    setLoading(false)
  }

  const fetchPendingInvitations = async (userId) => {
    try {
      if (isDemo) {
        setPendingInvitations([
          {
            id: 'demo-inv-1',
            match_id: 'demo-m1',
            status: 'pending_confirmation',
            matches: {
              id: 'demo-m1',
              club: '4Padels Bordeaux',
              scheduled_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
              creator_id: 'demo-u2',
              profiles: {
                first_name: 'Ludovic',
                last_name: 'Simon'
              }
            }
          }
        ])
        return
      }
      
      const { data, error } = await supabase
        .from('match_participations')
        .select(`
          id,
          match_id,
          status,
          matches (
            id,
            club,
            scheduled_at,
            creator_id,
            profiles:creator_id (
              first_name,
              last_name
            )
          )
        `)
        .eq('player_id', userId)
        .eq('status', 'pending_confirmation')

      if (error) throw error
      
      if (data && data.length > 0) {
        data.forEach(inv => {
          const alreadyLoaded = pendingInvitations.some(p => p.id === inv.id)
          if (!alreadyLoaded) {
            const creatorName = inv.matches?.profiles?.first_name || 'Un joueur'
            const dateStr = new Date(inv.matches?.scheduled_at).toLocaleDateString('fr-FR')
            const clubStr = inv.matches?.club || 'Club'
            toast.info(`${creatorName} vous a ajouté au match du ${dateStr} au ${clubStr}. Confirmez-vous le match ?`)
          }
        })
        setPendingInvitations(data)
      } else {
        setPendingInvitations([])
      }
    } catch (err) {
      console.warn("Impossible de charger les invitations (fail silent) :", err.message)
      setPendingInvitations([])
    }
  }

  const handleConfirmInvitation = async (invId, matchId) => {
    try {
      if (isDemo) {
        toast.success("Invitation acceptée avec succès (Mode Démo) !")
        setPendingInvitations(prev => prev.filter(inv => inv.id !== invId))
      } else {
        const { error } = await supabase
          .from('match_participations')
          .update({ status: 'confirmed' })
          .eq('id', invId)
        
        if (error) throw error

        toast.success("Vous avez confirmé votre participation au match !")
        
        if (session?.user) {
          await Promise.all([
            fetchRecentMatches(session.user.id),
            fetchPendingInvitations(session.user.id)
          ])
        }
      }
    } catch (err) {
      console.error("Erreur confirmation invitation:", err.message)
      toast.error("Impossible de confirmer l'invitation.")
    }
  }

  const handleDeclineInvitation = async (invId, matchId) => {
    try {
      if (isDemo) {
        toast.info("Invitation déclinée (Mode Démo).")
        setPendingInvitations(prev => prev.filter(inv => inv.id !== invId))
      } else {
        const { error } = await supabase
          .from('match_participations')
          .delete()
          .eq('id', invId)

        if (error) throw error

        toast.info("Vous avez décliné l'invitation.")
        
        if (session?.user) {
          await Promise.all([
            fetchRecentMatches(session.user.id),
            fetchPendingInvitations(session.user.id)
          ])
        }
      }
    } catch (err) {
      console.error("Erreur refus invitation:", err.message)
      toast.error("Impossible de décliner l'invitation.")
    }
  }

  // --- Supabase Data Fetching Functions ---

  const fetchProfile = async (userId) => {
    try {
      // Phase 1: Query ALL known columns. Supabase ignores columns that don't exist
      // when using SELECT, but PostgREST will 400 on unknown column names.
      // So we try the full column set first, then fall back to core-only.
      let data = null
      let error = null

      const fullSelect = 'id, first_name, last_name, city, country, region, club, hand, play_style, avatar_url, elo_rating, fair_play_score, punctuality_rate, matches_saved_count, player_tag, is_elite, decay_applied_cycles'
      const coreSelect = 'id, first_name, last_name, city, avatar_url, elo_rating, fair_play_score, punctuality_rate, matches_saved_count'

      const fullResult = await supabase
        .from('profiles')
        .select(fullSelect)
        .eq('id', userId)
        .single()

      if (fullResult.error) {
        // If the full query fails (e.g., a column doesn't exist yet),
        // fall back to querying only guaranteed core columns.
        console.warn("fetchProfile: full query failed, falling back to core columns:", fullResult.error.message)
        
        const coreResult = await supabase
          .from('profiles')
          .select(coreSelect)
          .eq('id', userId)
          .single()

        if (coreResult.error) throw coreResult.error
        data = coreResult.data
      } else {
        data = fullResult.data
      }

      if (data) {
        setUserProfile({
          id: data.id,
          firstName: data.first_name || 'Joueur',
          lastName: data.last_name || 'Padel',
          city: data.city || '',
          country: data.country || 'France',
          region: data.region || '',
          club: data.club || '',
          hand: data.hand || 'Droitier',
          playStyle: data.play_style || 'Stratège',
          avatar: data.avatar_url || null,
          playerTag: data.player_tag || '',
          isElite: data.is_elite === true,
          elo: data.elo_rating ?? 1000,
          rank: getRankFromElo(data.elo_rating ?? 1000),
          fairPlay: data.fair_play_score ?? 100,
          punctuality: data.punctuality_rate ?? 100,
          matchesSaved: data.matches_saved_count ?? 0,
          decayAppliedCycles: data.decay_applied_cycles ?? 0,
          badges: [
            { label: 'Pompier du Padel Lvl 2', color: 'violet' },
            { label: 'Joueur Flash', color: 'lime' },
            { label: 'Fiable +50', color: 'lime' },
          ],
        })
      }
    } catch (err) {
      console.error("Erreur profil:", err?.message || err)
      toast.error("Impossible de charger votre profil. Données par défaut utilisées.")
      setUserProfile({
        ...demoUser,
        id: userId,
        firstName: 'Joueur',
        lastName: 'Padel'
      })
    }
  }
  
  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, city, club, region, elo_rating, is_elite')
        .order('elo_rating', { ascending: false })
        .limit(50)
        
      if (error) throw error
      
      if (data) {
        const mapped = data.map(p => ({
          id: p.id,
          firstName: p.first_name || '',
          lastName: p.last_name || '',
          city: p.city || '',
          club: p.club || '',
          region: p.region || '',
          elo: p.elo_rating ?? 1000,
          rank: getRankFromElo(p.elo_rating ?? 1000),
          isElite: p.is_elite === true,
          winRate: Math.floor(Math.random() * (75 - 40 + 1)) + 40
        }))
        setLeaderboardPlayers(mapped)
      }
    } catch (err) {
      console.error("Erreur classement:", err?.message || err)
    }
  }

  const fetchUrgentMatches = async (userId) => {
    try {
      // 1. Essai RPC optimisé
      const { data, error } = await supabase
        .rpc('find_last_urgent_matches', { p_user_id: userId })

      if (!error && data) {
        const mapped = data.map(m => {
          const rawDate = m.scheduled_at || m.date_time
          const dateObj = rawDate ? new Date(rawDate) : new Date()
          const isToday = dateObj.toDateString() === new Date().toDateString()
          return {
            id: m.id,
            club: m.club || m.club_name || 'Padel Club Lac',
            time: dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            date: isToday ? "Aujourd'hui" : dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
            eloRequired: `${m.elo_min ?? 800}-${m.elo_max ?? 2000}`,
            playersJoined: Number(m.participant_count) || 0,
            playersNeeded: 4,
          }
        })
        setUrgentMatches(mapped)
        return
      }
      if (error) {
        console.warn("L'appel RPC 'find_last_urgent_matches' a retourné une erreur:", error.message)
      }
    } catch (e) {
      console.warn("L'appel RPC 'find_last_urgent_matches' a échoué:", e.message)
    }

    // 2. Fallback direct sur la table matches en supportant les deux schémas
    try {
      let dbMatches = null
      let dbError = null

      try {
        // Tentative 1 : Nouveau schéma
        const { data, error } = await supabase
          .from('matches')
          .select('id, club_name, date_time, type, is_urgent, slots_available')
          .eq('is_urgent', true)
        
        if (error) {
          dbError = error
        } else {
          dbMatches = data
        }
      } catch (errNew) {
        dbError = errNew
      }

      // Si erreur ou pas de données, tentative 2 : Ancien schéma
      if (dbError || !dbMatches) {
        console.warn("Échec requête nouveau schéma, tentative avec l'ancien schéma...")
        try {
          const { data, error } = await supabase
            .from('matches')
            .select('id, club, scheduled_at, match_type, is_last_urgent')
            .eq('is_last_urgent', true)
          
          if (!error) {
            dbMatches = data
            dbError = null // Nettoyer l'erreur précédente car le fallback a réussi
          } else {
            dbError = error
          }
        } catch (errOld) {
          dbError = errOld
        }
      }

      if (dbError) throw dbError

      if (dbMatches && dbMatches.length > 0) {
        const mapped = dbMatches.map(m => {
          const rawDate = m.date_time || m.scheduled_at
          const dateObj = rawDate ? new Date(rawDate) : new Date()
          const isToday = dateObj.toDateString() === new Date().toDateString()
          
          const slotsAvail = m.slots_available !== undefined ? m.slots_available : 1
          const playersJoined = 4 - slotsAvail

          return {
            id: m.id,
            club: m.club_name || m.club || 'Padel Club Lac',
            time: dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            date: isToday ? "Aujourd'hui" : dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
            eloRequired: '800-2000',
            playersJoined: Math.max(0, Math.min(4, playersJoined)),
            playersNeeded: 4,
          }
        })
        setUrgentMatches(mapped)
      } else {
        setUrgentMatches([])
      }
    } catch (fallbackErr) {
      console.warn("Échec complet du chargement des matchs urgents (fail silent) :", fallbackErr.message)
      setUrgentMatches([])
    }
  }

  const fetchRecentMatches = async (userId) => {
    try {
      const { data: participations, error: partError } = await supabase
        .from('match_participations')
        .select('match_id, elo_change')
        .eq('player_id', userId)

      if (partError) throw partError
      if (!participations || participations.length === 0) {
        setRecentMatches([])
        return
      }

      const matchIds = participations.map(p => p.match_id)
      const eloChangesMap = Object.fromEntries(participations.map(p => [p.match_id, p.elo_change]))

      const { data: matchesData, error: matchError } = await supabase
        .from('matches')
        .select(`
          id, club, scheduled_at, match_type, status, score_team_1, score_team_2,
          match_participations ( player_id, team, profiles ( id, first_name, last_name ) )
        `)
        .in('id', matchIds)
        .in('status', ['Pending', 'Full', 'Completed', 'Pending_Validation'])
        .order('scheduled_at', { ascending: false })

      if (matchError) throw matchError

      const { data: reviewsSubmitted, error: revError } = await supabase
        .from('reviews')
        .select('match_id')
        .eq('reviewer_id', userId)

      if (revError) throw revError
      const reviewedMatchIds = new Set(reviewsSubmitted.map(r => r.match_id))

      if (matchesData) {
        const mapped = matchesData.map(m => {
          const dateObj = new Date(m.scheduled_at)
          const playersList = m.match_participations
            ? m.match_participations.filter(p => p.player_id !== userId).map(p => ({
                id: p.player_id,
                name: `${p.profiles?.first_name || ''} ${p.profiles?.last_name ? p.profiles.last_name[0] + '.' : ''}`,
                team: p.team
              }))
            : []

          const needsReview = m.status === 'Completed' && playersList.length > 0 && !reviewedMatchIds.has(m.id)

          const myParticipation = m.match_participations?.find(p => p.player_id === userId);
          const myTeam = myParticipation ? myParticipation.team : 1;

          return {
            id: m.id,
            club: m.club || 'Club Padel',
            date: dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
            rawDate: m.scheduled_at,
            time: dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            type: m.match_type,
            status: m.status,
            score: m.score_team_1 && m.score_team_2 ? { team1: m.score_team_1, team2: m.score_team_2 } : null,
            eloChange: eloChangesMap[m.id] || 0,
            needsReview: needsReview,
            players: playersList,
            myTeam: myTeam,
          }
        })
        setRecentMatches(mapped)
      }
    } catch (err) {
      console.error("Erreur matches récents:", err.message)
      toast.error("Impossible de charger vos matchs récents.")
    }
  }

  // --- Real Interactions (Supabase-Connected) ---

  const handleSaveMatch = async (matchId) => {
    // --- Ranked match limit check for non-Elite users ---
    const targetMatch = urgentMatches.find(m => m.id === matchId)
    if (targetMatch?.type === 'Ranked' && !isElite) {
      // Count ranked matches this month
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const rankedThisMonth = recentMatches.filter(m => {
        if (m.type !== 'Ranked') return false
        // Parse match date
        const matchDate = new Date(m.rawDate || m.date)
        return matchDate >= new Date(startOfMonth)
      }).length

      if (rankedThisMonth >= 1) {
        setShowRankedLimit(true)
        return
      }
    }

    if (isDemo) {
      // Same ranked check for demo mode
      if (targetMatch?.type === 'Ranked' && !isElite) {
        const rankedDemoCount = recentMatches.filter(m => m.type === 'Ranked').length
        if (rankedDemoCount >= 1) {
          setShowRankedLimit(true)
          return
        }
      }
      setUrgentMatches(prev => prev.filter(m => m.id !== matchId))
      setUserProfile(prev => ({ ...prev, matchesSaved: prev.matchesSaved + 1 }))
      setShowGLHFNudge(true)
      toast.success("Félicitations ! Vous avez sauvé le match en Mode Démo.")
      return
    }

    try {
      setLoading(true)

      // Récupérer les participations actuelles pour vérifier si complet
      const { data: participations, error: partError } = await supabase
        .from('match_participations')
        .select('team, player_id')
        .eq('match_id', matchId)

      if (partError) throw partError

      if (participations.length >= 4) {
        throw new Error("Ce match est déjà complet.")
      }

      if (participations.some(p => p.player_id === userProfile.id)) {
        throw new Error("Vous participez déjà à ce match.")
      }

      // Attribution de l'équipe (1 s'il reste de la place, sinon 2)
      const team1Count = participations.filter(p => p.team === 1).length
      const assignedTeam = team1Count < 2 ? 1 : 2

      // Rejoindre le match
      const { error: insertError } = await supabase
        .from('match_participations')
        .insert({
          match_id: matchId,
          player_id: userProfile.id,
          team: assignedTeam,
          joined_via_last: true
        })

      if (insertError) throw insertError

      // Si le match a maintenant 4 joueurs, mettre à jour le statut en 'Full'
      if (participations.length === 3) {
        const { error: updateError } = await supabase
          .from('matches')
          .update({ status: 'Full' })
          .eq('id', matchId)
        
        if (updateError) throw updateError
      }

      await loadSupabaseData(userProfile.id)
      setShowGLHFNudge(true)
      toast.success("Match sauvé avec succès ! GLHF !")
    } catch (err) {
      console.error("Erreur lors de la sauvegarde du match :", err.message)
      toast.error(getFriendlyErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleReviewSubmit = async (matchId, ratings) => {
    if (isDemo) {
      setRecentMatches(prev => prev.map(m => m.id === matchId ? { ...m, needsReview: false } : m))
      return
    }

    try {
      setLoading(true)
      const reviewInserts = Object.entries(ratings).map(([playerId, scores]) => ({
        match_id: matchId,
        reviewer_id: userProfile.id,
        reviewed_id: playerId,
        punctuality_score: scores.punctuality,
        behavior_score: scores.behavior
      }))

      const { error } = await supabase
        .from('reviews')
        .insert(reviewInserts)

      if (error) throw error

      toast.success("Vos évaluations ont été soumises avec succès !")
      await fetchRecentMatches(userProfile.id)
    } catch (err) {
      console.error("Erreur lors de la soumission des avis :", err.message)
      toast.error(getFriendlyErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  // --- Edge Case Features Handlers ---

  const handleOpenScoreFlow = (match) => {
    setActiveScoreMatch(match)
    setShowScoreModal(true)
  }

  const handleCloseGLHF = () => {
    setShowGLHFNudge(false)
  }

  const handleScoreSubmit = async (matchId, scores, isIncomplete) => {
    if (isDemo) {
      setRecentMatches(prev => prev.map(m => {
        if (m.id === matchId) {
          return {
            ...m,
            status: 'Pending_Validation',
            score: scores,
            type: isIncomplete ? 'Amical' : m.type,
            needsReview: false
          }
        }
        return m
      }))
      return
    }

    try {
      setLoading(true)
      
      const updateData = {
        score_team_1: scores.team1,
        score_team_2: scores.team2,
        status: 'Pending_Validation'
      }

      if (isIncomplete) {
        updateData.match_type = 'Amical'
      }

      const { error } = await supabase
        .from('matches')
        .update(updateData)
        .eq('id', matchId)

      if (error) throw error

      toast.success("Le score a été enregistré et est en attente de consensus (4/4).")
      await fetchRecentMatches(userProfile.id)
    } catch (err) {
      console.error("Erreur lors de la soumission du score :", err.message)
      toast.error(getFriendlyErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  // Consensus handlers (Approve / Dispute)
  const handleApproveScore = async (matchId) => {
    if (isDemo) {
      toast.success("Consensus 4/4 validé ! Le score est définitivement scellé.")
      let isCasual = false
      setRecentMatches(prev => prev.map(m => {
        if (m.id === matchId) {
          const matchIsCasual = m.type === 'Casual' || m.type === 'Amical'
          if (matchIsCasual) isCasual = true
          return {
            ...m,
            status: 'Completed',
            eloChange: matchId === 'demo-r_pending' ? 32 : 16,
            hasDefeatedHighElo: matchId === 'demo-r_pending' ? true : false,
            needsReview: true
          }
        }
        return m
      }))
      
      // Boost user profile elo slightly for demo effect only if it's NOT a casual/amical match
      if (!isCasual) {
        const eloGain = matchId === 'demo-r_pending' ? 32 : 16
        setUserProfile(prev => ({
          ...prev,
          elo: prev.elo + eloGain,
          rank: getRankFromElo(prev.elo + eloGain)
        }))
      }
      return
    }

    try {
      setLoading(true)
      // Validation atomique via RPC : calcule ELO, stocke elo_change, passe en Completed
      const { data, error } = await supabase
        .rpc('complete_match', { p_match_id: matchId })

      if (error) throw error

      toast.success("Match validé ! Le score est scellé et l'Elo a été mis à jour.")
      await loadSupabaseData(userProfile.id)
    } catch (err) {
      console.error("Erreur lors de la validation du match :", err.message)
      toast.error(getFriendlyErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleDisputeScore = async (matchId) => {
    if (isDemo) {
      toast.info("Litige enregistré. Le match est bloqué en attente d'arbitrage par le staff.")
      setRecentMatches(prev => prev.map(m => {
        if (m.id === matchId) {
          return {
            ...m,
            status: 'Disputed'
          }
        }
        return m
      }))
      return
    }

    try {
      setLoading(true)
      // Litige atomique : revert ELO + statut Disputed via RPC
      const { data, error } = await supabase
        .rpc('dispute_match', { p_match_id: matchId })

      if (error) throw error

      toast.success("Contestation enregistrée ! Les ELO ont été rétablis et le match est en arbitrage.")
      
      // Recharger les données pour refléter les changements ELO
      await loadSupabaseData(userProfile.id)
    } catch (err) {
      console.error("Erreur lors de la contestation :", err.message)
      toast.error(getFriendlyErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleEmergencyCancel = async (matchId) => {
    if (isDemo) {
      setTimeout(() => {
        toast.info("Vote 4/4 atteint. Le match a été annulé avec succès.")
        setRecentMatches(prev => prev.map(m => m.id === matchId ? { ...m, status: 'Cancelled' } : m))
      }, 500)
      return
    }

    try {
      setLoading(true)
      const { error } = await supabase
        .from('matches')
        .update({ status: 'Cancelled' })
        .eq('id', matchId)

      if (error) throw error

      toast.success("Le match a été annulé avec succès.")
      await fetchRecentMatches(userProfile.id)
    } catch (err) {
      console.error("Erreur lors de l'annulation :", err.message)
      toast.error(getFriendlyErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleProposeRematch = (match) => {
    toast.success(`Formulaire de Revanche généré ! Joueurs pré-sélectionnés : Vous et ${match.players.length} autres à ${match.club}. Sélectionnez une nouvelle date.`)
  }

  const handleChallengePlayer = (player) => {
    setSelectedPlayer(null)
    setActiveChatRecipient(player)
    setActiveTab('chat')
    toast.success(`Salon de discussion privé ouvert avec ${player.firstName} ${player.lastName} pour organiser votre match !`)
  }

  const handleShortcutToCreateMatch = (data) => {
    setPrefilledMatchData(data)
    setActiveTab('create-match')
    toast.success("Informations du créneau pré-remplies. Vous pouvez maintenant publier votre match !")
  }

  const handleNavigateToDashboard = () => {
    setPrefilledMatchData(null)
    setActiveTab('dashboard')
  }

  const handleAddMatch = (newMatch) => {
    if (isDemo) {
      if (newMatch.is_last_urgent || newMatch.eloMin) {
        setUrgentMatches(prev => {
          const dateObj = new Date(newMatch.rawDate || newMatch.scheduled_at)
          const isToday = dateObj.toDateString() === new Date().toDateString()
          const mapped = {
            id: newMatch.id,
            club: newMatch.club,
            time: dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            date: isToday ? "Aujourd'hui" : dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
            eloRequired: `${newMatch.eloMin ?? 800}-${newMatch.eloMax ?? 2000}`,
            playersJoined: 1,
            playersNeeded: 4,
            type: newMatch.type
          }
          return [mapped, ...prev]
        })
      }
      
      setRecentMatches(prev => {
        const dateObj = new Date(newMatch.rawDate || newMatch.scheduled_at)
        const mappedRecent = {
          id: newMatch.id,
          club: newMatch.club,
          date: dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
          rawDate: newMatch.rawDate || newMatch.scheduled_at,
          time: dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          type: newMatch.type,
          status: 'Pending',
          score: null,
          eloChange: 0,
          needsReview: false,
          players: newMatch.players || [{ id: userProfile.id, name: `${userProfile.firstName} ${userProfile.lastName ? userProfile.lastName[0] + '.' : ''}`, team: 1 }],
          myTeam: 1
        }
        return [mappedRecent, ...prev]
      })
    } else {
      loadSupabaseData(userProfile.id)
    }
  }

  // --- Demo Mode Handlers ---

  const handleDemoLogin = () => {
    setIsDemo(true)
    
    // Dynamically adjust demo-r1 date to be 38 days ago (Standard) or 48 days ago (Elite) to trigger decay warning
    const warningDaysAgo = demoUser.isElite ? 48 : 38
    const warningDate = new Date()
    warningDate.setDate(warningDate.getDate() - warningDaysAgo)
    
    const adjustedRecentMatches = demoRecentMatches.map(m => {
      if (m.id === 'demo-r1') {
        return {
          ...m,
          date: warningDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
          rawDate: warningDate.toISOString()
        }
      }
      return m
    })

    setUserProfile({
      ...demoUser,
      decayAppliedCycles: 0
    })
    setUrgentMatches(demoUrgentMatches)
    setRecentMatches(adjustedRecentMatches)
    setLeaderboardPlayers(demoLeaderboard)
    setPendingInvitations([
      {
        id: 'demo-inv-1',
        match_id: 'demo-m1',
        status: 'pending_confirmation',
        matches: {
          id: 'demo-m1',
          club: '4Padels Bordeaux',
          scheduled_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          creator_id: 'demo-u2',
          profiles: {
            first_name: 'Ludovic',
            last_name: 'Simon'
          }
        }
      }
    ])
    setLoading(false)
  }

  const handleLogout = async () => {
    if (isDemo) {
      setIsDemo(false)
      setUserProfile(null)
      return
    }
    await supabase.auth.signOut()
    setUserProfile(null)
  }

  const handleOpenReview = (match) => {
    setReviewMatch(match)
    setShowReviewModal(true)
  }

  // --- Render logic ---

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-neon-lime/20 border-t-neon-lime animate-spin glow-lime" />
        <span className="text-sm font-semibold tracking-wider text-zinc-500 uppercase">Chargement du Competitive Hub...</span>
      </div>
    )
  }

  if (!userProfile) return <Auth onDemoLogin={handleDemoLogin} />

  // Check if profile is incomplete (missing firstName or lastName)
  const isProfileIncomplete = !userProfile.firstName || !userProfile.lastName;

  if (isProfileIncomplete) {
    return (
      <OnboardingForm 
        user={userProfile} 
        onComplete={(updatedProfile) => {
          setUserProfile(prev => ({
            ...prev,
            ...updatedProfile
          }))
        }} 
      />
    )
  }

  // Filter out disputed matches for visibility
  const visibleRecentMatches = recentMatches.filter(m => m.status !== 'Disputed')

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <DashboardHeader 
        user={{ ...userProfile, elo: effectiveElo, rank: effectiveRank }} 
        onLogout={handleLogout} 
        onUpgradeClick={() => setShowPremium(true)} 
        onProfileClick={() => setShowEditProfile(true)} 
        isAdmin={isAdmin}
        onAdminClick={() => setShowAdminPanel(true)}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setPrefilledMatchData(null);
        }}
      />

      {/* Sticky Premium Tab Bar */}
      <div className="sticky top-16 z-40 w-full bg-zinc-950/70 backdrop-blur-md border-b border-zinc-900/60 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-start md:justify-center overflow-x-auto py-2.5 gap-2 md:gap-4 scrollbar-none [-webkit-overflow-scrolling:touch]">
            
            <button
              onClick={() => { setActiveTab('dashboard'); setPrefilledMatchData(null); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-neon-lime/10 border border-neon-lime/30 text-neon-lime glow-lime text-glow-lime'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 border border-transparent'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Tableau de Bord</span>
            </button>

            <button
              onClick={() => { setActiveTab('create-match'); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                activeTab === 'create-match'
                  ? 'bg-neon-lime/10 border border-neon-lime/30 text-neon-lime glow-lime text-glow-lime'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 border border-transparent'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Lancer un Match</span>
            </button>

            <button
              onClick={() => { setActiveTab('bookings'); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                activeTab === 'bookings'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 glow-lime'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 border border-transparent'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Réservations</span>
            </button>

            <button
              onClick={() => { setActiveTab('chat'); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-neon-violet/10 border border-neon-violet/30 text-neon-violet glow-violet text-glow-violet'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 border border-transparent'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Messagerie</span>
            </button>

            <button
              onClick={() => { setActiveTab('tournaments'); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                activeTab === 'tournaments'
                  ? 'bg-neon-lime/10 border border-neon-lime/30 text-neon-lime glow-lime text-glow-lime'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 border border-transparent'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Tournois Official</span>
            </button>

          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        
        {/* Invitations en attente */}
        {pendingInvitations.length > 0 && (
          <section className="mt-6">
            <MatchInvitationBanner 
              invitations={pendingInvitations}
              onConfirm={handleConfirmInvitation}
              onDecline={handleDeclineInvitation}
            />
          </section>
        )}

        {/* Consensus banner if any pending validation */}
        {recentMatches.filter(m => m.status === 'Pending_Validation').length > 0 && (
          <section className="mt-6">
            <ScoreApprovalBanner 
              pendingMatches={recentMatches.filter(m => m.status === 'Pending_Validation')}
              onApprove={handleApproveScore}
              onDispute={handleDisputeScore}
            />
          </section>
        )}

        {/* Tab views */}
        {activeTab === 'dashboard' && (
          <div className="animate-fade-in space-y-8">
            {/* Elo Decay Dynamic Alerts */}
            {eloDecayStatus.approachDeadline && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-250 text-xs font-semibold flex items-center gap-3 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.1)] mt-6">
                <span className="text-lg">⚠️</span>
                <p className="flex-1 leading-relaxed text-zinc-300">
                  <span className="font-extrabold text-amber-400">Inactivité :</span> Sans match <span className="underline">Ranked</span> sous <span className="font-extrabold text-amber-300">{isElite ? '15' : '10'} jours</span>, vous perdrez <span className="font-extrabold text-red-400">15 points Elo</span>.
                </p>
                <button
                  onClick={() => setActiveTab('create-match')}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black uppercase text-[10px] tracking-wider transition-colors cursor-pointer"
                >
                  Jouer
                </button>
              </div>
            )}

            {eloDecayStatus.mustDecay && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-250 text-xs font-semibold flex items-center gap-3 shadow-[0_0_20px_rgba(239,68,68,0.1)] mt-6">
                <span className="text-lg animate-bounce">📉</span>
                <p className="flex-1 leading-relaxed text-zinc-300">
                  <span className="font-extrabold text-red-400">Pénalité d'inactivité :</span> -15 points Elo. Pénalité identique pour tous les joueurs, sans exception. Jouez un match Classé pour stopper la dégradation !
                </p>
                <button
                  onClick={() => setActiveTab('create-match')}
                  className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-650 text-white font-black uppercase text-[10px] tracking-wider transition-colors cursor-pointer"
                >
                  Jouer
                </button>
              </div>
            )}

            <section className="mt-6">
              <LastAlert matches={urgentMatches} savedCount={userProfile.matchesSaved} onSaveMatch={handleSaveMatch} />
            </section>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4 space-y-6">
                <PlayerCard user={{ ...userProfile, elo: effectiveElo, rank: effectiveRank, isElite, globalRank: effectiveLeaderboardPlayers.findIndex(p => p.id === userProfile?.id) + 1 || 11, hasExplorerBadge: badgeStats.clubsCount >= 3, hasVeteranBadge: recentMatches.filter(m => m.status === 'Completed' || m.status === 'Full').length >= 10 }} />
                <DefisNationaux challenges={challenges} />
                <BadgesGrid stats={badgeStats} isElite={isElite} />
              </div>

              <div className="lg:col-span-8">
                <MatchFeed 
                  matches={visibleRecentMatches} 
                  onOpenReview={handleOpenReview} 
                  onOpenScore={handleOpenScoreFlow} 
                  onEmergencyCancel={handleEmergencyCancel}
                />
              </div>
            </div>
            
            <section>
              <Leaderboard 
                players={effectiveLeaderboardPlayers} 
                currentUser={userProfile} 
                onSelectPlayer={handleSelectPlayer} 
                currentUserIsElite={isElite} 
                onConsultRegion={() => setHasConsultedRegion(true)}
              />
            </section>

            <section>
              <ProStats 
                user={{ ...userProfile, elo: effectiveElo }} 
                matches={recentMatches} 
                isElite={isElite} 
                onUpgrade={() => setShowPremium(true)} 
              />
            </section>
          </div>
        )}

        {activeTab === 'create-match' && (
          <div className="animate-fade-in">
            <CreateMatch 
              user={userProfile}
              isElite={isElite}
              isDemo={isDemo}
              onAddMatch={handleAddMatch}
              prefilledData={prefilledMatchData}
              onNavigateToDashboard={handleNavigateToDashboard}
              recentMatches={recentMatches}
              onRankedLimitReached={() => setShowRankedLimit(true)}
            />
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="animate-fade-in">
            <Bookings 
              user={userProfile}
              isDemo={isDemo}
              onShortcutToCreateMatch={handleShortcutToCreateMatch}
            />
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="animate-fade-in">
            <Chat 
              user={userProfile}
              isDemo={isDemo}
              recentMatches={recentMatches}
              leaderboardPlayers={leaderboardPlayers}
              directMessageRecipient={activeChatRecipient}
              onClearRecipient={() => setActiveChatRecipient(null)}
            />
          </div>
        )}

        {activeTab === 'tournaments' && (
          <div className="animate-fade-in">
            <Tournaments 
              user={userProfile}
              isDemo={isDemo}
              leaderboardPlayers={leaderboardPlayers}
            />
          </div>
        )}
      </main>

      {/* Dynamic Modals */}
      {showReviewModal && reviewMatch && (
        <ReviewModal match={reviewMatch} onClose={() => { setShowReviewModal(false); setReviewMatch(null) }} onSubmit={handleReviewSubmit} />
      )}

      {showGLHFNudge && (
        <GLHFNudgeModal onClose={handleCloseGLHF} />
      )}

      {showScoreModal && activeScoreMatch && (
        <ScoreInputModal 
          match={activeScoreMatch} 
          onClose={() => { setShowScoreModal(false); setActiveScoreMatch(null) }}
          onSubmitScore={handleScoreSubmit}
          onProposeRematch={handleProposeRematch}
          currentUser={userProfile}
        />
      )}
      {selectedPlayer && (
        <PlayerProfileModal 
          player={selectedPlayer} 
          onClose={() => setSelectedPlayer(null)} 
          onChallenge={handleChallengePlayer} 
        />
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-8 text-center text-xs text-zinc-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 elomatch. Tous droits réservés.</p>
          <p className="text-zinc-500 text-xs">
            Un problème ? Une idée ? Contactez le support :{' '}
            <a 
              href="mailto:ludow3b@gmail.com" 
              className="text-zinc-400 hover:text-neon-lime font-medium transition-colors cursor-pointer"
            >
              ludow3b@gmail.com
            </a>
          </p>
          <button 
            onClick={() => setShowCGU(true)} 
            className="hover:text-neon-lime transition-colors font-bold uppercase tracking-wider text-[10px] cursor-pointer"
          >
            Conditions Générales d'Utilisation (CGU)
          </button>
        </div>
      </footer>

      {showCGU && (
        <CGU onClose={() => setShowCGU(false)} />
      )}

      {showPremium && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/95 backdrop-blur-md animate-fade-in">
          <PremiumSubscription onClose={() => setShowPremium(false)} />
        </div>
      )}

      {showRankedLimit && (
        <RankedLimitModal 
          onClose={() => setShowRankedLimit(false)} 
          onUpgrade={() => { setShowRankedLimit(false); setShowPremium(true); }} 
        />
      )}

      {showEditProfile && (
        <EditProfileModal 
          user={userProfile} 
          onClose={() => setShowEditProfile(false)} 
          onSave={(updatedProfile) => {
            setUserProfile(prev => ({
              ...prev,
              ...updatedProfile
            }));
          }} 
        />
      )}

      {showAdminPanel && isAdmin && (
        <AdminPanel onClose={() => setShowAdminPanel(false)} />
      )}
    </div>
  )
}
