"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

const input =
  "border rounded-md border-mahiDark bg-mahiWhite px-3 py-2 font-mono text-sm text-mahiDark outline-none focus:border-mahiBlue";
const label = "text-xs font-mono uppercase text-mahiDark";

export default function CambiarPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    const nueva = String(form.get("nueva") ?? "");
    if (nueva !== String(form.get("confirmar") ?? "")) {
      setError("La confirmación no coincide.");
      return;
    }

    setCargando(true);
    const res = await fetch("/api/auth/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actual: String(form.get("actual") ?? ""), nueva }),
    });
    setCargando(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "No se pudo cambiar la contraseña.");
      return;
    }
    // El JWT actual conserva cambioPendiente=true: se cierra sesión y se vuelve a entrar.
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="actual" className={label}>Contraseña actual</label>
        <input id="actual" name="actual" type="password" autoComplete="current-password" required className={input} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="nueva" className={label}>Contraseña nueva (mín. 10)</label>
        <input id="nueva" name="nueva" type="password" autoComplete="new-password" minLength={10} required className={input} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="confirmar" className={label}>Confirmar contraseña</label>
        <input id="confirmar" name="confirmar" type="password" autoComplete="new-password" minLength={10} required className={input} />
      </div>

      {error && (
        <p role="alert" className="font-mono text-xs text-mahiRed">{error}</p>
      )}

      <button
        type="submit"
        disabled={cargando}
        className="mt-2 bg-mahiBlue px-4 py-2 text-sm font-bold text-mahiWhite rounded-md shadow-lg shadow-mahiBlue/30 hover:bg-mahiDark disabled:opacity-60"
      >
        {cargando ? "Guardando..." : "Guardar y volver a ingresar"}
      </button>
    </form>
  );
}
