import Navbar from "@/components/navbar";

export default function ReportesPage() {
  return (
    <main className="min-h-screen bg-mahiLight">
      <Navbar />
      <div className="p-8">
    <h1 className="mb-6 font-mono text-2xl font-bold uppercase text-mahiDark">
          Reportes
        </h1>
        <div className="rounded-md shadow-lg shadow-1x/30 bg-mahiWhite p-6">
        <p className="font-mono text-sm text-mahiDark">
            Reportes de activos
        </p>
        </div>
      </div>
    </main>
  );
}
