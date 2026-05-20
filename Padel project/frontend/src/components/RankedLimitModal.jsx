import { Crown, Lock, X, Zap } from 'lucide-react';

export default function RankedLimitModal({ onClose, onUpgrade }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-950/90 backdrop-blur-lg animate-fade-in px-4">
      <div className="relative w-full max-w-md bg-zinc-900 border-2 border-neon-violet/40 rounded-2xl p-8 shadow-2xl animate-slide-in overflow-hidden">
        
        {/* Glow decorations */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-neon-violet/10 rounded-full filter blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-neon-lime/5 rounded-full filter blur-[60px] pointer-events-none" />
        
        {/* Close */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-zinc-800 border border-zinc-700 hover:border-zinc-600 text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-neon-violet/10 border border-neon-violet/30 flex items-center justify-center glow-violet">
              <Lock className="w-8 h-8 text-neon-violet" />
            </div>
            <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-500 border-2 border-zinc-900 flex items-center justify-center animate-pulse">
              <span className="text-white text-[8px] font-black">!</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-center font-display font-extrabold text-2xl text-white uppercase tracking-tight mb-3">
          Limite mensuelle atteinte !
        </h2>

        {/* Message */}
        <p className="text-center text-zinc-400 text-sm leading-relaxed mb-8">
          Les membres <span className="text-zinc-200 font-semibold">Standard</span> sont limités à <span className="text-neon-lime font-bold">1 match Ranked par mois</span>. Passez <span className="text-neon-violet font-bold">Élite</span> pour jouer en illimité dès aujourd'hui.
        </p>

        {/* CTA */}
        <button 
          onClick={onUpgrade}
          className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl bg-gradient-to-r from-neon-violet to-neon-violet-deep text-white font-black uppercase tracking-widest text-sm transition-all hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] animate-pulse-button cursor-pointer"
        >
          <Crown className="w-5 h-5" />
          Passer au Statut Élite
        </button>

        {/* Subtext */}
        <p className="text-center text-zinc-600 text-[10px] mt-4 font-medium">
          À partir de 2,50 € / mois. Résiliation en un clic.
        </p>
      </div>
    </div>
  );
}
