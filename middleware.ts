import { authMiddleware, redirectToSignIn } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export default authMiddleware({
  publicRoutes: [
    "/",
    "/shops",
    "/shops/(.*)",
    "/api/shops",
    "/api/shops/(.*)/appointments",
    "/api/shops/(.*)/attendance",
    "/api/shops/(.*)/staff",
    "/api/shops/(.*)/reviews",
    "/api/users/init",
    "/api/users/clerk/(.*)"
  ],
  afterAuth(auth, req, evt) {
    if (!auth.userId && !auth.isPublicRoute) {
      return redirectToSignIn({ returnBackUrl: req.url });
    }
    return NextResponse.next();
  },
  // Ignore clock skew in development
  clockSkewInMs: process.env.NODE_ENV === "development" ? 120000 : undefined,
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
