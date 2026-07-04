export type ResearchStage =
  | 'searching'
  | 'crawling'
  | 'analyzing'
  | 'competitors'
  | 'done'
  | 'error'

export interface Competitor {
  name: string
  website: string
  reasoning?: string
}

export interface CompanyResearch {
  companyName: string
  website: string
  phoneNumber?: string
  address?: string
  productsServices: string[]
  painPoints: string[]
  summary: string
  competitors: Competitor[]
}

export interface ProgressEvent {
  stage: ResearchStage
  message: string
  data?: Partial<CompanyResearch>
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content?: string
  research?: CompanyResearch
  stage?: ResearchStage
  isLoading?: boolean
}

export interface DiscordConfig {
  botToken: string
  channelId: string
  applicantName: string
  applicantEmail: string
}

export const STAGE_LABELS: Record<ResearchStage, string> = {
  searching: 'Searching',
  crawling: 'Crawling',
  analyzing: 'Analyzing',
  competitors: 'Finding Competitors',
  done: 'Done',
  error: 'Error',
}

export const STAGE_ORDER: ResearchStage[] = [
  'searching',
  'crawling',
  'analyzing',
  'competitors',
  'done',
]
