import { useEffect, useMemo, useState } from 'react'
import { fetchAvailabilityForYear } from '../lib/availabilityApi'
import { hasSupabaseConfig, supabase } from '../lib/supabase'
import type { AvailabilityItem } from '../types'

// Loads every availability row in the calendar year of `weekStart`.
export function useAvailability(weekStart: Date, setStatus: (message: string) => void) {
  const [availability, setAvailability] = useState<AvailabilityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAvailability = async () => {
      if (!hasSupabaseConfig) {
        setAvailability([])
        setStatus('Add your Supabase credentials in .env.local to enable live data storage.')
        setLoading(false)
        return
      }

      try {
        if (!supabase) {
          setAvailability([])
          return
        }

        setAvailability(await fetchAvailabilityForYear(supabase, weekStart.getFullYear()))
      } catch (error) {
        console.error(error)
        setStatus('The availability board could not load. Check the Supabase table and keys.')
      } finally {
        setLoading(false)
      }
    }

    void loadAvailability()
  }, [weekStart, setStatus])

  const refreshAvailability = async () => {
    if (!hasSupabaseConfig || !supabase) {
      return
    }

    setAvailability(await fetchAvailabilityForYear(supabase, weekStart.getFullYear()))
  }

  const availabilityByDate = useMemo(() => {
    const entries: Record<string, AvailabilityItem[]> = {}

    availability.forEach((item) => {
      if (!entries[item.date]) {
        entries[item.date] = []
      }
      entries[item.date].push(item)
    })

    return entries
  }, [availability])

  return { availabilityByDate, loading, refreshAvailability }
}
