import { useState, useEffect } from 'react'
import { Calendar, Clock, MapPin, CheckCircle, Loader2, Sparkles, AlertCircle } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useToast } from './ToastProvider'

export default function Bookings({ 
  user, 
  isDemo, 
  onShortcutToCreateMatch 
}) {
  const toast = useToast()

  const CLUBS = [
    '4Padels Bordeaux', 
    'Big Padel Jet Sports', 
    'Padel Touch Arcachon', 
    'Padel Arena Rouen', 
    'Casa Padel Paris'
  ]

  const TIME_SLOTS = [
    '08:00', '09:30', '11:00', '12:30', '14:00', '15:30', '17:00', '18:30', '20:00', '21:30'
  ]

  const COURTS = ['Court Central', 'Court 2', 'Court 3 (Panoramique)']

  // Selection states
  const [selectedClub, setSelectedClub] = useState(CLUBS[0])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedSlot, setSelectedSlot] = useState(null) // { time, court }
  const [loading, setLoading] = useState(false)
  const [bookingsList, setBookingsList] = useState([])
  const [successBooking, setSuccessBooking] = useState(null) // Holds successfully completed booking

  // Demo bookings initial seed
  const [demoBookings, setDemoBookings] = useState([
    { id: '1', club: CLUBS[0], court: COURTS[0], booked_at: `${new Date().toISOString().split('T')[0]}T09:30:00.000Z`, player_id: 'other-u1' },
    { id: '2', club: CLUBS[0], court: COURTS[1], booked_at: `${new Date().toISOString().split('T')[0]}T17:00:00.000Z`, player_id: 'other-u2' },
    { id: '3', club: CLUBS[0], court: COURTS[2], booked_at: `${new Date().toISOString().split('T')[0]}T18:30:00.000Z`, player_id: 'other-u3' }
  ])

  useEffect(() => {
    fetchBookings()
  }, [selectedClub, selectedDate])

  const fetchBookings = async () => {
    if (isDemo) {
      // Filter local state bookings
      const localMatches = demoBookings.filter(b => {
        const bDate = b.booked_at.split('T')[0]
        return b.club === selectedClub && bDate === selectedDate
      })
      setBookingsList(localMatches)
    } else {
      setLoading(true)
      try {
        const startOfDay = `${selectedDate}T00:00:00.000Z`
        const endOfDay = `${selectedDate}T23:59:59.999Z`

        const { data, error } = await supabase
          .from('bookings')
          .select('id, user_id, club_name, court, date_time, duration_minutes')
          .eq('club_name', selectedClub)
          .gte('date_time', startOfDay)
          .lte('date_time', endOfDay)

        if (error) throw error

        // Map live data exactly back to component fields
        const mapped = (data || []).map(b => ({
          id: b.id,
          player_id: b.user_id,
          club: b.club_name,
          court: b.court,
          booked_at: b.date_time
        }))

        setBookingsList(mapped)
      } catch (err) {
        console.error('Error fetching bookings:', err)
        toast.error('Impossible de charger les réservations.')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleSelectSlot = (time, court) => {
    // Check if taken
    const isTaken = bookingsList.some(b => {
      const bTime = new Date(b.booked_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      return b.court === court && bTime === time
    })

    if (isTaken) {
      toast.error('Ce créneau est déjà réservé.')
      return
    }

    setSelectedSlot({ time, court })
    setSuccessBooking(null)
  }

  const handleBookCourt = async () => {
    if (!selectedSlot) return
    setLoading(true)

    const bookingDateTime = `${selectedDate}T${selectedSlot.time}:00.000Z`

    try {
      if (isDemo) {
        // Create simulated booking
        const newBooking = {
          id: `demo-b-${crypto.randomUUID()}`,
          player_id: user?.id || 'demo-u1',
          club: selectedClub,
          court: selectedSlot.court,
          booked_at: bookingDateTime
        }

        setDemoBookings(prev => [...prev, newBooking])
        setBookingsList(prev => [...prev, newBooking])
        setSuccessBooking(newBooking)
        toast.success(`Terrain réservé : ${selectedSlot.court} à ${selectedSlot.time} !`)
      } else {
        const { data, error } = await supabase
          .from('bookings')
          .insert({
            user_id: user.id,
            club_name: selectedClub,
            court: selectedSlot.court,
            date_time: bookingDateTime,
            duration_minutes: 90
          })
          .select()
          .single()

        if (error) throw error
        
        // Map live response exactly back to component fields
        const mapped = {
          id: data.id,
          player_id: data.user_id,
          club: data.club_name,
          court: data.court,
          booked_at: data.date_time
        }

        setBookingsList(prev => [...prev, mapped])
        setSuccessBooking(mapped)
        toast.success(`Terrain réservé : ${selectedSlot.court} à ${selectedSlot.time} !`)
      }
      setSelectedSlot(null)
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Erreur lors de la réservation.')
    } finally {
      setLoading(false)
    }
  }

  const handleShortcutMatch = () => {
    if (!successBooking) return
    const timeStr = new Date(successBooking.booked_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    const dateStr = successBooking.booked_at.split('T')[0]
    
    if (onShortcutToCreateMatch) {
      onShortcutToCreateMatch({
        club: successBooking.club,
        date: dateStr,
        time: timeStr
      })
    }
  }

  return (
    <div className="max-w-5xl mx-auto mt-6 space-y-6 animate-slide-in">
      
      {/* Booking Status Card */}
      {successBooking && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 border border-emerald-500/30 flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in shadow-[0_0_30px_rgba(16,185,129,0.1)]">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-5.5 h-5.5" />
            </div>
            <div>
              <p className="text-white text-sm font-bold uppercase tracking-wide">Créneau Réservé avec Succès !</p>
              <p className="text-xs text-zinc-400 font-medium">
                {successBooking.club} • {successBooking.court} le {new Date(successBooking.booked_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} à {new Date(successBooking.booked_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          <button
            onClick={handleShortcutMatch}
            className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-neon-lime text-zinc-950 font-black text-xs uppercase tracking-wider glow-lime transition-all duration-300 hover:scale-105 cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Créer un match elomatch pour ce créneau</span>
          </button>
        </div>
      )}

      {/* Booking Parameters & Club selector */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        <div className="md:col-span-4 p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 space-y-5">
          <h3 className="font-display font-extrabold text-sm uppercase tracking-wider text-white">Réservation de Terrain</h3>
          
          <div className="space-y-1.5">
            <label htmlFor="club-select-booking" className="text-[10px] uppercase tracking-widest font-black text-zinc-500">Choisir le Club</label>
            <select
              id="club-select-booking"
              value={selectedClub}
              onChange={(e) => { setSelectedClub(e.target.value); setSuccessBooking(null); }}
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/60 text-zinc-200 text-sm font-semibold focus:outline-none focus:border-neon-lime"
            >
              {CLUBS.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="date-select-booking" className="text-[10px] uppercase tracking-widest font-black text-zinc-500">Choisir la Date</label>
            <input
              id="date-select-booking"
              type="date"
              value={selectedDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => { setSelectedDate(e.target.value); setSuccessBooking(null); }}
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/60 text-zinc-200 text-sm font-semibold focus:outline-none focus:border-neon-lime"
            />
          </div>

          {/* Selection Detail & Action CTA */}
          {selectedSlot ? (
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-4 animate-fade-in">
              <div className="space-y-1">
                <span className="text-[9px] uppercase tracking-wider font-bold text-neon-lime">Votre Sélection</span>
                <p className="text-white text-sm font-bold">{selectedSlot.court}</p>
                <p className="text-zinc-400 text-xs flex items-center gap-1.5 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" /> {selectedSlot.time} le {new Date(selectedDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </p>
              </div>

              <button
                onClick={handleBookCourt}
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-neon-lime hover:bg-neon-lime/90 disabled:bg-zinc-800 text-zinc-950 font-black text-xs uppercase tracking-wider cursor-pointer glow-lime flex items-center justify-center gap-2 transition-all"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Confirmer la Réservation</span>}
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-zinc-950/30 border border-dashed border-zinc-800/60 text-center py-6">
              <AlertCircle className="w-6 h-6 text-zinc-600 mx-auto mb-2" />
              <p className="text-xs text-zinc-500 font-semibold leading-relaxed">Veuillez sélectionner un créneau disponible dans la grille horaire.</p>
            </div>
          )}
        </div>

        {/* Visual Timeline and Court grid */}
        <div className="md:col-span-8 p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 space-y-5">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-display font-extrabold text-sm uppercase tracking-wider text-white">Grille des Terrains</h4>
              <p className="text-[10px] text-zinc-500 font-semibold">Club : {selectedClub}</p>
            </div>
            <div className="flex gap-4 text-[9px] uppercase font-bold tracking-wider">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500/10 border border-emerald-500/20" />Libre</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-zinc-800" />Réservé</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-neon-lime" />Sélectionné</span>
            </div>
          </div>

          <div className="space-y-4">
            {COURTS.map(court => (
              <div key={court} className="space-y-1.5 p-3 rounded-xl bg-zinc-950/40 border border-zinc-800/60">
                <span className="text-[10px] uppercase font-black text-zinc-400 tracking-wide">{court}</span>
                
                <div className="grid grid-cols-5 gap-2">
                  {TIME_SLOTS.map(time => {
                    // Check if taken
                    const isTaken = bookingsList.some(b => {
                      const bTime = new Date(b.booked_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                      return b.court === court && bTime === time
                    })

                    const isSelected = selectedSlot?.court === court && selectedSlot?.time === time

                    let btnClass = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/30'
                    if (isTaken) {
                      btnClass = 'bg-zinc-900 border-zinc-800/50 text-zinc-600 cursor-not-allowed opacity-60'
                    } else if (isSelected) {
                      btnClass = 'bg-neon-lime border-neon-lime text-zinc-950 glow-lime font-black'
                    }

                    return (
                      <button
                        key={time}
                        onClick={() => handleSelectSlot(time, court)}
                        disabled={isTaken}
                        className={`py-2 rounded-lg border text-center font-mono text-[10px] font-bold tracking-wide transition-all cursor-pointer ${btnClass}`}
                      >
                        {time}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
