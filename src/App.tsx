import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import NewStudent from './pages/NewStudent';
import ALSStudent from './pages/ALSStudent';
import ALSNewEnrollees from './pages/ALSNewEnrollees';
import RegularStudent from './pages/RegularStudent';
import AppUsers from './pages/AppUsers';
import Login from './pages/Login';

function AppContent() {
  const { user, loading, signOut } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'new-student':
        return <NewStudent />;
      case 'als-student':
        return <ALSStudent />;
      case 'als-new-enrollees':
        return <ALSNewEnrollees />;
      case 'regular-student':
        return <RegularStudent />;
      case 'app-users':
        return <AppUsers />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-sky-200 via-blue-200 to-cyan-200">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} onLogout={signOut} />
      <main className="ml-48 flex-1">
        {renderPage()}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
