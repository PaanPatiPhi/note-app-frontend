import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "@/lib/auth-context";
import { LanguageProvider } from "@/lib/language-context";
import { Toaster } from "@/components/ui/toast";
import "./globals.css";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "dummy-client-id.apps.googleusercontent.com";

export const metadata = {
  title: "จดจด — พี่จ๊อด เลขาส่วนตัวในแชท",
  description: "พิมพ์บอกพี่จ๊อดใน LINE หรือบนเว็บ แล้วพี่จ๊อดจะจด ทำลิสต์ ตั้งเตือน และลงนัดใน Google Calendar ให้",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="min-h-screen bg-[#F0EFEB] text-[#26343F] antialiased">
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <AuthProvider>
            <LanguageProvider>
              <Toaster>
                <main className="min-h-screen">
                  {children}
                </main>
              </Toaster>
            </LanguageProvider>
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}