import OpenAI from 'openai'
import type { ComparisonResult, BrandAnalysis, VisionConfig } from './types'
import { estimateVisionCost, type VisionCostMetrics } from './cost'

export interface VisionRequest {
  imageA?: string | Buffer
  imageB?: string | Buffer
  image1?: string | Buffer
  image2?: string | Buffer
  brandName1?: string
  brandName2?: string
}

export interface BrandAnalysisWithMetrics {
  analysis: BrandAnalysis
  metrics: VisionCostMetrics
}

export class GPT4oMiniVisionService {
  private config: VisionConfig
  private _client: OpenAI | null = null

  private get client(): OpenAI {
    if (!this._client) this._client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    return this._client
  }

  constructor(config?: Partial<VisionConfig>) {
    this.config = {
      model: 'gpt-4o-mini',
      maxTokens: 500,
      temperature: 0.2,
      compressionQuality: 85,
      cacheTTL: 86400,
      ...config,
    }
  }

  async analyzeBrand(imageData: string | Buffer, brandName?: string): Promise<BrandAnalysis> {
    return (await this.analyzeBrandWithMetrics(imageData, brandName)).analysis
  }

  async analyzeBrandWithMetrics(imageData: string | Buffer, brandName?: string): Promise<BrandAnalysisWithMetrics> {
    const base64Image = typeof imageData === 'string' ? imageData : imageData.toString('base64')
    const response = await this.client.chat.completions.create({
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
          { type: 'text', text: `Analyze this brand logo/image ${brandName ? `for "${brandName}"` : ''} and provide:
1. Primary colors (RGB hex)
2. Logo type (wordmark, symbol, combination, abstract)
3. Style (modern, classic, minimalist, ornate)
4. Key visual elements (list 3-5)
5. Overall description (1-2 sentences)

Respond in JSON format:
{
  "colors": ["#FF0000", "#00FF00"],
  "logoType": "combination",
  "style": "modern",
  "elements": ["geometric shapes", "sans-serif text"],
  "description": "..."
}` },
        ],
      }],
    })

    const content = response.choices[0]?.message?.content
    if (!content) throw new Error('Unexpected response type from OpenAI')
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Could not parse JSON from response')

    return {
      analysis: JSON.parse(jsonMatch[0]) as BrandAnalysis,
      metrics: estimateVisionCost(this.config.model, response.usage),
    }
  }

  async compareBrands(request: VisionRequest): Promise<ComparisonResult> {
    const rawA = request.imageA ?? request.image1
    const rawB = request.imageB ?? request.image2
    if (!rawA || !rawB) throw new Error('compareBrands requires two images')
    const base64Image1 = typeof rawA === 'string' ? rawA : rawA.toString('base64')
    const base64Image2 = typeof rawB === 'string' ? rawB : rawB.toString('base64')

    const response = await this.client.chat.completions.create({
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image1}` } },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image2}` } },
          { type: 'text', text: `Compare these two brand logos/images ${request.brandName1 ? `("${request.brandName1}"` : ''}${request.brandName2 ? ` vs "${request.brandName2}")` : ')'}.

Analyze and respond ONLY with valid JSON (no markdown, no extra text):
{
  "colorSimilarity": 0-100,
  "typesSimilarity": 0-100,
  "styleSimilarity": 0-100,
  "similarities": ["up to 4 key visual similarities"],
  "differences": ["up to 4 key visual differences"],
  "confusionRisk": "low|medium|high",
  "overallScore": 0-100,
  "recommendation": "one sentence brand confusion risk summary",
  "colorsA": ["top 3 hex colors from image 1"],
  "colorsB": ["top 3 hex colors from image 2"]
}` },
        ],
      }],
    })

    const content = response.choices[0]?.message?.content
    if (!content) throw new Error('Unexpected response type from OpenAI')
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Could not parse JSON from response')
    const comparisonData = JSON.parse(jsonMatch[0])

    return {
      modelUsed: this.config.model,
      similarity: comparisonData.overallScore,
      colorSimilarity: comparisonData.colorSimilarity,
      stylesSimilarity: comparisonData.styleSimilarity,
      typeSimilarity: comparisonData.typesSimilarity,
      similarities: comparisonData.similarities ?? [],
      differences: comparisonData.differences ?? [],
      confusionRisk: comparisonData.confusionRisk ?? 'low',
      overallScore: comparisonData.overallScore ?? 0,
      recommendation: comparisonData.recommendation ?? '',
      colorsA: comparisonData.colorsA ?? [],
      colorsB: comparisonData.colorsB ?? [],
      tokensUsed: response.usage?.total_tokens ?? 0,
      analysisDetails: { timestamp: new Date().toISOString(), imageSizes: { image1: 'analyzed', image2: 'analyzed' } },
    }
  }

  async batchCompare(referenceImage: string | Buffer, comparisonImages: Array<{ image: string | Buffer; name?: string }>, brandName?: string): Promise<ComparisonResult[]> {
    const results: ComparisonResult[] = []
    for (const { image, name } of comparisonImages) {
      results.push(await this.compareBrands({ image1: referenceImage, image2: image, brandName1: brandName, brandName2: name }))
    }
    return results
  }

  async extractText(imageData: string | Buffer): Promise<string[]> {
    const base64Image = typeof imageData === 'string' ? imageData : imageData.toString('base64')
    const response = await this.client.chat.completions.create({
      model: this.config.model,
      max_tokens: 200,
      messages: [{ role: 'user', content: [
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
        { type: 'text', text: 'Extract all visible text from this image. Return as JSON array: ["text1", "text2"]' },
      ] }],
    })
    const content = response.choices[0]?.message?.content
    if (!content) return []
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    return jsonMatch ? JSON.parse(jsonMatch[0]) : []
  }

  getModelInfo() {
    return {
      model: this.config.model,
      maxTokens: this.config.maxTokens,
      temperature: this.config.temperature,
      compressionQuality: this.config.compressionQuality,
      cacheTTL: this.config.cacheTTL,
      description: 'GPT-4o mini - cost-effective vision analysis with metered token usage',
    }
  }
}

export const createVisionService = (config?: Partial<VisionConfig>) => new GPT4oMiniVisionService(config)
