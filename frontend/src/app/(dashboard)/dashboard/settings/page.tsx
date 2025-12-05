"use client";

import { useEffect, useState } from "react";
import { Save, Plus, Trash2, Star, Loader2 } from "lucide-react";
import { credentials as credentialsApi, users } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [credentials, setCredentials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // New credential form
  const [newCred, setNewCred] = useState({
    name: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneCountryCode: "+1",
    phoneNumber: "",
    isDefault: false,
  });

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    const { data } = await credentialsApi.list();
    if (data) {
      setCredentials(data);
    }
    setLoading(false);
  };

  const handleAddCredential = async () => {
    setSaving(true);
    
    // Transform data to match backend DTO
    const credentialData = {
      name: newCred.name,
      firstName: newCred.firstName,
      lastName: newCred.lastName,
      email: newCred.email,
      phone: newCred.phoneNumber 
        ? `${newCred.phoneCountryCode}${newCred.phoneNumber}` 
        : undefined,
      isDefault: newCred.isDefault,
    };
    
    const { data, error } = await credentialsApi.create(credentialData);
    if (data) {
      setShowAddModal(false);
      setNewCred({
        name: "",
        firstName: "",
        lastName: "",
        email: "",
        phoneCountryCode: "+1",
        phoneNumber: "",
        isDefault: false,
      });
      loadCredentials();
    }
    setSaving(false);
  };

  const handleSetDefault = async (id: string) => {
    await credentialsApi.setDefault(id);
    loadCredentials();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this credential?")) {
      await credentialsApi.delete(id);
      loadCredentials();
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your credentials and preferences
        </p>
      </div>

      {/* Credentials Section */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Signup Credentials</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition text-sm"
          >
            <Plus className="h-4 w-4" />
            Add Credential
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : credentials.length === 0 ? (
          <div className="bg-card border rounded-xl p-8 text-center">
            <p className="text-muted-foreground mb-4">
              No credentials yet. Add your first credential to start signing up.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition"
            >
              <Plus className="h-4 w-4" />
              Add Credential
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {credentials.map((cred) => (
              <div key={cred.id} className="bg-card border rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{cred.name}</h3>
                      {cred.isDefault && (
                        <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {cred.firstName} {cred.lastName} • {cred.email}
                    </p>
                    {cred.phone && (
                      <p className="text-sm text-muted-foreground">
                        {cred.phone}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!cred.isDefault && (
                      <button
                        onClick={() => handleSetDefault(cred.id)}
                        className="p-2 hover:bg-secondary rounded-lg transition"
                        title="Set as default"
                      >
                        <Star className="h-4 w-4 text-muted-foreground" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(cred.id)}
                      className="p-2 hover:bg-secondary rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add Credential Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border rounded-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold mb-4">Add Credential</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Credential Name *
                </label>
                <input
                  type="text"
                  value={newCred.name}
                  onChange={(e) => setNewCred({ ...newCred, name: e.target.value })}
                  className="w-full px-4 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., Marketing Leads"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={newCred.firstName}
                    onChange={(e) => setNewCred({ ...newCred, firstName: e.target.value })}
                    className="w-full px-4 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={newCred.lastName}
                    onChange={(e) => setNewCred({ ...newCred, lastName: e.target.value })}
                    className="w-full px-4 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={newCred.email}
                  onChange={(e) => setNewCred({ ...newCred, email: e.target.value })}
                  className="w-full px-4 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="signup@example.com"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Country Code
                  </label>
                  <input
                    type="text"
                    value={newCred.phoneCountryCode}
                    onChange={(e) => setNewCred({ ...newCred, phoneCountryCode: e.target.value })}
                    className="w-full px-4 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="+1"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={newCred.phoneNumber}
                    onChange={(e) => setNewCred({ ...newCred, phoneNumber: e.target.value })}
                    className="w-full px-4 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="1234567890"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newCred.isDefault}
                  onChange={(e) => setNewCred({ ...newCred, isDefault: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Set as default credential</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-muted-foreground hover:text-foreground transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCredential}
                disabled={saving || !newCred.name || !newCred.firstName || !newCred.email}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Add Credential
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

