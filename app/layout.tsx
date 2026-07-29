import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "ROMS - Runner's Overwatch Match System",
  description: '러너리그 오버워치 e스포츠 전적 및 통합 대시보드 시스템',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-[#0b0e14] text-gray-100 antialiased flex flex-col">
        {children}
      </body>
    </html>
  );
}
