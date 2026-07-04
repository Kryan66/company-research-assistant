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

export interface CrawledPage {
  url: string
  title: string
  content: string
}

export interface SerperSearchResult {
  title: string
  link: string
  snippet: string
}

export interface ProgressEvent {
  stage: ResearchStage
  message: string
  data?: Partial<CompanyResearch>
}

export interface DiscordConfig {
  botToken: string
  channelId: string
  applicantName: string
  applicantEmail: string
}
