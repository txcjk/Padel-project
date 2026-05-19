import { useState } from 'react'
import { Calendar, MapPin, Trophy, Shield, HelpCircle, Loader2, Sparkles, CheckCircle2 } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useToast } from './ToastProvider'

export default function CreateMatch({ 
  user, 
  isElite, 
  isDemo, 
  onAddMatch, 
  prefilledData = null, 
  onNavigateToDashboard 
}) {
  const toast = useToast()
  
  const CLUBS = [
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!date || !time) {
      toast.error('Veuillez remplir la date et l\'heure du match.')
      return
    }

    setLoading(true)
    const scheduledAt = new Date(`${date}T${time}`).toISOString()

    try {
      if (isDemo) {
        // --- Demo Mode Logic ---
        // Simulating the Elo limit check for standard user
        if (matchType === 'Ranked' && !isElite) {
          // If we had demo limitations, we would check them here.
          // For demo, we just simulate.
        }

        const simulatedMatch = {
          id: `demo-${crypto.randomUUID()}`,
          club,
          date: new Date(scheduledAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
          rawDate: scheduledAt,
          time: new Date(scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          type: matchType,
          status: 'Pending',
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
            { id: user?.id || 'demo-u1', name: `${user?.firstName || 'Alexandre'} ${user?.lastName ? user.lastName[0] + '.' : 'D.'}`, team: 1 }
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
        
        // 1. Double check Ranked match limit for non-Elite users
        if (matchType === 'Ranked' && !isElite) {
          const now = new Date()
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
          
          // Fetch creator's matches this month
          const { data: myMatches, error: myMatchesErr } = await supabase
            .from('matches')
            .select('id, match_type, scheduled_at')
            .eq('creator_id', user.id)
            .eq('match_type', 'Ranked')
            .gte('scheduled_at', startOfMonth)
            
          if (myMatchesErr) throw myMatchesErr

          if (myMatches && myMatches.length >= 1) {
            toast.error('Limite mensuelle atteinte. Les comptes standards sont limités à 1 match Classé créé par mois. Passez à Élite pour un accès illimité !')
            setLoading(false)
            return
          }
        }

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
            status: 'Pending'
          })
          .select()
          .single()

        if (matchErr) throw matchErr

        // 3. Auto-join creator in team 1
        const { error: partErr } = await supabase
          .from('match_participations')
          .insert({
            match_id: matchData.id,
            player_id: user.id,
            team: 1,
            joined_via_last: false
          })

        if (partErr) throw partErr

        setCreatedSuccess(true)
        toast.success('Votre match a été publié sur le salon compétitif !')
        
        if (onAddMatch) {
          // Trigger a refresh or local addition
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

  if (createdSuccess) {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-8 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 text-center space-y-6 animate-fade-in shadow-[0_0_50px_rgba(163,230,53,0.05)]">
        <div className="w-20 h-20 mx-auto rounded-full bg-neon-lime/10 border border-neon-lime/30 flex items-center justify-center glow-lime">
          <CheckCircle2 className="w-10 h-10 text-neon-lime" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display font-extrabold text-2xl text-white tracking-tight uppercase">Match publié avec succès !</h2>
          <p className="text-zinc-400 text-sm max-w-md mx-auto leading-relaxed">
            Votre match est désormais visible sur le mur principal de Padel Arena. Les autres joueurs peuvent s'y inscrire ou être notifiés s'il s'agit d'une alerte Last.
          </p>
        </div>
        
        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => {
              setCreatedSuccess(false)
              setDate('')
              setTime('')
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
    <div className="max-w-2xl mx-auto mt-6 animate-slide-in">
      {/* Premium header card */}
      <div className="p-6 rounded-t-2xl bg-gradient-to-r from-zinc-900 to-zinc-900/90 border-t border-x border-zinc-800/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-lime/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neon-lime/10 border border-neon-lime/20 flex items-center justify-center text-neon-lime">
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
    </div>
  )
}
