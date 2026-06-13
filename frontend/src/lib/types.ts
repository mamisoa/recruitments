export interface Position {
  id: number
  title: string
  company_url: string | null
  job_source: string | null
  job_is_url: boolean
  company_presentation: string | null
  job_presentation: string | null
  ai_model: string | null
  generated_at: string | null
  created_at: string
  updated_at: string
}

export interface PositionWithCounts extends Position {
  candidate_count: number
}

export interface CvFile {
  id: number
  candidate_id: number
  original_name: string
  content_type: string
  size_bytes: number
  uploaded_at: string
}

export interface Candidate {
  id: number
  position_id: number
  nom: string
  prenom: string
  ddn: string | null
  email: string | null
  telephone: string | null
  isikukood: string | null
  statut_marital: string | null
  statut_etudiant: boolean
  profile_summary: string | null
  ai_model: string | null
  summary_generated_at: string | null
  created_at: string
  updated_at: string
  age: number | null
}

export interface CandidateDetail extends Candidate {
  cv_files: CvFile[]
  interview: Interview | null
}

export interface CandidateIdentifiers {
  nom: string | null
  prenom: string | null
  ddn: string | null
  email: string | null
  telephone: string | null
  isikukood: string | null
}

export interface CustomEvaluation {
  title: string
  score: number | null
  note: string | null
}

export interface Interview {
  id: number
  candidate_id: number
  score_fluence: number | null
  note_fluence: string | null
  score_professionnalisme: number | null
  note_professionnalisme: string | null
  score_competences: number | null
  note_competences: string | null
  score_langues: number | null
  note_langues: string | null
  attentes_candidat: string | null
  specificites_candidat: string | null
  interview_summary: string | null
  custom_evaluations: CustomEvaluation[]
  ai_model: string | null
  summary_generated_at: string | null
  updated_at: string
}

export interface InterviewSheet {
  position: Position
  candidate: Candidate
  cv_files: CvFile[]
  interview: Interview | null
}
