import { NextRequest, NextResponse } from 'next/server'

type StatsQuery = {
  university?: string
  fakultas_id?: string
  prodi_id?: string
  subject_ids?: string // comma-separated
  date_start?: string
  date_end?: string
}

type StatsResponse = {
  status: boolean
  message?: string
  filters: StatsQuery
  data: {
    total_activities: number
    average_score: number
    active_users: number
    completion_rate: number
    distribution: {
      file: number
      video: number
      forum: number
      quiz: number
      assignment: number
      url: number
    }
  }
}

function parseQuery(req: NextRequest): StatsQuery {
  const url = new URL(req.url)
  const p = url.searchParams
  return {
    university: p.get('university') || undefined,
    fakultas_id: p.get('fakultas_id') || undefined,
    prodi_id: p.get('prodi_id') || undefined,
    subject_ids: p.get('subject_ids') || undefined,
    date_start: p.get('date_start') || undefined,
    date_end: p.get('date_end') || undefined,
  }
}

export async function GET(req: NextRequest) {
  const baseURL = process.env.SAS_BASE_URL || 'http://localhost:3001'
  const token = process.env.SAS_AUTH_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJuayIsIm5hbWUiOiJuayIsImthbXB1cyI6IiIsImZha3VsdGFzIjoiIiwicHJvZGkiOiIiLCJhZG1pbiI6dHJ1ZSwiZXhwIjoxNzg3MDczODUxLCJpYXQiOjE3NTU1Mzc4NTF9.bW5pbjR0'

  try {
    const url = new URL(req.url)
    const qs = url.searchParams.toString()
    const target = `${baseURL}/api/v1/sas/summary/stats${qs ? `?${qs}` : ''}`

    const res = await fetch(target, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: token,
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Upstream ${res.status}: ${text}`)
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json(
      {
        status: false,
        message: e?.message || 'Failed to get stats',
        filters: {},
        data: {
          total_activities: 0,
          average_score: 0,
          active_users: 0,
          completion_rate: 0,
          distribution: { file: 0, video: 0, forum: 0, quiz: 0, assignment: 0, url: 0 },
        },
      } as StatsResponse,
      { status: 500 }
    )
  }
}


