import { Amiri } from 'next/font/google';
import './globals.css';

const amiri = Amiri({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-amiri',
});

export const metadata = {
  title: 'Quran AI App',
  description: 'Quran reader with AI Tafseer Chat and Emotional Support Mode',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={amiri.variable}>
      <body>{children}</body>
    </html>
  );
}
