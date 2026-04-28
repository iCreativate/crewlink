import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/app/providers";
import { FreelancerEmergencyListener } from "@/components/FreelancerEmergencyListener";
import { TopNav } from "@/components/layout/TopNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CrewLink — Crew & media jobs",
    template: "%s · CrewLink",
  },
  description:
    "Connect freelancers with media houses: jobs, profiles, and portfolio in one production-ready workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <TopNav />
          <FreelancerEmergencyListener />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-zinc-200 py-8 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
            © {new Date().getFullYear()} CrewLink. All rights reserved.
          </footer>
        </Providers>
      </body>
    </html>
  );
}
