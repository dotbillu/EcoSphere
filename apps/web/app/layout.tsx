import Navbar from "./Components/Navbar";
import "./globals.css";
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="bg-black">
          <div className="relative z-[999]">
            <Navbar />
          </div>
          <div className="h-screen w-screen">{children}</div>
        </div>
      </body>
    </html>
  );
}
