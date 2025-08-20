# Student Activities Summary - API Contract

This document maps the frontend needs for the Student Activities Summary page into clear backend API endpoints. All endpoints are GET unless specified otherwise. The frontend currently uses mocked responses through Next.js route handlers under `app/api/sas/summary/*`. Replace these with real backend integrations when available.

Base path (frontend mocks): `/api/sas/summary/*`

Recommended backend base path: `/api/v1/sas/summary/*`

## Shared Query Parameters

- university: string (e.g., TEL-U BANDUNG)
- fakultas_id: string
- prodi_id: string
- subject_ids: string (comma-separated IDs)
- date_start: string (ISO YYYY-MM-DD)
- date_end: string (ISO YYYY-MM-DD)

These are optional. When omitted, backend should default to a reasonable scope (e.g., current term).

---

## 1) Chart Aggregation

- Frontend path: GET `/api/sas/summary/chart`
- Backend path (proposed): GET `/api/v1/sas/summary/chart`

Query params:
- Shared query parameters
- group_by: enum kampus | fakultas | prodi | subject (default: fakultas)

Response body:

```
{
  "status": true,
  "message": "optional",
  "filters": {
    "group_by": "fakultas",
    "university": "TEL-U BANDUNG",
    "fakultas_id": "",
    "prodi_id": "",
    "subject_ids": "1,2,3",
    "date_start": "2025-01-01",
    "date_end": "2025-01-31"
  },
  "data": [
    {
      "category": "FIF",
      "file": 120,
      "video": 80,
      "forum": 50,
      "quiz": 60,
      "assignment": 40,
      "url": 30
    }
  ]
}
```

Notes:
- category label matches selected group_by dimension.
- All activity fields are numeric counts in the period.

---

## 2) Stats Overview (Header KPIs)

- Frontend path: GET `/api/sas/summary/stats`
- Backend path (proposed): GET `/api/v1/sas/summary/stats`

Query params:
- Shared query parameters

Response body:

```
{
  "status": true,
  "message": "optional",
  "filters": { /* shared */ },
  "data": {
    "total_activities": 2547,
    "average_score": 3.2,
    "active_users": 1234,
    "completion_rate": 0.87,
    "distribution": {
      "file": 532,
      "video": 423,
      "forum": 345,
      "quiz": 532,
      "assignment": 687,
      "url": 560
    }
  }
}
```

Notes:
- completion_rate is 0..1 fraction.
- distribution may be used for a donut/pie chart.

---

## 3) Summary Table (Paginated)

- Frontend path: GET `/api/sas/summary/table`
- Backend path (proposed): GET `/api/v1/sas/summary/table`

Query params:
- Shared query parameters
- Pagination: page (default 1), limit (default 10)
- Sorting: sort_by one of
  - site, fakultas, program_studi, num_teacher, num_student,
  - file, video, forum, quiz, assignment, url,
  - sum, avg_activity_per_student_per_day
- sort_order: asc | desc (default desc)
- Optional: search (free-text filter against course/subject/program names)

Response body:

```
{
  "status": true,
  "message": "optional",
  "filters": { /* shared */ },
  "sorting": { "sort_by": "sum", "sort_order": "desc" },
  "pagination": {
    "current_page": 1,
    "items_per_page": 10,
    "total_items": 250,
    "total_pages": 25
  },
  "data": [
    {
      "id": 1,
      "site": "BDG",
      "fakultas": "FIF",
      "program_studi": "IF",
      "num_teacher": 3,
      "num_student": 80,
      "file": 12,
      "video": 10,
      "forum": 6,
      "quiz": 7,
      "assignment": 3,
      "url": 5,
      "sum": 43,
      "avg_activity_per_student_per_day": 1.4
    }
  ]
}
```

Notes:
- sum equals the sum of activity columns.
- avg_activity_per_student_per_day = fraction with one decimal.

---

## Frontend Components

New reusable components under `components/student-activities-summary`:
- chart-section.tsx → consumes `/api/sas/summary/chart`, renders `ActivityChart`
- stats-cards.tsx → consumes `/api/sas/summary/stats`, renders four KPI cards
- summary-table.tsx → consumes `/api/sas/summary/table`, renders table + pagination

Each component accepts params matching the shared query parameters for consistent filtering.

---

## Integration Checklist for Backend

- Implement the three endpoints with the proposed paths and exact response shapes.
- Support all query parameters listed above, including pagination and sorting for the table.
- Ensure numeric fields are numbers (not strings).
- Time range filtering should apply to all three endpoints consistently.
- Consider caching or async processing for heavy aggregations.

---

## Migration Plan

1. Replace Next route handlers with real HTTP calls inside the handlers (or point the frontend directly to backend URLs if CORS/auth allows).
2. Keep response shapes stable to avoid frontend changes.
3. Validate performance at realistic data volumes; paginate table accordingly.
