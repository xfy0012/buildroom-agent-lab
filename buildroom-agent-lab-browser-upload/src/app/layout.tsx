import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Buildroom · Agent Lab', description: 'A deterministic, local multi-agent orchestration playground.' };
export default function Layout({ children }: Readonly<{
    children: React.ReactNode;
}>) { return <html lang="en"><body>{children}</body></html>; }
