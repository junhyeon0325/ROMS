// 요청별로 검증된 관리자 식별자를 Prisma 감사 기록 계층에 전달한다.
import { AsyncLocalStorage } from "node:async_hooks";

const auditActorStorage = new AsyncLocalStorage<string>();

// 인증된 사용자를 현재 요청의 비동기 실행 문맥에 설정한다.
export function setAuditActor(userId: string): void {
  auditActorStorage.enterWith(userId);
}

// Prisma 쓰기 계층이 현재 요청의 감사 주체를 조회한다.
export function getAuditActor(): string | undefined {
  return auditActorStorage.getStore();
}
