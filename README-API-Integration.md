# API Integration for Telkom Admin Dashboard

This document explains how to use the API integrations for the three main endpoints:

1. `GET /api/courses` - Get courses with filtering and pagination
2. `GET /api/courses/{course_id}/activities` - Get activities for a specific course
3. `GET /api/activities/{activity_id}/students` - Get students for a specific activity

## 🎉 INTEGRATION COMPLETE!

✅ **Main Dashboard (`/`)**: Now uses real API data instead of mock data
✅ **Test Page (`/api-test`)**: Available for testing individual endpoints
✅ **Real-time Loading**: Activities and students load when expanded
✅ **Error Handling**: Displays API errors with retry options
✅ **Caching**: Efficient data caching to avoid redundant API calls

## Actual API Endpoints

The integration connects to your Celoe API with these actual curl examples:

```bash
# 1. Get courses with PBO search filter
curl "http://localhost:8888/celoeapi/index.php/api/courses?search=PBO&limit=10"

# 2. Get quiz activities in course ID 4
curl "http://localhost:8888/celoeapi/index.php/api/courses/4/activities?activity_type=quiz"

# 3. Get students in activity ID 1, sorted by score (descending)
curl "http://localhost:8888/celoeapi/index.php/api/activities/1/students?sort_by=nilai&sort_order=desc"
```

## How It Works Now

### Main Dashboard (`/`)
- **Courses**: Loads from real API with search/filter support
- **Activities**: Loads dynamically when you expand a course row
- **Students**: Loads dynamically when you expand an activity row
- **Caching**: Data is cached to avoid re-loading when expanding/collapsing
- **Loading States**: Shows spinners while loading data
- **Error Handling**: Displays errors with retry options

### Features Working
1. **Search**: Search courses by name, class, or instructor
2. **Filtering**: Filter by activity type, instructor, etc.
3. **Sorting**: Sort courses by name, student count, activity count
4. **Pagination**: Navigate through large datasets
5. **Expand/Collapse**: Click rows to load and view detailed data
6. **Real-time Stats**: Dashboard stats update based on loaded data
7. **Refresh**: Refresh button clears cache and reloads all data

### Test Page (`/api-test`)
- Individual endpoint testing
- Visual interface for API testing
- Real-time response display

## Quick Test

Visit your app at:
- **`/`** - Main dashboard with real API integration
- **`/api-test`** - API testing interface

## Installation & Setup

The API integration is already set up in your project. Make sure you have the following environment variables configured:

```bash
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8888/celoeapi/index.php
```

## Authentication

The API client automatically handles JWT authentication:

1. **Token from URL**: When users access your app with a `?token=xxx` parameter, it's automatically stored
2. **Token from localStorage**: Stored tokens are automatically used for subsequent requests
3. **Automatic retry**: If a token expires, the client will clear authentication and prompt for re-login

## Usage Examples

### 1. Using React Hooks (Recommended)

```typescript
import { useCourses, useCourseActivities, useActivityStudents } from './lib/api/hooks';

function CoursesComponent() {
  const { data, isLoading, error, refetch } = useCourses({
    page: 1,
    limit: 10,
    search: 'PBO',  // Search for PBO courses
    sort_by: 'course_name',
    sort_order: 'asc'
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.data.map(course => (
        <div key={course.course_id}>
          <h3>{course.course_name}</h3>
          <p>Instructor: {course.dosen_pengampu}</p>
          <p>Students: {course.jumlah_mahasiswa}</p>
        </div>
      ))}
    </div>
  );
}
```

### 2. Using Direct API Calls

```typescript
import { getCourses, getCourseActivities, getActivityStudents } from './lib/api';

async function loadData() {
  try {
    // Get PBO courses
    const courses = await getCourses({
      search: 'PBO',
      limit: 10
    });

    // Get quiz activities for course ID 4
    if (courses.data.length > 0) {
      const activities = await getCourseActivities(4, {
        activity_type: 'quiz'
      });

      // Get students for activity ID 1, sorted by score
      if (activities.data.length > 0) {
        const students = await getActivityStudents(1, {
          sort_by: 'nilai',
          sort_order: 'desc'
        });
        
        console.log('Students:', students);
      }
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
}
```

### 3. Real Example - Exact API Calls

