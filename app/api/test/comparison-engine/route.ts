import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/test/comparison-engine
 * Returns engine readiness status
 */
export async function GET() {
  return NextResponse.json({
    status: "ready",
    message: "POST test images as FormData (imageA, imageB) to run the full comparison pipeline",
    engine_features: [
      "SHA-256 duplicate detection",
      "DCT-based perceptual hash (pHash)",
      "EXIF metadata extraction",
      "Pixel-level diff overlay with compositing",
      "Error Level Analysis (ELA) tampering detection",
      "Auto-rotation from EXIF orientation",
      "Final composite scoring with forensic signals",
    ],
  })
}

/**
 * POST /api/test/comparison-engine
 * Accepts FormData with imageA and imageB files
 * Runs the full comparison engine and returns detailed results
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageAFile = formData.get("imageA") as File | null
    const imageBFile = formData.get("imageB") as File | null

    if (!imageAFile || !imageBFile) {
      return NextResponse.json(
        { error: "Missing imageA or imageB in FormData" },
        { status: 400 }
      )
    }

    console.log(
      `[v0] Received images: ${imageAFile.name} (${imageAFile.size}b), ${imageBFile.name} (${imageBFile.size}b)`
    )

    // Import all engine modules
    const { calculateSha256 } = await import("@/lib/image/hash")
    const { calculatePerceptualHash } = await import("@/lib/image/phash")
    const { extractMetadata } = await import("@/lib/image/metadata")
    const { generateDiffOverlay } = await import("@/lib/image/diff")
    const { computeEla } = await import("@/lib/image/ela")
    const { extractExif, compareExif } = await import("@/lib/image/exif")
    const { calculateFinalScore, classifyScore, getRecommendation } = await import("@/lib/image/scoring")

    const bufferA = Buffer.from(await imageAFile.arrayBuffer())
    const bufferB = Buffer.from(await imageBFile.arrayBuffer())

    console.log("[v0] 1. Computing SHA-256 hashes...")
    const sha256A = calculateSha256(bufferA)
    const sha256B = calculateSha256(bufferB)
    const isDuplicate = sha256A === sha256B

    console.log("[v0] 2. Extracting metadata (dimensions, colors)...")
    const metaA = await extractMetadata(bufferA)
    const metaB = await extractMetadata(bufferB)

    console.log("[v0] 3. Extracting EXIF forensic signals...")
    const exifA = await extractExif(bufferA)
    const exifB = await extractExif(bufferB)
    const exifComparison = compareExif(exifA, exifB)

    console.log("[v0] 4. Computing DCT-based perceptual hash...")
    const phashA = await calculatePerceptualHash(bufferA)
    const phashB = await calculatePerceptualHash(bufferB)

    console.log("[v0] 5. Generating pixel-level diff overlay...")
    const diff = await generateDiffOverlay(bufferA, bufferB)

    console.log("[v0] 6. Computing ELA tampering detection...")
    const elaA = await computeEla(bufferA)
    const elaB = await computeEla(bufferB)

    console.log("[v0] 7. Calculating final similarity score...")
    const score = await calculateFinalScore({
      sha256_a: sha256A,
      sha256_b: sha256B,
      phash_a: phashA,
      phash_b: phashB,
      pixel_similarity: diff.pixelSimilarity,
      metadata_a: metaA,
      metadata_b: metaB,
      forensics: {
        camera_match: exifComparison.camera_match,
        software_match: exifComparison.software_match,
        any_edited: exifComparison.any_edited,
        timestamp_delta_seconds: exifComparison.timestamp_delta_seconds,
        gps_distance_meters: exifComparison.gps_distance_meters,
        ela_score_a: elaA.tampering_score,
        ela_score_b: elaB.tampering_score,
        ela_alert: elaA.tampering_score > 40 || elaB.tampering_score > 40,
      },
    })

    const result = {
      test_metadata: {
        timestamp: new Date().toISOString(),
        imageA: imageAFile.name,
        imageB: imageBFile.name,
      },
      hashing: {
        sha256_a: sha256A.substring(0, 32) + "...",
        sha256_b: sha256B.substring(0, 32) + "...",
        is_duplicate: isDuplicate,
      },
      perceptual_hash: {
        phash_a: phashA,
        phash_b: phashB,
      },
      metadata: {
        image_a: {
          dimensions: `${metaA.width || "?"}x${metaA.height || "?"}`,
          avg_color: metaA.avg_color ? `rgb(${metaA.avg_color.r}, ${metaA.avg_color.g}, ${metaA.avg_color.b})` : null,
          brightness: metaA.brightness ? metaA.brightness.toFixed(2) : null,
        },
        image_b: {
          dimensions: `${metaB.width || "?"}x${metaB.height || "?"}`,
          avg_color: metaB.avg_color ? `rgb(${metaB.avg_color.r}, ${metaB.avg_color.g}, ${metaB.avg_color.b})` : null,
          brightness: metaB.brightness ? metaB.brightness.toFixed(2) : null,
        },
      },
      exif_forensics: {
        image_a: {
          camera: exifA.camera_make && exifA.camera_model ? `${exifA.camera_make} ${exifA.camera_model}` : "No EXIF",
          software: exifA.software,
          taken_at: exifA.taken_at,
        },
        image_b: {
          camera: exifB.camera_make && exifB.camera_model ? `${exifB.camera_make} ${exifB.camera_model}` : "No EXIF",
          software: exifB.software,
          taken_at: exifB.taken_at,
        },
        comparison: {
          camera_match: exifComparison.camera_match,
          software_match: exifComparison.software_match,
          any_edited: exifComparison.any_edited,
          timestamp_delta_seconds: exifComparison.timestamp_delta_seconds,
          gps_distance_meters: exifComparison.gps_distance_meters,
        },
      },
      pixel_diff: {
        similarity_percent: (diff.pixelSimilarity * 100).toFixed(2),
        total_pixels: diff.totalPixels,
        different_pixels: diff.diffPixels,
      },
      ela_tampering: {
        image_a: {
          tampering_score: elaA.tampering_score,
          risk_level: elaA.tampering_score > 70 ? "HIGH" : elaA.tampering_score > 40 ? "MEDIUM" : "LOW",
        },
        image_b: {
          tampering_score: elaB.tampering_score,
          risk_level: elaB.tampering_score > 70 ? "HIGH" : elaB.tampering_score > 40 ? "MEDIUM" : "LOW",
        },
      },
      final_result: {
        similarity_score: score.similarity_score.toFixed(2),
        classification: score.classification,
        recommendation: score.recommendation,
        signals: score.signals,
      },
    }

    console.log("[v0] Test completed successfully!")
    return NextResponse.json(result)
  } catch (err: any) {
    console.error("[v0] Test error:", err.message)
    console.error("[v0] Stack:", err.stack)
    return NextResponse.json(
      { error: err.message, type: err.constructor.name },
      { status: 500 }
    )
  }
}
