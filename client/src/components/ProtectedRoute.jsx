import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import { Spinner } from './Icons';

const ProtectedRoute = () => {
  const { status, isAuthenticated } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-ink-950 flex flex-col items-center justify-center gap-4 text-slate-300">
        <Spinner className="h-8 w-8 text-brand-400" />
        <p className="font-display text-sm tracking-wide text-slate-400">Verifying session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-ink-950 text-slate-200">
      <Navbar />
      <main className="flex-1 pb-16">
        <Outlet />
      </main>
    </div>
  );
};

export default ProtectedRoute;