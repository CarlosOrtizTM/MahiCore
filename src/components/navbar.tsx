"use client";

import Image from "next/image";
import { signOut } from "next-auth/react";

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
        <a href="/equipos" className="hover:text-mahiBlue">
          Equipos
        </a>
        <a href="/ubicaciones" className="hover:text-mahiBlue">
          Ubicaciones
        </a>
        <a href="/responsables" className="hover:text-mahiBlue">
          Responsables
        </a>
      </div>

      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="rounded-md shadow-lg shadow-mahiDark/30 px-3 py-1 font-mono text-sm text-mahiDark hover:bg-mahiRed hover:text-mahiWhite hover:border-mahiRed">
        Salir
      </button>
    </nav>
  );
}