import type { Metadata } from "next";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { getSession } from "@/lib/session";
import { createServerSupabaseClient } from '@/lib/supabase/server';

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const client = createServerSupabaseClient();

  let user = null;

  if (session) {
    if (session.userType === 'job_seeker') {
      const { data } = await client
        .from('job_seeker_profiles')
        .select('full_name, avatar_url')
        .eq('user_id', session.userId)
        .single();

      if (data) {
        user = {
          name: data.full_name,
          avatar_url: data.avatar_url,
        };
      }
    }

    if (session.userType === 'employer') {
      const { data } = await client
        .from('employer_profiles')
        .select('business_name, avatar_url')
        .eq('user_id', session.userId)
        .single();

      if (data) {
        user = {
          name: data.business_name,
          avatar_url: data.avatar_url,
        };
      }
    }
  }

  return (
    <html lang="vi">
      <body className="flex min-h-screen flex-col">
        <Header user={user} />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}