/**
 * AuthContext — simple role-based auth for the demo.
 * Two roles: 'customer' (GrowMart shopper) and 'admin' (ops console).
 * No real credentials — just a flag so admin routes are gated from customer view.
 */
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Start as customer. 'admin' unlocks /admin/* routes.
  const [role, setRole] = useState('customer');

  const loginAsAdmin    = () => setRole('admin');
  const loginAsCustomer = () => setRole('customer');
  const isAdmin         = role === 'admin';

  return (
    <AuthContext.Provider value={{ role, isAdmin, loginAsAdmin, loginAsCustomer }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
