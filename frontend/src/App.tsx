import { Route, Routes } from 'react-router'
import { Layout } from '@/components/Layout'
import { PositionList } from '@/routes/PositionList'
import { PositionDetail } from '@/routes/PositionDetail'
import { CandidatePage } from '@/routes/CandidatePage'
import { InterviewPage } from '@/routes/InterviewPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<PositionList />} />
        <Route path="positions/:positionId" element={<PositionDetail />} />
        <Route path="candidates/:candidateId" element={<CandidatePage />} />
        <Route path="candidates/:candidateId/interview" element={<InterviewPage />} />
      </Route>
    </Routes>
  )
}
