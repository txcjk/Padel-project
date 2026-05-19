import { useState, useEffect } from 'react'
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
import PlayerProfileModal from './components/PlayerProfileModal.jsx'
import CGU from './components/CGU.jsx'
import PremiumSubscription from './components/PremiumSubscription.jsx'
import OnboardingForm from './components/OnboardingForm.jsx'
import EditProfileModal from './components/EditProfileModal.jsx'
import ProStats from './components/ProStats.jsx'
import RankedLimitModal from './components/RankedLimitModal.jsx'
import AdminPanel from './components/AdminPanel.jsx'

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

  // Admin access check
  const isAdmin = session?.user?.email === 'ludow3b@gmail.com'

  // Elite status — connected to Supabase is_elite column
  const isElite = userProfile?.isElite === true

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
      fetchLeaderboard()
    ])
    setLoading(false)
  }

  // --- Supabase Data Fetching Functions ---

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, city, country, region, club, hand, play_style, avatar_url, elo_rating, fair_play_score, punctuality_rate, matches_saved_count, player_tag, is_elite')
        .eq('id', userId)
        .single()

      if (error) throw error

      if (data) {
        setUserProfile({
          id: data.id,
          firstName: data.first_name,
          lastName: data.last_name,
          city: data.city || 'Bordeaux',
          country: data.country || 'France',
          region: data.region || 'Nouvelle-Aquitaine',
          club: data.club || 'Padel Arena',
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
          badges: [
            { label: 'Pompier du Padel Lvl 2', color: 'violet' },
            { label: 'Joueur Flash', color: 'lime' },
            { label: 'Fiable +50', color: 'lime' },
          ],
        })
      }
    } catch (err) {
      console.error("Erreur profil:", err.message)
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
        .select('id, first_name, last_name, club, region, elo_rating, is_elite')
        .order('elo_rating', { ascending: false })
        .limit(50)
        
      if (error) throw error
      
      if (data) {
        const mapped = data.map(p => ({
          id: p.id,
          firstName: p.first_name,
          lastName: p.last_name,
          club: p.club || 'Padel Arena',
          region: p.region || 'Nouvelle-Aquitaine',
          elo: p.elo_rating ?? 1000,
          rank: getRankFromElo(p.elo_rating ?? 1000),
          isElite: p.is_elite === true,
          winRate: Math.floor(Math.random() * (75 - 40 + 1)) + 40
        }))
        setLeaderboardPlayers(mapped)
      }
    } catch (err) {
      console.error("Erreur classement:", err.message)
      toast.error("Impossible de charger le classement. Veuillez réessayer.")
    }
  }

  const fetchUrgentMatches = async (userId) => {
    try {
      // RPC optimisé : inclut directement le COUNT des participants
      const { data, error } = await supabase
        .rpc('find_last_urgent_matches', { p_user_id: userId })

      if (error) throw error
      if (data && data.length > 0) {
        const mapped = data.map(m => {
          const dateObj = new Date(m.scheduled_at)
          const isToday = dateObj.toDateString() === new Date().toDateString()
          return {
            id: m.id,
            club: m.club || 'Padel Club Lac',
            time: dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            date: isToday ? "Aujourd'hui" : dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
            eloRequired: `${m.elo_min ?? 800}-${m.elo_max ?? 2000}`,
            playersJoined: Number(m.participant_count) || 0,
            playersNeeded: 4,
          }
        })
        setUrgentMatches(mapped)
      } else {
        setUrgentMatches([])
      }
    } catch (err) {
      console.error("Erreur matches urgents:", err.message)
      toast.error("Impossible de charger les matchs urgents.")
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
      setRecentMatches(prev => prev.map(m => {
        if (m.id === matchId) {
          const isAmical = m.type === 'Amical'
          return {
            ...m,
            status: 'Completed',
            eloChange: isAmical ? 0 : 16, // +16 Elo for validation success
            needsReview: true
          }
        }
        return m
      }))
      // Boost user profile elo slightly for demo effect
      setUserProfile(prev => ({
        ...prev,
        elo: prev.elo + 16,
        rank: getRankFromElo(prev.elo + 16)
      }))
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
    toast.success(`Défi envoyé avec succès à ${player.firstName} ${player.lastName} ! Une invitation a été envoyée.`)
    setSelectedPlayer(null)
  }

  // --- Demo Mode Handlers ---

  const handleDemoLogin = () => {
    setIsDemo(true)
    setUserProfile(demoUser)
    setUrgentMatches(demoUrgentMatches)
    setRecentMatches(demoRecentMatches)
    setLeaderboardPlayers(demoLeaderboard)
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
        user={userProfile} 
        onLogout={handleLogout} 
        onUpgradeClick={() => setShowPremium(true)} 
        onProfileClick={() => setShowEditProfile(true)} 
        isAdmin={isAdmin}
        onAdminClick={() => setShowAdminPanel(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        
        {/* Consensus banner if any pending validation */}
        <section className="mt-6">
          <ScoreApprovalBanner 
            pendingMatches={recentMatches.filter(m => m.status === 'Pending_Validation')}
            onApprove={handleApproveScore}
            onDispute={handleDisputeScore}
          />
        </section>

        <section className="mt-6 animate-slide-in" style={{ animationDelay: '0.1s' }}>
          <LastAlert matches={urgentMatches} savedCount={userProfile.matchesSaved} onSaveMatch={handleSaveMatch} />
        </section>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 animate-slide-in" style={{ animationDelay: '0.2s' }}>
            <PlayerCard user={{ ...userProfile, isElite, globalRank: leaderboardPlayers.findIndex(p => p.id === userProfile?.id) + 1 || 11 }} />
          </div>

          <div className="lg:col-span-8 animate-slide-in" style={{ animationDelay: '0.3s' }}>
            <MatchFeed 
              matches={visibleRecentMatches} 
              onOpenReview={handleOpenReview} 
              onOpenScore={handleOpenScoreFlow} 
              onEmergencyCancel={handleEmergencyCancel}
            />
          </div>
        </div>
        
        <section className="mt-8 animate-slide-in" style={{ animationDelay: '0.4s' }}>
          <Leaderboard players={leaderboardPlayers} currentUser={userProfile} onSelectPlayer={setSelectedPlayer} currentUserIsElite={isElite} />
        </section>

        <section className="mt-8 animate-slide-in" style={{ animationDelay: '0.5s' }}>
          <ProStats 
            user={userProfile} 
            matches={recentMatches} 
            isElite={isElite} 
            onUpgrade={() => setShowPremium(true)} 
          />
        </section>
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
