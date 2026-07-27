import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'
import { AppDataProvider } from '@/components/AppDataProvider'
import { ThemeProvider } from '@/components/ThemeProvider'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          themes={['light', 'dark', 'reading']}
        >
          <AuthProvider>
            <AppDataProvider>{children}</AppDataProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
