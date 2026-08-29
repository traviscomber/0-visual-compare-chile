import Link from "next/link"

export function PublicLegalFooter() {
  return (
    <footer className="border-t border-[#BDBEBD]/10 bg-[#091A20] px-5 py-5 text-[#BDBEBD] lg:px-10">
      <div className="mx-auto flex max-w-[1480px] flex-col gap-3 text-[11px] sm:flex-row sm:items-center sm:justify-between">
        <span>VIDENTIA · un desarrollo de N3uralia</span>
        <nav aria-label="Información legal" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/privacidad" className="transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B7D3D1]">Privacidad</Link>
          <Link href="/terminos" className="transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B7D3D1]">Términos</Link>
          <a href="mailto:info@n3uralia.com" className="transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B7D3D1]">Contacto</a>
        </nav>
      </div>
    </footer>
  )
}
