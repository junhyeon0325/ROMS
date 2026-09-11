// app/layout.tsx
/**
 * [전체 루트 레이아웃 컴포넌트]
 * - Next.js 서비스의 최상위 기본 HTML 뼈대(Root Layout)
 * - 전역 폰트 로드, 기본 메타데이터(SEO), 다크모드 초기화 스크립트 실행
 */
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "ROMS — Season Report",
  description: '러너리그 오버워치 e스포츠 전적 및 통합 대시보드 시스템',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const saved = localStorage.getItem('roms_theme');
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (saved === 'dark' || (!saved && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Noto+Sans+KR:wght@400;500;700;900&family=JetBrains+Mono:wght@500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}

