import { useState } from 'react'
import { supabase, isConfigured } from '../supabaseClient'
import { Zap, Mail, Lock, User, MapPin, AlertCircle, ArrowRight, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import AuthAltSection from './AuthAltSection'
import CGU from './CGU'

export default function Auth({ onDemoLogin }) {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
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
    setSuccess(null)
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
        setSuccess("Inscription réussie ! Veuillez vérifier votre boîte mail pour confirmer votre compte (si activé dans Supabase) ou connectez-vous.")
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
              onClick={() => { setIsLogin(true); setError(null); setSuccess(null); }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-200 ${
                isLogin
                  ? 'bg-zinc-800 text-zinc-100 shadow-md border border-zinc-700/30'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Connexion
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(null); setSuccess(null); }}
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

            {success && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-neon-lime/10 border border-neon-lime/20 text-neon-lime text-xs leading-relaxed animate-fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{success}</span>
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

          {/* OAuth + Demo */}
          <AuthAltSection 
            onGoogleLogin={handleGoogleLogin}
            onDemoLogin={onDemoLogin}
            loading={loading}
          />
        </div>
      </div>

      {showCGU && (
        <CGU onClose={() => setShowCGU(false)} />
      )}
    </div>
  )
}
