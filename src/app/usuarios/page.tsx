import { redirect } from "next/navigation";
import Navbar from "@/components/navbar";
import { prisma } from "@/lib/db";
import { requirePageSession } from "@/lib/guard";
import UsuariosTable from "./usuarios-table";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const { user } = await requirePageSession();
  if (user.role !== "administrador") redirect("/");

  const usuarios = await prisma.user.findMany({
    orderBy: { username: "asc" },
    select: { id: true, username: true, role: true, activo: true, cambioPendiente: true, bloqueadoHasta: true },
  });

  return (
    <main className="min-h-screen bg-mahiLight">
      <Navbar />
      <div className="p-8">
        <UsuariosTable
          yoId={user.id}
          usuarios={usuarios.map((u) => ({
            ...u,
            bloqueado: !!u.bloqueadoHasta && u.bloqueadoHasta > new Date(),
          }))}
        />
      </div>
    </main>
  );
}
