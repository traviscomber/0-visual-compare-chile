import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "Privacidad",
  description: "Información sobre el tratamiento de datos en VIDENTIA y su demostración pública.",
  alternates: { canonical: "/privacidad" },
  robots: { index: true, follow: true },
}

const sections = [
  {
    title: "1. Alcance",
    body: [
      "Esta política explica cómo VIDENTIA, un desarrollo de N3uralia, trata información cuando utilizas videntia.app, incluida la demostración pública de investigación marcaria.",
      "La demostración está orientada a marcas, productos, servicios e imágenes de signos distintivos. No está diseñada para recibir datos personales sensibles ni información confidencial de terceros. Evita incorporar ese tipo de información en los campos o imágenes que envíes.",
    ],
  },
  {
    title: "2. Información que puede procesarse",
    body: [
      "Cuando utilizas la demo podemos procesar el nombre de la marca, la descripción opcional de productos o servicios, una imagen opcional y los datos técnicos necesarios para recibir y responder la solicitud.",
      "Para limitar el abuso de la demostración se utiliza una identidad técnica derivada de la dirección IP y del user-agent. El mecanismo de cuota transforma esa combinación mediante HMAC antes de registrarla; la clave de cuota almacenada por ese mecanismo no contiene la IP ni el user-agent en texto legible.",
      "También podemos procesar métricas de navegación y eventos operativos agregados para entender el uso y rendimiento del sitio. La configuración de analítica de VIDENTIA elimina los parámetros de consulta de la URL antes de enviar pageviews. Los atributos personalizados de los eventos de la demo describen únicamente modalidad de entrada, presencia o ausencia de contexto y tipo de resultado; no incluyen el nombre de la marca, el texto de actividad ni la imagen enviada.",
      "Si nos contactas por correo, WhatsApp o para contratar el servicio, trataremos además la información que voluntariamente entregues para responder, preparar una propuesta, gestionar la relación comercial o prestar el servicio solicitado.",
    ],
  },
  {
    title: "3. Finalidades",
    body: [
      "Usamos la información para ejecutar la investigación solicitada, analizar señales denominativas o figurativas, sugerir clases cuando existe contexto, consultar o contrastar fuentes de información, prevenir abuso, mantener seguridad y disponibilidad, diagnosticar fallos, medir de forma agregada el uso del producto y responder solicitudes comerciales o de soporte.",
      "No utilizamos la demo pública para emitir una decisión jurídica automatizada sobre registrabilidad. Los resultados son apoyo a la investigación y deben contrastarse con las fuentes oficiales y, cuando corresponda, con asesoría profesional.",
    ],
  },
  {
    title: "4. Proveedores y fuentes externas",
    body: [
      "VIDENTIA utiliza proveedores tecnológicos necesarios para operar infraestructura, almacenamiento, seguridad, analítica y procesamiento automatizado. Una solicitud o señal técnica puede ser transmitida a esos proveedores únicamente en la medida necesaria para ejecutar la función solicitada u operar el servicio y bajo las condiciones aplicables al servicio contratado por N3uralia.",
      "La plataforma también consulta, sincroniza o contrasta información de fuentes externas relacionadas con propiedad industrial. La disponibilidad y exactitud de esas fuentes dependen de sus respectivos operadores.",
    ],
  },
  {
    title: "5. Conservación",
    body: [
      "La demo pública no está concebida como un expediente persistente del usuario. Sin embargo, información técnica o de operación puede conservarse durante el tiempo razonablemente necesario para seguridad, prevención de abuso, diagnóstico, medición agregada, cumplimiento y continuidad del servicio.",
      "Cuando una investigación se convierte en una cuenta, caso, contrato o solicitud comercial, la información asociada puede conservarse durante la relación y posteriormente por los plazos necesarios para cumplir obligaciones legales, contractuales, contables o de defensa de derechos.",
    ],
  },
  {
    title: "6. Seguridad",
    body: [
      "Aplicamos medidas técnicas y organizativas razonables para reducir el riesgo de acceso, alteración, pérdida o uso no autorizado. Ningún sistema conectado a Internet puede garantizar riesgo cero.",
      "Los límites de tamaño, tipo de archivo, validaciones de entrada, controles de cuota y separación entre funciones públicas y autenticadas forman parte de las medidas operativas de la demo.",
    ],
  },
  {
    title: "7. Derechos y solicitudes",
    body: [
      "Puedes solicitar información sobre datos personales que mantengamos asociados a ti y ejercer los derechos que correspondan conforme a la legislación chilena aplicable. Para ello, escribe a info@n3uralia.com indicando que tu solicitud se refiere a privacidad en VIDENTIA y entregando antecedentes suficientes para identificar la relación o información consultada.",
      "Podremos solicitar verificación razonable de identidad antes de responder una solicitud que implique acceso, rectificación, eliminación u otra operación sobre datos personales.",
    ],
  },
  {
    title: "8. Marco normativo y cambios",
    body: [
      "Esta política se interpreta conforme a la normativa chilena aplicable sobre protección de datos y vida privada. La Ley 19.628 se mantiene vigente en su régimen actual hasta el 30 de noviembre de 2026; las modificaciones introducidas por la Ley 21.719 tienen vigencia diferida desde el 1 de diciembre de 2026.",
      "Podemos actualizar esta política cuando cambie la operación, la tecnología o el marco regulatorio. La versión publicada en esta página indicará la fecha de última actualización.",
    ],
  },
]

export default function PrivacidadPage() {
  return (
    <main className="min-h-screen bg-[#090D12] text-[#F4F7F6]">
      <header className="border-b border-white/10 px-5 py-5 lg:px-10">
        <div className="mx-auto flex max-w-[980px] items-center justify-between gap-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#8F9AA8] transition hover:text-white"><ArrowLeft className="h-4 w-4" />Volver a VIDENTIA</Link>
          <div className="text-right"><p className="text-sm font-semibold tracking-[0.14em] text-white">VIDENTIA</p><p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-[#66727F]">by N3uralia</p></div>
        </div>
      </header>

      <article className="px-5 py-14 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-[980px]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#64D5C2]">Legal · Privacidad</p>
          <h1 className="mt-5 text-[clamp(2.8rem,6vw,5.4rem)] font-normal leading-[0.95] tracking-[-0.055em] text-white">Política de privacidad</h1>
          <p className="mt-6 max-w-3xl text-base leading-7 text-[#9AA6B2]">Última actualización: 24 de agosto de 2026. Esta página describe el tratamiento de información en el sitio público y en las interacciones comerciales de VIDENTIA.</p>

          <div className="mt-12 divide-y divide-white/10 border-y border-white/10">
            {sections.map((section) => (
              <section key={section.title} className="grid gap-4 py-7 md:grid-cols-[220px_1fr] md:gap-10">
                <h2 className="text-sm font-semibold text-white">{section.title}</h2>
                <div className="space-y-4">{section.body.map((paragraph) => <p key={paragraph} className="text-sm leading-7 text-[#98A5AF]">{paragraph}</p>)}</div>
              </section>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm">
            <Link href="/terminos" className="font-medium text-[#8FDCCD] hover:text-white">Términos de uso</Link>
            <a href="mailto:info@n3uralia.com?subject=Privacidad%20VIDENTIA" className="font-medium text-[#8FDCCD] hover:text-white">info@n3uralia.com</a>
          </div>
        </div>
      </article>
    </main>
  )
}
