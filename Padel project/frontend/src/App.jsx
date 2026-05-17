import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
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

export default function App() {
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

  // Load user data if logged in
  useEffect(() => {
    if (session && session.user) {
      loadSupabaseData(session.user.id)
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
        .select('id, first_name, last_name, city, region, club, hand, play_style, elo_rating, fair_play_score, punctuality_rate, matches_saved_count')
        .eq('id', userId)
        .single()

      if (error) throw error

      if (data) {
        setUserProfile({
          id: data.id,
          firstName: data.first_name,
          lastName: data.last_name,
          city: data.city || 'Bordeaux',
          region: data.region || 'Nouvelle-Aquitaine',
          club: data.club || 'Padel Arena',
          hand: data.hand || 'Droitier',
          playStyle: data.play_style || 'Stratège',
          avatar: null,
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
        .select('id, first_name, last_name, club, region, elo_rating')
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
          winRate: Math.floor(Math.random() * (75 - 40 + 1)) + 40
        }))
        setLeaderboardPlayers(mapped)
      }
    } catch (err) {
      console.error("Erreur classement:", err.message)
    }
  }

  const fetchUrgentMatches = async (userId) => {
    try {
      // Utilise la fonction SQL qui filtre par rayon géographique côté serveur
      const { data, error } = await supabase
        .rpc('find_last_urgent_matches', { p_user_id: userId })

      if (error) throw error
      if (data) {
        const mapped = data.map(m => {
          const dateObj = new Date(m.scheduled_at)
          const isToday = dateObj.toDateString() === new Date().toDateString()
          return {
            id: m.id,
            club: m.club || 'Padel Club Lac',
            time: dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            date: isToday ? "Aujourd'hui" : dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
            eloRequired: `${m.elo_min ?? 800}-${m.elo_max ?? 2000}`,
            playersJoined: 0, // Sera mis à jour si besoin
            playersNeeded: 4,
          }
        })
        setUrgentMatches(mapped)
      }
    } catch (err) {
      console.error("Erreur matches urgents:", err.message)
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

          return {
            id: m.id,
            club: m.club || 'Club Padel',
            date: dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
            time: dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            type: m.match_type,
            status: m.status,
            score: m.score_team_1 && m.score_team_2 ? { team1: m.score_team_1, team2: m.score_team_2 } : null,
            eloChange: eloChangesMap[m.id] || 0,
            needsReview: needsReview,
            players: playersList,
          }
        })
        setRecentMatches(mapped)
      }
    } catch (err) {
      console.error("Erreur matches récents:", err.message)
    }
  }

  // --- Real Interactions ---

  const handleSaveMatch = async (matchId) => {
    if (isDemo) {
      setUrgentMatches(prev => prev.filter(m => m.id !== matchId))
      setUserProfile(prev => ({ ...prev, matchesSaved: prev.matchesSaved + 1 }))
      setShowGLHFNudge(true) // Trigger GLHF when match is fully accepted/joined
      alert("Félicitations ! Vous avez sauvé le match en Mode Démo.")
      return
    }
  }

  const handleReviewSubmit = async (matchId, ratings) => {
    if (isDemo) {
      setRecentMatches(prev => prev.map(m => m.id === matchId ? { ...m, needsReview: false } : m))
      return
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

  const handleScoreSubmit = (matchId, scores, isIncomplete) => {
    // Send to Pending_Validation state (waiting consensus)
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
  }

  // Consensus handlers (Approve / Dispute)
  const handleApproveScore = (matchId) => {
    alert("Consensus 4/4 validé ! Le score est définitivement scellé.")
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
  }

  const handleDisputeScore = (matchId) => {
    alert("Litige enregistré. Le match est bloqué en attente d'arbitrage par le staff.")
    setRecentMatches(prev => prev.map(m => {
      if (m.id === matchId) {
        return {
          ...m,
          status: 'Disputed'
        }
      }
      return m
    }))
  }

  const handleEmergencyCancel = (matchId) => {
    setTimeout(() => {
      alert("Vote 4/4 atteint. Le match a été annulé avec succès.")
      setRecentMatches(prev => prev.map(m => m.id === matchId ? { ...m, status: 'Cancelled' } : m))
    }, 500)
  }

  const handleProposeRematch = (match) => {
    alert(`Formulaire de Revanche généré ! \nJoueurs pré-sélectionnés: Vous et ${match.players.length} autres.\nLieu: ${match.club}\nSélectionnez simplement une nouvelle date.`)
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

  // Filter out disputed matches for visibility
  const visibleRecentMatches = recentMatches.filter(m => m.status !== 'Disputed')

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <DashboardHeader user={userProfile} onLogout={handleLogout} />

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
            <PlayerCard user={userProfile} />
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
          <Leaderboard players={leaderboardPlayers} currentUser={userProfile} />
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
    </div>
  )
}
