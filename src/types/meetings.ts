export interface Meeting {
  id: string
  clientId: string
  title: string
  /** ISO completo */
  startsAt: string
  durationMin: number
  meetUrl: string
  attendees: string[]
}

export interface MinuteAction {
  what: string
  owner: string
  due: string
}

export interface MeetingMinute {
  id: string
  clientId: string
  date: string
  title: string
  decisions: string[]
  actions: MinuteAction[]
}
