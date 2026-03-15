import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "F-Job - Nền tảng việc làm thời vụ",
  description:
    "F-Job kết nối người lao động thời vụ với nhà tuyển dụng sự kiện tại Việt Nam. Tìm việc nhanh, uy tín, an toàn.",
  openGraph: {
    title: "F-Job - Nền tảng việc làm thời vụ",
    description:
      "Kết nối người lao động thời vụ với nhà tuyển dụng sự kiện tại Việt Nam.",
    locale: "vi_VN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
