"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle, AlertTriangle, Loader2 } from "lucide-react"

export default function ComparisonEngineTester() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

  async function runTest() {
    setLoading(true)
    setError("")
    setResult(null)

    try {
      // Step 1: Get test images from the GET endpoint
      console.log("[v0] Fetching test images...")
      const initRes = await fetch("/api/test/comparison-engine")
      if (!initRes.ok) throw new Error("Failed to generate test images")

      const { images: imgMeta } = await initRes.json()
      console.log("[v0] Test images ready:", imgMeta)

      // Step 2: Create test FormData with synthesized images
      // For this test, we'll upload small PNG files created via the API
      const formData = new FormData()

      // Create a small red test image
      const canvasA = document.createElement("canvas")
      canvasA.width = 100
      canvasA.height = 100
      const ctxA = canvasA.getContext("2d")!
      ctxA.fillStyle = "#FF0000"
      ctxA.fillRect(0, 0, 100, 100)
      ctxA.fillStyle = "#FFFFFF"
      ctxA.font = "12px Arial"
      ctxA.fillText("ORIGINAL", 10, 50)

      const blobA = await new Promise<Blob>((resolve) =>
        canvasA.toBlob((blob) => resolve(blob!), "image/png")
      )
      formData.append("imageA", blobA, "test_original.png")

      // Create a slightly modified blue test image
      const canvasB = document.createElement("canvas")
      canvasB.width = 100
      canvasB.height = 100
      const ctxB = canvasB.getContext("2d")!
      ctxB.fillStyle = "#0000FF"
      ctxB.fillRect(0, 0, 100, 100)
      ctxB.fillStyle = "#FFFFFF"
      ctxB.font = "12px Arial"
      ctxB.fillText("MODIFIED", 10, 50)

      const blobB = await new Promise<Blob>((resolve) =>
        canvasB.toBlob((blob) => resolve(blob!), "image/png")
      )
      formData.append("imageB", blobB, "test_modified.png")

      console.log("[v0] Sending comparison request...")
      const compRes = await fetch("/api/test/comparison-engine", {
        method: "POST",
        body: formData,
      })

      if (!compRes.ok) {
        const errData = await compRes.json()
        throw new Error(errData.error || "Comparison failed")
      }

      const data = await compRes.json()
      console.log("[v0] Test result:", data)
      setResult(data)
    } catch (err: any) {
      console.error("[v0] Test error:", err)
      setError(err.message || "Test failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Comparison Engine Test Harness</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                This test simulates a full image comparison with all new engine
                features:
              </p>
              <ul className="text-sm space-y-2 ml-4 list-disc text-muted-foreground">
                <li>SHA-256 hashing for duplicate detection</li>
                <li>DCT-based perceptual hash (pHash)</li>
                <li>EXIF metadata extraction</li>
                <li>Pixel-level diff overlay</li>
                <li>ELA tampering detection</li>
                <li>Final composite scoring</li>
              </ul>
            </div>

            <Button onClick={runTest} disabled={loading} size="lg" className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Test...
                </>
              ) : (
                "Run Full Engine Test"
              )}
            </Button>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-800">Error</h3>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-800">Test Completed</p>
                    <p className="text-sm text-green-700">
                      {result.test_metadata.timestamp}
                    </p>
                  </div>
                </div>

                {/* SHA-256 */}
                <Card className="bg-slate-50">
                  <CardHeader>
                    <CardTitle className="text-base">SHA-256 Hashing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm font-mono">
                    <div>
                      <span className="text-muted-foreground">Image A:</span>{" "}
                      {result.hashing.sha256_a}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Image B:</span>{" "}
                      {result.hashing.sha256_b}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Duplicate:</span>
                      {result.hashing.is_duplicate ? (
                        <span className="text-red-600">Yes</span>
                      ) : (
                        <span className="text-green-600">No (different)</span>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* pHash */}
                <Card className="bg-slate-50">
                  <CardHeader>
                    <CardTitle className="text-base">
                      DCT-Based Perceptual Hash
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm font-mono">
                    <div>
                      <span className="text-muted-foreground">Image A:</span>{" "}
                      {result.perceptual_hash.phash_a}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Image B:</span>{" "}
                      {result.perceptual_hash.phash_b}
                    </div>
                  </CardContent>
                </Card>

                {/* Metadata & EXIF */}
                <Card className="bg-slate-50">
                  <CardHeader>
                    <CardTitle className="text-base">
                      Metadata & EXIF Extraction
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div>
                      <p className="font-semibold text-xs uppercase text-muted-foreground mb-2">
                        Image A
                      </p>
                      <dl className="space-y-1">
                        <div>
                          <span className="text-muted-foreground">
                            Dimensions:
                          </span>{" "}
                          {result.metadata.image_a.dimensions}
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Avg Color:
                          </span>{" "}
                          {result.metadata.image_a.avg_color || "N/A"}
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Brightness:
                          </span>{" "}
                          {result.metadata.image_a.brightness || "N/A"}
                        </div>
                      </dl>
                    </div>
                    <div>
                      <p className="font-semibold text-xs uppercase text-muted-foreground mb-2">
                        Image B
                      </p>
                      <dl className="space-y-1">
                        <div>
                          <span className="text-muted-foreground">
                            Dimensions:
                          </span>{" "}
                          {result.metadata.image_b.dimensions}
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Avg Color:
                          </span>{" "}
                          {result.metadata.image_b.avg_color || "N/A"}
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Brightness:
                          </span>{" "}
                          {result.metadata.image_b.brightness || "N/A"}
                        </div>
                      </dl>
                    </div>
                  </CardContent>
                </Card>

                {/* Diff Analysis */}
                <Card className="bg-slate-50">
                  <CardHeader>
                    <CardTitle className="text-base">Pixel-Level Diff</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        Similarity:
                      </span>{" "}
                      <span className="font-semibold">
                        {result.pixel_diff.similarity_percent}%
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Different Pixels:
                      </span>{" "}
                      {result.pixel_diff.different_pixels} /{" "}
                      {result.pixel_diff.total_pixels}
                    </div>
                  </CardContent>
                </Card>

                {/* ELA Analysis */}
                <Card className="bg-slate-50">
                  <CardHeader>
                    <CardTitle className="text-base">
                      ELA Tampering Detection
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div>
                      <p className="font-semibold text-xs uppercase text-muted-foreground mb-2">
                        Image A
                      </p>
                      <dl className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Risk:</span>
                          <span
                            className={
                              result.ela_tampering.image_a.tampering_score >
                              70
                                ? "text-red-600 font-semibold"
                                : result.ela_tampering.image_a.tampering_score >
                                    40
                                  ? "text-orange-600 font-semibold"
                                  : "text-green-600"
                            }
                          >
                            {result.ela_tampering.image_a.tampering_score.toFixed(
                              1
                            )}/100 ({result.ela_tampering.image_a.risk_level})
                          </span>
                        </div>
                      </dl>
                    </div>
                    <div>
                      <p className="font-semibold text-xs uppercase text-muted-foreground mb-2">
                        Image B
                      </p>
                      <dl className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Risk:</span>
                          <span
                            className={
                              result.ela_tampering.image_b.tampering_score >
                              70
                                ? "text-red-600 font-semibold"
                                : result.ela_tampering.image_b.tampering_score >
                                    40
                                  ? "text-orange-600 font-semibold"
                                  : "text-green-600"
                            }
                          >
                            {result.ela_tampering.image_b.tampering_score.toFixed(
                              1
                            )}/100 ({result.ela_tampering.image_b.risk_level})
                          </span>
                        </div>
                      </dl>
                    </div>
                  </CardContent>
                </Card>

                {/* Final Score */}
                <Card className="bg-gradient-to-br from-slate-900 to-slate-900 border-blue-500/20">
                  <CardHeader>
                    <CardTitle className="text-base">
                      Final Comparison Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-teal-700">
                        {result.final_result.similarity_score}
                      </div>
                      <div className="text-lg font-semibold text-teal-600">
                        {result.final_result.classification}
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Recommendation:</p>
                      <p className="font-medium">
                        {result.final_result.recommendation}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-xs text-muted-foreground mb-2">
                        Signal Breakdown:
                      </p>
                      <dl className="space-y-1 text-xs">
                        {Object.entries(result.final_result.signals).map(
                          ([key, value]: [string, any]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-muted-foreground">
                                {key}:
                              </span>
                              <span className="font-mono">
                                {typeof value === "number"
                                  ? value.toFixed(2)
                                  : typeof value === "object"
                                  ? JSON.stringify(value)
                                  : value}
                              </span>
                            </div>
                          )
                        )}
                      </dl>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
