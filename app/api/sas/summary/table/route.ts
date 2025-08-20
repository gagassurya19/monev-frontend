import { NextRequest, NextResponse } from 'next/server'

type TableQuery = {
  page?: string
  limit?: string
  search?: string
  sort_by?:
    | 'site'
    | 'fakultas'
    | 'program_studi'
    | 'num_teacher'
    | 'num_student'
    | 'file'
    | 'video'
    | 'forum'
    | 'quiz'
    | 'assignment'
    | 'url'
    | 'sum'
    | 'avg_activity_per_student_per_day'
  sort_order?: 'asc' | 'desc'
  university?: string
  fakultas_id?: string
  prodi_id?: string
  subject_ids?: string // comma-separated
  date_start?: string
  date_end?: string
}

export type SummaryRow = {
  id: number
  site: string
  fakultas: string
  program_studi: string
  course_name: string
  course_shortname: string
  num_teacher: number
  num_student: number
  file: number
  video: number
  forum: number
  quiz: number
  assignment: number
  url: number
  sum: number
  avg_activity_per_student_per_day: number
}

type TableResponse = {
  status: boolean
  message?: string
  filters: Omit<TableQuery, 'page' | 'limit' | 'sort_by' | 'sort_order'>
  pagination: {
    current_page: number
    items_per_page: number
    total_items: number
    total_pages: number
  }
  sorting: {
    sort_by: NonNullable<TableQuery['sort_by']>
    sort_order: NonNullable<TableQuery['sort_order']>
  }
  data: SummaryRow[]
}

function toNumber(value: string | null, defaultValue: number) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : defaultValue
}

function parseQuery(req: NextRequest) {
  const url = new URL(req.url)
  const p = url.searchParams
  const page = toNumber(p.get('page'), 1)
  const limit = toNumber(p.get('limit'), 10)
  const sort_by = (p.get('sort_by') as TableQuery['sort_by']) || 'sum'
  const sort_order = (p.get('sort_order') as TableQuery['sort_order']) || 'desc'
  const search = p.get('search') || undefined
  const filters: TableResponse['filters'] = {
    university: p.get('university') || undefined,
    fakultas_id: p.get('fakultas_id') || undefined,
    prodi_id: p.get('prodi_id') || undefined,
    subject_ids: p.get('subject_ids') || undefined,
    date_start: p.get('date_start') || undefined,
    date_end: p.get('date_end') || undefined,
  }
  return { page, limit, sort_by, sort_order, search, filters }
}

function seedRandom(seed: number) {
  let value = seed
  return () => {
    value = (value * 16807) % 2147483647
    return (value - 1) / 2147483646
  }
}

function generateMockRows(count: number, offset = 0): SummaryRow[] {
  const faculties = ['FIF', 'FEB', 'FRI', 'FKB', 'FTE']
  const prodis = ['IF', 'SI', 'TI', 'MI', 'DKV']
  const sites = ['BDG', 'PWT', 'JKT']
  const courses = [
    { name: 'PEMROGRAMAN UNTUK PERANGKAT BERGERAK 2', shortname: 'PPB' },
    { name: 'ALGORITMA DAN PEMROGRAMAN', shortname: 'ALPRO' },
    { name: 'STRUKTUR DATA', shortname: 'STRUKDAT' },
    { name: 'BASIS DATA', shortname: 'BASDAT' },
    { name: 'PEMROGRAMAN WEB', shortname: 'WEB' },
    { name: 'JARINGAN KOMPUTER', shortname: 'JARKOM' },
    { name: 'SISTEM OPERASI', shortname: 'SISOP' },
    { name: 'KECERDASAN BUATAN', shortname: 'AI' }
  ]
  const rnd = seedRandom(99 + offset)
  const rows: SummaryRow[] = []
  for (let i = 0; i < count; i++) {
    const file = Math.round(rnd() * 20)
    const video = Math.round(rnd() * 20)
    const forum = Math.round(rnd() * 20)
    const quiz = Math.round(rnd() * 20)
    const assignment = Math.round(rnd() * 20)
    const url = Math.round(rnd() * 20)
    const sum = file + video + forum + quiz + assignment + url
    const avg = Math.round((sum / Math.max(1, Math.round(rnd() * 30) + 10)) * 10) / 10
    const course = courses[Math.floor(rnd() * courses.length)]
    rows.push({
      id: offset + i + 1,
      site: sites[Math.floor(rnd() * sites.length)],
      fakultas: faculties[Math.floor(rnd() * faculties.length)],
      program_studi: prodis[Math.floor(rnd() * prodis.length)],
      course_name: course.name,
      course_shortname: course.shortname,
      num_teacher: Math.floor(rnd() * 5) + 1,
      num_student: Math.floor(rnd() * 80) + 20,
      file,
      video,
      forum,
      quiz,
      assignment,
      url,
      sum,
      avg_activity_per_student_per_day: avg,
    })
  }
  return rows
}

