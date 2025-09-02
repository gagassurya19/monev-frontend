export interface TpEtlSummary {
  id: number;
  user_id: number;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  total_courses_taught: number;
  total_activities: number;
  forum_replies: number;
  assignment_feedback_count: number;
  quiz_feedback_count: number;
  grading_count: number;
  mod_assign_logs: number;
  mod_forum_logs: number;
  mod_quiz_logs: number;
  total_login: number;
  total_student_interactions: number;
  extraction_date: string;
  created_at: string;
  updated_at: string;
}

export interface TpEtlUserCourses {
  user_id: number;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  course_id: number;
  course_name: string;
  course_shortname: string;
  total_activities: number;
  last_activity_date: string;
  first_activity_date: string;
}

export interface TpEtlDetail {
  id: number;
  user_id: number;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  course_id: number;
  course_name: string;
  course_shortname: string;
  activity_date: string;
  component: string;
  action: string;
  target: string;
  objectid: number;
  log_id: number;
  activity_timestamp: number;
  extraction_date: string;
  created_at: string;
  updated_at: string;
}

export interface TpEtlDetailSummary {
  user_id: number;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  course_id: number;
  course_name: string;
  course_shortname: string;
  total_activities: number;
  quiz_logs: number;
  forum_logs: number;
  assign_logs: number;
  last_activity_date: string;
  first_activity_date: string;
}
