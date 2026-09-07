const NICE_CLASS_LABELS: Record<number, string> = {
  1: "químicos e insumos industriales",
  2: "pinturas, recubrimientos y tintas",
  3: "cosmética, limpieza y perfumería",
  4: "combustibles, lubricantes y energía",
  5: "farmacéuticos y productos sanitarios",
  6: "metales y materiales metálicos",
  7: "maquinaria y equipos industriales",
  8: "herramientas e instrumentos manuales",
  9: "software, electrónica e instrumentos científicos",
  10: "equipos médicos y quirúrgicos",
  11: "climatización, iluminación y aparatos térmicos",
  12: "vehículos y movilidad",
  13: "armas, municiones y explosivos",
  14: "joyería, relojería y metales preciosos",
  15: "instrumentos musicales",
  16: "papelería, publicaciones y material impreso",
  17: "caucho, plásticos y materiales aislantes",
  18: "cuero, equipaje y artículos de viaje",
  19: "materiales de construcción no metálicos",
  20: "muebles y productos de interior",
  21: "utensilios domésticos y recipientes",
  22: "cuerdas, redes, lonas y fibras",
  23: "hilos y fibras textiles",
  24: "tejidos y textiles",
  25: "ropa, calzado y accesorios",
  26: "mercería, adornos y accesorios textiles",
  27: "revestimientos de piso y pared",
  28: "juegos, juguetes y artículos deportivos",
  29: "alimentos procesados de origen animal y vegetal",
  30: "alimentos preparados, café y confitería",
  31: "productos agrícolas y animales vivos",
  32: "bebidas no alcohólicas",
  33: "bebidas alcohólicas",
  34: "tabaco y artículos para fumadores",
  35: "publicidad, gestión comercial y negocios",
  36: "finanzas, seguros e inmobiliario",
  37: "construcción, instalación y reparación",
  38: "telecomunicaciones",
  39: "transporte, logística y almacenamiento",
  40: "tratamiento y transformación de materiales",
  41: "educación, capacitación y entretenimiento",
  42: "servicios científicos, tecnológicos y desarrollo de software",
  43: "alimentación y alojamiento temporal",
  44: "salud, veterinaria, agricultura y cuidado personal",
  45: "servicios jurídicos, seguridad y servicios personales",
}

export const NICE_CLASS_SOURCE_VERSION = "WIPO Nice Classification NCL(13-2027)"

export function niceClassLabel(value: number) {
  return NICE_CLASS_LABELS[value] ?? `actividad cubierta por la clase Nice ${value}`
}

export function buildNiceExpansionInterpretation(previousClasses: number[], newClasses: number[]) {
  const previous = normalizedClasses(previousClasses)
  const additions = normalizedClasses(newClasses)
  const destination = additions.map(value => `clase ${value} (${niceClassLabel(value)})`).join(", ")

  if (!destination) return "No hay una clase nueva interpretable."

  if (!previous.length) {
    return `Se observa una nueva cobertura marcaria en ${destination}. Es una señal de alcance registral, no prueba por sí sola un lanzamiento comercial.`
  }

  const origin = previous.slice(0, 4).map(value => `clase ${value} (${niceClassLabel(value)})`).join(", ")
  const extra = previous.length > 4 ? ` y ${previous.length - 4} clase${previous.length - 4 === 1 ? "" : "s"} adicional${previous.length - 4 === 1 ? "" : "es"}` : ""

  return `El titular amplía su huella observada desde ${origin}${extra} hacia ${destination}. Esto sugiere expansión de cobertura marcaria hacia ese ámbito; no demuestra por sí solo un nuevo producto, servicio o entrada comercial.`
}

function normalizedClasses(values: number[]) {
  return Array.from(new Set(values.filter(value => Number.isInteger(value) && value >= 1 && value <= 45))).sort((a, b) => a - b)
}
