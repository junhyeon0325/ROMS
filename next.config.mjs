/** @type {import('next').NextConfig} */
// 실제 페이지를 차단하지 않고 외부 리소스 정책 위반을 관찰한다.
const contentSecurityPolicyReportOnly = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' https://overfast-api.tekrop.fr https://d15f34w2p8l1cc.cloudfront.net https://nng-phinf.pstatic.net",
  "connect-src 'self'",
].join("; ");

const nextConfig = {
  reactStrictMode: true,
  // API와 정적 자산을 제외한 현재 페이지 응답에서만 Report-Only 헤더를 보낸다.
  async headers() {
    return ["/", "/login", "/admin/:path*"].map((source) => ({
      source,
      headers: [
        {
          key: "Content-Security-Policy-Report-Only",
          value: contentSecurityPolicyReportOnly,
        },
      ],
    }));
  },
};

export default nextConfig;
