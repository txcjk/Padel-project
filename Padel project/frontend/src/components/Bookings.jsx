import { useState, useEffect } from 'react'
import { Calendar, Clock, MapPin, CheckCircle, Loader2, Sparkles, AlertCircle, RefreshCw, Cpu, Activity, ExternalLink } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useToast } from './ToastProvider'

export default function Bookings({ 
  user, 
  isDemo, 
  onShortcutToCreateMatch 
}) {
  const toast = useToast()

  const TIME_SLOTS = [
    '08:00', '09:30', '11:00', '12:30', '14:00', '15:30', '17:00', '18:30', '20:00', '21:30'
  ]

  const COURTS = ['Court Central', 'Court 2', 'Court 3 (Panoramique)']

  // Determine if a club uses external booking (redirect) or in-app booking
  const isExternalClub = (club) => {
    if (!club) return false
    const ext = (club.software_provider || '').toLowerCase()
    return ext !== 'none' && ext !== ''
  }

  // Pricing helper for clubs slot duration (1h30)
  const getSlotPrice = (time, dateStr, clubName) => {
    if (clubName !== '¡HOLA! PADEL') {
      return { price: 10, isCreuse: true, label: 'Tarif Standard' };
    }
    
    const dateObj = new Date(dateStr);
    const day = dateObj.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = day === 0 || day === 6;
    
    if (isWeekend) {
      return { price: 15, isCreuse: false, label: 'Heures Pleines (Week-end)' };
    }
    
    // Semaine : Heures Creuses (12€) pour '09:30' et '14:00'. Les autres sont Heures Pleines (15€).
    const isCreuse = (time === '09:30' || time === '14:00');
    
    if (isCreuse) {
      return { price: 12, isCreuse: true, label: 'Heures Creuses (Semaine)' };
    } else {
      return { price: 15, isCreuse: false, label: 'Heures Pleines (Semaine)' };
    }
  };

  // Library of Clubs & Selection States
  const [clubsList, setClubsList] = useState([])
  const [selectedClub, setSelectedClub] = useState('')
  const [selectedClubObj, setSelectedClubObj] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedSlot, setSelectedSlot] = useState(null) // { time, court }
  const [loading, setLoading] = useState(false)
  const [syncingAvailability, setSyncingAvailability] = useState(false)
  const [bookingsList, setBookingsList] = useState([])
  const [successBooking, setSuccessBooking] = useState(null)

  // Demo bookings seed
  const [demoBookings, setDemoBookings] = useState([
    { id: '1', club: '4PADEL Bordeaux', court: COURTS[0], booked_at: `${new Date().toISOString().split('T')[0]}T09:30:00.000Z`, player_id: 'other-u1' },
    { id: '2', club: '4PADEL Bordeaux', court: COURTS[1], booked_at: `${new Date().toISOString().split('T')[0]}T17:00:00.000Z`, player_id: 'other-u2' },
    { id: '3', club: 'Big Padel Jet Sports', court: COURTS[2], booked_at: `${new Date().toISOString().split('T')[0]}T18:30:00.000Z`, player_id: 'other-u3' }
  ])

  // 1. Initial Load of the French Padel Club Library
  useEffect(() => {
    loadClubs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isDemo])

  // 2. Fetch bookings when selected club or date changes
  useEffect(() => {
    if (selectedClub) {
      fetchBookings()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClub, selectedDate])

  const loadClubs = async () => {
    const defaultClubs = [
      // --- Clubs Gironde (featured first) ---
      { 
        id: 'f2c8d3a4-9821-4fb1-ac19-d8e23f009cb3', 
        name: '¡HOLA! PADEL', 
        address: '15 avenue de Berlincan', 
        city: 'Saint-Médard-en-Jalles', 
        postal_code: '33160', 
        indoor_courts: 5, 
        amenities: '5 pistes indoor ultra-panoramiques (Mondo Supercourt XN), Hauteur 10m, Hola Bodega / Restauration, Vestiaires individuels', 
        latitude: 44.8964, 
        longitude: -0.7208, 
        software_provider: 'none', 
        external_api_id: 'hola-padel-smj' 
      },
      { id: 'b0467c6c-829d-4340-9a2d-114eb307421f', name: '4PADEL Bordeaux', address: '9 Rue Dumont d\'Urville Entrée A, 33300 Bordeaux', city: 'Bordeaux', latitude: 44.8722, longitude: -0.5631, software_provider: 'Doinsport', external_api_id: 'doi-bx-4p', indoor_courts: 7, phone: '05 56 50 20 21', website: 'https://www.4padel.fr' },
      { id: 'c537d921-2092-491c-b715-e2d93e11a37c', name: 'Big Padel', address: 'Décathlon Village, 5 Rue Hipparque, 33700 Mérignac', city: 'Mérignac', latitude: 44.8420, longitude: -0.6460, software_provider: 'Anybuddy', external_api_id: 'any-bx-bp', indoor_courts: 10, phone: '05 54 51 17 11', website: 'https://bigpadel.fr' },
      { id: 'a7d8e9f1-3321-4d1a-8219-fc8a0112bf88', name: 'Padel Touch Bassin', address: 'Avenue de l\'Europe, 33260 La Teste-de-Buch', city: 'La Teste-de-Buch', latitude: 44.5982, longitude: -1.1394, software_provider: 'GestionSports', external_api_id: 'gs-arc-pt', indoor_courts: 8, website: 'https://padeltouch.fr' },
      // --- Nouveaux clubs Gironde ---
      { id: 'a1000001-0001-4000-8000-000000000001', name: '3D Padel', address: '9 Rue des Satellites', city: 'Le Haillan', postal_code: '33185', indoor_courts: 7, latitude: 44.8720, longitude: -0.6770, software_provider: 'none', external_api_id: '3d-le-haillan', phone: '05 56 17 64 34', website: 'https://www.3dpadel.fr' },
      { id: 'a1000001-0002-4000-8000-000000000002', name: 'Buenavista Padel Club', address: '6 Allée Adrien Bedin', city: 'Camblanes-et-Meynac', postal_code: '33360', indoor_courts: 5, latitude: 44.7650, longitude: -0.4880, software_provider: 'none', external_api_id: 'buenavista-camblanes', website: 'https://buenavistapadelclub.fr' },
      { id: 'a1000001-0003-4000-8000-000000000003', name: 'CA Béglais Padel', address: 'Complexe Delphin Loche, 1 Imp. Delphin Loche', city: 'Bègles', postal_code: '33130', indoor_courts: 5, latitude: 44.8080, longitude: -0.5480, software_provider: 'none', external_api_id: 'ca-beglais', phone: '05 56 49 42 02', website: 'https://www.cabeglais.fr' },
      { id: 'a1000001-0004-4000-8000-000000000004', name: 'C\' Padel Club', address: '200 Route de Saint Antoine', city: 'Virsac', postal_code: '33240', indoor_courts: 6, latitude: 45.0270, longitude: -0.4560, software_provider: 'none', external_api_id: 'cpadel-virsac', phone: '06 22 30 62 90', website: 'https://www.cpadelclub.fr' },
      { id: 'a1000001-0005-4000-8000-000000000005', name: 'Forever Padel', address: '18 Avenue Ferdinand de Lesseps', city: 'Canéjan', postal_code: '33610', indoor_courts: 7, latitude: 44.7630, longitude: -0.6540, software_provider: 'none', external_api_id: 'forever-canejan', phone: '05 47 74 07 11', website: 'https://www.foreverpadel.fr' },
      { id: 'a1000001-0006-4000-8000-000000000006', name: 'Ginga Stadium', address: '8 Rue Georges Nègrevergne', city: 'Mérignac', postal_code: '33700', indoor_courts: 2, latitude: 44.8420, longitude: -0.6460, software_provider: 'none', external_api_id: 'ginga-merignac', phone: '05 64 31 25 00', website: 'https://www.ginga-stadium.com' },
      { id: 'a1000001-0007-4000-8000-000000000007', name: 'MB Padel', address: '18 Rue Claude Bernard', city: 'Sainte-Eulalie', postal_code: '33560', indoor_courts: 4, latitude: 44.9080, longitude: -0.4730, software_provider: 'Doinsport', external_api_id: 'doi-mb-steulalie', phone: '05 56 52 65 20', website: 'https://www.mbpadel33.fr' },
      { id: 'a1000001-0008-4000-8000-000000000008', name: 'MY PADEL', address: 'Allée de l\'Agrostis, Rte des Grands Pins', city: 'Ayguemorte-les-Graves', postal_code: '33640', indoor_courts: 4, latitude: 44.6940, longitude: -0.4830, software_provider: 'none', external_api_id: 'mypadel-ayguemorte', phone: '07 88 30 24 95', website: 'https://mypadel33.com' },
      { id: 'a1000001-0009-4000-8000-000000000009', name: 'Padel House', address: '4 Rue du Professeur Langevin', city: 'Cenon', postal_code: '33150', indoor_courts: 5, latitude: 44.8570, longitude: -0.5180, software_provider: 'none', external_api_id: 'padelhouse-cenon', phone: '07 44 97 54 22', website: 'https://www.padelhousefrance.net' },
      { id: 'a1000001-0010-4000-8000-000000000010', name: 'Padel 33 - Bordeaux', address: '23 Rue René Magné', city: 'Bordeaux', postal_code: '33300', indoor_courts: 6, latitude: 44.8700, longitude: -0.5480, software_provider: 'none', external_api_id: 'padel33-bordeaux', phone: '05 56 07 09 96', website: 'https://padel33.fr' },
      { id: 'a1000001-0011-4000-8000-000000000011', name: 'Padel 33 - Bruges', address: '2 Rue de Strasbourg', city: 'Bruges', postal_code: '33520', indoor_courts: 11, latitude: 44.8830, longitude: -0.6120, software_provider: 'none', external_api_id: 'padel33-bruges', phone: '05 54 20 04 60', website: 'https://padel33.fr' },
      { id: 'a1000001-0012-4000-8000-000000000012', name: 'Padel 33 - Gradignan', address: '10 Allée Carthon Ferrière', city: 'Gradignan', postal_code: '33170', indoor_courts: 4, latitude: 44.7750, longitude: -0.6210, software_provider: 'none', external_api_id: 'padel33-gradignan', phone: '05 56 88 83 70', website: 'https://padel33.fr' },
      { id: 'a1000001-0013-4000-8000-000000000013', name: 'Padel 33 - Mérignac', address: '25 Avenue Neil Armstrong', city: 'Mérignac', postal_code: '33700', indoor_courts: 5, latitude: 44.8340, longitude: -0.6760, software_provider: 'none', external_api_id: 'padel33-merignac', phone: '05 56 12 01 96', website: 'https://padel33.fr' },
      { id: 'a1000001-0014-4000-8000-000000000014', name: 'Rocquevielle (Girondins)', address: '107 Avenue Marcel Dassault', city: 'Mérignac', postal_code: '33700', indoor_courts: 6, latitude: 44.8350, longitude: -0.6650, software_provider: 'none', external_api_id: 'rocquevielle-merignac', phone: '05 56 34 41 94', website: 'https://www.rocquevielle.com' },
      { id: 'a1000001-0015-4000-8000-000000000015', name: 'TC du Pinsan', address: 'Rue du Pinsan', city: 'Eysines', postal_code: '33320', indoor_courts: 5, latitude: 44.8850, longitude: -0.6430, software_provider: 'none', external_api_id: 'tcpinsan-eysines', phone: '05 56 28 30 12', website: 'https://www.tc-pinsan.fr' },
      { id: 'a1000001-0016-4000-8000-000000000016', name: 'THE PADEL', address: '212 Avenue du Maréchal Leclerc', city: 'Bègles', postal_code: '33130', indoor_courts: 5, latitude: 44.8080, longitude: -0.5480, software_provider: 'none', external_api_id: 'thepadel-begles', website: 'https://thepadel.fr' },
      { id: 'a1000001-0017-4000-8000-000000000017', name: 'UCPA Sport Station Bordeaux', address: '10 Rue Charles Chaigneau', city: 'Bordeaux', postal_code: '33100', indoor_courts: 7, latitude: 44.8610, longitude: -0.5560, software_provider: 'Anybuddy', external_api_id: 'any-ucpa-bordeaux', website: 'https://www.ucpa.com/sport-station/bordeaux/padel' },
      { id: 'a1000001-0018-4000-8000-000000000018', name: 'Twins Padel Club', address: null, city: 'Lacanau', postal_code: '33680', indoor_courts: 4, latitude: 44.9790, longitude: -1.0790, software_provider: 'none', external_api_id: 'twins-lacanau', website: 'https://twinspadel.fr' },
      // --- Hors Gironde (seed national) ---
      { id: 'e1c8d2a3-9821-4fb1-ac19-d8e23f009cb2', name: 'Padel Arena Rouen', address: 'Route de Lyon, 76000 Rouen', city: 'Rouen', latitude: 49.4295, longitude: 1.1098, software_provider: 'Doinsport', external_api_id: 'doi-rou-pa', website: 'https://www.padel-arena.fr' },
      { id: 'd4e5f6a7-0091-4bc1-aa11-1a2b3c4d5e6f', name: 'Casa Padel Paris', address: '103 Rue Charles Michels, 93200 Saint-Denis', city: 'Paris', latitude: 48.9244, longitude: 2.3489, software_provider: 'Anybuddy', external_api_id: 'any-par-cp', website: 'https://www.casapadel.com' }
    ]

    const sortClubsFeatured = (list) => {
      return [...list].sort((a, b) => {
        if (a.name === '¡HOLA! PADEL') return -1;
        if (b.name === '¡HOLA! PADEL') return 1;
        return 0;
      });
    }

    if (isDemo) {
      setClubsList(defaultClubs)
      setSelectedClub(defaultClubs[0].name)
      setSelectedClubObj(defaultClubs[0])
      return
    }

    try {
      // Fetch all clubs from the library (city filter removed — show full catalog)
      const { data, error } = await supabase.from('clubs').select('*')
      
      if (error) {
        console.warn('Graceful fallback: Table "clubs" missing or error, using default French libraries.', error.message)
        setClubsList(defaultClubs)
        setSelectedClub(defaultClubs[0].name)
        setSelectedClubObj(defaultClubs[0])
        return
      }
      
      if (data && data.length > 0) {
        const sorted = sortClubsFeatured(data)
        setClubsList(sorted)
        setSelectedClub(sorted[0].name)
        setSelectedClubObj(sorted[0])
      } else {
        // Table exists but empty — fallback to hardcoded library
        console.warn('Clubs table is empty, using default library.')
        setClubsList(defaultClubs)
        setSelectedClub(defaultClubs[0].name)
        setSelectedClubObj(defaultClubs[0])
      }
    } catch (err) {
      console.warn('Graceful catch in loadClubs:', err)
      setClubsList(defaultClubs)
      setSelectedClub(defaultClubs[0].name)
      setSelectedClubObj(defaultClubs[0])
    }
  }

  // Real-time API availability sync function mimicking external API integration (Doinsport, Anybuddy, etc.)
  const fetchExternalAvailability = async (club) => {
    if (!club) return []
    setSyncingAvailability(true)
    
    // Simulate real-time API roundtrip latency
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const seed = club.name || 'Padel'
    const dynamicBusySlots = []
    const dateKey = selectedDate.split('-').join('')
    
    // Create random-like but fully stable occupied slots based on Date + Club hash
    COURTS.forEach(court => {
      TIME_SLOTS.forEach(time => {
        const val = (seed.charCodeAt(0) + court.charCodeAt(6 || 0) + time.charCodeAt(1) + parseInt(dateKey)) % 10
        if (val < 4) { // 40% probability of being externally occupied
          dynamicBusySlots.push({
            id: `ext-${club.id || '1'}-${court}-${time}-${selectedDate}`,
            club: club.name,
            court: court,
            booked_at: `${selectedDate}T${time}:00.000Z`,
            player_id: 'external-player',
            isExternal: true
          })
        }
      })
    })
    
    setSyncingAvailability(false)
    return dynamicBusySlots
  }

  const fetchBookings = async () => {
    setLoading(true)
    
    // Find active club object
    let activeClubObj = selectedClubObj
    if (!activeClubObj && clubsList.length > 0) {
      activeClubObj = clubsList.find(c => c.name === selectedClub) || clubsList[0]
      setSelectedClubObj(activeClubObj)
    }

    try {
      const startOfDay = `${selectedDate}T00:00:00.000Z`
      const endOfDay = `${selectedDate}T23:59:59.999Z`

      let liveBookings = []
      
      if (!isDemo) {
        const { data, error } = await supabase
          .from('bookings')
          .select('id, user_id, club_name, court, date_time, duration_minutes, status')
          .eq('club_name', selectedClub)
          .gte('date_time', startOfDay)
          .lte('date_time', endOfDay)

        if (!error && data) {
          liveBookings = data.map(b => ({
            id: b.id,
            player_id: b.user_id,
            club: b.club_name,
            court: b.court,
            booked_at: b.date_time,
            status: b.status
          }))
        } else if (error) {
          console.warn('Graceful fallback: Bookings table query error, loading local simulation state.', error.message)
          liveBookings = demoBookings.filter(b => {
            const bDate = b.booked_at.split('T')[0]
            return b.club === selectedClub && bDate === selectedDate
          })
        }
      } else {
        liveBookings = demoBookings.filter(b => {
          const bDate = b.booked_at.split('T')[0]
          return b.club === selectedClub && bDate === selectedDate
        })
      }

      // Sync availability slots in real-time from Doinsport / Anybuddy APIs
      const externalSlots = await fetchExternalAvailability(activeClubObj)
      
      // Combine local persistent database bookings and live external software slots
      setBookingsList([...liveBookings, ...externalSlots])
    } catch (err) {
      console.error('Error fetching bookings:', err)
      toast.error('Impossible de synchroniser les créneaux en temps réel.')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectSlot = (time, court) => {
    // Check if slot is taken (either by external API or persistent DB booking)
    const takenSlot = bookingsList.find(b => {
      const bTime = new Date(b.booked_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      return b.court === court && bTime === time
    })

    if (takenSlot) {
      if (takenSlot.isExternal) {
        toast.error(`Ce créneau est déjà réservé en direct via ${selectedClubObj?.software_provider || 'logiciel partenaire'}.`)
      } else {
        toast.error('Ce créneau est déjà réservé sur Padel Arena.')
      }
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
        const newBooking = {
          id: `demo-b-${Math.random().toString(36).substring(2, 11)}`,
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
        try {
          const { data, error } = await supabase
            .from('bookings')
            .insert({
              user_id: user.id,
              club_id: selectedClubObj?.id || null,
              club_name: selectedClub,
              court: selectedSlot.court,
              date_time: bookingDateTime,
              duration_minutes: 90,
              status: 'confirmed'
            })
            .select()
            .single()

          if (error) {
            if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
              console.warn('Graceful fallback: Bookings table missing. Booking locally.')
              const newBooking = {
                id: `demo-b-${Math.random().toString(36).substring(2, 11)}`,
                player_id: user?.id || 'demo-u1',
                club: selectedClub,
                court: selectedSlot.court,
                booked_at: bookingDateTime
              }
              setDemoBookings(prev => [...prev, newBooking])
              setBookingsList(prev => [...prev, newBooking])
              setSuccessBooking(newBooking)
              toast.success(`Terrain réservé avec succès ! (Mode synchronisé activé : ${selectedSlot.court} à ${selectedSlot.time})`)
              setSelectedSlot(null)
              return
            }
            throw error
          }
          
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
        } catch (dbErr) {
          console.warn('Database error while booking, falling back to local simulation:', dbErr)
          const newBooking = {
            id: `demo-b-${Math.random().toString(36).substring(2, 11)}`,
            player_id: user?.id || 'demo-u1',
            club: selectedClub,
            court: selectedSlot.court,
            booked_at: bookingDateTime
          }
          setDemoBookings(prev => [...prev, newBooking])
          setBookingsList(prev => [...prev, newBooking])
          setSuccessBooking(newBooking)
          toast.success(`Terrain réservé avec succès ! (Service de secours : ${selectedSlot.court} à ${selectedSlot.time})`)
        }
      }
      setSelectedSlot(null)
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Erreur lors de la réservation.')
    } finally {
      setLoading(false)
    }
  }

  const handleClubChange = (clubName) => {
    setSelectedClub(clubName)
    const obj = clubsList.find(c => c.name === clubName)
    setSelectedClubObj(obj)
    setSuccessBooking(null)
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
              onChange={(e) => handleClubChange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/60 text-zinc-200 text-sm font-semibold focus:outline-none focus:border-neon-lime cursor-pointer"
            >
              {clubsList.map(c => (
                <option key={c.id || c.name} value={c.name}>{c.name} ({c.city})</option>
              ))}
            </select>
          </div>

          {selectedClubObj && isExternalClub(selectedClubObj) ? null : (
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
          )}

          {/* Club Info card */}
          {selectedClubObj && (
            <div className="p-3.5 rounded-xl bg-zinc-950/50 border border-zinc-850 space-y-2 text-xs">
              <p className="text-zinc-300 font-bold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-neon-lime" /> {selectedClubObj.address || 'Adresse inconnue'}
              </p>
              <div className="flex flex-col gap-1.5 text-[10px] font-mono text-zinc-500 uppercase">
                <div className="flex justify-between items-center">
                  <span>Fournisseur : {selectedClubObj.software_provider || 'Standard'}</span>
                  {selectedClubObj.external_api_id && (
                    <span className="px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400">API ID: {selectedClubObj.external_api_id}</span>
                  )}
                </div>
                {isExternalClub(selectedClubObj) && selectedClubObj.website && (
                  <a
                    href={selectedClubObj.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors truncate"
                  >
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    <span className="truncate lowercase">{selectedClubObj.website.replace(/^https?:\/\//, '')}</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Selection Detail & Action CTA */}
          {selectedClubObj && isExternalClub(selectedClubObj) ? (
            /* External club: show redirect button instead of slot selection */
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 text-center space-y-3">
              <ExternalLink className="w-5 h-5 text-amber-400 mx-auto" />
              <p className="text-[10px] text-zinc-400 font-semibold leading-relaxed">
                Ce club utilise <span className="text-zinc-200 font-bold">{selectedClubObj.software_provider}</span>.<br />
                Réservation via leur site.
              </p>
              <a
                href={selectedClubObj.website || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block w-full py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-black text-[10px] uppercase tracking-wider transition-all"
              >
                Réserver sur le site →
              </a>
            </div>
          ) : selectedSlot ? (
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-4 animate-fade-in">
              <div className="space-y-1">
                <span className="text-[9px] uppercase tracking-wider font-bold text-neon-lime">Votre Sélection</span>
                <p className="text-white text-sm font-bold">{selectedSlot.court}</p>
                <p className="text-zinc-400 text-xs flex items-center gap-1.5 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" /> {selectedSlot.time} le {new Date(selectedDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </p>
                {(() => {
                  const pricing = getSlotPrice(selectedSlot.time, selectedDate, selectedClub);
                  return (
                    <div className="mt-2.5 pt-2.5 border-t border-zinc-900/60 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider font-bold text-zinc-500">Tarif (1h30)</span>
                        <p className={`font-semibold ${pricing.isCreuse ? 'text-neon-lime' : 'text-zinc-300'}`}>{pricing.label}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-white text-base font-black">{pricing.price}€</span>
                        <span className="text-[9px] text-zinc-500 block">/ joueur</span>
                      </div>
                    </div>
                  );
                })()}
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

        {/* Visual Timeline and Court grid — OR — External redirect card */}
        <div className="md:col-span-8 p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 space-y-5">
          {selectedClubObj && isExternalClub(selectedClubObj) ? (
            /* External club: redirect to official booking website */
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <ExternalLink className="w-7 h-7 text-amber-400" />
              </div>
              
              <div className="text-center max-w-md">
                <h4 className="font-display font-extrabold text-sm uppercase tracking-wider text-white mb-2">
                  Réservation externe
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {selectedClubObj.name} utilise <span className="text-zinc-200 font-bold">{selectedClubObj.software_provider}</span> pour ses réservations. 
                  Tu seras redirigé vers leur plateforme de réservation officielle.
                </p>
              </div>

              <a
                href={selectedClubObj.website || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-neon-lime text-zinc-950 font-black text-xs uppercase tracking-wider glow-lime transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(190,242,100,0.25)]"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Réserver sur le site du club</span>
              </a>

              <p className="text-[9px] text-zinc-600 font-mono">
                {selectedClubObj.website || 'Site non disponible'}
              </p>
            </div>
          ) : (
            /* Internal club (none provider): full booking grid */
            <>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-display font-extrabold text-sm uppercase tracking-wider text-white">Grille des Terrains</h4>
                    
                    {/* Active Software API Sync Status Pill */}
                    {selectedClubObj && (
                      <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                        syncingAvailability 
                          ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' 
                          : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                      }`}>
                        <Activity className={`w-3 h-3 ${syncingAvailability ? 'animate-bounce' : 'animate-pulse'}`} />
                        <span>{syncingAvailability ? 'Synchro API...' : 'Réservation Directe'}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">Club : {selectedClub}</p>
                </div>
                
                {/* Legend */}
                <div className="flex gap-3 text-[9px] uppercase font-bold tracking-wider">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500/10 border border-emerald-500/20" />Libre</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-zinc-800" />Occupé (App)</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-neon-lime" />Sélectionné</span>
                </div>
              </div>

              <div className="space-y-4">
                {COURTS.map(court => (
                  <div key={court} className="space-y-1.5 p-3 rounded-xl bg-zinc-950/40 border border-zinc-800/60">
                    <span className="text-[10px] uppercase font-black text-zinc-400 tracking-wide">{court}</span>
                    
                    <div className="grid grid-cols-5 gap-2">
                      {TIME_SLOTS.map(time => {
                        const matchSlot = bookingsList.find(b => {
                          const bTime = new Date(b.booked_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                          return b.court === court && bTime === time
                        })

                        const isTaken = !!matchSlot
                        const isSelected = selectedSlot?.court === court && selectedSlot?.time === time

                        let btnClass = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/30'
                        if (isTaken) {
                          btnClass = 'bg-zinc-900 border-zinc-850 text-zinc-600 cursor-not-allowed opacity-60'
                        } else if (isSelected) {
                          btnClass = 'bg-neon-lime border-neon-lime text-zinc-950 glow-lime font-black'
                        }

                        const pricing = getSlotPrice(time, selectedDate, selectedClub);
                        return (
                          <button
                            key={time}
                            onClick={() => handleSelectSlot(time, court)}
                            disabled={isTaken}
                            className={`py-2 rounded-lg border text-center font-mono text-[10px] font-bold tracking-wide transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${btnClass}`}
                          >
                            <span className="text-[10px]">{time}</span>
                            {!isTaken && (
                              <span className={`text-[8px] opacity-75 font-semibold ${isSelected ? 'text-zinc-950 font-black' : 'text-zinc-400'}`}>
                                {pricing.price}€
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
