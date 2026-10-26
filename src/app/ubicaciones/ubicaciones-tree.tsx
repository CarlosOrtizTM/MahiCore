"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal, { BotonesModal, estiloInput, estiloLabel } from "@/components/modal";

type Rol = "lector" | "editor" | "administrador";
type Rack = { id: string; nombre: string; unidadesU: number; equipos: number };
type Sala = { id: string; nombre: string; racks: Rack[] };
type Piso = { id: string; numero: number; salas: Sala[] };
type Sede = { id: string; nombre: string; direccion: string | null; pisos: Piso[] };

type Tipo = "sedes" | "pisos" | "salas" | "racks";
type Dialogo = {
  modo: "crear" | "editar";
  tipo: Tipo;
  padreId?: string; // sedeId, pisoId o salaId según el tipo
  id?: string;
  valores?: Record<string, string | number | null>;
};

const TITULO: Record<Tipo, string> = { sedes: "sede", pisos: "piso", salas: "sala", racks: "rack" };
const PADRE: Partial<Record<Tipo, string>> = { pisos: "sedeId", salas: "pisoId", racks: "salaId" };

const link = "text-xs text-mahiBlue hover:underline";
const linkRojo = "text-xs text-mahiRed hover:underline";

export default function UbicacionesTree({ sedes, rol }: { sedes: Sede[]; rol: Rol }) {
  const router = useRouter();
  const puedeEditar = rol === "editor" || rol === "administrador";
  const puedeBorrar = rol === "administrador";

  const [dlg, setDlg] = useState<Dialogo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  function abrir(d: Dialogo) {
    setError(null);
    setDlg(d);
  }

  async function guardar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!dlg) return;
    setError(null);
    setGuardando(true);

    const f = new FormData(e.currentTarget);
    const t = (k: string) => String(f.get(k) ?? "");
    const body: Record<string, unknown> = {};
    if (dlg.tipo === "sedes") {
      body.nombre = t("nombre");
      body.direccion = t("direccion");
    } else if (dlg.tipo === "pisos") {
      body.numero = Number(t("numero"));
    } else if (dlg.tipo === "salas") {
      body.nombre = t("nombre");
    } else {
      body.nombre = t("nombre");
      body.unidadesU = Number(t("unidadesU"));
    }
    if (dlg.modo === "crear" && PADRE[dlg.tipo]) body[PADRE[dlg.tipo]!] = dlg.padreId;

    const url =
      dlg.modo === "crear" ? `/api/ubicaciones/${dlg.tipo}` : `/api/ubicaciones/${dlg.tipo}/${dlg.id}`;
    const res = await fetch(url, {
      method: dlg.modo === "crear" ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setGuardando(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "No se pudo guardar.");
      return;
    }
    setDlg(null);
    router.refresh();
  }

  async function eliminar(tipo: Tipo, id: string, nombre: string, aviso: string) {
    if (!confirm(`¿Eliminar ${TITULO[tipo]} "${nombre}"?\n\n${aviso}`)) return;
    const res = await fetch(`/api/ubicaciones/${tipo}/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      alert(data?.error ?? "No se pudo eliminar.");
      return;
    }
    router.refresh();
  }

  const v = dlg?.valores ?? {};

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-mono text-2xl font-bold uppercase text-mahiDark">Ubicaciones</h1>
        {puedeEditar && (
          <button
            onClick={() => abrir({ modo: "crear", tipo: "sedes" })}
            className="rounded-md bg-mahiBlue px-4 py-2 font-mono text-sm font-bold text-mahiWhite shadow-lg shadow-mahiBlue/30 hover:bg-mahiDark"
          >
            + Nueva sede
          </button>
        )}
      </div>

      {sedes.length === 0 && (
        <p className="font-mono text-sm text-mahiDark/60">No hay sedes registradas.</p>
      )}

      {sedes.map((sede) => (
        <div key={sede.id} className="mb-6 rounded-md bg-mahiWhite p-6 shadow-lg shadow-mahiDark/30">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-mono text-lg font-bold text-mahiDark">{sede.nombre}</h2>
            {puedeEditar && (
              <>
                <button className={link} onClick={() => abrir({ modo: "crear", tipo: "pisos", padreId: sede.id })}>
                  + Piso
                </button>
                <button
                  className={link}
                  onClick={() =>
                    abrir({ modo: "editar", tipo: "sedes", id: sede.id, valores: { nombre: sede.nombre, direccion: sede.direccion } })
                  }
                >
                  Editar
                </button>
              </>
            )}
            {puedeBorrar && (
              <button
                className={linkRojo}
                onClick={() =>
                  eliminar("sedes", sede.id, sede.nombre, "Se eliminarán también sus pisos, salas, racks, equipos, puertos y enlaces.")
                }
              >
                Eliminar
              </button>
            )}
          </div>
          {sede.direccion && <p className="font-mono text-xs text-mahiDark/60">{sede.direccion}</p>}

          {sede.pisos.map((piso) => (
            <div key={piso.id} className="ml-4 mt-4">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="font-mono text-sm font-bold text-mahiBlue">Piso {piso.numero}</h3>
                {puedeEditar && (
                  <>
                    <button className={link} onClick={() => abrir({ modo: "crear", tipo: "salas", padreId: piso.id })}>
                      + Sala
                    </button>
                    <button
                      className={link}
                      onClick={() => abrir({ modo: "editar", tipo: "pisos", id: piso.id, valores: { numero: piso.numero } })}
                    >
                      Editar
                    </button>
                  </>
                )}
                {puedeBorrar && (
                  <button
                    className={linkRojo}
                    onClick={() =>
                      eliminar("pisos", piso.id, `Piso ${piso.numero}`, "Se eliminarán también sus salas, racks, equipos, puertos y enlaces.")
                    }
                  >
                    Eliminar
                  </button>
                )}
              </div>

              {piso.salas.map((sala) => (
                <div key={sala.id} className="ml-4 mt-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-mono text-sm text-mahiDark">{sala.nombre}</p>
                    {puedeEditar && (
                      <>
                        <button className={link} onClick={() => abrir({ modo: "crear", tipo: "racks", padreId: sala.id, valores: { unidadesU: 42 } })}>
                          + Rack
                        </button>
                        <button
                          className={link}
                          onClick={() => abrir({ modo: "editar", tipo: "salas", id: sala.id, valores: { nombre: sala.nombre } })}
                        >
                          Editar
                        </button>
                      </>
                    )}
                    {puedeBorrar && (
                      <button
                        className={linkRojo}
                        onClick={() =>
                          eliminar("salas", sala.id, sala.nombre, "Se eliminarán también sus racks, equipos, puertos y enlaces.")
                        }
                      >
                        Eliminar
                      </button>
                    )}
                  </div>

                  {sala.racks.length > 0 && (
                    <div className="ml-4 mt-2 flex flex-wrap gap-2">
                      {sala.racks.map((rack) => (
                        <span
                          key={rack.id}
                          className="flex items-center gap-2 bg-mahiLight px-2 py-1 font-mono text-xs text-mahiDark"
                        >
                          {rack.nombre} ({rack.unidadesU}U · {rack.equipos} eq.)
                          {puedeEditar && (
                            <button
                              className={link}
                              onClick={() =>
                                abrir({ modo: "editar", tipo: "racks", id: rack.id, valores: { nombre: rack.nombre, unidadesU: rack.unidadesU } })
                              }
                            >
                              Editar
                            </button>
                          )}
                          {puedeBorrar && (
                            <button
                              className={linkRojo}
                              onClick={() =>
                                eliminar("racks", rack.id, rack.nombre, "Se eliminarán también sus equipos, puertos y enlaces.")
                              }
                            >
                              Eliminar
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}

      {dlg && (
        <Modal
          titulo={`${dlg.modo === "crear" ? "Nuevo" : "Editar"} ${TITULO[dlg.tipo]}`}
          onClose={() => setDlg(null)}
        >
          <form onSubmit={guardar}>
            <div className="flex flex-col gap-3">
              {dlg.tipo === "pisos" ? (
                <label className={estiloLabel}>
                  Número de piso
                  <input name="numero" type="number" required defaultValue={v.numero ?? ""} className={estiloInput} />
                </label>
              ) : (
                <label className={estiloLabel}>
                  Nombre
                  <input name="nombre" required defaultValue={String(v.nombre ?? "")} className={estiloInput} />
                </label>
              )}
              {dlg.tipo === "sedes" && (
                <label className={estiloLabel}>
                  Dirección
                  <input name="direccion" defaultValue={String(v.direccion ?? "")} className={estiloInput} />
                </label>
              )}
              {dlg.tipo === "racks" && (
                <label className={estiloLabel}>
                  Unidades (U)
                  <input name="unidadesU" type="number" min={1} max={60} required defaultValue={v.unidadesU ?? 42} className={estiloInput} />
                </label>
              )}
            </div>
            {error && <p role="alert" className="mt-3 font-mono text-xs text-mahiRed">{error}</p>}
            <BotonesModal onCancel={() => setDlg(null)} guardando={guardando} />
          </form>
        </Modal>
      )}
    </>
  );
}
