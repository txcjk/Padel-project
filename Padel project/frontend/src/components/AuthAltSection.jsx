import { Zap } from 'lucide-react';

/**
 * Section OAuth et Mode Démo pour l'écran d'authentification.
 */
export default function AuthAltSection({ onGoogleLogin, onDemoLogin, loading }) {
  return (
    <div className="space-y-3">
      {/* Bouton Google */}
      <button
        onClick={onGoogleLogin}
        type="button"
        disabled={loading}
        className="w-full py-3 rounded-xl bg-white text-zinc-900 text-sm font-bold tracking-wide hover:bg-zinc-100 transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 shadow-sm"
        aria-label="Continuer avec Google"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continuer avec Google
      </button>

      <div className="text-center pt-2">
        <p className="text-[11px] text-zinc-500 mb-2">
          Vous souhaitez simplement tester l'interface utilisateur ?
        </p>
      </div>
      
      <button
        onClick={onDemoLogin}
        className="w-full py-3 rounded-xl bg-zinc-950/40 border border-neon-violet/30 text-neon-violet text-xs font-bold tracking-wide hover:border-neon-violet/60 hover:bg-neon-violet/5 transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5"
        aria-label="Activer le mode démo sans configuration"
      >
        <Zap className="w-3.5 h-3.5 text-neon-violet animate-pulse" />
        MODE DÉMO RAPIDE (Sans configuration)
      </button>

      {/* Support Notice */}
      <p className="text-[10px] text-zinc-500 text-center leading-relaxed pt-2">
        Besoin d'aide avec votre compte ? Écrivez-nous à{' '}
        <a 
          href="mailto:support@elomatch.app" 
          className="text-zinc-400 hover:text-neon-lime transition-colors font-medium cursor-pointer"
        >
          support@elomatch.app
        </a>
      </p>
    </div>
  );
}
