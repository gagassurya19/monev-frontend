'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Loader2, Search, Users, BookOpen } from 'lucide-react';
import { 
  getCourses, 
  getCourseActivities, 
  getActivityStudents,
  CoursesResponse,
  CourseActivitiesResponse,
  ActivityStudentsResponse,
  ApiError, 
  StudentsFilters
} from '../lib/api';

export function ApiTestComponent() {
  // States for different API calls
  const [coursesData, setCoursesData] = useState<CoursesResponse | null>(null);
  const [activitiesData, setActivitiesData] = useState<CourseActivitiesResponse | null>(null);
  const [studentsData, setStudentsData] = useState<ActivityStudentsResponse | null>(null);
  
  // Loading states
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  
  // Error states
  const [error, setError] = useState<string | null>(null);
  
  // Form inputs
  const [searchTerm, setSearchTerm] = useState('PBO');
  const [selectedCourseId, setSelectedCourseId] = useState<number>(4);
  const [selectedActivityId, setSelectedActivityId] = useState<number>(1);

  // Test 1: Get courses with search filter
  const testGetCourses = async () => {
    setCoursesLoading(true);
    setError(null);
    
    try {
      const response = await getCourses({
        search: searchTerm,
        limit: 10,
        page: 1,
        sort_by: 'course_name',
        sort_order: 'asc'
      });
      
      setCoursesData(response);
      console.log('Courses API Response:', response);
    } catch (err) {
      const apiError = err as ApiError;
      setError(`Courses API Error: ${apiError.message}`);
      console.error('Courses API Error:', apiError);
    } finally {
      setCoursesLoading(false);
    }
  };

  // Test 2: Get activities in course with quiz filter
  const testGetActivities = async () => {
    setActivitiesLoading(true);
    setError(null);
    
    try {
      const response = await getCourseActivities(selectedCourseId, {
        activity_type: 'quiz',
        page: 1,
        limit: 20
      });
      
      setActivitiesData(response);
      console.log('Activities API Response:', response);
    } catch (err) {
      const apiError = err as ApiError;
      setError(`Activities API Error: ${apiError.message}`);
      console.error('Activities API Error:', apiError);
    } finally {
      setActivitiesLoading(false);
    }
  };

  // Test 3: Get students with sorting by nilai (score)
  const testGetStudents = async () => {
    setStudentsLoading(true);
    setError(null);
    
    try {
      const response = await getActivityStudents(selectedActivityId, {
        activity_type: 'quiz' as StudentsFilters['activity_type'],
        sort_by: 'nilai',
        sort_order: 'desc',
        page: 1,
        limit: 10
      });
      
      setStudentsData(response);
      console.log('Students API Response:', response);
    } catch (err) {
      const apiError = err as ApiError;
      setError(`Students API Error: ${apiError.message}`);
      console.error('Students API Error:', apiError);
    } finally {
      setStudentsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Celoe API Integration Test</h1>
        <p className="text-gray-600 mt-2">Test the three main API endpoints</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Test 1: Courses API */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Courses API
            </CardTitle>
            <CardDescription>
              GET /api/courses?search=PBO&limit=10
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Search Term:</label>
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search courses..."
              />
            </div>
            
            <Button 
              onClick={testGetCourses} 
              disabled={coursesLoading}
              className="w-full"
            >
              {coursesLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Test Courses API
                </>
              )}
            </Button>

            {coursesData && (
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  Found {coursesData.pagination.total_items} courses
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {coursesData.data.map((course) => (
                    <div 
                      key={course.course_id} 
                      className="p-2 bg-gray-50 rounded text-sm cursor-pointer hover:bg-gray-100"
                      onClick={() => setSelectedCourseId(course.course_id)}
                    >
                      <div className="font-medium">{course.course_name}</div>
                      <div className="text-gray-600">
                        ID: {course.course_id} | Class: {course.kelas}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test 2: Activities API */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Activities API
            </CardTitle>
            <CardDescription>
              GET /api/courses/4/activities?activity_type=quiz
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Course ID:</label>
              <Input
                type="number"
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(Number(e.target.value))}
                placeholder="Course ID"
              />
            </div>
            
            <Button 
              onClick={testGetActivities} 
              disabled={activitiesLoading}
              className="w-full"
            >
              {activitiesLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                'Test Activities API'
              )}
            </Button>

            {activitiesData && (
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  Course: {activitiesData.course_info.course_name}
                </div>
                <div className="text-sm text-gray-600">
                  Found {activitiesData.data.length} quiz activities
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {activitiesData.data.map((activity) => (
                    <div 
                      key={activity.activity_id} 
                      className="p-2 bg-gray-50 rounded text-sm cursor-pointer hover:bg-gray-100"
                      onClick={() => setSelectedActivityId(activity.activity_id)}
                    >
                      <div className="font-medium">{activity.activity_name}</div>
                      <div className="text-gray-600">
                        ID: {activity.activity_id} | Type: {activity.activity_type}
                      </div>
                      <div className="text-gray-600">
                        Accessed: {activity.accessed_count} times
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test 3: Students API */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Students API
            </CardTitle>
            <CardDescription>
              GET /api/activities/1/students?sort_by=nilai&sort_order=desc
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Activity ID:</label>
              <Input
                type="number"
                value={selectedActivityId}
                onChange={(e) => setSelectedActivityId(Number(e.target.value))}
                placeholder="Activity ID"
              />
            </div>
            
            <Button 
              onClick={testGetStudents} 
              disabled={studentsLoading}
              className="w-full"
            >
              {studentsLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                'Test Students API'
              )}
            </Button>

            {studentsData && (
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  Activity: {studentsData.activity_info.activity_name}
                </div>
                
                {/* Statistics */}
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary">
                    {studentsData.statistics.total_participants} participants
                  </Badge>
                  <Badge variant="secondary">
                    {studentsData.statistics.completion_rate}% completion
                  </Badge>
                  {studentsData.statistics.average_score && (
                    <Badge variant="secondary">
                      Avg: {studentsData.statistics.average_score}
                    </Badge>
                  )}
                </div>

                <div className="max-h-40 overflow-y-auto space-y-1">
                  {studentsData.data.map((student) => (
                    <div key={student.user_id} className="p-2 bg-gray-50 rounded text-sm">
                      <div className="font-medium">{student.full_name}</div>
                      <div className="text-gray-600">
                        NIM: {student.nim} | Program: {student.program_studi}
                      </div>
                      {student.nilai && (
                        <div className="text-gray-600">
                          Score: {student.nilai}
                        </div>
                      )}
                      <div className="text-gray-600 text-xs">
                        Time: {student.waktu_aktivitas}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Test All Button */}
      <div className="text-center">
        <Button 
          onClick={async () => {
            await testGetCourses();
            setTimeout(() => testGetActivities(), 500);
            setTimeout(() => testGetStudents(), 1000);
          }}
          variant="outline"
          className="px-8"
        >
          Test All APIs Sequentially
        </Button>
      </div>
    </div>
  );
} 