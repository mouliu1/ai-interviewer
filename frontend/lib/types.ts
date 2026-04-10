export type CandidateProfile = {
  skills?: string[];
  projects?: Array<{
    name?: string;
    keywords?: string[];
    highlights?: string[];
    risk_points?: string[];
  }>;
  experience_summary?: string;
  [key: string]: unknown;
};

export type JobProfile = {
  target_role?: string;
  required_skills?: string[];
  preferred_skills?: string[];
  business_context?: string;
  interview_focus?: string[];
  [key: string]: unknown;
};

export type PrepareResponse = {
  prepare_id: string;
  resume_summary_preview: string;
  jd_summary_preview: string;
  candidate_profile: CandidateProfile;
  jd_profile: JobProfile;
  fit_focus_preview: string[];
};

export type StartInterviewPayload = {
  prepare_id: string;
  mode: "standard";
  planned_round_count: number;
};

export type StartInterviewResponse = {
  session_id: string;
  first_question: string;
  planned_round_count: number;
  focus_dimensions: string[];
  session_status: string;
};

export type TurnSummary = {
  next_action: string;
  next_question: string;
  turn_score_summary: {
    score: number;
    dimension_scores: Record<string, number>;
  };
  strengths: string[];
  weaknesses: string[];
  turn_feedback: string[];
  current_round: number;
  remaining_rounds: number;
  session_status: string;
};

export type FinishInterviewResponse = {
  report_id: string;
  overall_score: number;
  report_summary: string;
  session_status: string;
};

export type ReportResponse = {
  report_header: {
    session_id: string;
    title: string;
  };
  dimension_breakdown: Record<string, number>;
  strength_cards: string[];
  gap_cards: string[];
  action_items: string[];
  recommended_questions: string[];
  final_summary: string;
  overall_score?: number;
};

export type InterviewSnapshot = {
  sessionId?: string;
  prepareId?: string;
  currentQuestion: string;
  plannedRoundCount: number;
  currentRound: number;
  remainingRounds: number;
  sessionStatus: string;
  focusDimensions?: string[];
  lastTurn?: TurnSummary;
};

export type ReportSnapshot = {
  sessionId: string;
  reportId: string;
  overallScore: number;
  summary?: string;
  detail?: ReportResponse;
};
