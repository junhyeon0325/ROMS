# ROMS

ROMS(Runner-league Overwatch Management System)는 오버워치 e스포츠 아카이브와 운영 데이터를 관리하는 Next.js 기반 웹 애플리케이션입니다. 현재 관리자 인증, 스트리머·영웅·맵·공통 코드 관리, 외부 데이터 연동 기능을 제공합니다.

## 기술 구성

- Next.js 14 App Router
- React 18, TypeScript
- Tailwind CSS
- Prisma ORM, PostgreSQL
- NextAuth.js Credentials 인증

## 주요 폴더 구조

```text
app/          페이지, 레이아웃, Route Handler
components/   여러 화면에서 재사용하는 UI와 레이아웃 컴포넌트
lib/          인증, 도메인 서비스, 검증, DTO, 클라이언트, 외부 연동
prisma/       Prisma 스키마와 데이터베이스 마이그레이션
scripts/      개발 계정 생성과 개발일지 연동 스크립트
types/        외부 라이브러리 타입 보강 선언
산출물/       기획 문서, 화면 설계 자료, 로컬 개발일지
```

## 로컬 실행

필수 조건은 Node.js와 npm, 접근 가능한 PostgreSQL 데이터베이스입니다.

```bash
npm install
```

프로젝트 실행 전에 루트 `.env`에 `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`을 설정합니다. `.env`와 로컬 환경변수 파일은 Git에 포함하지 않습니다. Notion 개발일지 연동에는 `NOTION_API_KEY`, `NOTION_PAGE_ID`, `NOTION_DATABASE_ID`가 추가로 필요합니다.

```bash
npm run dev
```

기본 개발 서버는 `http://localhost:3000`에서 실행됩니다.

## 환경변수

| 변수 | 필수 여부 | 용도 |
| --- | --- | --- |
| `DATABASE_URL` | 필수 | 애플리케이션이 사용하는 PostgreSQL 연결 문자열 |
| `DIRECT_URL` | 필수 | Prisma 마이그레이션과 직접 연결에 사용하는 PostgreSQL 연결 문자열 |
| `NEXTAUTH_SECRET` | 필수 | NextAuth 세션과 토큰 서명에 사용하는 비밀값 |
| `NEXTAUTH_URL` | 필수 | NextAuth 콜백 기준이 되는 애플리케이션 URL |
| `NOTION_API_KEY` | 선택 | 개발일지 업로드 명령에서 사용하는 Notion 통합 키 |
| `NOTION_PAGE_ID` | 선택 | 개발일지를 업로드할 Notion 대상 페이지 또는 데이터베이스 ID |
| `NOTION_DATABASE_ID` | 선택 | `NOTION_PAGE_ID` 대신 사용할 수 있는 호환 변수 |

`NEXT_PUBLIC_*` 변수는 브라우저 번들에 노출될 수 있으므로 비밀값을 저장하지 않습니다. 현재 저장소 코드에서 사용이 확인되지 않은 로컬 변수는 예시 파일에 포함하지 않았습니다.

## Prisma 초기화와 마이그레이션

Prisma Client를 생성합니다.

```bash
npx prisma generate
```

로컬 개발 데이터베이스에 기존 마이그레이션을 적용하거나 새 마이그레이션을 생성합니다.

```bash
npx prisma migrate dev
```

배포 환경에서는 저장소에 포함된 마이그레이션만 적용합니다.

```bash
npx prisma migrate deploy
```

마이그레이션 파일을 만들지 않고 현재 스키마를 데이터베이스에 반영해야 하는 제한적인 로컬 작업에는 다음 명령을 사용할 수 있습니다.

```bash
npm run db:push
```

데이터를 확인할 때는 Prisma Studio를 실행합니다.

```bash
npm run db:studio
```

## 개발·빌드·검증 명령

```bash
npm run dev
npm run test
npm run lint
npx tsc --noEmit --incremental false
npm run build
npm run start
git diff --check
```

- `npm run dev`: 개발 서버 실행
- `npm run test`: Vitest 단위 테스트 일회 실행
- `npm run lint`: Next.js Core Web Vitals 규칙으로 정적 검사
- `npx tsc --noEmit --incremental false`: 파일을 생성하지 않는 TypeScript 검사
- `npm run build`: 프로덕션 빌드 검증
- `npm run start`: 생성된 프로덕션 빌드 실행
- `git diff --check`: 공백 오류와 충돌 표식 확인

`npm run user:create-dev`는 대화형으로 개발자 계정을 생성합니다. `npm run log:notion`은 외부 Notion 데이터를 변경하므로 명시적으로 필요한 경우에만 실행합니다.

## CSP 운영 상태

현재 CSP는 `Content-Security-Policy-Report-Only`로 운영하며, production 관리자 화면에서 JavaScript 오류 없이 이미지와 Google Fonts가 정상 표시되는 것을 확인했습니다. 인라인 스크립트 관련 Report-Only 메시지는 남아 있습니다.

정적 렌더링과 CDN 캐시 영향을 피하기 위해 nonce 기반 강제 CSP는 보류합니다. 강제 전환 전에는 운영 CDN·프록시 캐시 정책, 인증된 관리자 화면, 기존 이미지 hostname 목록을 확인하고 nonce 또는 hash 적용 후 회귀 테스트를 수행해야 합니다. Report-Only는 실제 사용 리소스를 관찰하면서 페이지 차단 없이 정책 근거를 축적하기 위해 유지합니다.
