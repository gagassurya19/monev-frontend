import { NextRequest, NextResponse } from 'next/server'

type ChartQuery = {
  university?: string
  fakultas_id?: string
  prodi_id?: string
  subject_ids?: string // comma-separated
  date_start?: string
  date_end?: string
  group_by?: 'kampus' | 'fakultas' | 'prodi' | 'subject'
}

type ChartDataItem = {
  category: string
  file: number
  video: number
  forum: number
  quiz: number
  assignment: number
  url: number
}

type ChartResponse = {
  status: boolean
  message?: string
  filters: Required<Pick<ChartQuery, 'group_by'>> & Omit<ChartQuery, 'group_by'>
  data: ChartDataItem[]
}

function parseQuery(req: NextRequest): Required<Pick<ChartQuery, 'group_by'>> & ChartQuery {
  const url = new URL(req.url)
  const params = url.searchParams
  const groupBy = (params.get('group_by') as ChartQuery['group_by']) || 'fakultas'
  return {
    group_by: groupBy,
    university: params.get('university') || undefined,
    fakultas_id: params.get('fakultas_id') || undefined,
    prodi_id: params.get('prodi_id') || undefined,
    subject_ids: params.get('subject_ids') || undefined,
    date_start: params.get('date_start') || undefined,
    date_end: params.get('date_end') || undefined,
  }
}

function seedRandom(seed: number) {
  let value = seed
  return () => {
    value = (value * 9301 + 49297) % 233280
    return value / 233280
  }
}

function generateMockChartData(groupBy: NonNullable<ChartQuery['group_by']>): ChartDataItem[] {
  const categoriesMap: Record<string, string[]> = {
    kampus: ['TEL-U BDG', 'TEL-U PWT', 'TEL-U JKT'],
    fakultas: ['FIF', 'FEB', 'FRI', 'FKB', 'FTE'],
    prodi: ['IF', 'SI', 'TI', 'MI', 'DKV'],
    subject: ['ALG1', 'PBO', 'BASDAT', 'STAT', 'JARKOM'],
  }
  const categories = categoriesMap[groupBy] || categoriesMap.fakultas
  const rnd = seedRandom(42)
  return categories.map((name) => ({
    category: name,
    file: Math.round(rnd() * 10 + 5),
    video: Math.round(rnd() * 10 + 5),
    forum: Math.round(rnd() * 10 + 5),
    quiz: Math.round(rnd() * 10 + 5),
    assignment: Math.round(rnd() * 10 + 5),
    url: Math.round(rnd() * 10 + 5),
  }))
}

export async function GET(req: NextRequest) {
  const baseURL = process.env.SAS_BASE_URL || 'http://localhost:3001'
  const token = process.env.SAS_AUTH_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJuayIsIm5hbWUiOiJuayIsImthbXB1cyI6IiIsImZha3VsdGFzIjoiIiwicHJvZGkiOiIiLCJhZG1pbiI6dHJ1ZSwiZXhwIjoxNzg3MDczODUxLCJpYXQiOjE3NTU1Mzc4NTF9.bW5pbjR0'

  try {
    const url = new URL(req.url)
    const qs = url.searchParams.toString()
    const target = `${baseURL}/api/v1/sas/summary/chart${qs ? `?${qs}` : ''}`

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
        message: e?.message || 'Failed to get chart data',
        filters: { group_by: 'fakultas' },
        data: [],
      } satisfies ChartResponse,
      { status: 500 }
    )
  }
}


