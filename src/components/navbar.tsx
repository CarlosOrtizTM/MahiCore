import Image from "next/image";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between border-b-2 border-mahiBlue bg-mahiWhite px-6 py-4">
      <div className="flex items-center gap-2">
        <Image src="/logo-mahicore.png" alt="Logo MahiCore" width={100} height={24} />

      </div>

      <div className="flex gap-6 font-mono text-sm text-mahiDark">
        <a href="/" className="hover:text-mahiBlue">
          Dashboard
        </a>
        <a href="/activos" className="hover:text-mahiBlue">
          Activos
        </a>
        <a href="/reportes" className="hover:text-mahiBlue">
          Reportes
        </a>
      </div>

      <button className="rounded-md shadow-lg shadow-mahiDark/30 px-3 py-1 font-mono text-sm text-mahiDark hover:bg-mahiRed hover:text-mahiWhite hover:border-mahiRed">
        Salir
      </button>
    </nav>
  );
}