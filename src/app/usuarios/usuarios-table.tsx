"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal, { BotonesModal, estiloInput, estiloLabel } from "@/components/modal";

type Rol = "lector" | "editor" | "administrador";
type Usuario = {
  id: string;
  username: string;
  role: Rol;
  activo: boolean;
  cambioPendiente: boolean;
  bloqueado: boolean;
};

const ROLES: Rol[] = ["lector", "editor", "administrador"];
const th = "px-4 py-3 font-mono text-xs uppercase text-mahiDark";
const td = "px-4 py-3 font-mono text-sm";

export default function UsuariosTable({ usuarios, yoId }: { usuarios: Usuario[]; yoId: string }) {
  const router = useRouter();
  const [nuevo, setNuevo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [credencial, setCredencial] = useState<{ username: string; password: string } | null>(null);
  const [copiado, setCopiado] = useState(false);

  async function llamar(url: string, method: string, body?: unknown) {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => null);
    return { ok: res.ok, data };
  }

  async function crear(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    const f = new FormData(e.currentTarget);
    const { ok, data } = await llamar("/api/usuarios", "POST", {
      username: String(f.get("username") ?? ""),
      role: String(f.get("role") ?? "lector"),
    });
    setGuardando(false);
    if (!ok) {
      setError(data?.error ?? "No se pudo crear el usuario.");
      return;
    }
    setNuevo(false);
    setCredencial({ username: data.usuario.username, password: data.passwordTemporal });
    router.refresh();
  }

  async function cambiarRol(u: Usuario, role: string) {
    const { ok, data } = await llamar(`/api/usuarios/${u.id}`, "PUT", { role });
    if (!ok) alert(data?.error ?? "No se pudo cambiar el rol.");
    router.refresh();
  }

  async function alternarActivo(u: Usuario) {
    const accion = u.activo ? "desactivar" : "activar";
    if (!confirm(`¿Quieres ${accion} la cuenta "${u.username}"?`)) return;
    const { ok, data } = await llamar(`/api/usuarios/${u.id}`, "PUT", { activo: !u.activo });
    if (!ok) alert(data?.error ?? "No se pudo actualizar.");
    router.refresh();
  }

  async function restablecer(u: Usuario) {
    if (!confirm(`¿Restablecer la contraseña de "${u.username}"?\n\nSe generará una contraseña temporal y deberá cambiarla al ingresar.`)) return;
    const { ok, data } = await llamar(`/api/usuarios/${u.id}/restablecer`, "POST");
    if (!ok) {
      alert(data?.error ?? "No se pudo restablecer.");
      return;
    }
    setCopiado(false);
    setCredencial({ username: data.username, password: data.passwordTemporal });
    router.refresh();
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-mono text-2xl font-bold uppercase text-mahiDark">Usuarios</h1>
        <button
          onClick={() => { setError(null); setNuevo(true); }}
          className="rounded-md bg-mahiBlue px-4 py-2 font-mono text-sm font-bold text-mahiWhite shadow-lg shadow-mahiBlue/30 hover:bg-mahiDark"
        >
          + Nuevo usuario
        </button>
      </div>

      <div className="overflow-x-auto rounded-md bg-mahiWhite p-6 shadow-lg shadow-mahiDark/30">
        <table className="w-full text-left">
          <thead className="border-b-2 border-mahiDark">
            <tr>
              <th className={th}>Usuario</th>
              <th className={th}>Rol</th>
              <th className={th}>Estado</th>
              <th className={th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => {
              const soyYo = u.id === yoId;
              return (
                <tr key={u.id} className="border-b border-mahiLight">
                  <td className={td}>
                    {u.username} {soyYo && <span className="text-mahiDark/50">(tú)</span>}
                  </td>
                  <td className={td}>
                    <select
                      value={u.role}
                      disabled={soyYo}
                      onChange={(e) => cambiarRol(u, e.target.value)}
                      className="rounded-md border border-mahiDark bg-mahiWhite px-2 py-1 text-sm disabled:opacity-50"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                  <td className={td}>
                    <span className={u.activo ? "text-mahiDark" : "text-mahiRed"}>
                      {u.activo ? "activo" : "desactivado"}
                    </span>
                    {u.cambioPendiente && <span className="ml-2 text-xs text-mahiDark/60">· cambio de contraseña pendiente</span>}
                    {u.bloqueado && <span className="ml-2 text-xs text-mahiRed">· bloqueado</span>}
                  </td>
                  <td className={td}>
                    <button onClick={() => restablecer(u)} className="mr-3 text-mahiBlue hover:underline">
                      Restablecer contraseña
                    </button>
                    {!soyYo && (
                      <button
                        onClick={() => alternarActivo(u)}
                        className={u.activo ? "text-mahiRed hover:underline" : "text-mahiBlue hover:underline"}
                      >
                        {u.activo ? "Desactivar" : "Activar"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {nuevo && (
        <Modal titulo="Nuevo usuario" onClose={() => setNuevo(false)}>
          <form onSubmit={crear}>
            <div className="flex flex-col gap-3">
              <label className={estiloLabel}>
                Usuario
                <input name="username" required minLength={3} maxLength={40} className={estiloInput} />
              </label>
              <label className={estiloLabel}>
                Rol
                <select name="role" defaultValue="lector" className={estiloInput}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </label>
              <p className="font-mono text-[11px] text-mahiDark/60">
                Se generará una contraseña temporal que verás una sola vez.
              </p>
            </div>
            {error && <p role="alert" className="mt-3 font-mono text-xs text-mahiRed">{error}</p>}
            <BotonesModal onCancel={() => setNuevo(false)} guardando={guardando} />
          </form>
        </Modal>
      )}

      {credencial && (
        <Modal titulo="Contraseña temporal" onClose={() => setCredencial(null)}>
          <p className="mb-3 font-mono text-sm text-mahiDark">
            Entrégasela a <strong>{credencial.username}</strong>. Se muestra una sola vez y deberá cambiarla al ingresar.
          </p>
          <div className="rounded-md bg-mahiLight p-3 text-center font-mono text-lg font-bold tracking-wider text-mahiDark select-all">
            {credencial.password}
          </div>
          <div className="mt-5 flex justify-end gap-3">
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(credencial.password);
                  setCopiado(true);
                } catch {
                  setCopiado(false);
                }
              }}
              className="rounded-md px-4 py-2 font-mono text-sm text-mahiBlue hover:bg-mahiLight"
            >
              {copiado ? "Copiado ✓" : "Copiar"}
            </button>
            <button
              onClick={() => setCredencial(null)}
              className="rounded-md bg-mahiBlue px-4 py-2 font-mono text-sm font-bold text-mahiWhite hover:bg-mahiDark"
            >
              Listo
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
