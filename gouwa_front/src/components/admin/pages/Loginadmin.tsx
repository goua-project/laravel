import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('admin@gouwadan.bj');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  
  const { login, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const success = await login(email, password);
    
    if (success) {
      showToast('success', 'Connexion réussie', 'Bienvenue dans l\'administration Gouwadan');
    } else {
      showToast('error', 'Erreur de connexion', 'Identifiants incorrects');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FF6A00] to-[#E55A00] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#FF6A00] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">G</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Gouwadan Admin</h1>
          <p className="text-gray-600 mt-2">Connectez-vous à votre compte administrateur</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Adresse email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@gouwadan.bj"
            required
          />

          <Input
            label="Mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <Button
            type="submit"
            className="w-full"
            loading={loading}
          >
            Se connecter
          </Button>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 text-center">
            <strong>Compte de démonstration :</strong><br />
            Email: admin@gouwadan.bj<br />
            Mot de passe: admin123
          </p>
        </div>
      </div>
    </div>
  );
};