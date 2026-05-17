import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

const isConfigured =
  !!supabaseUrl &&
  !!supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-supabase-project') &&
  !supabaseAnonKey.includes('your-supabase-anon-key')

if (!isConfigured) {
  console.warn(
    '⚠️ PadelArena : Supabase non configuré.\n' +
    'Créez "frontend/.env" avec :\n' +
    '  VITE_SUPABASE_URL=https://votre-projet.supabase.co\n' +
    '  VITE_SUPABASE_ANON_KEY=votre-cle-anon\n' +
    'Mode Démo activé en attendant.'
  )
}

// Créer le client seulement si config valide, sinon proxy qui throw sur usage
export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : new Proxy({}, {
      get(_, prop) {
        if (prop === 'auth') {
          return {
            getSession: () => Promise.resolve({ data: { session: null } }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
            signOut: () => Promise.resolve(),
          }
        }
        throw new Error(
          'Supabase non configuré. Créez frontend/.env avec VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.'
        )
      },
    })

export { isConfigured }
