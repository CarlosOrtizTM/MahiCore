import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

const MAX_INTENTOS = 5;
const BLOQUEO_MINUTOS = 15;
const SESION_SEGUNDOS = 60 * 60; // JWT de 1 hora

// Hash descartable para igualar el tiempo de respuesta cuando el usuario no existe
const HASH_FALSO =
  "00000000000000000000000000000000:" + "0".repeat(128);

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: SESION_SEGUNDOS },
  jwt: { maxAge: SESION_SEGUNDOS },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username?.trim();
        const password = credentials?.password;
        if (!username || !password) return null;

        const user = await prisma.user.findUnique({ where: { username } });

        if (!user) {
          verifyPassword(password, HASH_FALSO);
          return null;
        }

        if (!user.activo) {
          verifyPassword(password, HASH_FALSO);
          return null; // cuenta desactivada (misma respuesta que credenciales incorrectas)
        }

        const ahora = new Date();
        if (user.bloqueadoHasta && user.bloqueadoHasta > ahora) {
          throw new Error("BLOQUEADO");
        }

        if (!verifyPassword(password, user.passwordHash)) {
          const intentos = user.intentosFallidos + 1;
          const bloquear = intentos >= MAX_INTENTOS;
          await prisma.user.update({
            where: { id: user.id },
            data: {
              intentosFallidos: bloquear ? 0 : intentos,
              bloqueadoHasta: bloquear
                ? new Date(ahora.getTime() + BLOQUEO_MINUTOS * 60_000)
                : null,
            },
          });
          if (bloquear) throw new Error("BLOQUEADO");
          return null;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { intentosFallidos: 0, bloqueadoHasta: null },
        });

        return {
          id: user.id,
          name: user.username,
          role: user.role,
          cambioPendiente: user.cambioPendiente,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.cambioPendiente = user.cambioPendiente;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.id,
        name: token.name ?? "",
        role: token.role,
        cambioPendiente: token.cambioPendiente,
      };
      return session;
    },
  },
};
