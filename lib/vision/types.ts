/**
 * Vision Analysis Types for Brand Comparison
 */

export interface VisionConfig {
  model: string
  maxTokens: number
  temperature: number
  compressionQuality: number
  cacheTTL: number
}

export interface BrandAnalysis {
  colors: string[]
  logoType: 'wordmark' | 'symbol' | 'combination' | 'abstract' | 'unknown'
  style: 'modern' | 'classic' | 'minimalist' | 'ornate' | 'unknown'
  elements: string[]
  description: string
}

export interface ComparisonResult {
  modelUsed: string
  similarity: number
  colorSimilarity: number
  stylesSimilarity: number
  typeSimilarity: number
  similarities: string[]
  differences: string[]
  confusionRisk: 'low' | 'medium' | 'high'
  overallScore: number
  recommendation: string
  colorsA: string[]
  colorsB: string[]
  tokensUsed: number
  analysisDetails: {
    timestamp: string
    imageSizes: {
      image1: string
      image2: string
    }
  }
}

export interface BatchComparisonRequest {
  referenceImage: string | Buffer
  comparisonImages: Array<{
    image: string | Buffer
    name?: string
  }>
  brandName?: string
}

export interface CachedComparison {
  hash: string
  result: ComparisonResult
  timestamp: number
  ttl: number
}

export interface AnalysisMetrics {
  accuracy: number
  responseTime: number
  tokenUsage: {
    input: number
    output: number
    total: number
  }
  costEstimate: number
}
