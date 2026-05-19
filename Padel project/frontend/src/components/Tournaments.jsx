import { useState, useEffect } from 'react'
import { Trophy, Calendar, Users, Award, ShieldAlert, Sparkles, Loader2, Search, PlusCircle, Check } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useToast } from './ToastProvider'

export default function Tournaments({ 
  user, 
  isDemo, 
  leaderboardPlayers = [] 
}) {
  const toast = useToast()
  
  // Tab states
  const [activeSubTab, setActiveSubTab] = useState('list') // 'list' | 'brackets' | 'leaderboard'
  
  // Data states
  const [tournaments, setTournaments] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [tournamentPoints, setTournamentPoints] = useState([])
  const [loading, setLoading] = useState(false)

  // Registration modal/form states
  const [selectedTournament, setSelectedTournament] = useState(null)
  const [partnerMode, setPartnerMode] = useState('search') // 'search' | 'custom'
  const [partnerPlayerId, setPartnerPlayerId] = useState('')
  const [customPartnerName, setCustomPartnerName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Seed initial demo data
  const DEMO_TOURNAMENTS = [
    { id: 't1', title: 'Bordeaux Master Cup', club: '4Padels Bordeaux', scheduled_at: new Date(Date.now() + 5*86400000).toISOString(), status: 'Upcoming' },
    { id: 't2', title: 'Grand Slam Padel Arena', club: 'Padel Arena Rouen', scheduled_at: new Date(Date.now() + 12*86400000).toISOString(), status: 'Upcoming' },
    { id: 't3', title: 'Toulouse Padel Open', club: 'Casa Padel Paris', scheduled_at: new Date(Date.now() - 2*86400000).toISOString(), status: 'Ongoing' }
  ]

  const DEMO_REGISTRATIONS = [
    { id: 'r1', tournament_id: 't1', player_1_id: 'demo-u2', player_2_id: 'demo-u3', player_2_name: null },
    { id: 'r2', tournament_id: 't1', player_1_id: 'other-u5', player_2_id: null, player_2_name: 'Guillaume D.' }
  ]

  const DEMO_POINTS = [
    { player_id: 'demo-u1', name: 'Alexandre D.', points: 450, rank: 1, tag: 'ELITE-ALEX' },
    { player_id: 'demo-u2', name: 'Lucas M.', points: 380, rank: 2, tag: 'LUCAS-PADEL' },
    { player_id: 'demo-u3', name: 'Sofia R.', points: 350, rank: 3, tag: 'SOFIA-ATTACK' },
    { player_id: 'other-u5', name: 'Julien B.', points: 210, rank: 4, tag: 'JULIEN-B' },
    { player_id: 'other-u6', name: 'Marc T.', points: 190, rank: 5, tag: 'MARC-DEFENSE' }
  ]

  // Demo Brackets matches
  const BRACKETS_MATCHES = {
    quarters: [
      { id: 'q1', t1: 'Lucas M. / Sofia R.', s1: '6', s2: '6', t2: 'Marc T. / Antoine P.', s3: '4', s4: '2', winner: 1 },
      { id: 'q2', t1: 'Julien B. / Paul D.', s1: '7', s2: '4', s3: '6', t2: 'Thomas M. / Nathan V.', s3: '5', s4: '6', s5: '3', winner: 1 },
      { id: 'q3', t1: 'Alexandre D. / Hugo B.', s1: '6', s2: '6', t2: 'Vincent G. / Romain F.', s3: '3', s4: '1', winner: 1 },
      { id: 'q4', t1: 'Nicolas S. / Seb B.', s1: '6', s2: '3', s3: '6', t2: 'Pierre K. / David L.', s3: '4', s4: '6', s5: '4', winner: 1 }
    ],
    semis: [
      { id: 's1', t1: 'Lucas M. / Sofia R.', s1: '6', s2: '6', t2: 'Julien B. / Paul D.', s3: '2', s4: '3', winner: 1 },
      { id: 's2', t1: 'Alexandre D. / Hugo B.', s1: '6', s2: '7', t2: 'Nicolas S. / Seb B.', s3: '4', s4: '5', winner: 1 }
    ],
    final: [
      { id: 'f1', t1: 'Lucas M. / Sofia R.', s1: '3', s2: '4', t2: 'Alexandre D. / Hugo B.', s3: '6', s4: '6', winner: 2 }
    ]
  }

  useEffect(() => {
    loadTournamentData()
  }, [isDemo])

  const loadTournamentData = async () => {
    setLoading(true)
    try {
      if (isDemo) {
        setTournaments(DEMO_TOURNAMENTS)
        setRegistrations(DEMO_REGISTRATIONS)
        setTournamentPoints(DEMO_POINTS)
      } else {
        const { data: tourns, error: tournErr } = await supabase
          .from('tournaments')
          .select('id, created_at, title, club_name, start_date, max_teams, status')
          .order('start_date', { ascending: true })
        if (tournErr) throw tournErr
        
        const mappedTournaments = (tourns || []).map(t => ({
          id: t.id,
          created_at: t.created_at,
          title: t.title,
          club: t.club_name,
          scheduled_at: t.start_date,
          max_teams: t.max_teams,
          status: t.status === 'open' ? 'Upcoming' : t.status === 'ongoing' ? 'Ongoing' : t.status === 'finished' ? 'Completed' : t.status
        }))
        setTournaments(mappedTournaments)

        const { data: regs, error: regsErr } = await supabase.from('tournament_registrations').select('*')
        if (regsErr) throw regsErr
        setRegistrations(regs || [])

        // Load points aggregated with profiles
        const { data: pts, error: ptsErr } = await supabase.from('tournament_points').select(`
          id, tournament_id, player_id, points,
          profiles ( first_name, last_name, player_tag )
        `)
        if (ptsErr) throw ptsErr
        
        const mappedPoints = (pts || []).map((p, idx) => ({
          player_id: p.player_id,
          name: p.profiles ? `${p.profiles.first_name} ${p.profiles.last_name[0]}.` : 'Joueur',
          points: p.points,
          rank: idx + 1,
          tag: p.profiles?.player_tag || 'PADEL'
        })).sort((a,b) => b.points - a.points)

        setTournamentPoints(mappedPoints)
      }
    } catch (err) {
      console.error(err)
      toast.error('Erreur de chargement des tournois.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!selectedTournament) return

    setLoading(true)

    try {
      const p2Id = partnerMode === 'search' && partnerPlayerId ? partnerPlayerId : null
      const p2Name = partnerMode === 'custom' && customPartnerName ? customPartnerName : null

      if (partnerMode === 'search' && !partnerPlayerId) {
        toast.error('Veuillez sélectionner un partenaire.')
        setLoading(false)
        return
      }
      if (partnerMode === 'custom' && !customPartnerName) {
        toast.error('Veuillez renseigner le nom de votre partenaire.')
        setLoading(false)
        return
      }

      if (isDemo) {
        const newReg = {
          id: `demo-r-${Date.now()}`,
          tournament_id: selectedTournament.id,
          player_1_id: user?.id || 'demo-u1',
          player_2_id: p2Id,
          player_2_name: p2Name
        }

        setRegistrations(prev => [...prev, newReg])
        toast.success(`Inscription validée au tournoi ${selectedTournament.title} !`)
      } else {
        const { error } = await supabase
          .from('tournament_registrations')
          .insert({
            tournament_id: selectedTournament.id,
            player_1_id: user.id,
            player_2_id: p2Id,
            player_2_name: p2Name
          })

        if (error) throw error

        toast.success(`Inscription validée au tournoi ${selectedTournament.title} !`)
        loadTournamentData()
      }

      setSelectedTournament(null)
      setPartnerPlayerId('')
      setCustomPartnerName('')
    } catch (err) {
      console.error(err)
      toast.error(err.message || "Erreur lors de l'inscription.")
    } finally {
      setLoading(false)
    }
  }

  const filteredPlayers = leaderboardPlayers.filter(p => {
    if (p.id === (user?.id || 'demo-u1')) return false
    const name = (p.name || `${p.first_name} ${p.last_name || ''}`).toLowerCase()
    return name.includes(searchQuery.toLowerCase())
  })

  return (
    <div className="max-w-6xl mx-auto mt-6 space-y-6 animate-slide-in">
      
      {/* Tournaments header navigation tabs */}
      <div className="flex justify-between items-center border-b border-zinc-850 pb-2">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveSubTab('list')}
            className={`pb-2 font-display font-extrabold text-sm uppercase tracking-wider cursor-pointer border-b-2 transition-all ${
              activeSubTab === 'list' ? 'border-neon-lime text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            🏆 Tournois & Inscription
          </button>
          <button
            onClick={() => setActiveSubTab('brackets')}
            className={`pb-2 font-display font-extrabold text-sm uppercase tracking-wider cursor-pointer border-b-2 transition-all ${
              activeSubTab === 'brackets' ? 'border-neon-lime text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            🎴 Arbre des phases (Brackets)
          </button>
          <button
            onClick={() => setActiveSubTab('leaderboard')}
            className={`pb-2 font-display font-extrabold text-sm uppercase tracking-wider cursor-pointer border-b-2 transition-all ${
              activeSubTab === 'leaderboard' ? 'border-neon-lime text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            ⚡ Classement Spécifique
          </button>
        </div>
      </div>

      {/* VIEW 1: TOURNAMENTS LIST */}
      {activeSubTab === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-neon-lime" />
              </div>
            ) : tournaments.length > 0 ? (
              tournaments.map(t => {
                const isRegistered = registrations.some(r => r.tournament_id === t.id && (r.player_1_id === (user?.id || 'demo-u1') || r.player_2_id === (user?.id || 'demo-u1')))
                
                return (
                  <div key={t.id} className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-zinc-700 transition-colors relative overflow-hidden">
                    {t.status === 'Ongoing' && (
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-neon-violet glow-violet" />
                    )}
                    
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <h4 className="font-display font-black text-white text-base uppercase tracking-wide">{t.title}</h4>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                          t.status === 'Upcoming' 
                            ? 'bg-neon-lime/10 text-neon-lime border border-neon-lime/20' 
                            : 'bg-neon-violet/10 text-neon-violet border border-neon-violet/20 animate-pulse'
                        }`}>
                          {t.status === 'Upcoming' ? 'À Venir' : 'En Cours'}
                        </span>
                      </div>
                      <p className="text-zinc-400 text-xs font-semibold flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500" /> {new Date(t.scheduled_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">{t.club}</p>
                    </div>

                    {isRegistered ? (
                      <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold text-xs flex items-center gap-1.5">
                        <Check className="w-4 h-4" />
                        <span>Inscrit</span>
                      </div>
                    ) : t.status === 'Ongoing' ? (
                      <button disabled className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-500 border border-zinc-700/50 font-bold text-xs uppercase tracking-wider">
                        En Cours
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedTournament(t)}
                        className="px-4 py-2.5 rounded-xl bg-neon-lime hover:bg-neon-lime/90 text-zinc-950 font-black text-xs uppercase tracking-wider cursor-pointer glow-lime hover:scale-105 transition-all"
                      >
                        S'inscrire avec mon partenaire
                      </button>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="p-8 text-center text-zinc-500 font-semibold border border-dashed border-zinc-800 rounded-2xl py-12">
                Aucun tournoi planifié pour le moment.
              </div>
            )}
          </div>

          {/* Registration form overlay/card */}
          <div className="md:col-span-1">
            {selectedTournament ? (
              <form onSubmit={handleRegister} className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-5 animate-fade-in shadow-[0_0_30px_rgba(0,0,0,0.3)]">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-neon-lime">Formulaire d'Inscription</span>
                  <h4 className="text-white text-sm font-black uppercase truncate">{selectedTournament.title}</h4>
                </div>

                {/* Partner search / manual select tabs */}
                <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-zinc-950 border border-zinc-850">
                  <button
                    type="button"
                    onClick={() => setPartnerMode('search')}
                    className={`py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                      partnerMode === 'search' ? 'bg-zinc-850 text-white font-black' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    🔍 Rechercher
                  </button>
                  <button
                    type="button"
                    onClick={() => setPartnerMode('custom')}
                    className={`py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                      partnerMode === 'custom' ? 'bg-zinc-850 text-white font-black' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    ✍️ Nom Manuel
                  </button>
                </div>

                {partnerMode === 'search' ? (
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase tracking-widest font-black text-zinc-500 flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5" /> Sélectionner un Partenaire
                    </label>
                    <input
                      type="text"
                      placeholder="Chercher par nom..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-850 text-xs font-semibold text-zinc-200 focus:outline-none focus:border-neon-lime"
                    />
                    
                    {searchQuery.length > 0 && (
                      <div className="max-h-36 overflow-y-auto border border-zinc-850 rounded-xl p-1 bg-zinc-950 space-y-0.5">
                        {filteredPlayers.map(p => {
                          const name = p.name || `${p.first_name} ${p.last_name[0]}.`
                          const isSel = partnerPlayerId === p.id
                          return (
                            <button
                              type="button"
                              key={p.id}
                              onClick={() => { setPartnerPlayerId(p.id); setSearchQuery(''); }}
                              className={`w-full p-2 rounded-lg text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                                isSel ? 'bg-neon-lime text-zinc-950 font-bold' : 'hover:bg-zinc-900 text-zinc-300'
                              }`}
                            >
                              <span>{name} ({p.elo || 1000} Elo)</span>
                              {isSel && <Check className="w-3.5 h-3.5" />}
                            </button>
                          )
                        })}
                      </div>
                    )}
                    
                    {partnerPlayerId && (
                      <div className="p-2.5 rounded-xl bg-neon-lime/10 border border-neon-lime/20 flex items-center justify-between text-xs font-bold text-neon-lime">
                        <span>Sélectionné : {leaderboardPlayers.find(p => p.id === partnerPlayerId)?.name || 'Partenaire'}</span>
                        <button type="button" onClick={() => setPartnerPlayerId('')} className="text-zinc-400 hover:text-white font-black">X</button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label htmlFor="custom-partner-name" className="text-[9px] uppercase tracking-widest font-black text-zinc-500">Nom du Partenaire externe</label>
                    <input
                      id="custom-partner-name"
                      type="text"
                      placeholder="Nom complet..."
                      value={customPartnerName}
                      onChange={(e) => setCustomPartnerName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-850 text-xs font-semibold text-zinc-200 focus:outline-none focus:border-neon-lime"
                      required
                    />
                  </div>
                )}

                <div className="pt-2 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedTournament(null)}
                    className="py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs cursor-pointer transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="py-2.5 rounded-xl bg-neon-lime hover:bg-neon-lime/90 disabled:bg-zinc-800 text-zinc-950 font-black text-xs uppercase tracking-wider cursor-pointer glow-lime flex items-center justify-center transition-all"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmer'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-5 rounded-2xl bg-zinc-950/40 border border-dashed border-zinc-850 text-center py-10">
                <Users className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-xs text-zinc-500 font-semibold leading-relaxed">
                  Sélectionnez un tournoi de la liste pour vous inscrire en binôme.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: BRACKETS (ARBRE DE COMPÉTITION) */}
      {activeSubTab === 'brackets' && (
        <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 overflow-x-auto space-y-6">
          <div className="min-w-[800px] grid grid-cols-3 gap-6 items-center py-6 relative">
            
            {/* Quarts de Finale */}
            <div className="space-y-6">
              <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500 block mb-4">Quarts de Finale</span>
              
              {BRACKETS_MATCHES.quarters.map(m => (
                <div key={m.id} className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-850 text-xs space-y-2">
                  <div className={`flex justify-between items-center ${m.winner === 1 ? 'text-neon-lime font-bold' : 'text-zinc-400'}`}>
                    <span className="truncate max-w-[150px]">{m.t1}</span>
                    <span className="font-mono bg-zinc-900 px-1.5 py-0.5 rounded font-extrabold text-[10px]">{m.s1}-{m.s2}</span>
                  </div>
                  <div className={`flex justify-between items-center ${m.winner === 2 ? 'text-neon-lime font-bold' : 'text-zinc-400'}`}>
                    <span className="truncate max-w-[150px]">{m.t2}</span>
                    <span className="font-mono bg-zinc-900 px-1.5 py-0.5 rounded font-extrabold text-[10px]">{m.s3}-{m.s4}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Demies-Finales */}
            <div className="space-y-16">
              <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500 block mb-4">Demi-Finales</span>
              
              {BRACKETS_MATCHES.semis.map(m => (
                <div key={m.id} className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs space-y-2 relative">
                  {/* Connector lines visual mockups */}
                  <div className="absolute top-1/2 -left-4 w-4 h-0.5 bg-zinc-800" />
                  
                  <div className={`flex justify-between items-center ${m.winner === 1 ? 'text-neon-lime font-bold' : 'text-zinc-400'}`}>
                    <span className="truncate max-w-[150px]">{m.t1}</span>
                    <span className="font-mono bg-zinc-900 px-1.5 py-0.5 rounded font-extrabold text-[10px]">{m.s1}-{m.s2}</span>
                  </div>
                  <div className={`flex justify-between items-center ${m.winner === 2 ? 'text-neon-lime font-bold' : 'text-zinc-400'}`}>
                    <span className="truncate max-w-[150px]">{m.t2}</span>
                    <span className="font-mono bg-zinc-900 px-1.5 py-0.5 rounded font-extrabold text-[10px]">{m.s3}-{m.s4}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Finale */}
            <div className="space-y-32 flex flex-col justify-center">
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest text-neon-lime flex items-center gap-1 mb-4">
                  <Sparkles className="w-3.5 h-3.5" /> Grande Finale
                </span>
                
                {BRACKETS_MATCHES.final.map(m => (
                  <div key={m.id} className="p-4 rounded-xl bg-zinc-950 border-2 border-neon-lime/40 text-xs space-y-3 relative glow-lime">
                    <div className="absolute top-1/2 -left-4 w-4 h-0.5 bg-neon-lime/40" />
                    
                    <div className={`flex justify-between items-center ${m.winner === 1 ? 'text-neon-lime font-bold' : 'text-zinc-400'}`}>
                      <span className="truncate max-w-[150px]">{m.t1}</span>
                      <span className="font-mono bg-zinc-900 px-1.5 py-0.5 rounded font-extrabold text-[10px]">{m.s1}-{m.s2}</span>
                    </div>
                    <div className={`flex justify-between items-center ${m.winner === 2 ? 'text-neon-lime font-bold' : 'text-zinc-400'}`}>
                      <span className="truncate max-w-[150px]">{m.t2}</span>
                      <span className="font-mono bg-zinc-900 px-1.5 py-0.5 rounded font-extrabold text-[10px]">{m.s3}-{m.s4}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* VIEW 3: LEADERBOARD TOURNAMENT POINTS */}
      {activeSubTab === 'leaderboard' && (
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h4 className="font-display font-extrabold text-base uppercase text-white tracking-wide">Classement Points Tournoi</h4>
              <p className="text-[10px] text-zinc-500 font-semibold leading-relaxed">Les points sont accumulés exclusivement sur les participations et victoires lors des tournois officiels.</p>
            </div>
            
            <div className="px-3 py-1.5 rounded-full bg-neon-lime/10 border border-neon-lime/20 text-neon-lime text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 animate-pulse" />
              <span>Saison 2026</span>
            </div>
          </div>

          <div className="overflow-hidden border border-zinc-850 rounded-xl bg-zinc-950/40">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-850 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  <th className="py-3 px-4 w-16">Rang</th>
                  <th className="py-3 px-4">Joueur</th>
                  <th className="py-3 px-4">Tag Compétition</th>
                  <th className="py-3 px-4 text-right">Points Tournoi</th>
                </tr>
              </thead>
              <tbody>
                {tournamentPoints.map((p, idx) => {
                  const isMe = p.player_id === (user?.id || 'demo-u1')
                  
                  return (
                    <tr 
                      key={p.player_id} 
                      className={`border-b border-zinc-900/50 text-xs font-semibold transition-colors hover:bg-zinc-900/20 ${
                        isMe ? 'bg-neon-lime/5 text-neon-lime' : 'text-zinc-300'
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-center w-16">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                      </td>
                      <td className="py-3 px-4 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-[10px]">
                          {p.name[0]}
                        </div>
                        <span>{p.name}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[10px] tracking-wide text-zinc-500 uppercase">{p.tag}</td>
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-white text-sm">
                        {p.points} PTS
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  )
}
