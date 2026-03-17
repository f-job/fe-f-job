'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation'; // Thêm cái này để nhận diện trang
import { useRouter } from 'next/navigation';

type Props = {
    user: {
        name?: string;
        avatar_url?: string;
        email?: string;
    } | null;
};

export default function Header({ user }: Props) {
    const router = useRouter();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();

    // Kiểm tra xem có đang ở trang chủ (nơi có Hero xanh) hay không
    const isHomePage = pathname === '/';
    const handleLogout = async () => {
        try {
            // Gọi API để xoá cookie session
            await fetch('/api/auth/logout', {
                method: 'POST',
            });


            router.push('/dang-nhap');
            router.refresh();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // LOGIC WOW: 
    // Nếu ở trang chủ: Scroll mới hiện nền trắng. 
    // Nếu ở trang khác: Luôn hiện nền trắng mờ để không bị mất chữ.
    const headerStyles = (isScrolled || !isHomePage)
        ? 'border-b border-gray-200/50 bg-white/80 backdrop-blur-xl py-3 shadow-sm'
        : 'bg-transparent backdrop-blur-none py-5';

    const navLinkStyles = (isScrolled || !isHomePage)
        ? 'text-gray-700 hover:text-primary-600'
        : 'text-white/90 hover:text-white';

    const logoTextStyles = (isScrolled || !isHomePage) ? 'text-gray-900' : 'text-white';

    return (
        <header className={`fixed top-0 z-[100] w-full transition-all duration-500 ease-in-out ${headerStyles}`}>
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6">

                {/* Logo */}
                <Link href="/" className="group flex items-center gap-2.5">
                    <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary-600 to-blue-600 shadow-lg transition-transform duration-300 group-hover:scale-110">
                        <span className="text-xl font-black text-white">F</span>
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
                    </div>
                    <span className={`text-2xl font-black tracking-tighter transition-colors duration-300 ${logoTextStyles}`}>
                        Job<span className="text-primary-500">.</span>
                    </span>
                </Link>

                {/* Navigation */}
                <nav className="hidden md:flex items-center gap-8">
                    {['Việc làm', 'Công cụ', 'Cẩm nang nghề nghiệp'].map((item) => (
                        <Link
                            key={item}
                            href="#"
                            className={`relative text-sm font-bold transition-all duration-300 group ${navLinkStyles}`}
                        >
                            {item}
                            <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-primary-500 transition-all duration-300 group-hover:w-full" />
                        </Link>
                    ))}
                </nav>

                {/* Right side */}
                <div className="flex items-center gap-5">
                    {!user ? (
                        <div className="flex items-center gap-3">
                            <Link
                                href="/dang-nhap"
                                className={`text-sm font-bold transition-colors ${navLinkStyles}`}
                            >
                                Đăng nhập
                            </Link>
                            <Link
                                href="/dang-ky/nguoi-tim-viec"
                                className={`rounded-full px-5 py-2 text-sm font-bold shadow-lg transition-all duration-300 active:scale-95 ${(isScrolled || !isHomePage)
                                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                                    : 'bg-white text-primary-600 hover:bg-gray-100'
                                    }`}
                            >
                                Đăng ký
                            </Link>
                            <Link
                                href="/dang-ky/nha-tuyen-dung"
                                className={`hidden text-sm font-bold transition-colors lg:block ${navLinkStyles}`}
                            >
                                Đăng tuyển &amp; tìm hồ sơ
                            </Link>
                        </div>
                    ) : (
                        <div className="relative">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className={`group flex items-center gap-3 rounded-full border p-1 pr-4 transition-all duration-300 ${(isScrolled || !isHomePage)
                                    ? 'border-gray-200 bg-gray-50/50 hover:border-primary-300 shadow-sm'
                                    : 'border-white/20 bg-white/10 backdrop-blur-md hover:bg-white/20'
                                    }`}
                            >
                                <div className="relative h-8 w-8 overflow-hidden rounded-full ring-2 ring-transparent transition-all group-hover:ring-primary-500">
                                    <Image
                                        src={user.avatar_url || '/avatar-default.png'}
                                        alt="avatar"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div className="text-left">
                                    <p className={`text-[11px] font-bold leading-none ${logoTextStyles}`}>
                                        {user.name || 'User'}
                                    </p>
                                    <p className={`text-[9px] italic ${(isScrolled || !isHomePage) ? 'text-gray-500' : 'text-white/60'}`}>Ứng viên</p>
                                </div>
                            </button>

                            {/* Dropdown Menu */}
                            {isMenuOpen && (
                                <>
                                    {/* Overlay để đóng menu khi click ngoài */}
                                    <div className="fixed inset-0 z-[-1]" onClick={() => setIsMenuOpen(false)} />
                                    <div className="absolute right-0 mt-3 w-56 origin-top-right rounded-2xl border border-gray-100 bg-white p-2 shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in duration-200">
                                        <div className="px-4 py-3 border-b border-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                            Tài khoản
                                        </div>
                                        <div className="mt-1 space-y-0.5">
                                            <MenuLink href="/profile" label="Hồ sơ cá nhân" icon="👤" />
                                            <MenuLink href="/settings" label="Cài đặt" icon="⚙️" />
                                            <div className="my-1 border-t border-gray-50" />
                                            <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold text-red-500 transition-colors hover:bg-red-50">
                                                🚪 Đăng xuất
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

function MenuLink({ href, label, icon }: { href: string; label: string; icon: string }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 rounded-xl px-4 py-2 text-sm font-bold text-gray-600 transition-all hover:bg-primary-50 hover:text-primary-600"
        >
            <span className="text-base">{icon}</span>
            {label}
        </Link>
    );
}