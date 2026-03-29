"use client";
import { useEffect } from "react";
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to our backend
    fetch("/api/debug/log-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        level: "ERROR",
        message: error.message || "Global app crash",
        stack: error.stack,
        path: window.location.pathname,
      }),
    }).catch((err) => console.error("Failed to log global error:", err));
  }, [error]);
  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
          <div className="text-center max-w-md w-full bg-white p-8 rounded-lg shadow-sm border border-red-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h2>
            <cat app/api/debug/user/route.tsp className="text-gray-60"use client";
import { useEffect }erimport { use. export default function GlobalErr    error,
  reset,
}: {
  error          resetnC}: {
  )   ere  reset: () => void;
}) {
  useEffecla}) {
  useEffect(()py  uro    // Log the errw-    fetch("/api/debug/log-error", co      method: "POST",
      he    Tr      he            </      body: JSON.stringify({
        level: "ERROR",

         level: "ERROR"echo "InVzZSBjbGllbnQiOwoKaW1wb3J0IHsgdXNlRWZmZWN0IH0gZnJvbSAicmVhY3QiOwoKZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gR2xvYmFsRXJyb3IoewogIGVycm9yLAogIHJlc2V0LAp9OiB7CiAgZXJyb3I6IEVycm9yICYgeyBkaWdlc3Q/OiBzdHJpbmcgfTsKICByZXNldDogKCkgPT4gdm9pZDsKfSkgewogIHVzZUVmZmVjdCgoKSA9PiB7CiAgICAvLyBMb2cgdGhlIGVycm9yIHRvIG91ciBiYWNrZW5kCiAgICBmZXRjaCgiL2FwaS9kZWJ1Zy9sb2ctZXJyb3IiLCB7CiAgICAgIG1ldGhvZDogIlBPU1QiLAogICAgICBoZWFkZXJzOiB7ICJDb250ZW50LVR5cGUiOiAiYXBwbGljYXRpb24vanNvbiIgfSwKICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoewogICAgICAgIGxldmVsOiAiRVJST1IiLAogICAgICAgIG1lc3NhZ2U6IGVycm9yLm1lc3NhZ2UgfHwgIkdsb2JhbCBhcHAgY3Jhc2giLAogICAgICAgIHN0YWNrOiBlcnJvci5zdGFjaywKICAgICAgICBwYXRoOiB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUsCiAgICAgIH0pLAogICAgfSkuY2F0Y2goKGVycikgPT4gY29uc29sZS5lcnJvcigiRmFpbGVkIHRvIGxvZyBnbG9iYWwgZXJyb3I6IiwgZXJyKSk7CiAgfSwgW2Vycm9yXSk7CgogIHJldHVybiAoCiAgICA8aHRtbD4KICAgICAgPGJvZHk+CiAgICAgICAgPGRpdiBjbGFzc05hbWU9ImZsZXggbWluLWgtc2NyZWVuIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBiZy1ncmF5LTUwIHB4LTQgcHktMTIiPgogICAgICAgICAgPGRpdiBjbGFzc05hbWU9InRleHQtY2VudGVyIG1heC13LW1kIHctZnVsbCBiZy13aGl0ZSBwLTggcm91bmRlZC1sZyBzaGFkb3ctc20gYm9yZGVyIGJvcmRlci1yZWQtMTAwIj4KICAgICAgICAgICAgPGgyIGNsYXNzTmFtZT0idGV4dC0yeGwgZm9udC1ib2xkIHRleHQtZ3JheS05MDAgbWItNCI+U29tZXRoaW5nIHdlbnQgd3Jvbmc8L2gyPgogICAgICAgICAgICA8cCBjbGFzc05hbWU9InRleHQtZ3JheS02MDAgbWItNiI+CiAgICAgICAgICAgICAgQSBjcml0aWNhbCBlcnJvciBvY2N1cnJlZC4gT3VyIHRlYW0gaGFzIGJlZW4gbm90aWZpZWQuCiAgICAgICAgICAgIDwvcD4KICAgICAgICAgICAgPGJ1dHRvbgogICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHJlc2V0KCl9CiAgICAgICAgICAgICAgY2xhc3NOYW1lPSJiZy1ibGFjayB0ZXh0LXdoaXRlIHB4LTQgcHktMiByb3VuZGVkIGZvbnQtbWVkaXVtIHctZnVsbCBob3ZlcjpiZy1ncmF5LTgwMCB0cmFuc2l0aW9uLWNvbG9ycyIKICAgICAgICAgICAgPgogICAgICAgICAgICAgIFRyeSBhZ2FpbgogICAgICAgICAgICA8L2J1dHRvbj4KICAgICAgICAgIDwvZGl2PgogICAgICAgIDwvZGl2PgogICAgICA8L2JvZHk+CiAgICA8L2h0bWw+CiAgKTsKfQ==" | base64 --decode > app/global-error.tsx
