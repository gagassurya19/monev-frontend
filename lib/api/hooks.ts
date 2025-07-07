import { useState, useEffect, useCallback } from 'react';
import { ApiError } from '../api-client';

// Generic hook for API queries
export function useApiQuery<T>(
  queryFn: () => Promise<T>,
  dependencies: any[] = [],
  options: {
    enabled?: boolean;
    refetchOnMount?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: ApiError) => void;
  } = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    enabled = true,
    refetchOnMount = true,
    onSuccess,
    onError,
  } = options;

  const execute = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);
    setIsSuccess(false);

    try {
      const result = await queryFn();
      setData(result);
      setIsSuccess(true);
      onSuccess?.(result);
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError(
        'UNKNOWN_ERROR',
        'An unexpected error occurred',
        err
      );
      setError(apiError);
      onError?.(apiError);
    } finally {
      setIsLoading(false);
    }
  }, [queryFn, enabled, onSuccess, onError]);

  useEffect(() => {
    if (refetchOnMount) {
      execute();
    }
  }, [...dependencies, execute, refetchOnMount]);

  const refetch = useCallback(() => {
    execute();
  }, [execute]);

  return {
    data,
    isLoading,
    error,
    isSuccess,
    refetch,
  };
}

// Generic hook for API mutations (POST, PUT, DELETE operations)
export function useApiMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: ApiError, variables: TVariables) => void;
    onSettled?: (data: TData | null, error: ApiError | null, variables: TVariables) => void;
  } = {}
) {
  const [data, setData] = useState<TData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const { onSuccess, onError, onSettled } = options;

  const mutate = useCallback(async (variables: TVariables) => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);

    try {
      const result = await mutationFn(variables);
      setData(result);
      setIsSuccess(true);
      onSuccess?.(result, variables);
      onSettled?.(result, null, variables);
      return result;
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError(
        'UNKNOWN_ERROR',
        'An unexpected error occurred',
        err
      );
      setError(apiError);
      onError?.(apiError, variables);
      onSettled?.(null, apiError, variables);
      throw apiError;
    } finally {
      setIsLoading(false);
    }
  }, [mutationFn, onSuccess, onError, onSettled]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsSuccess(false);
  }, []);

  return {
    data,
    isLoading,
    error,
    isSuccess,
    mutate,
    reset,
  };
}

// Specific hooks for the three API endpoints

import { getCourses, getCourseActivities } from './courses';
import { getActivityStudents } from './activities';
import { CoursesFilters, ActivitiesFilters, StudentsFilters } from '../types';

/**
 * Hook for fetching courses with filters
 */
export function useCourses(
  filters: CoursesFilters = {},
  options?: Parameters<typeof useApiQuery>[2]
) {
  return useApiQuery(
    () => getCourses(filters),
    [JSON.stringify(filters)],
    options
  );
}

/**
 * Hook for fetching course activities
 */
export function useCourseActivities(
  courseId: number,
  filters: ActivitiesFilters = {},
  options?: Parameters<typeof useApiQuery>[2]
) {
  return useApiQuery(
    () => getCourseActivities(courseId, filters),
    [courseId, JSON.stringify(filters)],
    {
      enabled: !!courseId,
      ...options,
    }
  );
}

/**
 * Hook for fetching activity students
 */
export function useActivityStudents(
  activityId: number,
  activity_type: StudentsFilters['activity_type'],
  filters: StudentsFilters,
  options?: Parameters<typeof useApiQuery>[2]
) {
  return useApiQuery(
    () => getActivityStudents(activityId, activity_type, filters),
    [activityId, JSON.stringify(filters)],
    {
      enabled: !!activityId,
      ...options,
    }
  );
} 