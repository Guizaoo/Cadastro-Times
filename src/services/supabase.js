import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseConfigError =
  'Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no ambiente.'

const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)
const isBrowser = typeof window !== 'undefined'

export const authRememberKey = 'cadastro-times:auth-remember'

const getPreferredStorage = () => {
  if (!isBrowser) return undefined
  const remember = window.localStorage.getItem(authRememberKey) === 'true'
  return remember ? window.localStorage : window.sessionStorage
}

const storageAdapter = isBrowser
  ? {
      getItem: (key) => {
        const storage = getPreferredStorage()
        return storage ? storage.getItem(key) : null
      },
      setItem: (key, value) => {
        const storage = getPreferredStorage()
        if (!storage) return
        storage.setItem(key, value)
        const otherStorage = storage === window.localStorage ? window.sessionStorage : window.localStorage
        otherStorage.removeItem(key)
      },
      removeItem: (key) => {
        window.localStorage.removeItem(key)
        window.sessionStorage.removeItem(key)
      },
    }
  : undefined

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storage: storageAdapter,
      },
    })
  : null
