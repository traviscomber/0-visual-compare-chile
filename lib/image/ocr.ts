import { createWorker, OEM, PSM } from "tesseract.js"

export interface OcrResult {
  text: string | null
  confidence: number | null
  language: string
}

let workerPromise: Promise<Awaited<ReturnType<typeof createWorker>>> | null = null

async function getWorker() {
  if (!workerPromise) {
    workerPromise = createWorker("eng+spa", OEM.LSTM_ONLY).then(async (worker) => {
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SPARSE_TEXT,
        preserve_interword_spaces: "1",
      })
      return worker
    })
  }
  return workerPromise
}

export async function extractImageText(buffer: Buffer): Promise<OcrResult> {
  try {
    const worker = await getWorker()
    const { data } = await worker.recognize(buffer)
    const text = normalizeOcrText(data.text)
    return {
      text: text.length > 0 ? text : null,
      confidence: typeof data.confidence === "number" ? Math.round(data.confidence) : null,
      language: "eng+spa",
    }
  } catch (error) {
    console.error("[v0] OCR failed", error)
    return {
      text: null,
      confidence: null,
      language: "eng+spa",
    }
  }
}

function normalizeOcrText(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/[|•·]/g, " ")
    .trim()
}
