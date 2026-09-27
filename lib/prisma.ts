// Prisma 쓰기 요청에 현재 인증 사용자의 생성자·수정자 정보를 적용한다.
import { PrismaClient } from "@prisma/client";
import { getAuditActor } from "@/lib/audit-context";

type AuditMode = "create" | "update";
type DataRecord = Record<string, unknown>;

// 생성·수정 데이터와 중첩 관계 쓰기에 감사 사용자 ID를 재귀 적용한다.
function stampData(value: unknown, actor: string, mode: AuditMode): unknown {
  if (Array.isArray(value)) return value.map((item) => stampData(item, actor, mode));
  if (!value || typeof value !== "object" || value instanceof Date) return value;

  const result: DataRecord = { ...(value as DataRecord) };
  if (mode === "create") result.createdBy = actor;
  result.updatedBy = actor;

  for (const [key, nested] of Object.entries(result)) {
    if (key === "create") result[key] = stampData(nested, actor, "create");
    else if (key === "createMany") {
      const batch = nested as DataRecord;
      result[key] = batch && typeof batch === "object" && "data" in batch
        ? { ...batch, data: stampData(batch.data, actor, "create") }
        : stampData(nested, actor, "create");
    } else if (key === "update") {
      if (Array.isArray(nested)) {
        result[key] = nested.map((entry) => {
          if (!entry || typeof entry !== "object") return entry;
          const update = entry as DataRecord;
          return "data" in update ? { ...update, data: stampData(update.data, actor, "update") } : stampData(entry, actor, "update");
        });
      } else if (nested && typeof nested === "object" && "data" in nested) {
        const update = nested as DataRecord;
        result[key] = { ...update, data: stampData(update.data, actor, "update") };
      } else result[key] = stampData(nested, actor, "update");
    } else if (key === "upsert" || key === "connectOrCreate") {
      const stampBranch = (branch: unknown, branchMode: AuditMode): unknown => {
        if (Array.isArray(branch)) return branch.map((entry) => stampBranch(entry, branchMode));
        if (!branch || typeof branch !== "object") return branch;
        const item = { ...(branch as DataRecord) };
        if ("create" in item) item.create = stampData(item.create, actor, "create");
        if ("update" in item) item.update = stampData(item.update, actor, "update");
        return Object.keys(item).some((name) => name === "create" || name === "update")
          ? item
          : stampData(item, actor, branchMode);
      };
      result[key] = stampBranch(nested, "create");
    }
  }
  return result;
}

// Prisma 작업 유형별 입력 데이터에 검증된 요청 사용자를 덮어쓴다.
function stampArgs(operation: string, args: DataRecord, actor: string): DataRecord {
  const result = { ...args };
  if (operation === "create" || operation === "createMany" || operation === "createManyAndReturn") {
    result.data = stampData(result.data, actor, "create");
  } else if (operation === "update" || operation === "updateMany" || operation === "updateManyAndReturn") {
    result.data = stampData(result.data, actor, "update");
  } else if (operation === "upsert") {
    result.create = stampData(result.create, actor, "create");
    result.update = stampData(result.update, actor, "update");
  }
  return result;
}

const globalForPrisma = global as unknown as { prisma: ReturnType<typeof createPrisma> };

// 단일 Prisma 클라이언트에 모든 모델 쓰기의 감사 필드 처리를 등록한다.
function createPrisma() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  }).$extends({
    query: {
      $allModels: {
        async $allOperations({ operation, args, query }) {
          const actor = getAuditActor();
          if (!actor || !["create", "createMany", "createManyAndReturn", "update", "updateMany", "updateManyAndReturn", "upsert"].includes(operation)) {
            return query(args);
          }
          return query(stampArgs(operation, args as DataRecord, actor));
        },
      },
    },
  });
}

export const prisma = globalForPrisma.prisma || createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
