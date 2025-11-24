"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import Provider from "./Provider";
import Navbar from "@shared/Navbar";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-black">
      <body className="bg-black min-h-dvh">
        <Provider>
          <SessionProvider>
            <AuthGuard>{children}</AuthGuard>
          </SessionProvider>
        </Provider>
      </body>
    </html>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    if (status === "unauthenticated" && path !== "/login") {
      router.replace("/login");
    }
  }, [status, path, router]);

  // loading
  if (status === "loading") {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50 min-h-dvh w-screen">
        <span className="loading loading-dots loading-xl text-white"></span>
      </div>
    );
  }

  if (status === "unauthenticated" && path === "/login") {
    return (
      <div className="bg-black min-h-dvh w-screen flex flex-col">
        {children}
      </div>
    );
  }

  if (session) {
    return (
      <div className="bg-black min-h-dvh w-screen relative flex flex-col">
        {/* scrollable content */}
        <div className="flex-1 overflow-y-auto pb-[72px]">{children}</div>

        {/* floating bottom navbar */}
        <div className="fixed bottom-0 left-0 w-full z-50">
          <Navbar />
        </div>
      </div>
    );
  }

  return null;
}
