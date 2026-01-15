import { Metadata } from 'next'
import { RecommendWizard } from './RecommendWizard'

export const metadata: Metadata = {
  title: 'Find Your Perfect Game',
  description:
    'Answer a few quick questions and discover your ideal board game. Our smart recommendation engine matches you with games you will love.',
  openGraph: {
    title: 'Find Your Perfect Game | Boardmello',
    description:
      'Answer a few quick questions and discover your ideal board game match.',
  },
}

export default function RecommendPage() {
  return <RecommendWizard />
}
