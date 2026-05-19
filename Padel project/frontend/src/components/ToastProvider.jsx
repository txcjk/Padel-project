import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

/**
 * ToastProvider — Système de notification global pour elomatch.
 * Remplace tous les alert() natifs par des toasts modernes
 * avec l'esthétique Dark/Neon du design system.
 * 
 * Usage :
 *   const toast = useToast()
 *   toast.success("Match sauvé avec succès !")
 *   toast.error("Impossible de rejoindre le match.")
 *   toast.info("Score en attente de consensus.")
 */

const ToastContext = createContext(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}

// Auto-incrementing ID
let toastIdCounter = 0

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timersRef = useRef({})

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t))
    // Remove from DOM after exit animation
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 350)
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id])
      delete timersRef.current[id]
    }
  }, [])

  const addToast = useCallback((message, type = 'success', duration = 4500) => {
    const id = ++toastIdCounter
    setToasts(prev => [...prev, { id, message, type, exiting: false }])
    timersRef.current[id] = setTimeout(() => removeToast(id), duration)
    return id
  }, [removeToast])

  const success = useCallback((msg) => addToast(msg, 'success'), [addToast])
  const error = useCallback((msg) => addToast(msg, 'error', 6000), [addToast])
  const info = useCallback((msg) => addToast(msg, 'info'), [addToast])

  const contextValue = { success, error, info }

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      {/* ─── Toast Container (top-right, stacked) ─── */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none max-w-[min(420px,calc(100vw-2rem))]">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

/* ─── Individual Toast Component ─── */
function ToastItem({ toast, onDismiss }) {
  const isSuccess = toast.type === 'success'
  const isError = toast.type === 'error'
  // info by default

  // Styling per type
  const config = isSuccess
    ? {
        border: 'border-neon-lime/40',
        bg: 'bg-zinc-950/95',
        icon: <CheckCircle2 className="w-5 h-5 text-neon-lime shrink-0" />,
        textColor: 'text-neon-lime',
        glow: 'shadow-[0_0_25px_rgba(163,230,53,0.15),0_0_60px_rgba(163,230,53,0.06)]',
        progressColor: 'bg-neon-lime/60',
      }
    : isError
    ? {
        border: 'border-red-500/40',
        bg: 'bg-zinc-950/95',
        icon: <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />,
        textColor: 'text-red-400',
        glow: 'shadow-[0_0_25px_rgba(239,68,68,0.15),0_0_60px_rgba(239,68,68,0.06)]',
        progressColor: 'bg-red-500/60',
      }
    : {
        border: 'border-neon-violet/40',
        bg: 'bg-zinc-950/95',
        icon: <Info className="w-5 h-5 text-neon-violet shrink-0" />,
        textColor: 'text-neon-violet',
        glow: 'shadow-[0_0_25px_rgba(168,85,247,0.15),0_0_60px_rgba(168,85,247,0.06)]',
        progressColor: 'bg-neon-violet/60',
      }

  const animClass = toast.exiting ? 'toast-exit' : 'toast-enter'

  return (
    <div
      className={`pointer-events-auto relative flex items-start gap-3 px-5 py-4 rounded-2xl border backdrop-blur-xl ${config.bg} ${config.border} ${config.glow} ${animClass}`}
      role="alert"
    >
      {/* Icon */}
      <div className="mt-0.5">{config.icon}</div>

      {/* Message */}
      <p className={`text-sm font-semibold leading-relaxed ${config.textColor} flex-1`}>
        {toast.message}
      </p>

      {/* Close button */}
      <button
        onClick={onDismiss}
        className="p-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors cursor-pointer shrink-0"
        aria-label="Fermer"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-zinc-800/50 overflow-hidden">
        <div
          className={`h-full ${config.progressColor} rounded-full`}
          style={{
            animation: `toast-progress ${toast.type === 'error' ? '6s' : '4.5s'} linear forwards`,
          }}
        />
      </div>
    </div>
  )
}
