export type AvailabilityItem = {
  id: string
  date: string
  hour: number
  name: string
  color: string
  user_id?: string | null
  created_at?: string
}

export type UserRecord = {
  id: string
  first_name: string
  last_name: string
  color: string
}
