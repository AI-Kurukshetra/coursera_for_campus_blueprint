import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Campus LMS",
  description: "Campus Learning Management Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#0A0F1E] font-sans antialiased text-[#F8FAFC]">
        {children}
      </body>
    </html>
  );
}
