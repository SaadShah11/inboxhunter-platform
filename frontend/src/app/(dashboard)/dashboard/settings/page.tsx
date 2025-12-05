'use client';

import { useEffect, useState } from 'react';
import {
  User,
  Mail,
  Lock,
  Key,
  CreditCard,
  Bell,
  Moon,
  Sun,
  Monitor,
  Check,
  Plus,
  Trash2,
  Star,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  Palette,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { useThemeStore } from '@/lib/theme-store';
import { users, credentials as credentialsApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '@/components/ui/modal';

interface Credential {
  id: string;
  name: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  isDefault: boolean;
  createdAt: string;
}

type SettingsTab = 'profile' | 'credentials' | 'appearance' | 'security';

export default function SettingsPage() {
  const { toast } = useToast();
  const { user, updateUser } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [loading, setLoading] = useState(false);
  
  // Profile form
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  
  // Password form
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState(false);
  
  // Credentials
  const [credentialsList, setCredentialsList] = useState<Credential[]>([]);
  const [credentialsLoading, setCredentialsLoading] = useState(true);
  const [addCredentialOpen, setAddCredentialOpen] = useState(false);
  const [newCredential, setNewCredential] = useState({
    name: '',
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    setCredentialsLoading(true);
    const { data } = await credentialsApi.list();
    if (data) {
      setCredentialsList(Array.isArray(data) ? data : []);
    }
    setCredentialsLoading(false);
  };

  const handleUpdateProfile = async () => {
    if (!profileData.name.trim()) {
      toast({ type: 'error', title: 'Name is required' });
      return;
    }

    setLoading(true);
    const { data, error } = await users.updateProfile({
      name: profileData.name,
    });

    if (data) {
      updateUser({ name: profileData.name });
      toast({ type: 'success', title: 'Profile Updated', description: 'Your profile has been updated successfully' });
    } else {
      toast({ type: 'error', title: 'Update Failed', description: error || 'Failed to update profile' });
    }
    setLoading(false);
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast({ type: 'error', title: 'All fields are required' });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ type: 'error', title: 'Passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({ type: 'error', title: 'Password must be at least 8 characters' });
      return;
    }

    setLoading(true);
    const { data, error } = await users.changePassword({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });

    if (data) {
      toast({ type: 'success', title: 'Password Changed', description: 'Your password has been updated' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      toast({ type: 'error', title: 'Failed to Change Password', description: error || 'Please check your current password' });
    }
    setLoading(false);
  };

  const handleAddCredential = async () => {
    if (!newCredential.name || !newCredential.email) {
      toast({ type: 'error', title: 'Name and email are required' });
      return;
    }

    setLoading(true);
    const { data, error } = await credentialsApi.create({
      name: newCredential.name,
      email: newCredential.email,
      firstName: newCredential.firstName || undefined,
      lastName: newCredential.lastName || undefined,
      phone: newCredential.phone || undefined,
    });

    if (data) {
      toast({ type: 'success', title: 'Credential Added' });
      setNewCredential({ name: '', email: '', firstName: '', lastName: '', phone: '' });
      setAddCredentialOpen(false);
      loadCredentials();
    } else {
      toast({ type: 'error', title: 'Failed to Add Credential', description: error });
    }
    setLoading(false);
  };

  const handleDeleteCredential = async (id: string) => {
    const { error } = await credentialsApi.delete(id);
    if (!error) {
      toast({ type: 'success', title: 'Credential Deleted' });
      loadCredentials();
    } else {
      toast({ type: 'error', title: 'Failed to Delete', description: error });
    }
  };

  const handleSetDefault = async (id: string) => {
    const { error } = await credentialsApi.setDefault(id);
    if (!error) {
      toast({ type: 'success', title: 'Default Credential Updated' });
      loadCredentials();
    } else {
      toast({ type: 'error', title: 'Failed to Set Default', description: error });
    }
  };

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'credentials' as const, label: 'Credentials', icon: Key },
    { id: 'appearance' as const, label: 'Appearance', icon: Palette },
    { id: 'security' as const, label: 'Security', icon: Shield },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500">Manage your account and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800 pb-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors',
              activeTab === tab.id
                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                  {user?.name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-lg">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-gray-500">{user?.email}</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 mt-1 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 capitalize">
                    {user?.plan} Plan
                  </span>
                </div>
              </div>

              <Input
                label="Display Name"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                placeholder="Your name"
                icon={<User className="w-5 h-5" />}
              />

              <Input
                label="Email Address"
                value={profileData.email}
                disabled
                icon={<Mail className="w-5 h-5" />}
                hint="Email cannot be changed"
              />

              <div className="pt-2">
                <Button onClick={handleUpdateProfile} loading={loading}>
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Credentials Tab */}
      {activeTab === 'credentials' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Form Credentials</CardTitle>
                  <CardDescription>Credentials used for automated form filling</CardDescription>
                </div>
                <Button onClick={() => setAddCredentialOpen(true)} icon={<Plus className="w-4 h-4" />}>
                  Add Credential
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {credentialsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : credentialsList.length === 0 ? (
                <div className="text-center py-8">
                  <Key className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 mb-3">No credentials added yet</p>
                  <Button variant="secondary" onClick={() => setAddCredentialOpen(true)}>
                    Add Your First Credential
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {credentialsList.map((cred) => (
                    <div
                      key={cred.id}
                      className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 dark:text-white">{cred.name}</p>
                          {cred.isDefault && (
                            <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">
                              <Star className="w-3 h-3" />
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">{cred.email}</p>
                        {cred.phone && <p className="text-xs text-gray-400">{cred.phone}</p>}
                      </div>
                      <div className="flex items-center gap-1">
                        {!cred.isDefault && (
                          <button
                            onClick={() => handleSetDefault(cred.id)}
                            className="p-2 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition-colors text-gray-400 hover:text-amber-600"
                            title="Set as default"
                          >
                            <Star className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteCredential(cred.id)}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors text-gray-400 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Appearance Tab */}
      {activeTab === 'appearance' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>Choose how InboxHunter looks to you</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { value: 'light', label: 'Light', icon: Sun, description: 'Light background' },
                  { value: 'dark', label: 'Dark', icon: Moon, description: 'Dark background' },
                  { value: 'system', label: 'System', icon: Monitor, description: 'Follow system' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value as any)}
                    className={cn(
                      'relative p-4 rounded-xl border-2 text-left transition-all',
                      theme === option.value
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                    )}
                  >
                    {theme === option.value && (
                      <div className="absolute top-3 right-3 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <option.icon className={cn(
                      'w-8 h-8 mb-3',
                      theme === option.value ? 'text-indigo-500' : 'text-gray-400'
                    )} />
                    <p className="font-semibold text-gray-900 dark:text-white">{option.label}</p>
                    <p className="text-sm text-gray-500">{option.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Current Password"
                type={showPasswords ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                placeholder="••••••••"
                icon={<Lock className="w-5 h-5" />}
              />

              <Input
                label="New Password"
                type={showPasswords ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="••••••••"
                icon={<Lock className="w-5 h-5" />}
                hint="At least 8 characters"
              />

              <Input
                label="Confirm New Password"
                type={showPasswords ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="••••••••"
                icon={<Lock className="w-5 h-5" />}
              />

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showPasswords ? 'Hide passwords' : 'Show passwords'}
                </button>
              </div>

              <div className="pt-2">
                <Button
                  onClick={handleChangePassword}
                  loading={loading}
                  disabled={!passwordData.currentPassword || !passwordData.newPassword}
                >
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 dark:border-red-900">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Delete Account</p>
                  <p className="text-sm text-gray-500">Permanently delete your account and all data</p>
                </div>
                <Button variant="danger">Delete Account</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Credential Modal */}
      <Modal open={addCredentialOpen} onOpenChange={setAddCredentialOpen}>
        <ModalContent>
          <ModalHeader onClose={() => setAddCredentialOpen(false)}>
            <ModalTitle>Add Credential</ModalTitle>
            <ModalDescription>Create a new credential for form filling</ModalDescription>
          </ModalHeader>
          <ModalBody className="space-y-4">
            <Input
              label="Name"
              value={newCredential.name}
              onChange={(e) => setNewCredential({ ...newCredential, name: e.target.value })}
              placeholder="Work Email"
              hint="A name to identify this credential"
            />
            <Input
              label="Email"
              type="email"
              value={newCredential.email}
              onChange={(e) => setNewCredential({ ...newCredential, email: e.target.value })}
              placeholder="you@example.com"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={newCredential.firstName}
                onChange={(e) => setNewCredential({ ...newCredential, firstName: e.target.value })}
                placeholder="John"
              />
              <Input
                label="Last Name"
                value={newCredential.lastName}
                onChange={(e) => setNewCredential({ ...newCredential, lastName: e.target.value })}
                placeholder="Doe"
              />
            </div>
            <Input
              label="Phone Number"
              value={newCredential.phone}
              onChange={(e) => setNewCredential({ ...newCredential, phone: e.target.value })}
              placeholder="+1 555 123 4567"
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setAddCredentialOpen(false)}>Cancel</Button>
            <Button onClick={handleAddCredential} loading={loading} disabled={!newCredential.name || !newCredential.email}>
              Add Credential
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
