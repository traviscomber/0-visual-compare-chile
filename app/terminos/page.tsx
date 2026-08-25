import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "Términos de uso",
  description: "Términos aplicables al sitio y a la demostración pública de VIDENTIA.",
  alternates: { canonical: "/terminos" },
  robots: { index: true, follow: true },
}

const sections = [
  {
    title: "1. Servicio",
    body: [
      "VIDENTIA es una plataforma de apoyo a la investigación marcaria desarrollada por N3uralia. El sitio público permite explorar una demostración limitada y conocer modalidades empresariales de plataforma y API.",
      "Las funcionalidades autenticadas, integraciones, niveles de servicio, soporte, volumen, vigilancia y demás condiciones comerciales se rigen adicionalmente por la propuesta, orden de servicio o contrato que corresponda.",
    ],
  },
  {
    title: "2. Naturaleza de los resultados",
    body: [
      "VIDENTIA organiza señales, antecedentes y contexto para facilitar una revisión. No otorga, deniega ni garantiza el registro de una marca y no sustituye una decisión de INAPI, de tribunales, de otra autoridad competente ni el análisis de un profesional especializado.",
      "Una coincidencia, similitud, clase, código, score, alerta o recomendación no constituye por sí sola una conclusión jurídica. Del mismo modo, que un antecedente no aparezca en una consulta no garantiza inexistencia de conflicto, prioridad, disponibilidad o registrabilidad.",
    ],
  },
  {
    title: "3. Fuentes y actualidad",
    body: [
      "VIDENTIA puede combinar información sincronizada, verificaciones en línea y procesamiento automatizado. Los datos provenientes de terceros pueden contener retrasos, omisiones, cambios de formato, indisponibilidad o errores ajenos a N3uralia.",
      "Antes de adoptar una decisión jurídica, comercial o de presentación debes contrastar la información relevante con la fuente oficial vigente y realizar la revisión profesional que corresponda.",
    ],
  },
  {
    title: "4. Demo pública",
    body: [
      "La demo es una vista limitada y puede restringir cantidad de consultas, estrategias de búsqueda, antecedentes visibles, tiempo de ejecución, tamaño o tipo de imágenes y otras capacidades. Estos límites pueden cambiar para proteger la estabilidad y seguridad del servicio.",
      "No debes utilizar la demo para cargar material ilícito, malware, secretos, credenciales, datos personales sensibles ni información cuya transmisión o tratamiento no estés autorizado a realizar.",
    ],
  },
  {
    title: "5. Uso permitido",
    body: [
      "Puedes utilizar VIDENTIA para fines lícitos de investigación, evaluación, gestión y vigilancia de propiedad industrial dentro del alcance habilitado para tu modalidad de acceso.",
      "No está permitido eludir controles de acceso o cuota, interferir con el servicio, intentar obtener credenciales o datos no autorizados, introducir código malicioso, automatizar consumo abusivo, revender accesos sin autorización o utilizar el servicio de una forma que infrinja derechos de terceros o la legislación aplicable.",
    ],
  },
  {
    title: "6. Imágenes, nombres y otros contenidos enviados",
    body: [
      "Conservas los derechos que te correspondan sobre el material que envías. Al utilizar una función que requiere procesarlo, autorizas el tratamiento técnico necesario para ejecutar esa función, incluyendo análisis automatizado y transmisión a proveedores tecnológicos cuando sea necesario para prestar el servicio.",
      "Eres responsable de contar con autorización suficiente para enviar el contenido y de no incorporar información innecesaria de terceros. La demo no debe usarse como repositorio de documentación confidencial.",
    ],
  },
  {
    title: "7. Propiedad intelectual",
    body: [
      "La marca VIDENTIA, su interfaz, software, diseño, documentación, métodos de presentación y demás componentes propios están protegidos por los derechos que correspondan a N3uralia o a sus licenciantes. Estos términos no transfieren propiedad intelectual sobre la plataforma.",
      "Los antecedentes provenientes de fuentes externas mantienen el régimen jurídico y atribución que les corresponda. Su inclusión en VIDENTIA no implica apropiación de derechos sobre marcas, expedientes o materiales de terceros.",
    ],
  },
  {
    title: "8. Disponibilidad y cambios",
    body: [
      "Podemos modificar, suspender o limitar funciones públicas cuando sea necesario por mantenimiento, seguridad, cambios de proveedor, restricciones de una fuente externa, mejoras del producto o cumplimiento normativo.",
      "Para servicios contratados, los compromisos específicos de disponibilidad, soporte o continuidad serán los establecidos en el acuerdo comercial aplicable.",
    ],
  },
  {
    title: "9. Responsabilidad",
    body: [
      "Debes ejercer criterio propio respecto de los resultados y verificar los antecedentes relevantes antes de actuar. En la máxima medida permitida por la ley, N3uralia no responde por decisiones tomadas exclusivamente sobre la base de una vista de demostración, por indisponibilidad o errores atribuibles a fuentes externas, ni por un uso del servicio contrario a estos términos.",
      "Nada en estos términos pretende excluir responsabilidades que no puedan limitarse válidamente conforme a la legislación aplicable.",
    ],
  },
  {
    title: "10. Contacto y actualizaciones",
    body: [
      "Para consultas sobre estos términos puedes escribir a info@n3uralia.com. Podemos actualizar estas condiciones para reflejar cambios del producto, seguridad, operación o normativa; la versión publicada indicará su fecha de actualización.",
      "Estos términos se interpretan conforme a la legislación de la República de Chile, sin perjuicio de las normas imperativas y reglas de competencia que resulten aplicables en cada caso.",
    ],
  },
]

export default function TerminosPage() {
  return (
    <main className="min-h-screen bg-[#090D12] text-[#F4F7F6]">
      <header className="border-b border-white/10 px-5 py-5 lg:px-10">
        <div className="mx-auto flex max-w-[980px] items-center justify-between gap-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#8F9AA8] transition hover:text-white"><ArrowLeft className="h-4 w-4" />Volver a VIDENTIA</Link>
          <div className="text-right"><p className="text-sm font-semibold tracking-[0.14em] text-white">VIDENTIA</p><p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-[#8994A1]">by N3uralia</p></div>
        </div>
      </header>

      <article className="px-5 py-14 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-[980px]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#64D5C2]">Legal · Uso</p>
          <h1 className="mt-5 text-[clamp(2.8rem,6vw,5.4rem)] font-normal leading-[0.95] tracking-[-0.055em] text-white">Términos de uso</h1>
          <p className="mt-6 max-w-3xl text-base leading-7 text-[#9AA6B2]">Última actualización: 24 de agosto de 2026. Estas condiciones aplican al uso del sitio público y de la demostración de VIDENTIA.</p>

          <div className="mt-12 divide-y divide-white/10 border-y border-white/10">
            {sections.map((section) => (
              <section key={section.title} className="grid gap-4 py-7 md:grid-cols-[220px_1fr] md:gap-10">
                <h2 className="text-sm font-semibold text-white">{section.title}</h2>
                <div className="space-y-4">{section.body.map((paragraph) => <p key={paragraph} className="text-sm leading-7 text-[#98A5AF]">{paragraph}</p>)}</div>
              </section>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm">
            <Link href="/privacidad" className="font-medium text-[#8FDCCD] hover:text-white">Política de privacidad</Link>
            <a href="mailto:info@n3uralia.com?subject=T%C3%A9rminos%20VIDENTIA" className="font-medium text-[#8FDCCD] hover:text-white">info@n3uralia.com</a>
          </div>
        </div>
      </article>
    </main>
  )
}
