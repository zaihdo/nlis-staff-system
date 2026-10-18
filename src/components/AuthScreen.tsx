import { useState, type FormEvent } from 'react'
import { hasSupabaseConfig, supabase } from '../lib/supabase'

const requiredPassword = import.meta.env.VITE_POLL_PASSWORD ?? 'staff-pass'
const hasAdminAuth = Boolean(import.meta.env.VITE_SUPABASE_AUTH_EMAIL && import.meta.env.VITE_SUPABASE_AUTH_PASSWORD)

type AuthScreenProps = {
  onUnlock: (statusMessage: string) => void
}

export function AuthScreen({ onUnlock }: AuthScreenProps) {
  const [authMode, setAuthMode] = useState<'staff' | 'admin'>('staff')
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [adminEmail, setAdminEmail] = useState(import.meta.env.VITE_SUPABASE_AUTH_EMAIL ?? '')
  const [adminPassword, setAdminPassword] = useState(import.meta.env.VITE_SUPABASE_AUTH_PASSWORD ?? '')
  const [adminError, setAdminError] = useState('')
  const [adminLoading, setAdminLoading] = useState(false)

  const handleUnlock = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (password === requiredPassword) {
      setPasswordError('')
      onUnlock('Password accepted. Please choose a date and add your availability.')
      return
    }

    setPasswordError('Incorrect password. Please try again.')
  }

  const handleAdminSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!hasSupabaseConfig || !supabase) {
      setAdminError('Supabase is not configured yet. Add your auth credentials in .env.local.')
      return
    }

    if (!adminEmail.trim() || !adminPassword.trim()) {
      setAdminError('Enter both an email and a password to continue.')
      return
    }

    setAdminLoading(true)
    setAdminError('')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: adminEmail.trim(),
        password: adminPassword,
      })

      if (error) {
        throw error
      }

      onUnlock('Admin sign in successful. You can now manage the availability calendar.')
    } catch (error) {
      console.error(error)
      setAdminError('Unable to sign in with Supabase Auth. Check the admin email and password.')
    } finally {
      setAdminLoading(false)
    }
  }

  return (
    <main className="auth-screen">
      <div className="auth-card">
        <p className="eyebrow">Staff availability</p>
        <h1>Access the calendar</h1>

        <div className="auth-switcher">
          <button
            type="button"
            className={authMode === 'staff' ? 'switch-button active' : 'switch-button'}
            onClick={() => setAuthMode('staff')}
          >
            Staff access
          </button>
          <button
            type="button"
            className={authMode === 'admin' ? 'switch-button active' : 'switch-button'}
            onClick={() => setAuthMode('admin')}
            disabled={!hasAdminAuth}
          >
            Admin sign in
          </button>
        </div>

        {authMode === 'staff' ? (
          <form onSubmit={handleUnlock} className="auth-form">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Type the access password"
            />

            {passwordError ? <p className="error-text">{passwordError}</p> : null}

            <button type="submit" className="primary-button">
              Unlock poll
            </button>
          </form>
        ) : (
          <form onSubmit={handleAdminSignIn} className="auth-form">
            <label htmlFor="admin-email">Email</label>
            <input
              id="admin-email"
              type="email"
              value={adminEmail}
              onChange={(event) => setAdminEmail(event.target.value)}
              placeholder="admin@example.com"
            />

            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              value={adminPassword}
              onChange={(event) => setAdminPassword(event.target.value)}
              placeholder="Type your admin password"
            />

            {adminError ? <p className="error-text">{adminError}</p> : null}

            <button type="submit" className="primary-button" disabled={adminLoading}>
              {adminLoading ? 'Signing in…' : 'Sign in with Supabase'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
