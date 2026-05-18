import React, { useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import PlayerCard from './PlayerCard';
import { X, User, MapPin, Compass, Globe, Camera, Loader2, Save } from 'lucide-react';

export default function EditProfileModal({ user, onClose, onSave }) {
  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');
  const [city, setCity] = useState(user.city || '');
  const [country, setCountry] = useState(user.country || 'France');
  const [travelRadius, setTravelRadius] = useState(user.travelRadius || 30);
  const [dominantHand, setDominantHand] = useState(user.hand || 'Droitier');
  const [playStyle, setPlayStyle] = useState(user.playStyle || 'Stratège');
  const [mainClub, setMainClub] = useState(user.club || '');
  
  // Avatar states
  const [avatarUrl, setAvatarUrl] = useState(user.avatar || '');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    setAvatarPreview(preview);
    setUploadingAvatar(true);
    setAvatarError(null);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to Supabase Storage bucket 'avatars'
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true,
          cacheControl: '3600'
        });

      if (uploadError) throw uploadError;

      // Get Public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(data.publicUrl);
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setAvatarError("Erreur lors du chargement de l'image. Veuillez réessayer.");
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
    }
  };

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
          avatar_url: avatarUrl
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Call onSave prop with updated fields format to update parent App.jsx UI state
      onSave({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        city: city.trim(),
        country: country.trim(),
        club: mainClub.trim(),
        hand: dominantHand,
        playStyle: playStyle,
        avatar: avatarUrl,
        playerTag: user.playerTag
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Une erreur est survenue lors de la sauvegarde.');
    } finally {
      setLoading(false);
    }
  };

  // Live FIFA card preview object
  const previewUser = {
    firstName: firstName.trim() || 'Prénom',
    lastName: lastName.trim() || 'Nom',
    elo: user.elo || 1000,
    rank: user.rank || { label: 'Bronze', color: 'bronze' },
    playStyle: playStyle,
    hand: dominantHand,
    avatar: avatarPreview || avatarUrl || null,
    club: mainClub.trim() || 'Mon Club Principal',
    playerTag: user.playerTag || '',
    globalRank: user.globalRank || 12,
    fairPlay: user.fairPlay || 100,
    punctuality: user.punctuality || 100,
    matchesSaved: user.matchesSaved || 0
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
      
      {/* Outer panel with neon dual gradients */}
      <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(139,92,246,0.15)] flex flex-col md:flex-row animate-scale-up max-h-[90vh] md:max-h-none overflow-y-auto md:overflow-y-visible">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-zinc-950/60 border border-zinc-850 flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* LEFT COLUMN: FIFA CARD PREVIEW (Desktop only) */}
        <div className="hidden md:flex w-[38%] bg-zinc-950 border-r border-zinc-800/40 p-8 flex-col justify-center items-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] opacity-20 pointer-events-none" />
          
          <div className="text-center space-y-1 mb-6 z-10">
            <h3 className="font-display font-black text-xs uppercase tracking-widest text-zinc-500">Aperçu en Direct</h3>
            <p className="text-[9px] text-zinc-600 font-bold uppercase">Les changements se reflètent sur votre Player Card</p>
          </div>

          <div className="relative hover:rotate-1 transition-transform duration-500 z-10 w-full flex justify-center scale-95">
            <PlayerCard user={previewUser} />
          </div>
        </div>

        {/* RIGHT COLUMN: EDIT FORM */}
        <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto max-h-[80vh] md:max-h-[85vh]">
          
          <div>
            <div className="space-y-1 mb-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-neon-violet/10 text-neon-violet border border-neon-violet/20 tracking-wider">
                  Profil Joueur
                </span>
                {user.playerTag && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 tracking-wider font-mono">
                    {user.playerTag} (Lecture Seule)
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-display font-extrabold text-white uppercase tracking-wide mt-2">
                Modifier ma Player Card
              </h2>
            </div>

            {error && (
              <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold leading-relaxed animate-fade-in">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Avatar Zone inside Form */}
              <div className="flex flex-col items-center py-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  className="hidden"
                />
                
                <div 
                  onClick={handleAvatarClick}
                  className="relative w-20 h-20 rounded-full border-2 border-dashed border-zinc-800 hover:border-neon-violet bg-zinc-950/60 transition-all duration-300 flex items-center justify-center cursor-pointer group overflow-hidden shadow-inner focus:outline-none"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-neon-violet/0 to-neon-violet/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {previewUser.avatar ? (
                    <>
                      <img 
                        src={previewUser.avatar} 
                        alt="Avatar Preview" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-0.5">
                        <Camera className="w-4 h-4 text-neon-violet" />
                        <span className="text-[8px] uppercase tracking-wider font-bold text-zinc-300">Modifier</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-2 space-y-1 select-none">
                      <User className="w-4 h-4 text-zinc-500 group-hover:text-neon-violet transition-colors" />
                      <span className="text-[7px] font-black uppercase tracking-wider text-zinc-500 group-hover:text-neon-violet transition-colors leading-none">
                        Ajouter
                      </span>
                    </div>
                  )}

                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-neon-violet animate-spin" />
                    </div>
                  )}
                </div>

                {avatarError && (
                  <span className="text-[9px] text-red-400 font-semibold mt-1.5 text-center">
                    {avatarError}
                  </span>
                )}
              </div>

              {/* Identity Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold">Prénom</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-zinc-950/60 border border-zinc-800/80 focus:border-neon-lime/50 rounded-xl py-2 px-3 text-sm text-zinc-100 focus:outline-none transition-all"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold">Nom</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-zinc-950/60 border border-zinc-800/80 focus:border-neon-lime/50 rounded-xl py-2 px-3 text-sm text-zinc-100 focus:outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Geographic Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold">Ville</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-650" />
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-zinc-950/60 border border-zinc-800/80 focus:border-neon-lime/50 rounded-xl py-2 pl-9 pr-3 text-sm text-zinc-100 focus:outline-none transition-all"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold">Pays</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-650" />
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="ex: France"
                      className="w-full bg-zinc-950/60 border border-zinc-800/80 focus:border-neon-lime/50 rounded-xl py-2 pl-9 pr-3 text-sm text-zinc-100 focus:outline-none transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Club de Padel principal */}
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold">Club de Padel principal</label>
                <div className="relative">
                  <Compass className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-650" />
                  <input
                    type="text"
                    value={mainClub}
                    onChange={(e) => setMainClub(e.target.value)}
                    className="w-full bg-zinc-950/60 border border-zinc-800/80 focus:border-neon-lime/50 rounded-xl py-2 pl-9 pr-3 text-sm text-zinc-100 focus:outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Travel radius */}
              <div className="space-y-1.5 bg-zinc-950/30 p-3 rounded-xl border border-zinc-800/40">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold">Rayon de déplacement max</label>
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

              {/* Lateral & Style preference */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold">Préférence Latérale</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['Droitier', 'Gaucher'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setDominantHand(opt)}
                        className={`py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border cursor-pointer transition-all ${dominantHand === opt ? 'bg-neon-lime/10 border-neon-lime text-neon-lime' : 'bg-zinc-950/40 border-zinc-800/80 text-zinc-500 hover:text-zinc-300'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold">Style de Jeu</label>
                  <div className="grid grid-cols-3 gap-1">
                    {['Attaquant', 'Défenseur', 'Stratège'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setPlayStyle(opt)}
                        className={`py-1.5 px-0.5 rounded-xl text-[8px] sm:text-[9px] font-bold uppercase tracking-wide border cursor-pointer transition-all ${playStyle === opt ? 'bg-neon-violet/10 border-neon-violet text-neon-violet' : 'bg-zinc-950/40 border-zinc-800/80 text-zinc-500 hover:text-zinc-300'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Save CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-neon-violet-deep to-neon-violet hover:from-neon-violet hover:to-neon-violet-deep text-white text-xs font-black uppercase tracking-wider transition-all duration-300 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Sauvegarder les modifications
                  </>
                )}
              </button>

            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
