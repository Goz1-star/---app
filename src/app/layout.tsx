import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "无名小卒工坊",
  description: "软件技术专业学校工作室管理 App",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
