import type {
  ChangeType,
  ChangeStatus,
  SourceType,
  DemographicCategory,
  EventType,
} from "@prisma/client";

export type {
  ChangeType,
  ChangeStatus,
  SourceType,
  DemographicCategory,
  EventType,
};

export interface UserProfile {
  sex?: string;
  maritalStatus?: string;
  sexualOrientation?: string;
  religion?: string;
  ethnicity?: string;
  salaryBracket?: string;
  usState?: string;
  politicalAffiliation?: string;
}

export interface PersonalizedImpactResult {
  overallScore: number;
  totalPoliciesAnalyzed: number;
  categoryBreakdown: CategoryScore[];
  topPositive: ImpactDetail[];
  topNegative: ImpactDetail[];
  recentChanges: ImpactDetail[];
}

export interface CategoryScore {
  category: string;
  averageScore: number;
  count: number;
  mostImpactful: ImpactDetail | null;
}

export interface ImpactDetail {
  policyChangeId: string;
  policyTitle: string;
  score: number;
  confidence: number;
  explanation: string;
  category: string;
  subcategory: string;
  publicationDate: string | null;
}

export interface FederalRegisterDocument {
  document_number: string;
  title: string;
  abstract: string | null;
  type: string;
  subtype: string | null;
  publication_date: string;
  signing_date: string | null;
  effective_on: string | null;
  agencies: { name: string; id: number }[];
  citation: string | null;
  html_url: string;
  raw_text_url: string | null;
  executive_order_number: number | null;
  cfr_references: { title: number; part: number }[];
}

export interface APArticle {
  title: string;
  link: string;
  pubDate: string;
  contentSnippet: string;
  content: string;
}

export interface AISummaryResponse {
  headline: string;
  lead: string;
  details: string;
  context: string;
  topics: string[];
  changeType: ChangeType;
}

export interface AIImpactResponse {
  category: DemographicCategory;
  subcategory: string;
  score: number;
  explanation: string;
  confidence: number;
}

export interface AIDigestResponse {
  headline: string;
  summary: string;
  entries: {
    policyChangeId: string;
    briefSummary: string;
    orderIndex: number;
  }[];
}

export interface AITriageResponse {
  relevantCategories: DemographicCategory[];
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
  meta?: {
    page?: number;
    perPage?: number;
    total?: number;
    generatedAt?: string;
  };
}
