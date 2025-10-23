"use client";

import { SessionProvider, useSession, signIn } from "next-auth/react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import Navbar from "./Components/Navbar";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <AuthGuard>{children}</AuthGuard>
        </SessionProvider>
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
      router.push("/login");
    }
  }, [status, path]);


  if (status === "loading") {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

 
  if (status === "unauthenticated" && path === "/login") {
    return <>{children}</>; 
  }

 
  if (session) {
    return (
      <div className="bg-black">
        <div className="relative z-[999]">
          <Navbar />
        </div>
        <div className="h-screen w-screen">{children}</div>
      </div>
    );
  }

  return null; 
}

