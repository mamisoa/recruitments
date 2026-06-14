import { Navigate, Route, Routes } from 'react-router'
import { Layout } from '@/components/Layout'
import { CompanyPage } from '@/routes/CompanyPage'
import { PositionList } from '@/routes/PositionList'
import { PositionDetail } from '@/routes/PositionDetail'
import { CandidatePage } from '@/routes/CandidatePage'
import { InterviewPage } from '@/routes/InterviewPage'
import { DashboardPage } from '@/routes/DashboardPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/company" replace />} />
        <Route path="company" element={<CompanyPage />} />
        <Route path="positions" element={<PositionList />} />
        <Route path="positions/:positionId" element={<PositionDetail />} />
        <Route path="positions/:positionId/dashboard" element={<DashboardPage />} />
        <Route path="candidates/:candidateId" element={<CandidatePage />} />
        <Route path="candidates/:candidateId/interview" element={<InterviewPage />} />
      </Route>
    </Routes>
  )
}
