import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import NewStudent from './pages/NewStudent';
import ALSStudent from './pages/ALSStudent';
import ALSNewEnrollees from './pages/ALSNewEnrollees';
import RegularStudent from './pages/RegularStudent';
import AppUsers from './pages/AppUsers';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import UpdatePassword from './pages/UpdatePassword';

function AppContent() {
  const { user, loading, signOut } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = (page: string) => {
    switch (page) {
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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // If user is logged in, show dashboard directly
  if (user) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-sky-200 via-blue-200 to-cyan-200">
        <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} onLogout={signOut} />
        <main className="ml-48 flex-1">
          {renderPage(currentPage)}
        </main>
      </div>
    );
  }

  // If no user, show auth routes
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/update-password" element={<UpdatePassword />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
