import { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Edit2,
  Save,
  X,
  Check,
  Settings,
  Users,
  Folder,
} from "lucide-react";
import { supabase } from "../lib/supabase";

interface Client {
  id: string;
  name: string;
  company_code: string;
  cloudinary_folder: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  is_active: boolean;
  created_at: string;
}

export function ClientManagement() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingClient, setEditingClient] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    company_code: "",
    cloudinary_folder: "",
    logo_url: "",
    primary_color: "#3B82F6",
    secondary_color: "#1E40AF",
    is_active: true,
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingClient) {
        const { error } = await supabase
          .from("clients")
          .update(formData)
          .eq("id", editingClient);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("clients").insert([formData]);

        if (error) throw error;
      }

      setShowAddForm(false);
      setEditingClient(null);
      setFormData({
        name: "",
        company_code: "",
        cloudinary_folder: "",
        logo_url: "",
        primary_color: "#3B82F6",
        secondary_color: "#1E40AF",
        is_active: true,
      });
      fetchClients();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleEdit = (client: Client) => {
    setFormData({
      name: client.name,
      company_code: client.company_code,
      cloudinary_folder: client.cloudinary_folder || "",
      logo_url: client.logo_url || "",
      primary_color: client.primary_color,
      secondary_color: client.secondary_color,
      is_active: client.is_active,
    });
    setEditingClient(client.id);
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingClient(null);
    setFormData({
      name: "",
      company_code: "",
      cloudinary_folder: "",
      logo_url: "",
      primary_color: "#3B82F6",
      secondary_color: "#1E40AF",
      is_active: true,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Client Management
          </h1>
          <p className="text-slate-600 mt-1">
            Manage client accounts and settings
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Client</span>
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            {editingClient ? "Edit Client" : "Add New Client"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Client Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter client name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Company Code
                </label>
                <input
                  type="text"
                  value={formData.company_code}
                  onChange={(e) =>
                    setFormData({ ...formData, company_code: e.target.value })
                  }
                  required
                  disabled={!!editingClient}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100"
                  placeholder="e.g., ABC123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Cloudinary Folder
                </label>
                <input
                  type="text"
                  value={formData.cloudinary_folder}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cloudinary_folder: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., clients/abc-company"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Logo URL
                </label>
                <input
                  type="url"
                  value={formData.logo_url}
                  onChange={(e) =>
                    setFormData({ ...formData, logo_url: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Primary Color
                </label>
                <div className="flex space-x-2">
                  <input
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        primary_color: e.target.value,
                      })
                    }
                    className="h-10 w-20 border border-slate-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.primary_color}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        primary_color: e.target.value,
                      })
                    }
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Secondary Color
                </label>
                <div className="flex space-x-2">
                  <input
                    type="color"
                    value={formData.secondary_color}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        secondary_color: e.target.value,
                      })
                    }
                    className="h-10 w-20 border border-slate-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.secondary_color}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        secondary_color: e.target.value,
                      })
                    }
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label
                htmlFor="is_active"
                className="text-sm font-medium text-slate-700"
              >
                Active
              </label>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center space-x-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
              <button
                type="submit"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{editingClient ? "Update" : "Create"} Client</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client) => (
          <div
            key={client.id}
            className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 hover:border-slate-300 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                {client.logo_url ? (
                  <img
                    src={client.logo_url}
                    alt={client.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: client.primary_color }}
                  >
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-slate-900">{client.name}</h3>
                  <p className="text-sm text-slate-500">
                    {client.company_code}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleEdit(client)}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {client.cloudinary_folder && (
                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <Folder className="w-4 h-4" />
                  <span className="truncate">{client.cloudinary_folder}</span>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <div
                  className="w-6 h-6 rounded border border-slate-200"
                  style={{ backgroundColor: client.primary_color }}
                  title="Primary Color"
                />
                <div
                  className="w-6 h-6 rounded border border-slate-200"
                  style={{ backgroundColor: client.secondary_color }}
                  title="Secondary Color"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    client.is_active
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {client.is_active ? (
                    <>
                      <Check className="w-3 h-3 mr-1" />
                      Active
                    </>
                  ) : (
                    "Inactive"
                  )}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {clients.length === 0 && !showAddForm && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
          <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            No clients yet
          </h3>
          <p className="text-slate-600 mb-4">
            Get started by adding your first client
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add Client</span>
          </button>
        </div>
      )}
    </div>
  );
}
