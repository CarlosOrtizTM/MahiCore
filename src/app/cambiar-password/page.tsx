import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import CambiarPasswordForm from "./form";

export default async function CambiarPasswordPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <main className="flex min-h-screen items-center justify-center bg-mahiLight p-4">
      <div className="w-full max-w-sm rounded-md bg-mahiWhite p-8 shadow-xl/30">
        <h1 className="mb-1 font-mono text-lg font-bold uppercase text-mahiDark">
          Cambiar contraseña
        </h1>
        <p className="mb-6 font-mono text-xs text-mahiDark">
          Por seguridad debes definir una contraseña nueva antes de continuar.
        </p>
        <CambiarPasswordForm />
      </div>
    </main>
  );
}
