import React, { useState, useRef, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import PlayerCard from './PlayerCard';
import AvatarUploadZone from './AvatarUploadZone';
import { useAvatarUpload } from '../hooks/useAvatarUpload';
import { Zap, MapPin, Compass, ShieldCheck, ArrowRight, Globe } from 'lucide-react';

export default function OnboardingForm({ user, onComplete }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [city, setCity] = useState('');
  const [travelRadius, setTravelRadius] = useState(30);
  const [dominantHand, setDominantHand] = useState('Droitier');
  const [playStyle, setPlayStyle] = useState('Stratège');
  const [mainClub, setMainClub] = useState('');
  const [country, setCountry] = useState('France');
  
  // Ref stable pour le numéro aléatoire — ne change pas à chaque render
  const tagNumberRef = useRef(Math.floor(Math.random() * 9000) + 1000);
  const prevFirstNameRef = useRef('');

  // Génération stable du playerTag — dépend uniquement de firstName et user
  const playerTag = useMemo(() => {
    // Si l'utilisateur a déjà un tag, l'utiliser
    if (user?.playerTag) return user.playerTag;
    // Si pas de prénom, pas de tag
    if (!firstName.trim()) return '';
    // Si le prénom change, régénérer le numéro
    if (firstName.trim() !== prevFirstNameRef.current) {
      tagNumberRef.current = Math.floor(Math.random() * 9000) + 1000;
      prevFirstNameRef.current = firstName.trim();
    }
    return `${firstName.trim()}#${tagNumberRef.current}`;
  }, [firstName, user?.playerTag]);
  
  // Avatar upload hook
  const avatar = useAvatarUpload(user?.id, user?.avatar_url);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !city.trim() || !mainClub.trim()) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          city: city.trim(),
          country: country.trim(),
          max_radius_km: parseInt(travelRadius),
          hand: dominantHand,
          play_style: playStyle,
          club: mainClub.trim(),
          avatar_url: avatar.avatarUrl,
          player_tag: playerTag,
          elo_rating: 1000,
          fair_play_score: 100,
          punctuality_rate: 100,
          matches_saved_count: 0
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Notify App.jsx with local fields format
      onComplete({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        city: city.trim(),
        country: country.trim(),
        club: mainClub.trim(),
        hand: dominantHand,
        playStyle: playStyle,
        avatar: avatar.avatarUrl,
        playerTag: playerTag,
        elo: 1000,
        rank: { label: 'Bronze', color: 'bronze' },
        fairPlay: 100,
        punctuality: 100,
        matchesSaved: 0
      });
    } catch (err) {
      setError(err.message || 'Une erreur est survenue lors de la création de votre carte.');
    } finally {
      setLoading(false);
    }
  };

  // Preview object passed to the Fifa-style PlayerCard (memoized)
  const previewUser = useMemo(() => ({
    firstName: firstName.trim() || 'Prénom',
    lastName: lastName.trim() || 'Nom',
    elo: 1000,
    rank: { label: 'Bronze', color: 'bronze' },
    playStyle: playStyle,
    hand: dominantHand,
    avatar: avatar.currentAvatar,
    club: mainClub.trim() || 'Mon Club Principal',
    country: country.trim(),
    playerTag: playerTag,
    globalRank: 12,
    fairPlay: 100,
    punctuality: 100,
    matchesSaved: 0
  }), [firstName, lastName, playStyle, dominantHand, avatar.currentAvatar, mainClub, country, playerTag]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans font-display-wrapper">
      {/* Background decorations */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-violet/10 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-lime/5 rounded-full filter blur-[120px] pointer-events-none" />

      {/* Main Glassmorphic Panel */}
      <div className="relative w-full max-w-5xl bg-zinc-900/60 border border-zinc-800/80 rounded-3xl overflow-hidden backdrop-blur-2xl shadow-2xl flex flex-col lg:flex-row items-stretch animate-slide-in">
        
        {/* LEFT COLUMN: FORM */}
        <div className="flex-1 p-8 sm:p-10 flex flex-col justify-between space-y-6">
          
          {/* Header Title */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon-lime/10 border border-neon-lime/30 text-neon-lime text-[10px] font-black uppercase tracking-widest">
              <Zap className="w-3.5 h-3.5 animate-pulse" />
              Étape Finale
            </div>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight uppercase">
              Créez votre <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-lime to-emerald-400">Player Card</span>
            </h1>
            <p className="text-zinc-400 text-sm font-medium">
              Complétez vos attributs compétitifs pour débloquer votre accès au matchmaking et afficher votre style de jeu.
            </p>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold leading-relaxed animate-fade-in">
                {error}
              </div>
            )}

            {playerTag && (
              <div className="p-4 rounded-2xl bg-neon-lime/5 border border-neon-lime/20 text-neon-lime text-xs font-semibold leading-relaxed animate-fade-in flex flex-col items-center text-center gap-1.5 shadow-[0_0_20px_rgba(204,255,0,0.05)]">
                <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500">ID Joueur Unique</span>
                <span className="text-xl font-black font-display text-white tracking-wide">{playerTag}</span>
                <p className="text-[10px] text-zinc-400 font-medium">
                  Voici votre ID unique elomatch. Partagez-le avec vos partenaires pour qu'ils vous trouvent instantanément.
                </p>
              </div>
            )}

            {/* Avatar Upload Zone */}
            <AvatarUploadZone
              avatar={avatar.currentAvatar}
              uploading={avatar.uploading}
              error={avatar.error}
              onAvatarClick={avatar.handleClick}
              fileInputRef={avatar.fileInputRef}
              onFileChange={avatar.handleFileChange}
              size="lg"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Prénom */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Prénom</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-zinc-600" />
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="ex: Alexandre"
                    className="w-full bg-zinc-950/60 border border-zinc-800/80 focus:border-neon-lime/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Nom */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Nom</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-zinc-600" />
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="ex: Dupont"
                    className="w-full bg-zinc-950/60 border border-zinc-800/80 focus:border-neon-lime/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Ville */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Ville</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-zinc-600" />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="ex: Bordeaux"
                    className="w-full bg-zinc-950/60 border border-zinc-800/80 focus:border-neon-lime/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Pays */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Pays</label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-3 w-4 h-4 text-zinc-600" />
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="ex: France"
                    className="w-full bg-zinc-950/60 border border-zinc-800/80 focus:border-neon-lime/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Club de Padel principal */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Club de Padel principal</label>
              <div className="relative">
                <Compass className="absolute left-3.5 top-3 w-4 h-4 text-zinc-600" />
                <input
                  type="text"
                  value={mainClub}
                  onChange={(e) => setMainClub(e.target.value)}
                  placeholder="ex: 4Padels Bordeaux"
                  className="w-full bg-zinc-950/60 border border-zinc-800/80 focus:border-neon-lime/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none transition-all"
                  required
                />
              </div>
            </div>

            {/* Slider: Rayon max de déplacement */}
            <div className="space-y-2 bg-zinc-950/30 p-4 rounded-2xl border border-zinc-800/40">
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Rayon de déplacement max</label>
                <span className="text-xs font-black text-neon-lime tracking-wide">{travelRadius} km</span>
              </div>
              <input 
                type="range" 
                min="5" 
                max="100" 
                step="5"
                value={travelRadius}
                onChange={(e) => setTravelRadius(e.target.value)}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-neon-lime focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Lateral Preference */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Préférence Latérale</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Droitier', 'Gaucher'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setDominantHand(opt)}
                      className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wider border cursor-pointer transition-all ${dominantHand === opt ? 'bg-neon-lime/10 border-neon-lime text-neon-lime' : 'bg-zinc-950/40 border-zinc-800/80 text-zinc-500 hover:text-zinc-300'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Play style */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Style de Jeu</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Attaquant', 'Défenseur', 'Stratège'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setPlayStyle(opt)}
                      className={`py-2 px-1 rounded-xl text-[10px] font-bold uppercase tracking-wide border cursor-pointer transition-all ${playStyle === opt ? 'bg-neon-violet/10 border-neon-violet text-neon-violet' : 'bg-zinc-950/40 border-zinc-800/80 text-zinc-500 hover:text-zinc-300'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Validation CTA */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-4 rounded-xl bg-gradient-to-r from-neon-violet-deep to-neon-violet hover:from-neon-violet hover:to-neon-violet-deep text-white text-sm font-black uppercase tracking-wider transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>
                  Valider ma Player Card
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Disclaimer */}
          <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase tracking-wide">
            <ShieldCheck className="w-4 h-4 text-zinc-400" />
            <span>Votre classement commence par défaut à 1000 Elo et 100% de Fair-Play.</span>
          </div>

        </div>

        {/* RIGHT COLUMN: REAL-TIME PLAYER CARD PREVIEW */}
        <div className="hidden lg:flex w-2/5 bg-zinc-950 border-l border-zinc-800/40 p-8 flex-col justify-center items-center relative overflow-hidden">
          {/* Subtle grid patterns */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />
          
          <div className="text-center space-y-1 mb-8 z-10">
            <h3 className="font-display font-black text-xs uppercase tracking-widest text-zinc-500">Aperçu en Temps Réel</h3>
            <p className="text-[10px] text-zinc-600 font-bold uppercase">Votre carte sera visible sur les leaderboards publics</p>
          </div>

          <div className="relative hover:rotate-2 transition-transform duration-500 z-10 w-full flex justify-center">
            <PlayerCard user={previewUser} />
          </div>
        </div>

      </div>
    </div>
  );
}
