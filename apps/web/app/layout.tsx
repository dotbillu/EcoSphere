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
      <body className="bg-black min-h-screen overscroll-none">
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

  if (status === "loading") {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <span className="loading loading-dots loading-xl text-white"></span>
      </div>
    );
  }

  if (status === "unauthenticated" && path === "/login") {
    return (
      <div className="bg-black min-h-screen w-full flex flex-col">
        {children}
      </div>
    );
  }

  if (session) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative w-full">
          {children}
        </div>
        
        <div className="flex-none z-50 w-full bg-black">
          <Navbar />
        </div>
      </div>
    );
  }

  return null;
}
