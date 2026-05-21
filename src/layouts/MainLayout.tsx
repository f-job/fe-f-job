import { Outlet } from 'react-router-dom';
import { AppNavbar } from '@components/common/AppNavbar';
import { Footer } from '@/components/home/Footer';

export default function MainLayout() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <AppNavbar />
      <main className="flex-grow-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
