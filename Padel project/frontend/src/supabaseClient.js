import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

const isConfigured =
  !!supabaseUrl &&
  !!supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  supabaseUrl !== 'https://your-supabase-project.supabase.co' &&
  supabaseAnonKey !== 'your-supabase-anon-key'

// Créer le client Supabase
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
