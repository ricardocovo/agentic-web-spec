import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/context";
import { Nav } from "@/components/Nav";
import { RepoBar } from "@/components/RepoBar";

export const metadata: Metadata = {
  title: "Web-Spec",
  description: "Generate specs and tasks ready for agentic development",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-text-primary font-body">
        <AppProvider>
          <Nav />
          <RepoBar />
          <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
        </AppProvider>
      </body>
    </html>
  );
}
