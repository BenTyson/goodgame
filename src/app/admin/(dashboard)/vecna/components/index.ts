// New tab-based admin UI
export { VecnaAdmin } from './VecnaAdmin'

// Discovery tab components
export * from './discovery'

// Processing tab components
export * from './processing'

// Legacy components (kept for backward compatibility during migration)
export { VecnaPipeline } from './VecnaPipeline'
export { VecnaFamilySidebar } from './VecnaFamilySidebar'
export { VecnaEmptyState } from './VecnaEmptyState'
export { RulebookDiscovery } from './RulebookDiscovery'
export { StateActions } from './StateActions'
export { FamilyBatchActions } from './FamilyBatchActions'

// Shared components used by both Discovery and Processing
export { PipelineProgressBar, PipelineProgressDots } from './PipelineProgressBar'
export { BlockedStateAlert } from './BlockedStateAlert'
export { AutoProcessModal } from './AutoProcessModal'
export { ModelSelector } from './ModelSelector'
export { SourcesDrawer } from './SourcesDrawer'
export { ContentReviewPanel } from './ContentReviewPanel'
export { JsonEditor } from './JsonEditor'
export { RegenerateButton } from './RegenerateButton'
