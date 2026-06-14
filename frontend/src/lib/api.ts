import type {
  Candidate,
  CandidateDetail,
  CandidateIdentifiers,
  CvFile,
  Interview,
  InterviewSheet,
  Position,
  PositionWithCounts,
} from './types'

const BASE = '/api'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: init?.body && !(init.body instanceof FormData)
      ? { 'Content-Type': 'application/json' }
      : undefined,
    ...init,
  })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const data = await res.json()
      detail = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, detail)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

const json = (body: unknown): RequestInit => ({ body: JSON.stringify(body) })

// --- Health ---------------------------------------------------------------- //
export const getHealth = () =>
  request<{ status: string; ai_enabled: boolean }>('/health')

// --- Positions ------------------------------------------------------------- //
export const listPositions = () => request<PositionWithCounts[]>('/positions')
export const getPosition = (id: number) => request<Position>(`/positions/${id}`)
export const createPosition = (data: Partial<Position>) =>
  request<Position>('/positions', { method: 'POST', ...json(data) })
export const updatePosition = (id: number, data: Partial<Position>) =>
  request<Position>(`/positions/${id}`, { method: 'PUT', ...json(data) })
export const generatePresentations = (id: number) =>
  request<Position>(`/positions/${id}/generate`, { method: 'POST' })

// --- Candidates ------------------------------------------------------------ //
export const listCandidates = (positionId: number) =>
  request<Candidate[]>(`/positions/${positionId}/candidates`)
export const getCandidate = (id: number) =>
  request<CandidateDetail>(`/candidates/${id}`)
export const getInterviewSheet = (id: number) =>
  request<InterviewSheet>(`/candidates/${id}/sheet`)
export const createCandidate = (positionId: number, data: Partial<Candidate>) =>
  request<Candidate>(`/positions/${positionId}/candidates`, {
    method: 'POST',
    ...json(data),
  })
export const updateCandidate = (id: number, data: Partial<Candidate>) =>
  request<CandidateDetail>(`/candidates/${id}`, { method: 'PUT', ...json(data) })
export const deleteCandidate = (id: number) =>
  request<void>(`/candidates/${id}`, { method: 'DELETE' })

export const uploadCvs = (id: number, files: File[]) => {
  const fd = new FormData()
  files.forEach((f) => fd.append('files', f))
  return request<CvFile[]>(`/candidates/${id}/cv`, { method: 'POST', body: fd })
}
export const deleteCv = (candidateId: number, cvId: number) =>
  request<void>(`/candidates/${candidateId}/cv/${cvId}`, { method: 'DELETE' })

export const extractIdentifiers = (id: number) =>
  request<CandidateIdentifiers>(`/candidates/${id}/extract`, { method: 'POST' })
export const generateProfileSummary = (id: number) =>
  request<CandidateDetail>(`/candidates/${id}/summary/generate`, { method: 'POST' })

// --- Interview ------------------------------------------------------------- //
export const saveInterview = (candidateId: number, data: Partial<Interview>) =>
  request<Interview>(`/candidates/${candidateId}/interview`, {
    method: 'PUT',
    ...json(data),
  })
export const generateInterviewSummary = (candidateId: number, lang: string) =>
  request<Interview>(
    `/candidates/${candidateId}/interview/summary/generate?lang=${encodeURIComponent(lang)}`,
    { method: 'POST' },
  )
