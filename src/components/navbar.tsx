import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SalirButton from "./salir-button";

export default async function Navbar() {
  const session = await getServerSession(authOptions);
  const esAdmin = session?.user?.role === "administrador";

  return (
    <nav className="flex items-center justify-between border-b-2 border-mahiBlue bg-mahiWhite px-6 py-4">
      <div className="flex items-center gap-2">
        <Image src="/logo-mahicore.png" alt="Logo MahiCore" width={100} height={24} />
      </div>

      <div className="flex gap-6 font-mono text-sm text-mahiDark">
        <a href="/" className="hover:text-mahiBlue">Dashboard</a>
        <a href="/equipos" className="hover:text-mahiBlue">Equipos</a>
        <a href="/ubicaciones" className="hover:text-mahiBlue">Ubicaciones</a>
        <a href="/responsables" className="hover:text-mahiBlue">Responsables</a>
        {esAdmin && <a href="/usuarios" className="hover:text-mahiBlue">Usuarios</a>}
      </div>

      <div className="flex items-center gap-4">
        {session?.user && (
          <span className="font-mono text-xs text-mahiDark/60">
            {session.user.name} · {session.user.role}
          </span>
        )}
        <SalirButton />
      </div>
    </nav>
  );
}
