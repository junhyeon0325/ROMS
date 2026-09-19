// File: app/admin/developer/layout.tsx
// Component: DeveloperLayout
// Purpose: 향후 추가될 모든 개발자 전용 관리자 화면에 DEV 권한 경계를 일괄 적용한다.
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AuthorizationError, requireDeveloper } from "@/lib/auth-guards";

// ADMIN을 거부하고 DEV 세션만 하위 개발자 페이지에 진입시킨다.
export default async function DeveloperLayout({ children }: { children: ReactNode }) {
  try {
    await requireDeveloper();
  } catch (error) {
    if (error instanceof AuthorizationError && error.status === 401) {
      redirect("/login?callbackUrl=/admin/developer");
    }
    redirect("/admin");
  }

  return children;
}
