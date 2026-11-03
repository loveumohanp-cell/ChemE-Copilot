import type { Metadata } from "next"; import "./globals.css";
export const metadata: Metadata = { title: "ChemE Copilot", description: "Grounded chemical-engineering research assistant" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
