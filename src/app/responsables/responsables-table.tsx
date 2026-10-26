"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Rol = "lector" | "editor" | "administrador";
type Fila = {
  id: string;
  nombre: string;
  email: string;
  cargo: string | null;
  telefono: string | null;
  equipos: number;
  cuentas: number;
};

const th = "px-4 py-3 font-mono text-xs uppercase text-mahiDark";
const td = "px-4 py-3 font-mono text-sm";
const input =
  "w-full border rounded-md border-mahiDark bg-mahiWhite px-3 py-2 font-mono text-sm text-mahiDark outline-none focus:border-mahiBlue";

export default function ResponsablesTable({ filas, rol }: { filas: Fila[]; rol: Rol }) {
  const router = useRouter();
  const puedeEditar = rol === "editor" || rol === "administrador";
  const puedeBorrar = rol === "administrador";

  const [modal, setModal] = useState<{ modo: "crear" | "editar"; fila?: Fila } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function guardar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!modal) return;
    setError(null);
    setGuardando(true);

    const f = new FormData(e.currentTarget);
    const body = {
      nombre: String(f.get("nombre") ?? ""),
      email: String(f.get("email") ?? ""),
      cargo: String(f.get("cargo") ?? ""),
      telefono: String(f.get("telefono") ?? ""),
    };
    const editar = modal.modo === "editar" && modal.fila;
    const res = await fetch(editar ? `/api/responsables/${modal.fila!.id}` : "/api/responsables", {
      method: editar ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setGuardando(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "No se pudo guardar.");
      return;
    }
    setModal(null);
    router.refresh();
  }

  async function eliminar(fila: Fila) {
    const aviso =
      fila.equipos + fila.cuentas > 0
        ? `\n\nTiene ${fila.equipos} equipo(s) y ${fila.cuentas} cuenta(s) asociados; quedarán sin responsable.`
        : "";
    if (!confirm(`¿Eliminar a "${fila.nombre}"?${aviso}`)) return;

    const res = await fetch(`/api/responsables/${fila.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      alert(data?.error ?? "No se pudo eliminar.");
      return;
    }
    router.refresh();
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-mono text-2xl font-bold uppercase text-mahiDark">Responsables</h1>
        {puedeEditar && (
          <button
            onClick={() => { setError(null); setModal({ modo: "crear" }); }}
            className="rounded-md bg-mahiBlue px-4 py-2 font-mono text-sm font-bold text-mahiWhite shadow-lg shadow-mahiBlue/30 hover:bg-mahiDark"
          >
            + Nuevo responsable
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-md bg-mahiWhite p-6 shadow-lg shadow-mahiDark/30">
        <table className="w-full text-left">
          <thead className="border-b-2 border-mahiDark">
            <tr>
              <th className={th}>Nombre</th>
              <th className={th}>Email</th>
              <th className={th}>Cargo</th>
              <th className={th}>Tel.</th>
              <th className={th}>Equipos</th>
              <th className={th}>Cuentas</th>
              {puedeEditar && <th className={th}>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {filas.map((r) => (
              <tr key={r.id} className="border-b border-mahiLight">
                <td className={td}>{r.nombre}</td>
                <td className={td}>{r.email}</td>
                <td className={td}>{r.cargo ?? "—"}</td>
                <td className={td}>{r.telefono ?? "—"}</td>
                <td className={`${td} text-center`}>{r.equipos}</td>
                <td className={`${td} text-center`}>{r.cuentas}</td>
                {puedeEditar && (
                  <td className={td}>
                    <button
                      onClick={() => { setError(null); setModal({ modo: "editar", fila: r }); }}
                      className="mr-3 text-mahiBlue hover:underline"
                    >
                      Editar
                    </button>
                    {puedeBorrar && (
                      <button onClick={() => eliminar(r)} className="text-mahiRed hover:underline">
                        Eliminar
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {filas.length === 0 && (
              <tr>
                <td colSpan={7} className={`${td} text-center text-mahiDark/60`}>
                  No hay responsables registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-mahiDark/50 p-4">
          <form
            onSubmit={guardar}
            className="w-full max-w-md rounded-md bg-mahiWhite p-6 shadow-xl"
          >
            <h2 className="mb-4 font-mono text-lg font-bold uppercase text-mahiDark">
              {modal.modo === "crear" ? "Nuevo responsable" : "Editar responsable"}
            </h2>

            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 font-mono text-xs uppercase text-mahiDark">
                Nombre
                <input name="nombre" required defaultValue={modal.fila?.nombre ?? ""} className={input} />
              </label>
              <label className="flex flex-col gap-1 font-mono text-xs uppercase text-mahiDark">
                Email
                <input name="email" type="email" required defaultValue={modal.fila?.email ?? ""} className={input} />
              </label>
              <label className="flex flex-col gap-1 font-mono text-xs uppercase text-mahiDark">
                Cargo
                <input name="cargo" defaultValue={modal.fila?.cargo ?? ""} className={input} />
              </label>
              <label className="flex flex-col gap-1 font-mono text-xs uppercase text-mahiDark">
                Teléfono
                <input name="telefono" defaultValue={modal.fila?.telefono ?? ""} className={input} />
              </label>
            </div>

            {error && <p role="alert" className="mt-3 font-mono text-xs text-mahiRed">{error}</p>}

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-md px-4 py-2 font-mono text-sm text-mahiDark hover:bg-mahiLight"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="rounded-md bg-mahiBlue px-4 py-2 font-mono text-sm font-bold text-mahiWhite hover:bg-mahiDark disabled:opacity-60"
              >
                {guardando ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
