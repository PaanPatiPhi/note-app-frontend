import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "@/lib/auth-context";
import { LanguageProvider } from "@/lib/language-context";
import { Toaster } from "@/components/ui/toast";
import "./globals.css";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "dummy-client-id.apps.googleusercontent.com";

export const metadata = {
  title: "JodJod - สมุดบันทึกส่วนตัว",
  description: "จดทุกอย่างได้ง่ายๆ เข้าถึงได้จากทุกที่ ทั้ง Web และ LINE",
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