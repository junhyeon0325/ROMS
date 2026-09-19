// NextAuth 세션과 JWT에 서버가 보증하는 사용자 식별자 및 역할 타입을 확장한다.
import type { DefaultSession } from "next-auth";

type AuthRole = "USER" | "ADMIN" | "DEV";

declare module "next-auth" {
  interface User {
    role: AuthRole;
  }

  interface Session {
    user: {
      id: string;
      role: AuthRole;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: AuthRole;
  }
}
