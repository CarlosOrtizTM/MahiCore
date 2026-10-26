"use client";

export default function Modal({
  titulo,
  onClose,
  children,
}: {
  titulo: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-mahiDark/50 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-md bg-mahiWhite p-6 shadow-xl">
        <h2 className="mb-4 font-mono text-lg font-bold uppercase text-mahiDark">{titulo}</h2>
        {children}
      </div>
    </div>
  );
}

export const estiloInput =
  "w-full border rounded-md border-mahiDark bg-mahiWhite px-3 py-2 font-mono text-sm text-mahiDark outline-none focus:border-mahiBlue";
export const estiloLabel =
  "flex flex-col gap-1 font-mono text-xs uppercase text-mahiDark";

export function BotonesModal({
  onCancel,
  guardando,
}: {
  onCancel: () => void;
  guardando: boolean;
}) {
  return (
    <div className="mt-5 flex justify-end gap-3">
      <button
        type="button"
        onClick={onCancel}
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
  );
}
