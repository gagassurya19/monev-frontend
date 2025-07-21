// ETL Status and Log interfaces
export interface ETLStatus {
    status: boolean;
    data: {
        status: string;
        lastRun: {
            id: string;
            start_date: string;
            end_date: string;
            status: string;
            total_records: string;
            offset: string;
        };
        nextRun: string;
        isRunning: boolean;
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