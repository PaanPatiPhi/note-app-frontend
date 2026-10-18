import { Toaster } from "@/components/ui/toast"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <Toaster>
          <main>
            {children}
          </main>
        </Toaster>
      </body>
    </html>
  )
}