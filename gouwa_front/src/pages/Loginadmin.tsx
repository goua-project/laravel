import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContextAdmin';
import { useToast } from '../components/ui/Toast';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  // Redirection vers le dashboard admin après connexion
  if (isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const success = await login(email, password);
    
    if (success) {
      showToast('success', 'Connexion réussie', 'Bienvenue dans l\'administration Gouwadan');
      // La redirection se fera automatiquement grâce au changement d'état isAuthenticated
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
            placeholder="Votre email administrateur"
            required
          />

          <Input
            label="Mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Votre mot de passe"
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
      </div>
    </div>
  );
};