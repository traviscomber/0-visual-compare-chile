import { createClient } from "@supabase/supabase-js"

const INAPI_BASE = "https://buscadormarcas.inapi.cl/Marca"
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

const args = parseArgs(process.argv.slice(2))
const queries = resolveQueries(args)

if (!queries.length) {
  console.error("Usage: node scripts/run-inapi-sync.mjs --query VISUAL [--type nombre] [--delayMs 400]")
  console.error("   or: node scripts/run-inapi-sync.mjs --preset alphabet")
  process.exit(1)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const delayMs = Number.isFinite(Number(args.delayMs)) ? Math.max(0, Number(args.delayMs)) : 400

for (let index = 0; index < queries.length; index += 1) {
  const job = queries[index]
  console.log(`[sync] ${index + 1}/${queries.length} ${job.searchType}:${job.query}`)
  await runJob(job, {
    delayMs,
    position: index + 1,
    totalJobs: queries.length,
    preset: args.preset ?? null,
  })

  if (delayMs > 0 && index < queries.length - 1) {
    await sleep(delayMs)
  }
}

console.log("[sync] completed")

async function runJob(job, metadata) {
  const startedAt = new Date().toISOString()
  const { data: run, error: runError } = await supabase
    .from("inapi_sync_runs")
    .insert({
      source: "inapi",
      status: "running",
      search_type: job.searchType,
      query: job.query,
      metadata: {
        cli: true,
        ...metadata,
      },
      started_at: startedAt,
    })
    .select("id")
    .single()

  if (runError || !run) {
    throw new Error(`Failed to create sync run: ${runError?.message ?? "unknown error"}`)
  }

  try {
    const marcas = await searchInapi(job)
    let inserted = 0
    let updated = 0

    for (const marca of marcas) {
      const recordPayload = {
        source: "inapi",
        source_record_id: marca.id,
        nombre: marca.nombre,
        solicitante: marca.solicitante,
        numero_registro: marca.numeroRegistro || null,
        numero_solicitud: marca.metadata?.numSolicitud || null,
        estado: marca.estado,
        fecha_presentacion: marca.fecha || null,
        fecha_registro: marca.fecha || null,
        fecha_resolucion: null,
        pais: marca.pais || "CL",
        source_url: "https://buscadormarcas.inapi.cl/Marca/BuscarMarca.aspx",
        metadata: marca.metadata ?? {},
        last_synced_at: new Date().toISOString(),
      }

      const { data: existing } = await supabase
        .from("trademark_records")
        .select("id")
        .eq("source", "inapi")
        .eq("source_record_id", marca.id)
        .maybeSingle()

      const { data: record, error: upsertError } = await supabase
        .from("trademark_records")
        .upsert(recordPayload, { onConflict: "source,source_record_id" })
        .select("id")
        .single()

      if (upsertError || !record) {
        throw new Error(`Failed to upsert trademark record: ${upsertError?.message ?? "unknown error"}`)
      }

      await supabase.from("trademark_record_niza").delete().eq("trademark_record_id", record.id)
      await supabase.from("trademark_record_viena").delete().eq("trademark_record_id", record.id)

      if (marca.niza.length) {
        const { error } = await supabase.from("trademark_record_niza").insert(
          marca.niza.map((code) => ({ trademark_record_id: record.id, code })),
        )
        if (error) {
          throw new Error(`Failed to insert Niza codes: ${error.message}`)
        }
      }

      if (marca.viena.length) {
        const { error } = await supabase.from("trademark_record_viena").insert(
          marca.viena.map((code) => ({ trademark_record_id: record.id, code })),
        )
        if (error) {
          throw new Error(`Failed to insert Viena codes: ${error.message}`)
        }
      }

      if (existing?.id) updated += 1
      else inserted += 1
    }

    await supabase
      .from("inapi_sync_runs")
      .update({
        status: "completed",
        finished_at: new Date().toISOString(),
        total_fetched: marcas.length,
        inserted_count: inserted,
        updated_count: updated,
        error_message: null,
      })
      .eq("id", run.id)
  } catch (error) {
    await supabase
      .from("inapi_sync_runs")
      .update({
        status: "failed",
        finished_at: new Date().toISOString(),
        error_message: String(error),
      })
      .eq("id", run.id)

    throw error
  }
}

async function searchInapi(job) {
  const sessionId = await getSession()
  const params = {
    LastNumSol: "0",
    Hash: "",
    IDW: "",
    responseCaptcha: "skip-captcha-for-cli-sync",
    param1: job.searchType === "solicitud" ? job.query : "",
    param2: job.searchType === "registro" ? job.query : "",
    param3: job.searchType === "nombre" ? job.query : "",
    param4: job.searchType === "solicitante" ? job.query : "",
    param5: job.searchType === "clase" ? job.query : "",
    param6: "",
    param7: "",
    param8: "",
    param9: "",
    param10: "",
    param11: "",
    param12: "",
    param13: "",
    param14: "",
    param15: "",
    param16: "",
    param17: args.matchMode || "2",
  }

  const response = await fetch(`${INAPI_BASE}/BuscarMarca.aspx/FindMarcas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Accept: "application/json, text/javascript, */*",
      "X-Requested-With": "XMLHttpRequest",
      Referer: `${INAPI_BASE}/BuscarMarca.aspx`,
      "User-Agent": USER_AGENT,
      Cookie: `ASP.NET_SessionId=${sessionId}`,
    },
    body: JSON.stringify(params),
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`INAPI responded with HTTP ${response.status}`)
  }

  const json = await response.json()
  const payload = JSON.parse(json.d ?? "{}")
  if (payload.ErrorMessage) {
    throw new Error(payload.ErrorMessage)
  }

  return (payload.Marcas ?? []).map((item) => cellToMarca(item.cell, item.id))
}

async function getSession() {
  const response = await fetch(`${INAPI_BASE}/BuscarMarca.aspx`, {
    headers: { "User-Agent": USER_AGENT },
    cache: "no-store",
  })

  const setCookie = response.headers.get("set-cookie") ?? ""
  const match = setCookie.match(/ASP\.NET_SessionId=([^;]+)/)
  if (!match) {
    throw new Error(`Could not obtain INAPI session (status ${response.status})`)
  }

  return match[1]
}

function cellToMarca(cell, id) {
  const niza = String(cell[2] ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)

  const estadoOriginal = normalizeText(String(cell[5] ?? ""))
  const estado =
    estadoOriginal === "En Trámite" || estadoOriginal === "Pendiente"
      ? "Pendiente"
      : estadoOriginal === "Registrada"
        ? "Registrada"
        : "Denegada"

  return {
    id,
    nombre: normalizeText(String(cell[3] ?? "")),
    solicitante: normalizeText(String(cell[4] ?? "")),
    numeroRegistro: normalizeText(String(cell[1] ?? "")),
    estado,
    fecha: "",
    pais: "CL",
    niza,
    viena: [],
    metadata: {
      source: "inapi",
      numSolicitud: normalizeText(String(cell[0] ?? "")),
      estadoOriginal,
      tipoMarca: normalizeText(String(cell[6] ?? "")),
      subtipoMarca: normalizeText(String(cell[7] ?? "")),
      fileSeq: normalizeText(String(cell[8] ?? "")),
      fileType: normalizeText(String(cell[9] ?? "")),
    },
  }
}

function resolveQueries(inputArgs) {
  const type = inputArgs.type || "nombre"
  if (inputArgs.preset === "alphabet") {
    return "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((query) => ({ query, searchType: "nombre" }))
  }
  if (inputArgs.preset === "niza-core") {
    return Array.from({ length: 45 }, (_, index) => ({
      query: String(index + 1).padStart(2, "0"),
      searchType: "clase",
    }))
  }
  if (inputArgs.preset === "top-brands") {
    return ["VISUAL", "COMPARE", "LOGO", "MARCA", "BRAND"].map((query) => ({ query, searchType: "nombre" }))
  }
  if (inputArgs.queries) {
    return inputArgs.queries
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((query) => ({ query, searchType: type }))
  }
  if (inputArgs.query) {
    return [{ query: inputArgs.query.trim(), searchType: type }]
  }
  return []
}

function parseArgs(argv) {
  const result = {}
  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index]
    if (!current.startsWith("--")) continue
    const key = current.slice(2)
    const next = argv[index + 1]
    result[key] = next && !next.startsWith("--") ? next : "true"
    if (next && !next.startsWith("--")) {
      index += 1
    }
  }
  return result
}

function normalizeText(value) {
  return value
    .replace(/Ã¡/g, "á")
    .replace(/Ã©/g, "é")
    .replace(/Ã­/g, "í")
    .replace(/Ã³/g, "ó")
    .replace(/Ãº/g, "ú")
    .replace(/Ã±/g, "ñ")
    .replace(/TrÃ¡mite/g, "Trámite")
    .trim()
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
