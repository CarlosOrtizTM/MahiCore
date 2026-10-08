import Image from "next/image";

export default function LoginPage() {
  return (
    <main
      className="relative flex min-h-screen items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('/login-bg.jpg')" }}
    >
      <div className="absolute inset-0 bg-mahiDark/50" />

      <div className="relative z-10 w-full max-w-sm rounded-md bg-mahiWhite p-8 shadow-xl/30">
        <div className="mb-1 flex items-center gap-3 justify-center">
          <Image src="/logo-mahicore.png" alt="Logo MahiCore" width={250} height={100} />
  <br />
        </div>

      <br />
        <form className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="username" className="text-xs font-mono uppercase text-mahiDark">
              Usuario
            </label>
            <input
              id="username"
              name="username"
              type="text"
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
              className="border rounded-md inset-shadow-sm/50 border-mahiDark bg-mahiWhite px-3 py-2 font-mono text-sm text-mahiDark outline-none focus:border-mahiBlue"
            />
          </div>

          <button
            type="submit"
            className="mt-2 bg-mahiBlue px-4 py-2 text-sm font-bold text-mahiWhite rounded-md shadow-lg shadow-mahiBlue/30 hover:bg-mahiDark hover:shadow-mahiDark/30"
          >
            Ingresar
          </button>
        </form>
      </div>
    </main>
  );
}