// 📁 screens/Settings.jsx
import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, X, Settings as SettingsIcon, CheckCircle, AlertCircle, Search, Save, RefreshCw } from "lucide-react";
import * as settingService from "../services/settingServices";

export default function Settings() {
  const [settings, setSettings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingSetting, setEditingSetting] = useState(null);
  const [form, setForm] = useState({
    key: "",
    value: "",
    description: ""
  });

  const commonSettings = [
    { key: "TAX_RATE", label: "Tax Rate (%)", placeholder: "e.g., 18", type: "number" },
    { key: "CHECK_IN_TIME", label: "Check-in Time", placeholder: "e.g., 14:00", type: "time" },
    { key: "CHECK_OUT_TIME", label: "Check-out Time", placeholder: "e.g., 12:00", type: "time" },
    { key: "CURRENCY", label: "Currency Symbol", placeholder: "e.g., ₹", type: "text" },
    { key: "ADVANCE_PERCENTAGE", label: "Advance Payment (%)", placeholder: "e.g., 30", type: "number" },
    { key: "CANCELLATION_FEE", label: "Cancellation Fee (%)", placeholder: "e.g., 10", type: "number" },
    { key: "MAX_GUESTS_PER_ROOM", label: "Max Guests per Room", placeholder: "e.g., 4", type: "number" },
    { key: "MINIMUM_STAY", label: "Minimum Stay (nights)", placeholder: "e.g., 1", type: "number" },
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingService.getSettings();
      setSettings(response.data || []);
      setError("");
    } catch (err) {
      console.error("❌ SETTINGS FETCH ERROR:", err);
      setError("Failed to load settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.key || !form.value) {
      setError("Key and value are required");
      return;
    }

    try {
      setLoading(true);
      await settingService.createOrUpdateSetting(form);
      await fetchSettings();
      resetForm();
      setShowForm(false);
    } catch (err) {
      console.error("❌ SETTING SAVE ERROR:", err.response?.data || err);
      setError(err.response?.data?.message || "Failed to save setting. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (key) => {
    if (!window.confirm("Are you sure you want to delete this setting?")) return;
    
    try {
      setLoading(true);
      await settingService.deleteSetting(key);
      await fetchSettings();
    } catch (err) {
      console.error("❌ SETTING DELETE ERROR:", err);
      setError("Failed to delete setting. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickEdit = (setting) => {
    setEditingSetting(setting);
    setForm({
      key: setting.key,
      value: setting.value,
      description: setting.description || ""
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setForm({
      key: "",
      value: "",
      description: ""
    });
    setEditingSetting(null);
  };

  const openAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const filteredSettings = settings.filter(setting =>
    setting.key?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    setting.value?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
    setting.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCommonSetting = (key) => {
    return commonSettings.find(s => s.key === key);
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar pr-1">
      <div className="w-full pb-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600 mt-1">Configure hotel system parameters and preferences</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
            <button onClick={() => setError("")} className="ml-auto">
              <X className="w-4 h-4 text-red-500" />
            </button>
          </div>
        )}

        {/* Header with Actions */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl">
                <SettingsIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">System Parameters</h2>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Configure global constants</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search settings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm font-medium transition-all"
                />
              </div>
              <button
                onClick={openAdd}
                className="px-5 py-2.5 bg-purple-600 text-white font-bold rounded-xl text-sm hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 active:scale-95 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Setting
              </button>
              <button
                onClick={fetchSettings}
                className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Common Settings Grid */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Common Configurations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {commonSettings.map((setting) => {
              const currentSetting = settings.find(s => s.key === setting.key);
              return (
                <div key={setting.key} className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                        <SettingsIcon className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-tight">{setting.label}</span>
                    </div>
                    <button
                      onClick={() => {
                        if (currentSetting) {
                          handleQuickEdit(currentSetting);
                        } else {
                          setForm({ 
                            key: setting.key, 
                            value: "", 
                            description: setting.label 
                          });
                          setEditingSetting(null);
                          setShowForm(true);
                        }
                      }}
                      className="text-xs text-purple-600 hover:text-purple-700 font-bold uppercase tracking-wider underline decoration-purple-200 underline-offset-4 decoration-2"
                    >
                      {currentSetting ? "Update" : "Setup"}
                    </button>
                  </div>
                  <div className="mb-4">
                    <code className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                      {setting.key}
                    </code>
                  </div>
                  <div className="text-center py-4 bg-gray-50/50 rounded-xl border border-dashed border-gray-100">
                    <p className={`text-2xl font-black tracking-tighter tabular-nums ${
                      currentSetting ? 'text-gray-900' : 'text-gray-300'
                    }`}>
                      {currentSetting ? currentSetting.value : "---"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* All Settings Table */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">All Settings</h3>
            <p className="text-sm text-gray-600">Complete list of system configuration</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Key</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Value</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Description</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Type</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSettings.length > 0 ? (
                  filteredSettings.map((setting) => {
                    const commonSetting = getCommonSetting(setting.key);
                    return (
                      <tr key={setting.key} className="hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <code className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm font-mono">
                              {setting.key}
                            </code>
                            {commonSetting && (
                              <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                                Common
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-medium">{setting.value}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm text-gray-600">
                            {setting.description || commonSetting?.label || "Custom setting"}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {commonSetting?.type || "text"}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleQuickEdit(setting)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            {!commonSetting && (
                              <button
                                onClick={() => handleDelete(setting.key)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <SettingsIcon className="w-12 h-12 text-gray-300 mb-4" />
                        <p className="text-gray-500">No settings found</p>
                        {searchTerm && (
                          <button
                            onClick={() => setSearchTerm("")}
                            className="mt-2 text-purple-600 hover:text-purple-700 text-sm font-medium"
                          >
                            Clear search
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Settings Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <SettingsIcon className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {editingSetting ? "Edit Setting" : "Add New Setting"}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {editingSetting ? "Update system setting" : "Add new system parameter"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Setting Key *
                  </label>
                  {editingSetting ? (
                    <div className="px-4 py-2 bg-gray-100 rounded-lg text-gray-700">
                      {form.key}
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g., TAX_RATE, CHECK_IN_TIME"
                      value={form.key}
                      onChange={(e) => setForm({ ...form, key: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Use uppercase with underscores (e.g., SITE_NAME)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Value *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter value"
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    placeholder="Enter description for this setting"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows="2"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {getCommonSetting(form.key) && (
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-700">
                      This is a common setting: {getCommonSetting(form.key)?.label}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {editingSetting ? "Update Setting" : "Save Setting"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-700">Processing...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}