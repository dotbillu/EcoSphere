"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import Provider from "./Provider";
import Navbar from "./Components/Navbar";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-black">
      {/* Set bg-black here */}
      <body className="bg-black min-h-screen">
        {" "}
        {/* Set bg-black here and ensure height */}
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
    // Redirect unauthenticated users away from restricted pages
    if (status === "unauthenticated" && path !== "/login") {
      router.replace("/login");
    }
  }, [status, path, router]);

  if (status === "loading") {
    // Full screen black loading state
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50 min-h-screen w-screen">
        <span className="loading loading-dots loading-xl text-white"></span>
      </div>
    );
  }

  // Allow unauthenticated access only on the /login page
  if (status === "unauthenticated" && path === "/login") {
    return <div className="bg-black min-h-screen w-screen">{children}</div>;
  }

  // Authenticated layout
  if (session) {
    return (
      <div className="bg-black min-h-screen w-screen">
        {children}
        <Navbar />
      </div>
    );
  }

  // Return null or a simple container while status is resolving on restricted pages
  return null;
}
