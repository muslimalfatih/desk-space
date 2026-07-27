import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'workspace.rent — Build it before you rent it',
  description:
    'Design your workspace in 3D, then rent it by the week. Desks, chairs, monitors and accessories — delivered and set up.',
  openGraph: {
    title: 'workspace.rent — Build it before you rent it',
    description: 'Design your workspace in 3D, then rent it by the week.',
    siteName: 'workspace.rent',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
