// ETL Status and Log interfaces
export interface ETLStatus {
    status: {
        status: string;
        lastRun: {
            id: number;
            start_date: string;
            end_date: string;
            status: string;
            total_records: number;
            offset: number;
        };
        nextRun: string;
        isRunning: boolean;
        shouldRun: boolean;
    };
}

export interface ETLLog {
    id: string;
    start_date: string;
    end_date: string;
    duration: string;
    status: string;
    total_records: string;
    offset: string;
    created_at: string;
}

export interface ETLDebugData {
    status: boolean;
    debug_data: {
        all_processes: any[];
        running_processes: any[];
        running_count: number;
    };
}

// SAS ETL Types
export interface SASETLHistoryResponse {
    status: boolean;
    message: string;
    data: {
        logs: SASETLLog[];
        pagination: SASETLPagination;
    };
}

export interface SASETLLog {
    total_records: ReactNode;
    id: number;
    start_date: string;
    end_date: string;
    duration: string;
    status: string;
    offset: number;
    created_at: string;
}

export interface SASETLPagination {
    total: number;
    limit: number;
    offset: number;
    current_page: number;
    total_pages: number;
}

export interface SASETLRunResponse {
    message: string;
    result: {
        success: boolean;
        message: string;
        timestamp: string;
        totalRecords: number;
        results: SASETLTableResult[];
    };
}

export interface SASETLTableResult {
    table: string;
    dbTable: string;
    records: number;
}

export interface SASETLStatusResponse {
    status: {
        status: string;
        lastRun: {
            id: number;
            start_date: string;
            end_date: string;
            status: string;
            offset: number;
        };
        nextRun: string;
        isRunning: boolean;
        shouldRun: boolean;
    };
}

export interface SASETLTestAPIResponse {
    status: boolean;
    message: string;
    data: {
        success: boolean;
        message: string;
        data: {
            status: {
                status: boolean;
                data: {
                    last_run: {
                        id: number;
                        start_time: string;
                        end_time: string;
                        status: string;
                        message: string;
                        parameters: {
                            trigger: string;
                            message: string;
                            start_date: string;
                            end_date: string;
                            concurrency: number;
                            days_processed: number;
                        };
                        duration_seconds: string;
                    };
                    currently_running: number;
                    recent_activity: number;
                    watermark: {
                        last_extracted_date: string;
                        last_extracted_timecreated: string;
                        next_extract_date: string;
                        updated_at: string;
                    };
                    service: string;
                };
            };
            export: {
                status: boolean;
                data: SASETLExportData[];
                has_next: boolean;
                filters: {
                    date: string | null;
                    course_id: string | null;
                };
                pagination: {
                    limit: number;
                    offset: number;
                    count: number;
                    total_count: number;
                    has_more: boolean;
                };
            };
            availableTables: string[];
        };
    };
}

export interface SASETLExportData {
    id: string;
    course_id: string;
    num_teachers: string;
    num_students: string;
    file_views: string;
    video_views: string;
    forum_views: string;
    quiz_views: string;
    assignment_views: string;
    url_views: string;
    total_views: string;
    avg_activity_per_student_per_day: string | null;
    active_days: string;
    extraction_date: string;
    created_at: string;
    updated_at: string;
} 