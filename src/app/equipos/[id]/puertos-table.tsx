"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal, { BotonesModal, estiloInput, estiloLabel } from "@/components/modal";

type Rol = "lector" | "editor" | "administrador";
type Destino = {
  enlaceId: string;
  medio: string;
  etiquetaCable: string | null;
  equipo: string;
  equipoId: string;
  puerto: number;
  etiquetaPuerto: string | null;
};
type Puerto = {
  id: string;
  numero: number;
  tipo: string;
  vlan: number | null;
  etiqueta: string | null;
  destino: Destino | null;
};
type PuertoLibre = { id: string; numero: number; etiqueta: string | null; libre: boolean };

const MEDIOS = [
  { v: "utp_cat6", t: "UTP Cat6" },
  { v: "fibra", t: "Fibra" },
  { v: "coaxial", t: "Coaxial" },
];

const th = "px-4 py-3 font-mono text-xs uppercase text-mahiDark";
const td = "px-4 py-2 font-mono text-sm";

export default function PuertosTable({
  puertos,
  otrosEquipos,
  rol,
}: {
  puertos: Puerto[];
  otrosEquipos: { id: string; nombre: string; tipo: string }[];
  rol: Rol;
}) {
  const router = useRouter();
  const puedeEditar = rol === "editor" || rol === "administrador";

  const [editando, setEditando] = useState<Puerto | null>(null);
  const [conectando, setConectando] = useState<Puerto | null>(null);
  const [destinoPuertos, setDestinoPuertos] = useState<PuertoLibre[]>([]);
  const [cargandoPuertos, setCargandoPuertos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function guardarPuerto(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editando) return;
    setError(null);
    setGuardando(true);
    const f = new FormData(e.currentTarget);
    const vlan = String(f.get("vlan") ?? "");
    const res = await fetch(`/api/puertos/${editando.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ etiqueta: String(f.get("etiqueta") ?? ""), vlan: vlan ? Number(vlan) : null }),
    });
    setGuardando(false);
    if (!res.ok) {
      setError((await res.json().catch(() => null))?.error ?? "No se pudo guardar.");
      return;
    }
    setEditando(null);
    router.refresh();
  }

  async function elegirEquipoDestino(equipoId: string) {
    setDestinoPuertos([]);
    if (!equipoId) return;
    setCargandoPuertos(true);
    const res = await fetch(`/api/equipos/${equipoId}/puertos`);
    setCargandoPuertos(false);
    if (res.ok) setDestinoPuertos(await res.json());
  }

  async function conectar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!conectando) return;
    setError(null);
    setGuardando(true);
    const f = new FormData(e.currentTarget);
    const res = await fetch("/api/enlaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        puertoAId: conectando.id,
        puertoBId: String(f.get("puertoB") ?? ""),
        medio: String(f.get("medio") ?? ""),
        etiqueta: String(f.get("etiqueta") ?? ""),
      }),
    });
    setGuardando(false);
    if (!res.ok) {
      setError((await res.json().catch(() => null))?.error ?? "No se pudo conectar.");
      return;
    }
    setConectando(null);
    router.refresh();
  }

  async function desconectar(p: Puerto) {
    if (!p.destino) return;
    if (!confirm(`¿Desconectar el puerto ${p.numero} de «${p.destino.equipo}» (puerto ${p.destino.puerto})?\n\nEl enlace queda dado de baja en el historial.`)) return;
    const res = await fetch(`/api/enlaces/${p.destino.enlaceId}`, { method: "DELETE" });
    if (!res.ok) {
      alert((await res.json().catch(() => null))?.error ?? "No se pudo desconectar.");
      return;
    }
    router.refresh();
  }

  return (
    <>
      <h2 className="mb-3 font-mono text-lg font-bold uppercase text-mahiDark">
        Puertos ({puertos.length})
      </h2>
      <div className="overflow-x-auto rounded-md bg-mahiWhite p-6 shadow-lg shadow-mahiDark/30">
        <table className="w-full text-left">
          <thead className="border-b-2 border-mahiDark">
            <tr>
              <th className={th}>Puerto</th>
              <th className={th}>Tipo</th>
              <th className={th}>VLAN</th>
              <th className={th}>Etiqueta</th>
              <th className={th}>Conectado a</th>
              {puedeEditar && <th className={th}>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {puertos.map((p) => (
              <tr key={p.id} className="border-b border-mahiLight">
                <td className={td}>{p.numero}</td>
                <td className={td}>{p.tipo}</td>
                <td className={td}>{p.vlan ?? "—"}</td>
                <td className={td}>{p.etiqueta ?? "—"}</td>
                <td className={td}>
                  {p.destino ? (
                    <span>
                      <a href={`/equipos/${p.destino.equipoId}`} className="text-mahiBlue hover:underline">
                        {p.destino.equipo}
                      </a>{" "}
                      · puerto {p.destino.puerto}
                      {p.destino.etiquetaPuerto ? ` (${p.destino.etiquetaPuerto})` : ""} · {p.destino.medio}
                      {p.destino.etiquetaCable ? ` · cable ${p.destino.etiquetaCable}` : ""}
                    </span>
                  ) : (
                    <span className="text-mahiDark/50">Libre</span>
                  )}
                </td>
                {puedeEditar && (
                  <td className={td}>
                    <button
                      className="mr-3 text-mahiBlue hover:underline"
                      onClick={() => { setError(null); setEditando(p); }}
                    >
                      Etiqueta
                    </button>
                    {p.destino ? (
                      <button className="text-mahiRed hover:underline" onClick={() => desconectar(p)}>
                        Desconectar
                      </button>
                    ) : (
                      <button
                        className="text-mahiBlue hover:underline"
                        onClick={() => { setError(null); setDestinoPuertos([]); setConectando(p); }}
                      >
                        Conectar
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {puertos.length === 0 && (
              <tr>
                <td colSpan={6} className={`${td} text-center text-mahiDark/60`}>
                  Este equipo no tiene puertos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editando && (
        <Modal titulo={`Puerto ${editando.numero}`} onClose={() => setEditando(null)}>
          <form onSubmit={guardarPuerto}>
            <div className="flex flex-col gap-3">
              <label className={estiloLabel}>
                Etiqueta (oficina o destino)
                <input name="etiqueta" defaultValue={editando.etiqueta ?? ""} className={estiloInput} />
              </label>
              <label className={estiloLabel}>
                VLAN
                <input name="vlan" type="number" min={1} max={4094} defaultValue={editando.vlan ?? ""} className={estiloInput} />
              </label>
            </div>
            {error && <p role="alert" className="mt-3 font-mono text-xs text-mahiRed">{error}</p>}
            <BotonesModal onCancel={() => setEditando(null)} guardando={guardando} />
          </form>
        </Modal>
      )}

      {conectando && (
        <Modal titulo={`Conectar puerto ${conectando.numero}`} onClose={() => setConectando(null)}>
          <form onSubmit={conectar}>
            <div className="flex flex-col gap-3">
              <label className={estiloLabel}>
                Equipo destino
                <select
                  required
                  defaultValue=""
                  onChange={(e) => elegirEquipoDestino(e.target.value)}
                  className={estiloInput}
                >
                  <option value="" disabled>Selecciona un equipo</option>
                  {otrosEquipos.map((o) => (
                    <option key={o.id} value={o.id}>{o.nombre} ({o.tipo})</option>
                  ))}
                </select>
              </label>
              <label className={estiloLabel}>
                Puerto destino (solo libres)
                <select name="puertoB" required defaultValue="" disabled={cargandoPuertos} className={estiloInput}>
                  <option value="" disabled>
                    {cargandoPuertos ? "Cargando..." : "Selecciona un puerto"}
                  </option>
                  {destinoPuertos.filter((d) => d.libre).map((d) => (
                    <option key={d.id} value={d.id}>
                      Puerto {d.numero}{d.etiqueta ? ` — ${d.etiqueta}` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label className={estiloLabel}>
                Medio
                <select name="medio" defaultValue="utp_cat6" className={estiloInput}>
                  {MEDIOS.map((m) => (
                    <option key={m.v} value={m.v}>{m.t}</option>
                  ))}
                </select>
              </label>
              <label className={estiloLabel}>
                Etiqueta del cable (opcional)
                <input name="etiqueta" className={estiloInput} />
              </label>
            </div>
            {error && <p role="alert" className="mt-3 font-mono text-xs text-mahiRed">{error}</p>}
            <BotonesModal onCancel={() => setConectando(null)} guardando={guardando} />
          </form>
        </Modal>
      )}
    </>
  );
}
