import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageSquare, Send, Users, ShieldAlert, Sparkles, User, Bell, Loader2 } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useToast } from './ToastProvider'

const MESSAGE_COOLDOWN_MS = 1500 // 1.5s between messages

export default function Chat({ 
  user, 
  isDemo, 
  recentMatches = [], 
  leaderboardPlayers = [], 
  directMessageRecipient = null,
  onClearRecipient
}) {
  const toast = useToast()
  const messagesEndRef = useRef(null)

  // Selection states
  const [activeTab, setActiveTab] = useState('matches') // 'matches' | 'direct'
  const [selectedChannel, setSelectedChannel] = useState(null) // Holds selected match or recipient player
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const lastMessageTime = useRef(0)

  // Active Chats List
  const myMatches = recentMatches.filter(m => m.status === 'Pending' || m.status === 'Full' || m.status === 'Pending_Validation' || m.status === 'Completed')

  // Demo messages seed
  const [demoMessages, setDemoBookedMessages] = useState([
    // Match chats demo data
    { id: 'm1', sender_id: 'demo-u2', sender_name: 'Lucas M.', match_id: myMatches[0]?.id || 'demo-m1', content: 'Salut l\'équipe ! Des balles neuves dispo pour ce soir ?', created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: 'm2', sender_id: 'demo-u3', sender_name: 'Sofia R.', match_id: myMatches[0]?.id || 'demo-m1', content: 'Oui j\'ai un tube neuf de Head Pro S ! 🎾', created_at: new Date(Date.now() - 1800000).toISOString() },
    
    // Direct messages demo data
    { id: 'd1', sender_id: 'demo-u2', sender_name: 'Lucas M.', recipient_id: 'demo-u1', content: 'Hey, chaud pour un amical la semaine prochaine ?', created_at: new Date(Date.now() - 7200000).toISOString() }
  ])

  // Scroll to bottom helper
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, selectedChannel, scrollToBottom])

  // Handle outside direct recipient trigger
  useEffect(() => {
    if (directMessageRecipient) {
      setActiveTab('direct')
      setSelectedChannel(directMessageRecipient)
      if (onClearRecipient) onClearRecipient()
    }
  }, [directMessageRecipient])

  // Fetch messages when selected channel changes
  useEffect(() => {
    if (!selectedChannel) return

    if (isDemo) {
      // Filter local state
      const channelMessages = demoMessages.filter(msg => {
        if (activeTab === 'matches') {
          return msg.match_id === selectedChannel.id
        } else {
          // Direct chat between user and selectedChannel
          return (msg.sender_id === 'demo-u1' && msg.recipient_id === selectedChannel.id) ||
                 (msg.sender_id === selectedChannel.id && msg.recipient_id === 'demo-u1')
        }
      })
      setMessages(channelMessages)
    } else {
      fetchLiveMessages()
    }
  }, [selectedChannel, activeTab, demoMessages])

  // Realtime Supabase Channel subscription
  useEffect(() => {
    if (isDemo || !selectedChannel) return

    // Set up Supabase Realtime listener
    const channel = supabase
      .channel(`chat-room-${selectedChannel.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new
          // Check if message belongs to active conversation
          const belongsToMatch = activeTab === 'matches' && newMsg.match_id === selectedChannel.id
          const belongsToDM = activeTab === 'direct' && (
            (newMsg.sender_id === user.id && newMsg.receiver_id === selectedChannel.id) ||
            (newMsg.sender_id === selectedChannel.id && newMsg.receiver_id === user.id)
          )

          if (belongsToMatch || belongsToDM) {
            // Fetch sender profile details to display
            supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', newMsg.sender_id)
              .single()
              .then(({ data }) => {
                const name = data ? `${data.first_name} ${data.last_name[0]}.` : 'Joueur'
                setMessages(prev => [...prev, { ...newMsg, recipient_id: newMsg.receiver_id, sender_name: name }])
              })
              .catch(err => {
                console.warn('Realtime profile load error:', err)
                setMessages(prev => [...prev, { ...newMsg, recipient_id: newMsg.receiver_id, sender_name: 'Joueur' }])
              })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedChannel, activeTab, isDemo])

  const fetchLiveMessages = async () => {
    setLoading(true)
    try {
      let query = supabase.from('messages').select(`
        id, sender_id, match_id, receiver_id, content, created_at,
        profiles!messages_sender_id_fkey ( first_name, last_name )
      `)

      if (activeTab === 'matches') {
        query = query.eq('match_id', selectedChannel.id)
      } else {
        query = query.or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedChannel.id}),and(sender_id.eq.${selectedChannel.id},receiver_id.eq.${user.id})`)
      }

      const { data, error } = await query.order('created_at', { ascending: true })
      if (error) {
        // Graceful fallback for missing table or other errors
        if (error.status === 404 || error.code === 'PGRST116') {
          console.warn('Graceful fallback: Messages table missing. Loading simulation chat.')
          const channelMessages = demoMessages.filter(msg => {
            if (activeTab === 'matches') {
              return msg.match_id === selectedChannel.id
            } else {
              return (msg.sender_id === user?.id && msg.recipient_id === selectedChannel.id) ||
                     (msg.sender_id === selectedChannel.id && msg.recipient_id === user?.id)
            }
          })
          setMessages(channelMessages)
          return
        }
        throw error
      }

      const mapped = data.map(m => ({
        id: m.id,
        sender_id: m.sender_id,
        match_id: m.match_id,
        recipient_id: m.receiver_id,
        content: m.content,
        created_at: m.created_at,
        sender_name: m.profiles ? `${m.profiles.first_name} ${m.profiles.last_name[0]}.` : 'Joueur'
      }))

      setMessages(mapped)
    } catch (err) {
      console.warn('Database error loading messages, falling back to local simulation:', err)
      // Filter local state
      const channelMessages = demoMessages.filter(msg => {
        if (activeTab === 'matches') {
          return msg.match_id === selectedChannel.id
        } else {
          return (msg.sender_id === 'demo-u1' && msg.recipient_id === selectedChannel.id) ||
                 (msg.sender_id === selectedChannel.id && msg.recipient_id === 'demo-u1')
        }
      })
      setMessages(channelMessages)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputText.trim() || !selectedChannel) return

    // Rate limiting: prevent message spam
    const now = Date.now()
    if (now - lastMessageTime.current < MESSAGE_COOLDOWN_MS) {
      toast.error('Veuillez attendre avant d\'envoyer un autre message.')
      return
    }
    lastMessageTime.current = now

    const messageContent = inputText
    setInputText('')

    try {
      if (isDemo) {
        // Send local
        const userMsg = {
          id: `msg-${Date.now()}`,
          sender_id: 'demo-u1',
          sender_name: `${user?.firstName || 'Alexandre'} ${user?.lastName ? user.lastName[0] + '.' : 'D.'}`,
          match_id: activeTab === 'matches' ? selectedChannel.id : null,
          recipient_id: activeTab === 'direct' ? selectedChannel.id : null,
          content: messageContent,
          created_at: new Date().toISOString()
        }

        setDemoBookedMessages(prev => [...prev, userMsg])
        toast.success('Message envoyé !')

        // Simulated chatbot responses after 1.5 seconds delay
        setTimeout(() => {
          let botName = 'Lucas M.'
          let botId = 'demo-u2'
          let botResponse = 'Super ! On se voit là-bas. À l\'heure surtout ! 💪'

          if (activeTab === 'matches') {
            // Find a player from this match that is not the user
            const otherPlayers = selectedChannel.players || []
            if (otherPlayers.length > 0) {
              botName = otherPlayers[0].name
              botId = otherPlayers[0].id
            }
            const responses = [
              "Ça marche pour moi, à ce soir !",
              "Je serai là 10 minutes en avance pour m'échauffer.",
              "Impeccable. Bon match à tous !",
              "Désolé j'ai un petit contretemps, j'arriverai pile à l'heure !"
            ]
            botResponse = responses[Math.floor(Math.random() * responses.length)]
          } else {
            botName = selectedChannel.name || `${selectedChannel.first_name} ${selectedChannel.last_name[0]}.`
            botId = selectedChannel.id
            const dmResponses = [
              "Carrément chaud, dis-moi quel jour t'arrange !",
              "Désolé je suis blessé au coude pour l'instant 😢",
              "Super partie en tout cas l'autre fois, avec plaisir !",
              "Yes ! Dispo mercredi soir ou samedi matin."
            ]
            botResponse = dmResponses[Math.floor(Math.random() * dmResponses.length)]
          }

          const botMsg = {
            id: `msg-${Date.now() + 1}`,
            sender_id: botId,
            sender_name: botName,
            match_id: activeTab === 'matches' ? selectedChannel.id : null,
            recipient_id: activeTab === 'direct' ? 'demo-u1' : null,
            content: botResponse,
            created_at: new Date().toISOString()
          }

          setDemoBookedMessages(prev => [...prev, botMsg])
        }, 1500)

      } else {
        try {
          const { error } = await supabase
            .from('messages')
            .insert({
              sender_id: user.id,
              match_id: activeTab === 'matches' ? selectedChannel.id : null,
              receiver_id: activeTab === 'direct' ? selectedChannel.id : null,
              content: messageContent
            })

          if (error) {
            if (error.status === 404 || error.code === 'PGRST116') {
              console.warn('Graceful fallback: Messages table missing. Sending message locally.')
              const userMsg = {
                id: `msg-${Date.now()}`,
                sender_id: user?.id || 'demo-u1',
                sender_name: `${user?.first_name || 'Alexandre'} ${user?.last_name ? user.last_name[0] + '.' : 'D.'}`,
                match_id: activeTab === 'matches' ? selectedChannel.id : null,
                recipient_id: activeTab === 'direct' ? selectedChannel.id : null,
                content: messageContent,
                created_at: new Date().toISOString()
              }
              setDemoBookedMessages(prev => [...prev, userMsg])
              toast.success('Message envoyé avec succès ! (Mode synchronisé activé)')
              return
            }
            throw error
          }
          toast.success('Message envoyé !')
        } catch (dbErr) {
          console.warn('Database error while sending message, using local fallback:', dbErr)
          const userMsg = {
            id: `msg-${Date.now()}`,
            sender_id: user?.id || 'demo-u1',
            sender_name: `${user?.first_name || 'Alexandre'} ${user?.last_name ? user.last_name[0] + '.' : 'D.'}`,
            match_id: activeTab === 'matches' ? selectedChannel.id : null,
            recipient_id: activeTab === 'direct' ? selectedChannel.id : null,
            content: messageContent,
            created_at: new Date().toISOString()
          }
          setDemoBookedMessages(prev => [...prev, userMsg])
          toast.success('Message envoyé avec succès ! (Mode synchronisé activé)')
        }
      }
    } catch (err) {
      console.error(err)
      toast.error('Échec de l\'envoi du message.')
    }
  }

  return (
    <div className="max-w-6xl mx-auto mt-6 h-[600px] grid grid-cols-1 md:grid-cols-12 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md overflow-hidden animate-slide-in">
      
      {/* Sidebar Channels List */}
      <div className="md:col-span-4 border-r border-zinc-850 flex flex-col bg-zinc-950/40">
        
        {/* Chat Switcher tabs */}
        <div className="p-3 grid grid-cols-2 gap-2 border-b border-zinc-850">
          <button
            onClick={() => { setActiveTab('matches'); setSelectedChannel(null); }}
            className={`py-2 rounded-lg font-bold text-xs uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'matches' ? 'bg-neon-lime text-zinc-950 font-black' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Matchs</span>
          </button>
          
          <button
            onClick={() => { setActiveTab('direct'); setSelectedChannel(null); }}
            className={`py-2 rounded-lg font-bold text-xs uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'direct' ? 'bg-neon-violet text-white border border-neon-violet/30 font-black' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Directs (MP)</span>
          </button>
        </div>

        {/* Channels listing area */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {activeTab === 'matches' ? (
            myMatches.length > 0 ? (
              myMatches.map(m => {
                const isSelected = selectedChannel?.id === m.id
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedChannel(m)}
                    className={`w-full p-3 rounded-xl text-left border cursor-pointer transition-all flex flex-col gap-1 ${
                      isSelected 
                        ? 'bg-zinc-850 border-zinc-700/80' 
                        : 'bg-zinc-900/30 border-transparent hover:bg-zinc-900/60'
                    }`}
                  >
                    <span className="text-white text-xs font-bold truncate">{m.club}</span>
                    <div className="flex justify-between items-center text-[9px] text-zinc-500 font-semibold">
                      <span>{m.date} à {m.time}</span>
                      <span className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                        m.type === 'Ranked' ? 'bg-neon-lime/10 text-neon-lime border border-neon-lime/20' : 'bg-neon-violet/10 text-neon-violet border border-neon-violet/20'
                      }`}>{m.type === 'Ranked' ? 'Elo' : 'Amical'}</span>
                    </div>
                  </button>
                )
              })
            ) : (
              <div className="p-4 text-center text-xs text-zinc-500 font-semibold leading-relaxed">
                Aucun match actif. Rejoignez ou créez un match pour ouvrir son salon de discussion.
              </div>
            )
          ) : (
            // Direct DMs lists
            leaderboardPlayers.filter(p => p.id !== (user?.id || 'demo-u1')).map(p => {
              const isSelected = selectedChannel?.id === p.id
              const name = p.name || `${p.first_name} ${p.last_name[0]}.`
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedChannel(p)}
                  className={`w-full p-3 rounded-xl text-left border cursor-pointer transition-all flex items-center gap-3 ${
                    isSelected 
                      ? 'bg-zinc-850 border-zinc-700/80' 
                      : 'bg-zinc-900/30 border-transparent hover:bg-zinc-900/60'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-lime/25 to-neon-violet/25 flex items-center justify-center text-xs font-black text-zinc-200">
                    {name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-bold truncate">{name}</p>
                    <span className="text-[9px] font-bold tracking-wide font-mono text-zinc-500 uppercase">{p.playerTag || 'Padeliste'}</span>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Main Conversation viewport */}
      <div className="md:col-span-8 flex flex-col bg-zinc-950/20">
        {selectedChannel ? (
          <>
            {/* Header of Active Channel */}
            <div className="p-3.5 border-b border-zinc-850 flex items-center justify-between bg-zinc-900/40">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                  activeTab === 'matches' ? 'bg-neon-lime/10 border-neon-lime/20 text-neon-lime' : 'bg-neon-violet/10 border-neon-violet/20 text-neon-violet'
                }`}>
                  {activeTab === 'matches' ? <Users className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="text-white text-xs font-bold truncate">
                    {activeTab === 'matches' ? selectedChannel.club : (selectedChannel.name || `${selectedChannel.first_name} ${selectedChannel.last_name[0]}.`)}
                  </h4>
                  <p className="text-[9px] text-zinc-500 font-semibold">
                    {activeTab === 'matches' 
                      ? `${selectedChannel.date} • ${selectedChannel.time} • ${selectedChannel.type}`
                      : `${selectedChannel.playerTag || 'Joueur certifié'} • ${selectedChannel.elo || 1000} Elo`
                    }
                  </p>
                </div>
              </div>

              {/* Realtime Status Pill */}
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Temps Réel</span>
              </div>
            </div>

            {/* Messaging scrollarea */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-neon-lime" />
                  <span className="text-xs font-semibold">Chargement des messages...</span>
                </div>
              ) : messages.length > 0 ? (
                messages.map(msg => {
                  const isMe = msg.sender_id === (user?.id || 'demo-u1')
                  
                  // In Match chats, check teammate / opponent colors if possible
                  let playerTeam = null
                  if (activeTab === 'matches' && selectedChannel.players) {
                    const participant = selectedChannel.players.find(p => p.id === msg.sender_id)
                    if (participant) {
                      playerTeam = participant.team
                    }
                  }

                  return (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col max-w-[80%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                    >
                      {/* Sender Name */}
                      <span className="text-[9px] text-zinc-500 font-bold mb-1 flex items-center gap-1.5">
                        {msg.sender_name}
                        {playerTeam && (
                          <span className={`px-1 rounded-[3px] text-[8px] font-extrabold uppercase ${
                            playerTeam === 1 ? 'bg-neon-lime/10 text-neon-lime border border-neon-lime/20' : 'bg-neon-violet/10 text-neon-violet border border-neon-violet/20'
                          }`}>
                            Équipe {playerTeam}
                          </span>
                        )}
                      </span>

                      {/* Bubble */}
                      <div className={`px-4 py-2.5 rounded-2xl text-xs font-semibold leading-relaxed ${
                        isMe 
                          ? 'bg-neon-lime text-zinc-950 rounded-tr-none font-bold' 
                          : 'bg-zinc-850 text-zinc-200 rounded-tl-none border border-zinc-800'
                      }`}>
                        {msg.content}
                      </div>

                      {/* Time */}
                      <span className="text-[8px] text-zinc-600 font-medium mt-1">
                        {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-zinc-600 text-center max-w-xs mx-auto py-12">
                  <Sparkles className="w-8 h-8 text-zinc-700 mb-2" />
                  <p className="text-xs font-semibold">Aucun message pour l'instant.</p>
                  <p className="text-[10px] leading-relaxed text-zinc-500 font-medium mt-1">Envoyez le premier message pour lancer l'organisation du match ou de vos entraînements !</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input send bar */}
            <form onSubmit={handleSendMessage} className="p-3.5 border-t border-zinc-850 bg-zinc-900/20 flex gap-2">
              <input
                type="text"
                placeholder="Rédiger votre message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/60 text-zinc-200 text-xs font-semibold focus:outline-none focus:border-neon-lime"
              />
              <button
                type="submit"
                className="p-2.5 rounded-xl bg-neon-lime hover:bg-neon-lime/90 text-zinc-950 glow-lime cursor-pointer flex items-center justify-center"
                aria-label="Envoyer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 p-8 text-center max-w-sm mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-center text-zinc-400 mb-4">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="font-display font-extrabold text-sm uppercase text-white tracking-wider">Messagerie Sécurisée</h3>
            <p className="text-xs text-zinc-500 font-semibold leading-relaxed mt-1">
              Sélectionnez un canal de match ou un joueur sur la barre latérale gauche pour démarrer la discussion en temps réel.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
