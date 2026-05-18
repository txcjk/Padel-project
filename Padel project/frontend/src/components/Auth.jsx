import { useState } from 'react'
import { supabase, isConfigured } from '../supabaseClient'
import { Zap, Mail, Lock, User, MapPin, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react'
import CGU from './CGU'

export default function Auth({ onDemoLogin }) {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showCGU, setShowCGU] = useState(false)

  // Form inputs
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [city, setCity] = useState('')

  const handleGoogleLogin = async () => {
    setError(null)
    setLoading(true)
    if (!isConfigured) {
      setError("Supabase n'est pas configuré. Veuillez utiliser le Mode Démo Rapide.")
      setLoading(false)
      return
    }
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      })
      if (error) throw error
    } catch (err) {
      setError(err.message || "Erreur lors de la connexion Google.")
      setLoading(false)
    }
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!isConfigured) {
      setError("Supabase n'est pas configuré. Veuillez utiliser le 'Mode Démo Rapide' ci-dessous pour tester l'application.")
      setLoading(false)
      return
    }

    try {
      if (isLogin) {
        // Sign In
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError
      } else {
        // Sign Up
        if (!firstName || !lastName || !city) {
          throw new Error('Veuillez remplir tous les champs du profil.')
        }

        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            redirectTo: window.location.origin,
            data: {
              first_name: firstName,
              last_name: lastName,
              city: city,
            },
          },
        })
        if (signUpError) throw signUpError
        setError("Inscription réussie ! Veuillez vérifier votre boîte mail pour confirmer votre compte (si activé dans Supabase) ou connectez-vous.")
        setIsLogin(true)
      }
    } catch (err) {
      setError(err.message || "Une erreur est survenue lors de l'authentification.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background glowing decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-lime/5 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-violet/5 rounded-full filter blur-[120px] pointer-events-none" />

      {/* Main card */}
      <div className="relative w-full max-w-md bg-zinc-900/80 border border-zinc-800/80 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden animate-slide-in">
        {/* Top colorful accent bar */}
        <div className="h-1 bg-gradient-to-r from-neon-lime via-emerald-400 to-neon-violet" />

        <div className="p-8 space-y-6">
          {/* Logo / Title */}
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-lime to-neon-lime-dim flex items-center justify-center glow-lime">
              <Zap className="w-6 h-6 text-zinc-950" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <h1 className="font-display font-extrabold text-2xl tracking-tight text-zinc-100 lowercase">
                elo<span className="text-neon-lime">match</span>
              </h1>
              <span className="text-[10px] tracking-[0.25em] text-zinc-500 uppercase font-medium mt-0.5">
                Competitive Hub
              </span>
            </div>
          </div>

          {/* Login/Register Tabs */}
          <div className="flex bg-zinc-950/60 p-1 rounded-xl border border-zinc-800/40">
            <button
              onClick={() => { setIsLogin(true); setError(null) }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-200 ${
                isLogin
                  ? 'bg-zinc-800 text-zinc-100 shadow-md border border-zinc-700/30'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Connexion
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(null) }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-200 ${
                !isLogin
                  ? 'bg-zinc-800 text-zinc-100 shadow-md border border-zinc-700/30'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Inscription
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs leading-relaxed animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Profile fields for SignUp */}
            {!isLogin && (
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium">Prénom</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Alexandre"
                        className="w-full bg-zinc-950/60 border border-zinc-800/60 focus:border-neon-lime/50 rounded-xl py-2.5 pl-3 pr-4 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none transition-all"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium">Nom</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Dupont"
                        className="w-full bg-zinc-950/60 border border-zinc-800/60 focus:border-neon-lime/50 rounded-xl py-2.5 pl-3 pr-4 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none transition-all"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium">Ville</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-zinc-600" />
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Bordeaux"
                      className="w-full bg-zinc-950/60 border border-zinc-800/60 focus:border-neon-lime/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none transition-all"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium">Adresse Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-600" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alexandre.dupont@email.com"
                  className="w-full bg-zinc-950/60 border border-zinc-800/60 focus:border-neon-lime/50 rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none transition-all"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-600" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-zinc-950/60 border border-zinc-800/60 focus:border-neon-lime/50 rounded-xl py-3 pl-10 pr-10 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-neon-lime to-emerald-500 text-zinc-950 text-sm font-bold tracking-wide transition-all duration-300 hover:shadow-lg hover:shadow-neon-lime/20 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 rounded-full border-2 border-zinc-950 border-t-transparent animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Se Connecter' : "Créer mon Compte"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {!isLogin && (
              <p className="text-[10px] text-zinc-500 text-center leading-relaxed mt-2">
                En créant un compte, vous acceptez nos{' '}
                <button
                  type="button"
                  onClick={() => setShowCGU(true)}
                  className="text-neon-lime hover:underline font-bold focus:outline-none cursor-pointer"
                >
                  Conditions Générales d'Utilisation (CGU)
                </button>
                .
              </p>
            )}
          </form>

          {/* Divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-zinc-800/60"></div>
            <span className="flex-shrink mx-3 text-[10px] text-zinc-600 uppercase tracking-widest font-bold">OU</span>
            <div className="flex-grow border-t border-zinc-800/60"></div>
          </div>

          {/* Demo Login Mode */}
          <div className="space-y-3">
            {/* Bouton Google */}
            <button
              onClick={handleGoogleLogin}
              type="button"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-white text-zinc-900 text-sm font-bold tracking-wide hover:bg-zinc-100 transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 shadow-sm"
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
            >
              <Zap className="w-3.5 h-3.5 text-neon-violet animate-pulse" />
              MODE DÉMO RAPIDE (Sans configuration)
            </button>

            {/* Support Notice */}
            <p className="text-[10px] text-zinc-500 text-center leading-relaxed pt-2">
              Besoin d'aide avec votre compte ? Écrivez-nous à{' '}
              <a 
                href="mailto:ludow3b@gmail.com" 
                className="text-zinc-400 hover:text-neon-lime transition-colors font-medium cursor-pointer"
              >
                ludow3b@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>

      {showCGU && (
        <CGU onClose={() => setShowCGU(false)} />
      )}
    </div>
  )
}
