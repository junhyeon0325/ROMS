// 관리자 입력 이미지 URL이 안전한 HTTPS 절대 URL인지 검사한다.
export function validateHttpsImageUrl(value: string): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:"
      ? null
      : "이미지 URL은 https: 주소만 사용할 수 있습니다.";
  } catch {
    return "이미지 URL 형식이 올바르지 않습니다.";
  }
}
