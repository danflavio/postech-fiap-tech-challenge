import { useState } from 'react';
import { AuthContext } from './AuthContext';
import api from '../services/api';

const getStoredUser = () => {
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');

  if (!token || !storedUser) return null;

  try {
    return JSON.parse(storedUser);
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser);

  const login = async (email, senha) => {
    const { data } = await api.post('/auth/login', { email, senha });

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);

    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
