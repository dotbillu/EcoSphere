"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">Login to EcoSphere</h1>

      <button
        onClick={() => signIn("google", { callbackUrl: "/house" })}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md"
      >
        Login with Google
      </button>
    </div>
  );
}

