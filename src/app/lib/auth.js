// lib/auth.js
import GoogleProvider from "next-auth/providers/google";

/**
 * ตั้งค่า NextAuth ให้ session มี email เสมอ
 * และให้ getServerSession ใช้ชุดเดียวกันทุกที่
 *
 * ต้องมี .env.local:
 *  NEXTAUTH_SECRET=...
 *  NEXTAUTH_URL=http://localhost:3000
 *  GOOGLE_CLIENT_ID=...
 *  GOOGLE_CLIENT_SECRET=...
 *  ADMIN_EMAILS=admin1@example.com,admin2@example.com
 */
export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      // scopes เริ่มต้นมี "openid email profile" อยู่แล้ว
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt", // ใช้ JWT ให้แน่ใจว่า middleware/getServerSession ทำงานตรงกัน
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      // ใส่ email ลง token ให้ชัวร์
      if (profile?.email) token.email = profile.email;
      return token;
    },
    async session({ session, token }) {
      // ใส่ email ลง session ให้ชัวร์
      if (token?.email) session.user = { ...(session.user || {}), email: token.email };
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
};
