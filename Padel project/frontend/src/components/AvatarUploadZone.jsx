import { User, Camera, Loader2 } from 'lucide-react';

/**
 * Zone d'upload avatar réutilisable.
 * Utilisé par OnboardingForm et EditProfileModal.
 */
export default function AvatarUploadZone({ 
  avatar, 
  uploading, 
  error, 
  onAvatarClick, 
  fileInputRef, 
  onFileChange,
  size = 'lg' // 'lg' pour onboarding, 'md' pour edit modal
}) {
  const sizeClasses = {
    lg: 'w-24 h-24 sm:w-28 sm:h-28',
    md: 'w-20 h-20'
  };

  const iconSizes = {
    lg: { camera: 'w-5 h-5', user: 'w-5 h-5', spinner: 'w-6 h-6', text: 'text-[8px]' },
    md: { camera: 'w-4 h-4', user: 'w-4 h-4', spinner: 'w-5 h-5', text: 'text-[7px]' }
  };

  const s = iconSizes[size];

  return (
    <div className="flex flex-col items-center justify-center py-2 animate-fade-in">
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        accept="image/*"
        className="hidden"
      />
      
      <div 
        onClick={onAvatarClick}
        className={`relative ${sizeClasses[size]} rounded-full border-2 border-dashed border-zinc-800 hover:border-neon-violet bg-zinc-950/60 transition-all duration-300 flex items-center justify-center cursor-pointer group overflow-hidden shadow-inner focus:outline-none`}
      >
        {/* Glow au hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-neon-violet/0 to-neon-violet/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute -inset-0.5 rounded-full bg-neon-violet/10 opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300" />

        {avatar ? (
          <>
            <img 
              src={avatar} 
              alt="Avatar Preview" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-1">
              <Camera className={s.camera + " text-neon-violet"} />
              <span className={s.text + " uppercase tracking-wider font-bold text-zinc-300"}>Modifier</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-3 space-y-1.5 select-none">
            <div className={`w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:border-neon-violet/40 transition-colors`}>
              <User className={s.user + " text-zinc-500 group-hover:text-neon-violet transition-colors"} />
            </div>
            <span className={s.text + " font-black uppercase tracking-wider text-zinc-500 group-hover:text-neon-violet transition-colors leading-normal"}>
              Ajouter une photo
            </span>
          </div>
        )}

        {/* Spinner upload */}
        {uploading && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-[1px]">
            <Loader2 className={s.spinner + " text-neon-violet animate-spin"} />
          </div>
        )}
      </div>

      {/* Erreur */}
      {error && (
        <span className="text-[10px] text-red-400 font-semibold mt-2 text-center leading-relaxed">
          {error}
        </span>
      )}
      
      {/* Hint format */}
      {!avatar && !error && (
        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-2 select-none">
          Format recommandé : Carré (PNG, JPG)
        </span>
      )}
    </div>
  );
}