export async function GET(req: NextRequest) {
  const baseURL = process.env.SAS_BASE_URL || 'http://localhost:3001'
  const token = process.env.SAS_AUTH_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJuayIsIm5hbWUiOiJuayIsImthbXB1cyI6IiIsImZha3VsdGFzIjoiIiwicHJvZGkiOiIiLCJhZG1pbiI6dHJ1ZSwiZXhwIjoxNzg3MDczODUxLCJpYXQiOjE3NTU1Mzc4NTF9.bW5pbjR0'

  try {
    const url = new URL(req.url)
    const qs = url.searchParams.toString()
    const target = `${baseURL}/api/v1/sas/summary/table${qs ? `?${qs}` : ''}`

    // Add debugging for search parameter
    const searchParam = url.searchParams.get('search')
    if (searchParam) {
      console.log('Search parameter received:', searchParam)
    }

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
    
    // If we're using mock data (when backend is not available), apply search filter
    if (searchParam && data.data && Array.isArray(data.data)) {
      const searchLower = searchParam.toLowerCase()
      data.data = data.data.filter((row: any) => 
        row.course_name?.toLowerCase().includes(searchLower) ||
        row.course_shortname?.toLowerCase().includes(searchLower) ||
        row.program_studi?.toLowerCase().includes(searchLower) ||
        row.fakultas?.toLowerCase().includes(searchLower)
      )
      // Update pagination
      if (data.pagination) {
        data.pagination.total_items = data.data.length
        data.pagination.total_pages = Math.ceil(data.data.length / (parseInt(url.searchParams.get('limit') || '10')))
      }
    }
    
    return NextResponse.json(data)
  } catch (e: any) {
    console.error('Error in table API:', e)
    
    // Generate mock data for testing when backend fails
    const { page, limit, sort_by, sort_order, search } = parseQuery(req)
    let mockData = generateMockRows(50) // Generate 50 rows
    
    // Apply search filter to mock data
    if (search) {
      const searchLower = search.toLowerCase()
      mockData = mockData.filter(row => 
        row.course_name.toLowerCase().includes(searchLower) ||
        row.course_shortname.toLowerCase().includes(searchLower) ||
        row.program_studi.toLowerCase().includes(searchLower) ||
        row.fakultas.toLowerCase().includes(searchLower)
      )
    }
    
    // Apply pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedData = mockData.slice(startIndex, endIndex)
    
    return NextResponse.json(
      {
        status: true,
        message: 'Using mock data (backend unavailable)',
        filters: {},
        sorting: { sort_by, sort_order },
        pagination: {
          current_page: page,
          items_per_page: limit,
          total_items: mockData.length,
          total_pages: Math.ceil(mockData.length / limit),
        },
        data: paginatedData,
      } as TableResponse,
      { status: 200 }
    )
  }
}


