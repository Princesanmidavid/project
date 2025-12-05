import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import FarmerDashboard from './components/FarmerDashboard';
import CustomerDashboard from './components/CustomerDashboard';

export interface User {
  id: string;
  type: 'farmer' | 'customer';
  fullName: string;
  email: string;
  phone: string;
  companyName?: string;
  uniqueCode?: string;
}

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <LandingPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {currentUser.type === 'farmer' ? (
        <FarmerDashboard user={currentUser} onLogout={handleLogout} />
      ) : (
        <CustomerDashboard user={currentUser} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;