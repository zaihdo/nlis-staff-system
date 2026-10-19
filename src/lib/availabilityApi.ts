import type { SupabaseClient } from '@supabase/supabase-js'
import type { AvailabilityItem } from '../types'

export const fetchAvailabilityForYear = async (client: SupabaseClient, year: number) => {
  const { data, error } = await client
    .from('availability')
    .select('*')
    .gte('date', `${year}-01-01`)
    .lt('date', `${year + 1}-01-01`)

  if (error) {
    throw error
  }

  return (data ?? []) as AvailabilityItem[]
}

// Makes `slots` the person's full set of slots for `date`. Adds missing slots first, then
// drops deselected ones, so a failure partway through never loses slots the user meant to keep.
// Doesn't rely on the (name, date, hour) unique constraint, which the live database lacks.
export const saveDayAvailability = async (
  client: SupabaseClient,
  { name, date, slots, color }: { name: string; date: string; slots: number[]; color: string },
) => {
  const { data: existing, error: fetchError } = await client
    .from('availability')
    .select('hour')
    .eq('name', name)
    .eq('date', date)

  if (fetchError) {
    throw fetchError
  }

  const existingSlots = new Set((existing ?? []).map((row) => row.hour as number))
  const payload = slots.filter((slot) => !existingSlots.has(slot)).map((slot) => ({ name, date, hour: slot, color }))

  if (payload.length > 0) {
    const { error: insertError } = await client.from('availability').insert(payload)

    if (insertError) {
      throw insertError
    }
  }

  let deleteQuery = client.from('availability').delete().eq('name', name).eq('date', date)
  if (slots.length > 0) {
    deleteQuery = deleteQuery.not('hour', 'in', `(${slots.join(',')})`)
  }

  const { error: deleteError } = await deleteQuery

  if (deleteError) {
    throw deleteError
  }
}

export const deleteAvailabilityEntry = async (client: SupabaseClient, id: string) => {
  const { error } = await client.from('availability').delete().eq('id', id)

  if (error) {
    throw error
  }
}

export const deleteAvailabilitySlot = async (client: SupabaseClient, name: string, date: string, hour: number) => {
  const { error } = await client.from('availability').delete().eq('name', name).eq('date', date).eq('hour', hour)

  if (error) {
    throw error
  }
}

export const deleteAvailabilityDay = async (client: SupabaseClient, name: string, date: string) => {
  const { error } = await client.from('availability').delete().eq('name', name).eq('date', date)

  if (error) {
    throw error
  }
}
