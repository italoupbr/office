import type { Meeting, MeetingMinute } from '../../types'
import { isoDateTime, isoDay } from './calendar'
import { mockClients } from './clients'

const AGENCY_TEAM = ['Henrique Vaz', 'Sofia Queiroz']

export const mockMeetings: Record<string, Meeting[]> = mockClients.reduce<
  Record<string, Meeting[]>
>((acc, client, index) => {
  acc[client.id] = [
    {
      id: `mtg-${client.id.slice(-1)}-1`,
      clientId: client.id,
      title: 'Reunião mensal de resultados',
      startsAt: isoDateTime(3 + index, 14),
      durationMin: 60,
      meetUrl: `https://meet.google.com/upsend-${client.id.slice(-1)}-mensal`,
      attendees: [...AGENCY_TEAM, `Diretoria ${client.name}`],
    },
    {
      id: `mtg-${client.id.slice(-1)}-2`,
      clientId: client.id,
      title: 'Alinhamento de pauta de conteúdo',
      startsAt: isoDateTime(11 + index, 10, 30),
      durationMin: 45,
      meetUrl: `https://meet.google.com/upsend-${client.id.slice(-1)}-pauta`,
      attendees: ['Marina Duarte', `Marketing ${client.name}`],
    },
  ]
  return acc
}, {})

export const mockMinutes: Record<string, MeetingMinute[]> = mockClients.reduce<
  Record<string, MeetingMinute[]>
>((acc, client, index) => {
  acc[client.id] = [
    {
      id: `min-${client.id.slice(-1)}-1`,
      clientId: client.id,
      date: isoDay(-(26 + index)),
      title: 'Reunião mensal de resultados',
      decisions: [
        'Priorizar as pautas com intenção de compra antes das informativas.',
        'Manter o investimento de mídia no mesmo patamar por mais um mês.',
      ],
      actions: [
        { what: 'Entregar as 3 pautas de maior intenção', owner: 'Marina Duarte', due: isoDay(-(12 + index)) },
        { what: 'Revisar o formulário de contato do site', owner: 'Rafael Lino', due: isoDay(4 + index) },
      ],
    },
    {
      id: `min-${client.id.slice(-1)}-2`,
      clientId: client.id,
      date: isoDay(-(55 + index)),
      title: 'Kickoff do trimestre',
      decisions: [
        'Meta do trimestre definida em crescimento de leads do site.',
        'Perfil da Empresa no Google passa a ter postagem semanal.',
      ],
      actions: [
        { what: 'Montar o calendário de postagens do perfil', owner: 'Diego Sales', due: isoDay(-(40 + index)) },
        { what: 'Aprovar os textos das páginas de serviço', owner: `Marketing ${client.name}`, due: isoDay(-(30 + index)) },
      ],
    },
  ]
  return acc
}, {})
