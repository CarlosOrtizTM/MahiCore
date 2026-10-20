import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

/**
 * Solo mejora la experiencia (redirigir al login). La seguridad real está
 * en requireRole() / requirePageSession(). Las rutas /api se protegen en
 * cada handler, por eso quedan fuera del matcher.
 */
export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    if (req.nextauth.token?.cambioPendiente && pathname !== "/cambiar-password") {
      return NextResponse.redirect(new URL("/cambiar-password", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: { authorized: ({ token }) => !!token },
    pages: { signIn: "/login" },
  },
);

export const config = {
  matcher: [
    "/((?!api|login|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)",
  ],
};
