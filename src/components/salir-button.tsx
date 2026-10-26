"use client";

import { signOut } from "next-auth/react";

export default function SalirButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="rounded-md shadow-lg shadow-mahiDark/30 px-3 py-1 font-mono text-sm text-mahiDark hover:bg-mahiRed hover:text-mahiWhite hover:border-mahiRed"
    >
      Salir
    </button>
  );
}
