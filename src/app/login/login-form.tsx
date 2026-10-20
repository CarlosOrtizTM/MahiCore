"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setCargando(true);

    const form = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      username: String(form.get("username") ?? ""),
      password: String(form.get("password") ?? ""),
      redirect: false,
    });

    setCargando(false);

    if (res?.error === "BLOQUEADO") {
      setError("Cuenta bloqueada temporalmente. Intenta de nuevo en 15 minutos.");
      return;
    }
    if (!res || res.error) {
      setError("Usuario o contraseña incorrectos.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="username" className="text-xs font-mono uppercase text-mahiDark">
          Usuario
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          className="border rounded-md border-mahiDark bg-mahiWhite px-3 py-2 font-mono text-sm text-mahiDark outline-none focus:border-mahiBlue"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-xs font-mono uppercase text-mahiDark">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="border rounded-md inset-shadow-sm/50 border-mahiDark bg-mahiWhite px-3 py-2 font-mono text-sm text-mahiDark outline-none focus:border-mahiBlue"
        />
      </div>

      {error && (
        <p role="alert" className="font-mono text-xs text-mahiRed">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={cargando}
        className="mt-2 bg-mahiBlue px-4 py-2 text-sm font-bold text-mahiWhite rounded-md shadow-lg shadow-mahiBlue/30 hover:bg-mahiDark hover:shadow-mahiDark/30 disabled:opacity-60"
      >
        {cargando ? "Verificando..." : "Ingresar"}
      </button>
    </form>
  );
}
