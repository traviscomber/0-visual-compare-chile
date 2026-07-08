import exifr from "exifr"

export interface ExifData {
  camera_make: string | null
  camera_model: string | null
  software: string | null
  /** ISO-8601 timestamp when the photo was taken. */
  taken_at: string | null
  /** ISO-8601 timestamp of the last modification declared by the camera/editor. */
  modified_at: string | null
  /** EXIF orientation tag (1-8). 1 = normal. */
  orientation: number | null
  gps: { lat: number; lng: number } | null
  exposure: {
    iso: number | null
    fnumber: number | null
    exposure_time: number | null
    focal_length: number | null
  }
  /** True when the Software tag mentions a known editor (Photoshop, Lightroom, etc.). */
  was_edited: boolean
  /** Raw key/value strings we surface to the user. */
  raw: Record<string, string>
}

const EDITOR_SIGNATURES = [
  "photoshop",
  "lightroom",
  "gimp",
  "pixelmator",
  "affinity",
  "snapseed",
  "facetune",
  "vsco",
  "remini",
  "topaz",
  "luminar",
]

const EMPTY_EXIF: ExifData = {
  camera_make: null,
  camera_model: null,
  software: null,
  taken_at: null,
  modified_at: null,
  orientation: null,
  gps: null,
  exposure: { iso: null, fnumber: null, exposure_time: null, focal_length: null },
  was_edited: false,
  raw: {},
}

function toIsoString(value: unknown): string | null {
  if (!value) return null
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null
    return value.toISOString()
  }
  if (typeof value === "string") {
    const d = new Date(value)
    if (!Number.isNaN(d.getTime())) return d.toISOString()
  }
  return null
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const n = Number.parseFloat(value)
    if (Number.isFinite(n)) return n
  }
  return null
}

/**
 * Extract a normalized EXIF view of an image. Returns an empty object on
 * failure so callers don't have to defend against `null`.
 */
export async function extractExif(buffer: Buffer): Promise<ExifData> {
  try {
    const data = (await exifr.parse(buffer, {
      pick: [
        "Make",
        "Model",
        "Software",
        "DateTimeOriginal",
        "CreateDate",
        "ModifyDate",
        "Orientation",
        "ISO",
        "FNumber",
        "ExposureTime",
        "FocalLength",
        "GPSLatitude",
        "GPSLongitude",
        "latitude",
        "longitude",
      ],
    })) as Record<string, unknown> | undefined

    if (!data) return EMPTY_EXIF

    const make = (data.Make as string | undefined) ?? null
    const model = (data.Model as string | undefined) ?? null
    const software = (data.Software as string | undefined) ?? null
    const taken =
      toIsoString(data.DateTimeOriginal) ?? toIsoString(data.CreateDate) ?? toIsoString(data.ModifyDate)
    const modified = toIsoString(data.ModifyDate)
    const orientation = toNumber(data.Orientation)

    const lat = toNumber(data.latitude ?? data.GPSLatitude)
    const lng = toNumber(data.longitude ?? data.GPSLongitude)
    const gps = lat != null && lng != null ? { lat, lng } : null

    const wasEdited =
      typeof software === "string" && EDITOR_SIGNATURES.some((s) => software.toLowerCase().includes(s))

    const raw: Record<string, string> = {}
    if (make) raw.Make = String(make).trim()
    if (model) raw.Model = String(model).trim()
    if (software) raw.Software = String(software).trim()
    if (taken) raw.DateTimeOriginal = taken
    if (modified) raw.ModifyDate = modified
    if (gps) raw.GPS = `${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)}`

    return {
      camera_make: make ? String(make).trim() : null,
      camera_model: model ? String(model).trim() : null,
      software: software ? String(software).trim() : null,
      taken_at: taken,
      modified_at: modified,
      orientation,
      gps,
      exposure: {
        iso: toNumber(data.ISO),
        fnumber: toNumber(data.FNumber),
        exposure_time: toNumber(data.ExposureTime),
        focal_length: toNumber(data.FocalLength),
      },
      was_edited: wasEdited,
      raw,
    }
  } catch {
    return EMPTY_EXIF
  }
}

/**
 * Distance in meters between two GPS coordinates (Haversine formula).
 */
export function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6_371_000
  const toRad = (x: number) => (x * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return 2 * R * Math.asin(Math.sqrt(h))
}

export interface ExifComparison {
  /** Both files report the same Make + Model. */
  camera_match: boolean | null
  /** Whichever file has Software, did it match? null if either is missing. */
  software_match: boolean | null
  /** Either image was edited in known photo-editing software. */
  any_edited: boolean
  /** Difference in seconds between the two `taken_at` timestamps; null if missing. */
  timestamp_delta_seconds: number | null
  /** Distance in meters between the two GPS points; null if either is missing. */
  gps_distance_meters: number | null
}

export function compareExif(a: ExifData, b: ExifData): ExifComparison {
  const haveCameraA = a.camera_make || a.camera_model
  const haveCameraB = b.camera_make || b.camera_model
  const cameraMatch =
    haveCameraA && haveCameraB
      ? (a.camera_make ?? "") === (b.camera_make ?? "") && (a.camera_model ?? "") === (b.camera_model ?? "")
      : null

  const softwareMatch =
    a.software && b.software ? a.software.toLowerCase() === b.software.toLowerCase() : null

  let timestampDelta: number | null = null
  if (a.taken_at && b.taken_at) {
    timestampDelta = Math.abs(new Date(a.taken_at).getTime() - new Date(b.taken_at).getTime()) / 1000
  }

  const gpsDistance = a.gps && b.gps ? haversineMeters(a.gps, b.gps) : null

  return {
    camera_match: cameraMatch,
    software_match: softwareMatch,
    any_edited: a.was_edited || b.was_edited,
    timestamp_delta_seconds: timestampDelta,
    gps_distance_meters: gpsDistance,
  }
}
