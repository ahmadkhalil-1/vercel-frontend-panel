import React, { useEffect, useState } from 'react';
import { Cross, CrossIcon, Edit, Plus, Trash2, X, ChevronDown, ChevronUp, Search } from 'lucide-react';
import api from '../../api/api';
import Select from 'react-select';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const initialForm = { name: '', email: '', password: '' };

const ManagerManagement = () => {
  const [managers, setManagers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchManagers = async () => {
    setLoading(true);
    try {
      const res = await api.getManagers();
      setManagers(res.managers || []);
    } catch (err) {
      setError('Failed to fetch managers');
      toast.error('Failed to fetch managers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagers();
    // Fetch categories for dropdown
    api.getCategories().then(res => {
      if (res.success && res.categories) setCategories(res.categories);
    });
  }, []);

  const openModal = (manager = null) => {
    setError('');
    if (manager) {
      setForm({ name: manager.name, email: manager.email, password: '' });
      setSelectedCategories(manager.categories ? manager.categories.map(c => c.toString()) : []);
      setEditingId(manager._id);
    } else {
      setForm(initialForm);
      setSelectedCategories([]);
      setEditingId(null);
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm(initialForm);
    setEditingId(null);
    setError('');
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCategoryChange = (catId) => {
    if (selectedCategories.includes(catId)) {
      setSelectedCategories(selectedCategories.filter(id => id !== catId));
    } else {
      setSelectedCategories([...selectedCategories, catId]);
    }
  };
  const handleAllCategories = () => {
    if (selectedCategories.length === categories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(categories.map(cat => cat._id));
    }
  };

  // Prepare options for react-select
  const categoryOptions = [
    { value: 'ALL', label: 'All' },
    ...categories.map(cat => ({ value: cat._id, label: cat.name }))
  ];
  // Compute selected options for react-select
  const selectedOptions = selectedCategories.length === categories.length
    ? [categoryOptions[0], ...categories.map(cat => ({ value: cat._id, label: cat.name }))]
    : categoryOptions.filter(opt => selectedCategories.includes(opt.value));
  // Handle react-select change
  const handleSelectChange = (selected) => {
    if (!selected) {
      setSelectedCategories([]);
      return;
    }
    // If 'All' is selected, select all categories
    if (selected.some(opt => opt.value === 'ALL')) {
      setSelectedCategories(categories.map(cat => cat._id));
    } else {
      setSelectedCategories(selected.map(opt => opt.value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const managerData = { ...form, categories: selectedCategories };
      if (editingId) {
        // Update
        const res = await api.updateManager(editingId, managerData);
        setManagers((prev) => prev.map((m) => (m._id === editingId ? res.manager : m)));
        toast.success('Manager updated successfully');
      } else {
        // Add
        const res = await api.addManager(managerData);
        setManagers((prev) => [...prev, res.manager]);
        toast.success('Manager added successfully');
      }
      closeModal();
    } catch (err) {
      setError('Operation failed');
      toast.error('Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this manager?')) return;
    setLoading(true);
    try {
      await api.deleteManager(id);
      setManagers((prev) => prev.filter((m) => m._id !== id));
      toast.success('Manager deleted successfully');
    } catch (err) {
      setError('Delete failed');
      toast.error('Delete failed');
    } finally {
      setLoading(false);
    }
  };

  // Filter managers by name or email
  const filteredManagers = managers.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <ToastContainer />
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Manage Managers</h2>
        <button
          className="bg-blue-600 text-white flex justify-between gap-2 items-center px-4 py-2 rounded-xl hover:bg-blue-700 transition"
          onClick={() => openModal()}
        >
          <Plus size={16} /> Add Manager
        </button>
      </div>
      {/* Search Bar */}
      <div className="flex items-center mb-4">
        <div className="relative w-full max-w-xs">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search managers..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="border-gray-300 border rounded-full pl-8 pr-4 py-2 w-full text-sm shadow-sm placeholder:text-xs focus:outline-none"
          />
        </div>
      </div>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Name</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Email</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredManagers.map((manager) => (
              <tr key={manager._id}>
                <td className="px-4 py-2">{manager.name}</td>
                <td className="px-4 py-2">{manager.email}</td>
                <td className="px-4 py-2 space-x-2">
                  <button
                    className=" text-blue-600 hover:text-blue-800"
                    onClick={() => openModal(manager)}
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    className="text-red-600 hover:text-red-800"
                    onClick={() => handleDelete(manager._id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredManagers.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center text-gray-400 py-4">No managers found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={closeModal}
            >
              <X size={20} /> 
            </button>
            <h3 className="text-lg font-bold mb-4">{editingId ? 'Edit Manager' : 'Add Manager'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder='Enter manager name'
                  value={form.name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 outline-blue-500 px-3 py-2 rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder='Enter manager email'
                  value={form.email}
                  onChange={handleChange}
                  className="w-full border border-gray-300 outline-blue-500 px-3 py-2 rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password {editingId && <span className="text-xs text-gray-400">(leave blank to keep unchanged)</span>}</label>
                <input
                  type="password"
                  name="password"
                  placeholder='Enter manager password'
                  value={form.password}
                  onChange={handleChange}
                  className="w-full border border-gray-300 outline-blue-500 px-3 py-2 rounded"
                  // placeholder={editingId ? 'Leave blank to keep unchanged' : ''}
                  required={!editingId}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Categories Access</label>
                <Select
                  isMulti
                  options={categoryOptions}
                  value={selectedOptions}
                  onChange={handleSelectChange}
                  closeMenuOnSelect={false}
                  hideSelectedOptions={false}
                  classNamePrefix="react-select"
                  styles={{
                    menu: (provided) => ({ ...provided, maxHeight: 240, overflowY: 'auto', zIndex: 9999 }),
                    control: (provided) => ({ ...provided, minHeight: 44 }),
                  }}
                  placeholder="Select categories..."
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                disabled={loading}
              >
                {editingId ? 'Update' : 'Add'} Manager
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerManagement; 