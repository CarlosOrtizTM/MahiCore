"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal, { BotonesModal, estiloInput, estiloLabel } from "@/components/modal";

type Rol = "lector" | "editor" | "administrador";
type Equipo = {
  id: string;
  nombre: string;
  tipo: string;
  estado: string;
  salaId: string;
  salaNombre: string;
  rackId: string | null;
  rackNombre: string | null;
  uInicio: number | null;
  alturaU: number;
  responsableId: string | null;
  responsableNombre: string | null;
  direccionIp: string | null;
  dns: string | null;
  marca: string | null;
  modelo: string | null;
  descripcion: string | null;
};
type Opcion = { id: string; etiqueta: string };

const TIPOS = ["switch", "router", "firewall", "camara", "access_point", "servidor", "patch_panel", "otro"];
const ESTADOS = ["activo", "mantenimiento", "baja"];

const th = "px-4 py-3 font-mono text-xs uppercase text-mahiDark";
const td = "px-4 py-3 font-mono text-sm";

export default function EquiposTable({
  equipos,
  salas,
  racks,
  responsables,
  rol,
}: {
  equipos: Equipo[];
  salas: Opcion[];
  racks: (Opcion & { unidadesU: number })[];
  responsables: { id: string; nombre: string }[];
  rol: Rol;
}) {
  const router = useRouter();
  const puedeEditar = rol === "editor" || rol === "administrador";
  const puedeBorrar = rol === "administrador";

  const [modal, setModal] = useState<{ modo: "crear" | "editar"; equipo?: Equipo } | null>(null);
  const [rackSel, setRackSel] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  function abrir(modo: "crear" | "editar", equipo?: Equipo) {
    setError(null);
    setRackSel(equipo?.rackId ?? "");
    setModal({ modo, equipo });
  }

  async function guardar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!modal) return;
    setError(null);
    setGuardando(true);

    const f = new FormData(e.currentTarget);
    const texto = (k: string) => String(f.get(k) ?? "");
    const rackId = texto("rackId") || null;
    const body = {
      nombre: texto("nombre"),
      tipo: texto("tipo"),
      estado: texto("estado"),
      rackId,
      salaId: rackId ? null : texto("salaId") || null,
      uInicio: rackId && texto("uInicio") ? Number(texto("uInicio")) : null,
      alturaU: texto("alturaU") ? Number(texto("alturaU")) : 1,
      responsableId: texto("responsableId") || null,
      direccionIp: texto("direccionIp") || null,
      dns: texto("dns") || null,
      marca: texto("marca") || null,
      modelo: texto("modelo") || null,
      descripcion: texto("descripcion") || null,
      ...(modal.modo === "crear"
        ? { cantidadPuertos: texto("cantidadPuertos") ? Number(texto("cantidadPuertos")) : null }
        : {}),
    };

    const editar = modal.modo === "editar" && modal.equipo;
    const res = await fetch(editar ? `/api/equipos/${modal.equipo!.id}` : "/api/equipos", {
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

  async function eliminar(eq: Equipo) {
    if (!confirm(`¿Eliminar el equipo "${eq.nombre}"?\n\nTambién se eliminarán sus puertos y enlaces.`)) return;
    const res = await fetch(`/api/equipos/${eq.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      alert(data?.error ?? "No se pudo eliminar.");
      return;
    }
    router.refresh();
  }

  const ubicacionRack = (eq: Equipo) =>
    eq.rackNombre
      ? `${eq.rackNombre}${eq.uInicio ? ` · U${eq.uInicio}${eq.alturaU > 1 ? `–U${eq.uInicio + eq.alturaU - 1}` : ""}` : ""}`
      : "—";

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-mono text-2xl font-bold uppercase text-mahiDark">Equipos</h1>
        {puedeEditar && (
          <button
            onClick={() => abrir("crear")}
            disabled={salas.length === 0}
            title={salas.length === 0 ? "Primero crea una sala en Ubicaciones" : undefined}
            className="rounded-md bg-mahiBlue px-4 py-2 font-mono text-sm font-bold text-mahiWhite shadow-lg shadow-mahiBlue/30 hover:bg-mahiDark disabled:opacity-50"
          >
            + Nuevo equipo
          </button>
        )}
      </div>

      {puedeEditar && salas.length === 0 && (
        <p className="mb-4 font-mono text-xs text-mahiRed">
          Para registrar equipos primero crea una sede, piso y sala en Ubicaciones.
        </p>
      )}

      <div className="overflow-x-auto rounded-md bg-mahiWhite p-6 shadow-xl/30">
        <table className="w-full text-left">
          <thead className="border-b-2 border-mahiDark">
            <tr>
              <th className={th}>Nombre</th>
              <th className={th}>Tipo</th>
              <th className={th}>IP</th>
              <th className={th}>Estado</th>
              <th className={th}>Sala</th>
              <th className={th}>Rack / U</th>
              <th className={th}>Responsable</th>
              <th className={th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {equipos.map((eq) => (
              <tr key={eq.id} className="border-b border-mahiLight">
                <td className={td}>
                  <a href={`/equipos/${eq.id}`} className="text-mahiBlue hover:underline">{eq.nombre}</a>
                </td>
                <td className={td}>{eq.tipo}</td>
                <td className={td}>{eq.direccionIp ?? "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 font-mono text-xs uppercase ${
                      eq.estado === "activo"
                        ? "bg-mahiBlue text-mahiWhite"
                        : eq.estado === "mantenimiento"
                          ? "bg-yellow-500 text-mahiDark"
                          : "bg-mahiRed text-mahiWhite"
                    }`}
                  >
                    {eq.estado}
                  </span>
                </td>
                <td className={td}>{eq.salaNombre}</td>
                <td className={td}>{ubicacionRack(eq)}</td>
                <td className={td}>{eq.responsableNombre ?? "—"}</td>
                <td className={td}>
                  <a href={`/equipos/${eq.id}`} className="mr-3 text-mahiBlue hover:underline">Puertos</a>
                  {puedeEditar && (
                    <button onClick={() => abrir("editar", eq)} className="mr-3 text-mahiBlue hover:underline">
                      Editar
                    </button>
                  )}
                  {puedeBorrar && (
                    <button onClick={() => eliminar(eq)} className="text-mahiRed hover:underline">
                      Eliminar
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {equipos.length === 0 && (
              <tr>
                <td colSpan={8} className={`${td} text-center text-mahiDark/60`}>
                  No hay equipos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal
          titulo={modal.modo === "crear" ? "Nuevo equipo" : "Editar equipo"}
          onClose={() => setModal(null)}
        >
          <form onSubmit={guardar}>
            <div className="flex flex-col gap-3">
              <label className={estiloLabel}>
                Nombre
                <input name="nombre" required defaultValue={modal.equipo?.nombre ?? ""} className={estiloInput} />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className={estiloLabel}>
                  Tipo
                  <select name="tipo" defaultValue={modal.equipo?.tipo ?? "switch"} className={estiloInput}>
                    {TIPOS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </label>
                <label className={estiloLabel}>
                  Estado
                  <select name="estado" defaultValue={modal.equipo?.estado ?? "activo"} className={estiloInput}>
                    {ESTADOS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className={estiloLabel}>
                Rack
                <select
                  name="rackId"
                  value={rackSel}
                  onChange={(e) => setRackSel(e.target.value)}
                  className={estiloInput}
                >
                  <option value="">— Sin rack —</option>
                  {racks.map((r) => (
                    <option key={r.id} value={r.id}>{r.etiqueta}</option>
                  ))}
                </select>
              </label>

              {!rackSel && (
                <label className={estiloLabel}>
                  Sala
                  <select name="salaId" required defaultValue={modal.equipo?.salaId ?? ""} className={estiloInput}>
                    <option value="" disabled>Selecciona una sala</option>
                    {salas.map((s) => (
                      <option key={s.id} value={s.id}>{s.etiqueta}</option>
                    ))}
                  </select>
                </label>
              )}

              <div className="grid grid-cols-2 gap-3">
                <label className={estiloLabel}>
                  U inicial
                  <input
                    name="uInicio"
                    type="number"
                    min={1}
                    required={!!rackSel}
                    disabled={!rackSel}
                    defaultValue={modal.equipo?.uInicio ?? ""}
                    className={`${estiloInput} disabled:bg-mahiLight disabled:opacity-60`}
                  />
                </label>
                <label className={estiloLabel}>
                  Altura (U)
                  <input
                    name="alturaU"
                    type="number"
                    min={1}
                    required={!!rackSel}
                    disabled={!rackSel}
                    defaultValue={modal.equipo?.alturaU ?? 1}
                    className={`${estiloInput} disabled:bg-mahiLight disabled:opacity-60`}
                  />
                </label>
              </div>
              {!rackSel && (
                <p className="-mt-2 font-mono text-[11px] text-mahiDark/60">
                  Elige un rack para asignar unidades U.
                </p>
              )}

              <div className="grid grid-cols-2 gap-3">
                <label className={estiloLabel}>
                  Dirección IP
                  <input name="direccionIp" defaultValue={modal.equipo?.direccionIp ?? ""} placeholder="10.0.0.1" className={estiloInput} />
                </label>
                <label className={estiloLabel}>
                  Servidores DNS
                  <input name="dns" defaultValue={modal.equipo?.dns ?? ""} placeholder="8.8.8.8, 1.1.1.1" className={estiloInput} />
                </label>
                <label className={estiloLabel}>
                  Marca
                  <input name="marca" defaultValue={modal.equipo?.marca ?? ""} className={estiloInput} />
                </label>
                <label className={estiloLabel}>
                  Modelo
                  <input name="modelo" defaultValue={modal.equipo?.modelo ?? ""} className={estiloInput} />
                </label>
              </div>

              {modal.modo === "crear" && (
                <label className={estiloLabel}>
                  Cantidad de puertos
                  <input
                    name="cantidadPuertos"
                    type="number"
                    min={0}
                    max={96}
                    placeholder="Por defecto según el tipo"
                    className={estiloInput}
                  />
                </label>
              )}

              <label className={estiloLabel}>
                Descripción
                <input name="descripcion" defaultValue={modal.equipo?.descripcion ?? ""} className={estiloInput} />
              </label>

              <label className={estiloLabel}>
                Responsable
                <select name="responsableId" defaultValue={modal.equipo?.responsableId ?? ""} className={estiloInput}>
                  <option value="">— Sin responsable —</option>
                  {responsables.map((r) => (
                    <option key={r.id} value={r.id}>{r.nombre}</option>
                  ))}
                </select>
              </label>
            </div>

            {error && <p role="alert" className="mt-3 font-mono text-xs text-mahiRed">{error}</p>}
            <BotonesModal onCancel={() => setModal(null)} guardando={guardando} />
          </form>
        </Modal>
      )}
    </>
  );
}
