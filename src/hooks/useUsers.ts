import { useEffect, useState } from 'react'
import { hasSupabaseConfig, supabase } from '../lib/supabase'
import { DEFAULT_USERS } from '../lib/staff'
import type { UserRecord } from '../types'

// Loads the staff list from Supabase, falling back to DEFAULT_USERS.
export function useUsers() {
  const [users, setUsers] = useState<UserRecord[]>(DEFAULT_USERS)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(DEFAULT_USERS[0]?.id ?? null)

  useEffect(() => {
    const applyDefaults = () => {
      setUsers(DEFAULT_USERS)
      setSelectedUserId(DEFAULT_USERS[0]?.id ?? null)
    }

    const loadUsers = async () => {
      if (!hasSupabaseConfig || !supabase) {
        applyDefaults()
        return
      }

      try {
        const { data, error } = await supabase.from('users').select('*').order('last_name', { ascending: true })

        if (error) {
          throw error
        }

        if (data && data.length > 0) {
          const nextUsers = data as UserRecord[]
          setUsers(nextUsers)
          setSelectedUserId((current) => {
            if (current && nextUsers.some((user) => user.id === current)) {
              return current
            }

            return nextUsers[0]?.id ?? null
          })
          return
        }

        applyDefaults()
      } catch (error) {
        console.error(error)
        applyDefaults()
      }
    }

    void loadUsers()
  }, [])

  return { users, selectedUserId, setSelectedUserId }
}
