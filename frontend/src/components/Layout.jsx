import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export const Layout = () => {
  return (
    <>
      <Navbar />
      <main className="page">
        <Outlet />
      </main>
    </>
  );
};
