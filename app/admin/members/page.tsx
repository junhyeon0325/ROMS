// File: app/admin/members/page.tsx
// Page/Component: AdminMembersCompatibilityPage
// Purpose: 기존 회원 관리 URL을 스트리머 관리 URL로 연결한다.
import { redirect } from "next/navigation";

// 기존 URL 접근을 새 스트리머 관리 경로로 이동한다.
export default function AdminMembersCompatibilityPage() { redirect("/admin/streamers"); }
