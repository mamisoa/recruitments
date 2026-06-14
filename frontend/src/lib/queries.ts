import { useQuery } from '@tanstack/react-query'
import * as api from './api'

export const qk = {
  health: ['health'] as const,
  company: ['company'] as const,
  positions: ['positions'] as const,
  position: (id: number) => ['position', id] as const,
  candidates: (positionId: number) => ['candidates', positionId] as const,
  candidate: (id: number) => ['candidate', id] as const,
  sheet: (id: number) => ['sheet', id] as const,
}

export const useHealth = () => useQuery({ queryKey: qk.health, queryFn: api.getHealth })

export const useCompany = () =>
  useQuery({ queryKey: qk.company, queryFn: api.getCompany })

export const usePositions = () =>
  useQuery({ queryKey: qk.positions, queryFn: api.listPositions })

export const usePosition = (id: number) =>
  useQuery({ queryKey: qk.position(id), queryFn: () => api.getPosition(id) })

export const useCandidates = (positionId: number) =>
  useQuery({
    queryKey: qk.candidates(positionId),
    queryFn: () => api.listCandidates(positionId),
  })

export const useCandidate = (id: number) =>
  useQuery({ queryKey: qk.candidate(id), queryFn: () => api.getCandidate(id) })

export const useInterviewSheet = (id: number) =>
  useQuery({ queryKey: qk.sheet(id), queryFn: () => api.getInterviewSheet(id) })
