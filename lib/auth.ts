// NextAuth Credentials 로그인과 JWT 세션에 적용할 서버 전용 인증 설정이다.
import { compare } from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

const LOGIN_ROLES = new Set(["ADMIN", "DEV"]);

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "관리자 계정",
      credentials: {
        email: { label: "이메일", type: "email" },
        password: { label: "비밀번호", type: "password" },
      },
      // DB의 bcrypt 해시를 검증하고 관리자 계정만 NextAuth 사용자로 반환한다.
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        if (!email || !password || password.length > 200) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !LOGIN_ROLES.has(user.role)) return null;

        const passwordMatches = await compare(password, user.passwordHash);
        if (!passwordMatches) return null;

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // 로그인 직후 DB 식별자와 역할만 서명된 JWT에 보존한다.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    // 서버에서 검증된 JWT 값만 세션 사용자 정보로 공개한다.
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email ?? "";
        session.user.role = token.role;
      }
      return session;
    },
  },
};
