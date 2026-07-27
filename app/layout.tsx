import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'workspace.rent',
  description: 'Design your workspace, then rent it by the week.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
