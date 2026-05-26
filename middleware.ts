export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    // Match all routes except public ones
    "/((?!_next/static|_next/image|favicon.ico|share|api/auth).*)",
  ],
};
