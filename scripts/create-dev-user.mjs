// 터미널에서만 이메일·비밀번호를 받아 bcrypt 해시가 적용된 최초 DEV 계정을 생성한다.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const prisma = new PrismaClient();
const { hash } = bcrypt;

// 입력 문자를 출력하지 않고 TTY에서 비밀번호 한 줄을 읽는다.
function readSecret(prompt) {
  if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
    throw new Error("비밀번호 보호를 위해 대화형 터미널에서 실행해야 합니다.");
  }

  return new Promise((resolve, reject) => {
    let value = "";
    stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    // 비밀번호 입력이 끝나면 TTY 모드와 이벤트 리스너를 원래 상태로 복구한다.
    const cleanup = () => {
      stdin.off("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
    };

    // 엔터·취소·백스페이스를 구분해 화면에 평문을 쓰지 않고 입력값을 조립한다.
    const onData = (character) => {
      if (character === "\u0003") {
        cleanup();
        stdout.write("\n");
        reject(new Error("사용자가 계정 생성을 취소했습니다."));
        return;
      }
      if (character === "\r" || character === "\n") {
        cleanup();
        stdout.write("\n");
        resolve(value);
        return;
      }
      if (character === "\u007f" || character === "\b") {
        value = value.slice(0, -1);
        return;
      }
      value += character;
    };

    stdin.on("data", onData);
  });
}

// 기존 계정을 변경하지 않고 검증된 입력으로 새 DEV 계정만 생성한다.
async function main() {
  const readline = createInterface({ input: stdin, output: stdout });
  const email = (await readline.question("DEV 이메일: ")).trim().toLowerCase();
  readline.close();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("유효한 이메일을 입력해주세요.");
  }

  const password = await readSecret("DEV 비밀번호(12자 이상): ");
  const confirmation = await readSecret("비밀번호 확인: ");
  if (password.length < 12) throw new Error("비밀번호는 12자 이상이어야 합니다.");
  if (password !== confirmation) throw new Error("입력한 비밀번호가 일치하지 않습니다.");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("이미 등록된 이메일입니다. 기존 계정은 변경하지 않았습니다.");

  const passwordHash = await hash(password, 12);
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: "DEV",
      createdBy: "create-dev-user",
    },
  });

  stdout.write(`DEV 계정이 생성되었습니다: ${email}\n`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
