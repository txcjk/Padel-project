import { X, Shield, Trophy, HeartHandshake, Swords, FileText, Scale, Sparkles } from 'lucide-react'
import { useState, useRef } from 'react'

export default function CGU({ onClose }) {
  const [activeArticle, setActiveArticle] = useState(null)
  
  const articles = [
    {
      id: 'art1',
      title: "Article 1 : Objet et Acceptation des CGU",
      icon: Scale,
      color: "lime",
      badge: "Légal",
      content: "Les présentes Conditions Générales d'Utilisation ont pour objet de définir les modalités d'accès et d'utilisation de l'Application. L'inscription et l'utilisation de l'Application impliquent l'acceptation sans réserve des présentes CGU par l'utilisateur."
    },
    {
      id: 'art2',
      title: "Article 2 : Le Système de Classement Équitable (Score Elo)",
      icon: Trophy,
      color: "violet",
      badge: "Compétition",
      content: [
        "elomatch repose sur un algorithme de classement compétitif appelé « Score Elo ».",
        "Chaque nouvel utilisateur commence avec un score par défaut de 1000 points.",
        "Les matchs définis comme « Ranked » (Classés) modifient le score Elo des participants à l'issue de la rencontre, selon les résultats saisis et validés par les joueurs.",
        "Les matchs définis comme « Amical » n'ont aucun impact sur le score Elo.",
        "Toute tentative de falsification des scores ou de triche entraînera une réinitialisation du score Elo ou un bannissement du profil."
      ]
    },
    {
      id: 'art3',
      title: "Article 3 : Politique anti-toxicité et Score de Fair-play",
      icon: HeartHandshake,
      color: "lime",
      badge: "Comportement",
      content: [
        "Afin de garantir une communauté saine, elomatch intègre un système de notation réciproque et asymétrique après chaque match. Les utilisateurs s'évaluent sur deux critères : la Ponctualité et le Comportement.",
        "Sécurité anti-vengeance : Les notes obtenues sont anonymisées et ne sont révélées qu'après un délai de 24 heures ou lorsque l'ensemble des 4 joueurs d'un match a soumis son évaluation.",
        "Seuil de restriction (Sanction automatique) : Tout utilisateur dont le Score de Fair-play (Trust Score) descend en dessous de 70% se verra automatiquement et temporairement suspendu des fonctionnalités compétitives, à savoir l'accès aux matchs « Ranked » et à la section d'urgence « LAST »."
      ]
    },
    {
      id: 'art4',
      title: "Article 4 : Règles spécifiques aux Matchs",
      icon: Swords,
      color: "violet",
      badge: "Règlement",
      content: [
        "Annulation d'urgence : L'annulation d'un match « Ranked » planifié n'est possible que si les quatre (4) joueurs inscrits valident unanimement la demande d'annulation via l'interface de vote. À défaut d'unanimité, le match est maintenu.",
        "Matchs inachevés (Temps imparti dépassé) : Si une rencontre ne peut aller à son terme (fin de la location du terrain par le club), les joueurs s'engagent à cocher la case « Match incomplet ». Le match sera automatiquement requalifié en mode « Amical » et n'affectera pas le score Elo. Une fonctionnalité de « Revanche » permettra de dupliquer la session pour une date ultérieure."
      ]
    },
    {
      id: 'art5',
      title: "Article 5 : Données Personnelles et Géolocalisation (RGPD)",
      icon: Shield,
      color: "lime",
      badge: "RGPD",
      content: [
        "L'Application collecte et traite des données personnelles (Nom, prénom, adresse e-mail) ainsi que des données de géolocalisation pour permettre le matchmaking par rayon géographique et le fonctionnement des alertes « LAST ».",
        "Les données sont stockées de manière sécurisée en Europe via notre infrastructure (Supabase).",
        "Conformément au Règlement Général sur la Protection des Données (RGPD), chaque utilisateur dispose d'un droit d'accès, de rectification et de suppression de ses données, accessible directement depuis les paramètres de son profil ou sur simple demande."
      ]
    }
  ]

  const articleRefs = useRef({})

  const scrollToArticle = (id) => {
    setActiveArticle(id)
    articleRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
      
      {/* Background glowing decorations inside modal */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-neon-lime/5 rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-neon-violet/5 rounded-full filter blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-5xl bg-zinc-900 border border-zinc-850 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.85)] flex flex-col h-[85vh] animate-slide-in">
        
        {/* Top colorful accent bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-neon-lime via-emerald-400 to-neon-violet" />

        {/* Modal Header */}
        <div className="p-6 md:p-8 bg-zinc-950/40 border-b border-zinc-850 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-neon-lime shadow-md shadow-neon-lime/5">
              <FileText className="w-5 h-5 text-neon-lime" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-display font-extrabold text-white tracking-wide uppercase">
                Conditions Générales d'Utilisation
              </h2>
              <p className="text-xs text-zinc-500 font-medium tracking-wide mt-0.5">
                Application <span className="text-neon-lime">elomatch</span> • En vigueur au 18 mai 2026
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-zinc-950/60 hover:bg-zinc-800 border border-zinc-850 flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition-all cursor-pointer shadow-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* LEFT SIDEBAR: Nav Quick Links */}
          <div className="w-full md:w-[28%] bg-zinc-950/50 p-6 border-b md:border-b-0 md:border-r border-zinc-850 flex md:flex-col gap-3 overflow-x-auto md:overflow-x-visible md:overflow-y-auto shrink-0 scrollbar-none">
            <div className="hidden md:block mb-3">
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-black">
                Sommaire
              </span>
            </div>
            {articles.map((art) => {
              const Icon = art.icon
              const isActive = activeArticle === art.id
              const colorClass = art.color === 'lime' 
                ? (isActive ? 'bg-neon-lime/10 border-neon-lime/30 text-neon-lime' : 'text-zinc-400 border-zinc-850/60 hover:text-zinc-200 hover:bg-zinc-900')
                : (isActive ? 'bg-neon-violet/10 border-neon-violet/30 text-neon-violet' : 'text-zinc-400 border-zinc-850/60 hover:text-zinc-200 hover:bg-zinc-900')
              return (
                <button
                  key={art.id}
                  onClick={() => scrollToArticle(art.id)}
                  className={`flex items-center gap-3 w-full text-left p-3 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer shrink-0 md:shrink ${colorClass}`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate md:whitespace-normal line-clamp-1 md:line-clamp-2 leading-relaxed">
                    {art.title.split(' : ')[0]}
                  </span>
                </button>
              )
            })}
            
            <div className="hidden md:flex flex-col mt-auto pt-6 border-t border-zinc-850/40 space-y-2">
              <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold">
                <Sparkles className="w-3.5 h-3.5 text-neon-lime" />
                <span>elomatch Competitive Hub</span>
              </div>
              <p className="text-[9px] text-zinc-600 leading-relaxed font-medium">
                Notre but est de garantir une expérience de jeu saine, équitable et hautement compétitive pour tous les joueurs.
              </p>
            </div>
          </div>

          {/* RIGHT PANELS: Scrolling Legal Copy */}
          <div className="flex-1 p-6 md:p-8 overflow-y-auto space-y-8 bg-zinc-900/30">
            
            {/* Introduction Box */}
            <div className="p-5 bg-gradient-to-br from-zinc-950/80 to-zinc-950/40 border border-zinc-850 rounded-2xl relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-neon-lime/5 rounded-full filter blur-2xl pointer-events-none" />
              <p className="text-zinc-300 text-sm leading-relaxed font-medium">
                Bienvenue sur <strong className="text-white">elomatch</strong> (ci-après « l'Application »), l'application de matchmaking compétitif dédiée aux sports de raquette (Padel). L'utilisation de notre plateforme est soumise au respect des présentes CGU.
              </p>
            </div>

            {/* Articles Blocks */}
            <div className="space-y-6">
              {articles.map((art) => {
                const Icon = art.icon
                const isLime = art.color === 'lime'
                const themeColor = isLime ? 'text-neon-lime border-neon-lime/20 bg-neon-lime/10' : 'text-neon-violet border-neon-violet/20 bg-neon-violet/10'
                const highlightBorder = isLime ? 'focus-within:border-neon-lime/30' : 'focus-within:border-neon-violet/30'
                return (
                  <div
                    key={art.id}
                    ref={(el) => (articleRefs.current[art.id] = el)}
                    className={`p-6 bg-zinc-950/40 hover:bg-zinc-950/70 border border-zinc-850 rounded-2xl transition-all duration-300 ${highlightBorder}`}
                  >
                    <div className="flex flex-wrap items-center gap-2.5 mb-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${themeColor} border`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <h3 className="font-display font-extrabold text-base md:text-lg text-zinc-100 uppercase tracking-wide flex-1 min-w-[200px]">
                        {art.title}
                      </h3>
                      <span className={`text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded border ${themeColor}`}>
                        {art.badge}
                      </span>
                    </div>

                    <div className="space-y-3 pl-0 md:pl-10">
                      {Array.isArray(art.content) ? (
                        <ul className="space-y-3">
                          {art.content.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2.5 text-zinc-300 text-sm leading-relaxed font-medium">
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-2 ${isLime ? 'bg-neon-lime' : 'bg-neon-violet'}`} />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-zinc-300 text-sm leading-relaxed font-medium">
                          {art.content}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-zinc-950/50 border-t border-zinc-850 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] text-zinc-500 font-bold tracking-wider uppercase">
            elomatch © 2026 — Tous droits réservés
          </p>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-neon-lime text-zinc-950 font-display font-black text-xs uppercase tracking-widest transition-all duration-300 hover:bg-lime-400 hover:shadow-[0_0_20px_rgba(163,230,53,0.3)] hover:scale-[1.02] cursor-pointer"
          >
            J'AI COMPRIS ET J'ACCEPTE
          </button>
        </div>

      </div>
    </div>
  )
}
