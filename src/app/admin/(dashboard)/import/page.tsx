import { ImportWizard } from '@/components/admin/import'

export const metadata = {
  title: 'Import Games | Admin',
  description: 'Import games from BoardGameGeek',
}

export default function ImportPage() {
  return (
    <div className="container py-6 max-w-4xl">
      <ImportWizard />
    </div>
  )
}