```typescript
import { useState, useEffect } from 'react';
import { getCourses, getCourseActivities, getActivityStudents } from './lib/api';

function CeloeApiExample() {
  const [coursesData, setCoursesData] = useState(null);
  const [activitiesData, setActivitiesData] = useState(null);
  const [studentsData, setStudentsData] = useState(null);

  useEffect(() => {
    async function loadAllData() {
      try {
        // Equivalent to: curl "...api/courses?search=PBO&limit=10"
        const courses = await getCourses({
          search: 'PBO',
          limit: 10
        });
        setCoursesData(courses);

        // Equivalent to: curl "...api/courses/4/activities?activity_type=quiz"
        const activities = await getCourseActivities(4, {
          activity_type: 'quiz'
        });
        setActivitiesData(activities);

        // Equivalent to: curl "...api/activities/1/students?sort_by=nilai&sort_order=desc"
        const students = await getActivityStudents(1, {
          sort_by: 'nilai',
          sort_order: 'desc'
        });
        setStudentsData(students);

      } catch (error) {
        console.error('API Error:', error);
      }
    }

    loadAllData();
  }, []);

  return (
    <div>
      <h2>PBO Courses</h2>
      {coursesData?.data.map(course => (
        <div key={course.course_id}>
          {course.course_name} - {course.kelas}
        </div>
      ))}

      <h2>Quiz Activities (Course 4)</h2>
      {activitiesData?.data.map(activity => (
        <div key={activity.activity_id}>
          {activity.activity_name} - Accessed: {activity.accessed_count}
        </div>
      ))}

      <h2>Students (Activity 1) - Sorted by Score</h2>
      {studentsData?.data.map(student => (
        <div key={student.user_id}>
          {student.full_name} ({student.nim}) - Score: {student.nilai || 'N/A'}
        </div>
      ))}

      {/* Show statistics */}
      {studentsData?.statistics && (
        <div>
          <p>Total Participants: {studentsData.statistics.total_participants}</p>
          <p>Completion Rate: {studentsData.statistics.completion_rate}%</p>
          {studentsData.statistics.average_score && (
            <p>Average Score: {studentsData.statistics.average_score}</p>
          )}
        </div>
      )}
    </div>
  );
}
```

## API Response Types

### Courses Response
```typescript
interface CoursesResponse {
  data: Course[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
  };
  filters_applied: {
    search?: string;
    dosen_pengampu?: string;
    activity_type?: string;
  };
}
```

### Course Activities Response
```typescript
interface CourseActivitiesResponse {
  data: ActivitySummary[];
  pagination: PaginationInfo;
  course_info: {
    course_id: number;
    course_name: string;
    kelas: string;
  };
}
```

### Activity Students Response
```typescript
interface ActivityStudentsResponse {
  data: StudentDisplayData[];
  pagination: PaginationInfo;
  activity_info: {
    activity_id: number;
    activity_name: string;
    activity_type: string;
    course_name: string;
  };
  statistics: {
    total_participants: number;
    average_score?: number;
    completion_rate: number;
  };
}
```

## Error Handling

The API client provides comprehensive error handling:

```typescript
import { ApiError } from './lib/api';

try {
  const data = await getCourses();
} catch (error) {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'INVALID_TOKEN':
      case 'EXPIRED_TOKEN':
        // Redirect to login
        window.location.href = '/login';
        break;
      case 'NETWORK_ERROR':
        // Show network error message
        alert('Please check your internet connection');
        break;
      default:
        // Show generic error
        alert(`Error: ${error.message}`);
    }
  }
}
```

## Available Filter Options

### Courses Filters
- `page?: number` - Page number (default: 1)
- `limit?: number` - Items per page (default: 10)
- `search?: string` - Search term for course name (e.g., "PBO")
- `dosen_pengampu?: string` - Filter by instructor
- `activity_type?: string` - Filter by activity type
- `sort_by?: 'course_name' | 'jumlah_mahasiswa' | 'jumlah_aktivitas'`
- `sort_order?: 'asc' | 'desc'`

### Activities Filters
- `activity_type?: 'resource' | 'assign' | 'quiz'` - Filter by type (e.g., "quiz")
- `section?: number` - Filter by section
- `page?: number` - Page number (default: 1)
- `limit?: number` - Items per page (default: 20)

### Students Filters
- `page?: number` - Page number (default: 1)
- `limit?: number` - Items per page (default: 10)
- `search?: string` - Search by name or NIM
- `program_studi?: string` - Filter by study program
- `sort_by?: 'full_name' | 'nim' | 'nilai' | 'waktu_aktivitas'` - Sort by score ("nilai")
- `sort_order?: 'asc' | 'desc'` - Sort order

## Testing Your Integration

1. **Visit the main dashboard**: Go to `/` in your browser
2. **Search for courses**: Try searching "PBO" or other course names
3. **Expand rows**: Click course rows to load activities, click activity rows to load students
4. **Use filters**: Filter by activity type, instructor, etc.
5. **Test the API page**: Go to `/api-test` for individual endpoint testing
6. **Check browser console**: View detailed API responses in console logs

## Environment Configuration

Make sure to set up your environment variables:

```bash
# .env.local or .env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8888/celoeapi/index.php
```

If not set, it defaults to `http://localhost:8888/celoeapi/index.php`.

## What Changed

### Before (Mock Data)
- Used generated fake data
- All data loaded at once
- No real API calls

### After (Real API Integration)
- ✅ Uses real Celoe API endpoints
- ✅ Dynamic loading (activities load when course expanded)
- ✅ Proper caching to avoid redundant calls
- ✅ Real-time loading states
- ✅ Error handling with retry options
- ✅ Search and filtering work with real data
- ✅ Pagination works with real data
- ✅ Statistics calculated from real data

## Notes

1. **Authentication**: All API calls require a valid JWT token
2. **Rate Limiting**: Be mindful of API rate limits (100 requests per minute per user)
3. **Caching**: The implementation includes smart caching to avoid redundant API calls
4. **Error Boundaries**: Consider using React Error Boundaries for better error handling
5. **Loading States**: The dashboard shows loading indicators while fetching data
6. **Performance**: Data loads on-demand for better performance with large datasets 