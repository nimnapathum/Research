import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Security Trust Study Portal',
  description: 'Participant workspace and research operations for the security trust study'
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
