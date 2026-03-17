import Link from 'next/link';
// Import các icon cần thiết từ Lucide React
import { Facebook, Instagram, Linkedin, Youtube } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-slate-950 text-slate-400">
      {/* Hiệu ứng ánh sáng ngầm (Ambient Light) ở góc footer */}
      <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-primary-600/10 blur-[100px]" />
      <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-blue-600/10 blur-[100px]" />

      <div className="relative mx-auto max-w-7xl px-6 pb-12 pt-20">
        <div className="grid gap-12 lg:grid-cols-4 md:grid-cols-2">
          
          {/* Cột 1: Brand & Description */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-blue-500 text-white shadow-lg transition-transform group-hover:scale-110">
                <span className="text-xl font-black">F</span>
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">
                Job<span className="text-primary-500">.</span>
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-slate-400">
              Nền tảng kết nối việc làm thời vụ thông minh, giúp sinh viên và người lao động tại Đà Nẵng tìm kiếm cơ hội nhanh chóng.
            </p>
            {/* Newsletter thu nhỏ */}
            <div className="flex max-w-sm items-center rounded-full bg-slate-900 p-1 ring-1 ring-white/10 focus-within:ring-primary-500/50">
              <input 
                type="email" 
                placeholder="Nhận tin tuyển dụng..." 
                className="w-full bg-transparent px-4 py-2 text-xs text-white outline-none"
              />
              <button className="rounded-full bg-primary-600 px-4 py-2 text-xs font-bold text-white hover:bg-primary-500 transition-colors">
                Gửi
              </button>
            </div>
          </div>

          {/* Cột 2: Quick Links */}
          <div>
            <h3 className="mb-6 text-sm font-bold uppercase tracking-widest text-white">Khám phá</h3>
            <ul className="space-y-4">
              <FooterLink href="#" label="Tìm việc làm" />
              <FooterLink href="#" label="Việc làm hot" />
              <FooterLink href="#" label="Công ty hàng đầu" />
              <FooterLink href="#" label="Cẩm nang nghề nghiệp" />
            </ul>
          </div>

          {/* Cột 3: Company */}
          <div>
            <h3 className="mb-6 text-sm font-bold uppercase tracking-widest text-white">F-Job</h3>
            <ul className="space-y-4">
              <FooterLink href="#" label="Về chúng tôi" />
              <FooterLink href="#" label="Chính sách bảo mật" />
              <FooterLink href="#" label="Điều khoản dịch vụ" />
              <FooterLink href="#" label="Liên hệ hỗ trợ" />
            </ul>
          </div>

          {/* Cột 4: Social & Contact */}
          <div>
            <h3 className="mb-6 text-sm font-bold uppercase tracking-widest text-white">Kết nối</h3>
            <p className="mb-5 text-sm">Địa chỉ: Hòa Hải, Ngũ Hành Sơn, Đà Nẵng</p>
            
            {/* --- ĐÂY LÀ PHẦN CẬP NHẬT CHÍNH --- */}
            <div className="flex gap-4">
              <SocialIcon Icon={Facebook} href="#" hoverColor="hover:bg-blue-600" />
              <SocialIcon Icon={Instagram} href="#" hoverColor="hover:bg-pink-600" />
              <SocialIcon Icon={Linkedin} href="#" hoverColor="hover:bg-blue-700" />
              <SocialIcon Icon={Youtube} href="#" hoverColor="hover:bg-red-600" />
            </div>
            {/* ------------------------------------- */}
            
          </div>

        </div>

        {/* Bottom Line */}
        <div className="mt-20 flex flex-col items-center justify-between border-t border-white/5 pt-8 md:flex-row">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} F-Job. Mang lại cơ hội cho mọi người.
          </p>
          <div className="mt-4 flex gap-6 md:mt-0">
            <span className="text-[10px] text-slate-600 font-medium uppercase tracking-[0.2em]">Designed with ❤️ in Da Nang</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Sub-component cho Link để code sạch hơn và có hiệu ứng hover đồng nhất
function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link 
        href={href} 
        className="text-sm transition-all duration-300 hover:text-primary-400 hover:translate-x-1 inline-block"
      >
        {label}
      </Link>
    </li>
  );
}

// --- CẬP NHẬT SUB-COMPONENT SOCIALICON ---
type SocialIconProps = {
  Icon: React.ElementType; // Nhận một component Icon làm prop
  href: string;
  hoverColor: string;
};

function SocialIcon({ Icon, href, hoverColor }: SocialIconProps) {
  return (
    <Link
      href={href}
      className={`flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 border border-white/5 text-white/70 transition-all duration-300 ${hoverColor} hover:text-white hover:-translate-y-1.5 shadow-lg group`}
    >
      {/* Icon hiển thị ở giữa với hiệu ứng scale nhẹ khi hover */}
      <Icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" strokeWidth={1.5} />
    </Link>
  );
}