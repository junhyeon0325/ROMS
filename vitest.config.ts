// Vitest가 프로젝트 경로 별칭을 사용해 Node 환경의 순수 로직 테스트만 실행하도록 설정한다.
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,
  },
});
