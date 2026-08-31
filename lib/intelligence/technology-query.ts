const TECHNICAL_ACCENTS: Record<string, string> = {
  extraccion: "extracción",
  hidrogeno: "hidrógeno",
  termico: "térmico",
  termica: "térmica",
  termicos: "térmicos",
  termicas: "térmicas",
  desalacion: "desalación",
  electroquimica: "electroquímica",
  electroquimico: "electroquímico",
  electroquimicas: "electroquímicas",
  electroquimicos: "electroquímicos",
  tecnologia: "tecnología",
  tecnologias: "tecnologías",
  energia: "energía",
  energias: "energías",
  electrolisis: "electrólisis",
  catalisis: "catálisis",
  sintesis: "síntesis",
  quimica: "química",
  quimico: "químico",
  quimicas: "químicas",
  quimicos: "químicos",
}

export function normalizeTechnologyQuery(input: string) {
  const cleaned = input
    .normalize("NFC")
    .replace(/[,|:\"'()[\]{}]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("es-CL")

  return cleaned
    .split(" ")
    .filter(Boolean)
    .map(token => TECHNICAL_ACCENTS[token] ?? token)
    .join(" ")
}
