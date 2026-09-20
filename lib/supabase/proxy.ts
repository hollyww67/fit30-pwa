import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const noStore = (result: NextResponse) => {
    result.headers.set("Cache-Control", "private, no-store");
    return result;
  };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const path = request.nextUrl.pathname;
  const publicPath = path === "/auth" || path === "/login" || path === "/auth/callback" || path === "/auth/update-password";
  if (!url || !key) {
    return noStore(publicPath
      ? response
      : new NextResponse("Сервис временно недоступен.", { status: 503 }));
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookies) {
        cookies.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !publicPath) {
    const redirect = NextResponse.redirect(new URL("/auth", request.url));
    response.cookies.getAll().forEach(({ name, value, ...options }) => redirect.cookies.set(name, value, options));
    return noStore(redirect);
  }
  if (user && (path === "/auth" || path === "/login")) {
    const redirect = NextResponse.redirect(new URL("/today", request.url));
    response.cookies.getAll().forEach(({ name, value, ...options }) => redirect.cookies.set(name, value, options));
    return noStore(redirect);
  }
  return noStore(response);
}
