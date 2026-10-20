import Image from "next/image";
import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <main
      className="relative flex min-h-screen items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('/login-bg.jpg')" }}
    >
      <div className="absolute inset-0 bg-mahiDark/50" />

      <div className="relative z-10 w-full max-w-sm rounded-md bg-mahiWhite p-8 shadow-xl/30">
        <div className="mb-6 flex items-center justify-center gap-3">
          <Image src="/logo-mahicore.png" alt="Logo MahiCore" width={250} height={100} />
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
