import { useEffect } from 'react'
import { Sparkles, X } from 'lucide-react'

export default function GLHFNudgeModal({ onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-sm rounded-2xl bg-zinc-900 border-2 border-neon-lime shadow-[0_0_40px_rgba(163,230,53,0.15)] p-6 overflow-hidden text-center">
        {/* Glow backdrop */}
        <div className="absolute inset-0 bg-gradient-to-br from-neon-lime/10 to-transparent pointer-events-none" />
        
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-neon-lime/20 border border-neon-lime/40 flex items-center justify-center glow-lime">
            <Sparkles className="w-6 h-6 text-neon-lime" />
          </div>
        </div>

        <h2 className="font-display font-extrabold text-2xl text-zinc-100 tracking-wide mb-2 text-glow-lime">
          GLHF !
        </h2>
        <p className="text-sm text-zinc-300 leading-relaxed font-medium mb-6">
          Soyez fair-play, n'oubliez pas ce n'est que du sport. Bon match à vous ! 🎾
        </p>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-lg bg-neon-lime text-zinc-950 font-bold tracking-wide uppercase transition-transform hover:scale-[1.02] shadow-[0_0_15px_rgba(163,230,53,0.4)] cursor-pointer"
        >
          OK, C'EST PARTI !
        </button>
      </div>
    </div>
  )
}
