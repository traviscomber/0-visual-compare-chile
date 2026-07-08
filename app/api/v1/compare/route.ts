import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { authenticateApiKey } from "@/lib/api/auth"

export const runtime = "nodejs"
export const maxDuration = 60

interface CompareRequest {
  image_a_id: string
  image_b_id: string
}

interface CompareResponse {
  id: string
  image_a_id: string
  image_b_id: string
  similarity_score: number
  classification: string
  signals: Record<string, unknown>
  recommendation: string
  created_at: string
}

export async function POST(request: Request) {
  try {
    // Authenticate with API key
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 })
    }

    const apiKey = authHeader.slice(7)
    const context = await authenticateApiKey(apiKey)
    if (!context) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    const body: CompareRequest = await request.json()
    const { image_a_id, image_b_id } = body

    if (!image_a_id || !image_b_id) {
      return NextResponse.json({ error: "Both image_a_id and image_b_id are required" }, { status: 400 })
    }

    if (image_a_id === image_b_id) {
      return NextResponse.json({ error: "Cannot compare an image with itself" }, { status: 400 })
    }

    const admin = createAdminClient()

    // Fetch both images
    const { data: images, error: fetchError } = await admin
      .from("images")
      .select("*")
      .eq("organization_id", context.organization_id)
      .in("id", [image_a_id, image_b_id])

    if (fetchError || !images || images.length !== 2) {
      return NextResponse.json({ error: "One or both images not found" }, { status: 404 })
    }

    const imageA = images.find((i) => i.id === image_a_id)
    const imageB = images.find((i) => i.id === image_b_id)

    if (!imageA || !imageB) {
      return NextResponse.json({ error: "Images not found" }, { status: 404 })
    }

    // Calculate similarity score
    const similarityScore = calculateSimilarity(imageA, imageB)

    // Classify result
    let classification: string
    if (similarityScore >= 95) {
      classification = "exact_match"
    } else if (similarityScore >= 85) {
      classification = "near_duplicate"
    } else if (similarityScore >= 60) {
      classification = "visually_similar"
    } else if (similarityScore >= 20) {
      classification = "partially_similar"
    } else {
      classification = "different"
    }

    // Extract signals
    const signals = {
      sha256_match: imageA.sha256 === imageB.sha256,
      phash_distance: calculateHammingDistance(imageA.phash, imageB.phash),
      size_match: imageA.size_bytes === imageB.size_bytes,
      dimensions_match: imageA.width === imageB.width && imageA.height === imageB.height,
      format_match: imageA.mime_type === imageB.mime_type,
    }

    const recommendation =
      classification === "exact_match" ? "REJECT_DUPLICATE" : classification === "different" ? "APPROVE" : "REVIEW"

    // Store comparison result
    const { data: comparison, error: insertError } = await admin
      .from("comparisons")
      .insert({
        user_id: context.user_id,
        organization_id: context.organization_id,
        image_a_id: imageA.id,
        image_b_id: imageB.id,
        similarity_score: similarityScore,
        classification,
        signals,
        recommendation,
        result_json: {
          images: {
            a: {
              id: imageA.id,
              filename: imageA.filename,
              width: imageA.width,
              height: imageA.height,
            },
            b: {
              id: imageB.id,
              filename: imageB.filename,
              width: imageB.width,
              height: imageB.height,
            },
          },
          similarity_score: similarityScore,
          classification,
          recommendation,
        },
      })
      .select()
      .single()

    if (insertError || !comparison) {
      console.error("[v0] Comparison insert error:", insertError)
      return NextResponse.json({ error: "Failed to save comparison" }, { status: 500 })
    }

    // Log usage
    await admin.from("usage_logs").insert({
      user_id: context.user_id,
      organization_id: context.organization_id,
      action: "comparison.created",
      metadata: {
        comparison_id: comparison.id,
        similarity_score: similarityScore,
        classification,
      },
    })

    const response: CompareResponse = {
      id: comparison.id,
      image_a_id: imageA.id,
      image_b_id: imageB.id,
      similarity_score: similarityScore,
      classification,
      signals,
      recommendation,
      created_at: comparison.created_at,
    }

    return NextResponse.json({ success: true, data: response }, { status: 200 })
  } catch (error) {
    console.error("[v0] Compare error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function calculateSimilarity(imageA: any, imageB: any): number {
  // Exact SHA-256 match = 100%
  if (imageA.sha256 === imageB.sha256) return 100

  // pHash distance (Hamming distance)
  const hammingDistance = calculateHammingDistance(imageA.phash, imageB.phash)
  const maxDistance = 64
  const phashSimilarity = Math.max(0, 100 - (hammingDistance / maxDistance) * 100)

  // Weighted scoring
  const weights = {
    phash: 0.6,
    format: 0.15,
    dimensions: 0.15,
    size: 0.1,
  }

  let score = phashSimilarity * weights.phash

  if (imageA.mime_type === imageB.mime_type) score += 100 * weights.format
  if (imageA.width === imageB.width && imageA.height === imageB.height) score += 100 * weights.dimensions
  if (Math.abs(imageA.size_bytes - imageB.size_bytes) < imageA.size_bytes * 0.1) score += 100 * weights.size

  return Math.round(score * 10) / 10
}

function calculateHammingDistance(hash1: string, hash2: string): number {
  if (!hash1 || !hash2 || hash1.length !== hash2.length) return 64

  let distance = 0
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) distance++
  }
  return distance
}
