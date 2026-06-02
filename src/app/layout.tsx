import { BRAND_NAME } from "@/config/brand";
import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/components/ToastProvider";

const outfit = Outfit({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${BRAND_NAME} — Administration`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");if(t==="dark")document.documentElement.classList.add("dark");}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${outfit.className} dark:bg-gray-900`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <AuthProvider>
            <SidebarProvider>
              {children}
              <ToastProvider />
            </SidebarProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
