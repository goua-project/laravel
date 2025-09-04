import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { Settings as SettingsIcon, Bell, Shield, Palette, Globe } from 'lucide-react';

export const Settings: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('general');

  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'Gouwadan',
    siteDescription: 'Plateforme e-commerce béninoise',
    adminEmail: 'admin@gouwadan.bj',
    supportEmail: 'support@gouwadan.bj'
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    orderNotifications: true,
    userRegistration: true
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: '60',
    passwordMinLength: '8',
    loginAttempts: '5'
  });

  const tabs = [
    { id: 'general', label: 'Général', icon: SettingsIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Sécurité', icon: Shield },
    { id: 'appearance', label: 'Apparence', icon: Palette },
    { id: 'localization', label: 'Localisation', icon: Globe }
  ];

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('success', 'Paramètres sauvegardés', 'Les paramètres généraux ont été mis à jour');
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('success', 'Notifications mises à jour', 'Vos préférences de notification ont été sauvegardées');
  };

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('success', 'Sécurité mise à jour', 'Les paramètres de sécurité ont été modifiés');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <form onSubmit={handleSaveGeneral} className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Paramètres Généraux</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Nom du site"
                value={generalSettings.siteName}
                onChange={(e) => setGeneralSettings({ ...generalSettings, siteName: e.target.value })}
              />
              <Input
                label="Email administrateur"
                type="email"
                value={generalSettings.adminEmail}
                onChange={(e) => setGeneralSettings({ ...generalSettings, adminEmail: e.target.value })}
              />
              <Input
                label="Email support"
                type="email"
                value={generalSettings.supportEmail}
                onChange={(e) => setGeneralSettings({ ...generalSettings, supportEmail: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description du site
              </label>
              <textarea
                value={generalSettings.siteDescription}
                onChange={(e) => setGeneralSettings({ ...generalSettings, siteDescription: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
                rows={3}
              />
            </div>
            <Button type="submit">Sauvegarder</Button>
          </form>
        );

      case 'notifications':
        return (
          <form onSubmit={handleSaveNotifications} className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Préférences de Notification</h3>
            <div className="space-y-4">
              {Object.entries(notificationSettings).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between py-2">
                  <label className="text-sm font-medium text-gray-700">
                    {key === 'emailNotifications' && 'Notifications par email'}
                    {key === 'smsNotifications' && 'Notifications SMS'}
                    {key === 'pushNotifications' && 'Notifications push'}
                    {key === 'orderNotifications' && 'Notifications de commandes'}
                    {key === 'userRegistration' && 'Notifications d\'inscription'}
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setNotificationSettings({ 
                        ...notificationSettings, 
                        [key]: e.target.checked 
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#FF6A00]/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF6A00]"></div>
                  </label>
                </div>
              ))}
            </div>
            <Button type="submit">Sauvegarder</Button>
          </form>
        );

      case 'security':
        return (
          <form onSubmit={handleSaveSecurity} className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Paramètres de Sécurité</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">Authentification à deux facteurs</label>
                  <p className="text-xs text-gray-500">Ajouter une couche de sécurité supplémentaire</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={securitySettings.twoFactorAuth}
                    onChange={(e) => setSecuritySettings({ 
                      ...securitySettings, 
                      twoFactorAuth: e.target.checked 
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#FF6A00]/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF6A00]"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Timeout de session (minutes)"
                  type="number"
                  value={securitySettings.sessionTimeout}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: e.target.value })}
                />
                <Input
                  label="Longueur minimum du mot de passe"
                  type="number"
                  value={securitySettings.passwordMinLength}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, passwordMinLength: e.target.value })}
                />
                <Input
                  label="Tentatives de connexion max"
                  type="number"
                  value={securitySettings.loginAttempts}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, loginAttempts: e.target.value })}
                />
              </div>
            </div>
            <Button type="submit">Sauvegarder</Button>
          </form>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Paramètres d'Apparence</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Couleur principale
                </label>
                <div className="flex space-x-4">
                  <div className="w-12 h-12 bg-[#FF6A00] rounded-lg border-2 border-gray-300 cursor-pointer"></div>
                  <div className="w-12 h-12 bg-blue-600 rounded-lg border-2 border-gray-300 cursor-pointer"></div>
                  <div className="w-12 h-12 bg-green-600 rounded-lg border-2 border-gray-300 cursor-pointer"></div>
                  <div className="w-12 h-12 bg-purple-600 rounded-lg border-2 border-gray-300 cursor-pointer"></div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mode d'affichage
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]">
                  <option>Clair</option>
                  <option>Sombre</option>
                  <option>Automatique</option>
                </select>
              </div>
            </div>
            <Button onClick={() => showToast('success', 'Apparence mise à jour', 'Les paramètres d\'apparence ont été sauvegardés')}>
              Sauvegarder
            </Button>
          </div>
        );

      case 'localization':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Paramètres de Localisation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Langue par défaut
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]">
                  <option>Français</option>
                  <option>Anglais</option>
                  <option>Yoruba</option>
                  <option>Fon</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fuseau horaire
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]">
                  <option>UTC+1 (Afrique de l'Ouest)</option>
                  <option>UTC+0 (GMT)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Devise par défaut
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]">
                  <option>Franc CFA (₣)</option>
                  <option>Dollar US ($)</option>
                  <option>Euro (€)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Format de date
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]">
                  <option>DD/MM/YYYY</option>
                  <option>MM/DD/YYYY</option>
                  <option>YYYY-MM-DD</option>
                </select>
              </div>
            </div>
            <Button onClick={() => showToast('success', 'Localisation mise à jour', 'Les paramètres de localisation ont été sauvegardés')}>
              Sauvegarder
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-[#FF6A00] text-[#FF6A00]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconComponent size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};