import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';

export default function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <MobileNav />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
