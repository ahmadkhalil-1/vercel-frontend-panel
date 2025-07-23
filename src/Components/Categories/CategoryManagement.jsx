import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Search, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CategoryManagement = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showSubcategoryForm, setShowSubcategoryForm] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [imageErrors, setImageErrors] = useState({}); // Track failed images
    const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
    const [showEditSubcategoryModal, setShowEditSubcategoryModal] = useState(false);
    const [showEditDetailModal, setShowEditDetailModal] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [globalError, setGlobalError] = useState("");
    const { user } = useAuth();
    const [openSubDetails, setOpenSubDetails] = useState({});
    const [showAddDetailForm, setShowAddDetailForm] = useState(false);
    // Add state for details modal
    const [detailsModalSubcategory, setDetailsModalSubcategory] = useState(null);
    const [detailsModalCategory, setDetailsModalCategory] = useState(null);

    const initialFormState = {
        name: '',
        categoryImage: null,
        subcategories: [{
            name: '',
            image: null,
            details: [{
                image: null,
                price: '',
                isLocked: false
            }]
        }]
    };

    const [formData, setFormData] = useState(initialFormState);
    const [subcategoryFormData, setSubcategoryFormData] = useState({
        name: '',
        image: null,
        details: [{ price: '', isLocked: false }]
    });
    const [detailFormData, setDetailFormData] = useState({ price: '', isLocked: false, image: null });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await api.getCategories();
            if (response.success) {
                setCategories(response.categories);
            } else {
                toast.error(response.message || 'Failed to fetch categories');
            }
        } catch (error) {
            toast.error('Error fetching categories');
        }
        setLoading(false);
    };

    const allowedCategories = user?.role === 'manager' ? (user.categories || []).map(String) : [];
    const visibleCategories = user?.role === 'manager'
        ? categories.filter(cat => allowedCategories.includes(cat._id.toString()))
        : categories;
    const filteredVisibleCategories = visibleCategories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filter categories for managers (string conversion for safety)
    // const allowedCategories = user?.role === 'manager' ? (user.categories || []).map(String) : [];
    // const visibleCategories = user?.role === 'manager'
    //     ? categories.filter(cat => allowedCategories.includes(cat._id.toString()))
    //     : categories;

    // Handle image error with proper fallback
    const handleImageError = (imageId, e) => {
        // Prevent infinite loops by checking if we've already set an error for this image
        if (!imageErrors[imageId]) {
            setImageErrors(prev => ({ ...prev, [imageId]: true }));
            // Set a simple colored div as fallback instead of another image URL
            e.target.style.display = 'none';
            if (e.target.nextSibling) {
                e.target.nextSibling.style.display = 'flex';
            }
        }
    };

    // Create fallback div for failed images
    const createFallbackDiv = (name, size = 'h-10 w-10') => (
        <div
            className={`${size} rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-medium text-sm`}
            style={{ display: 'none' }}
        >
            {name ? name.charAt(0).toUpperCase() : '?'}
        </div>
    );

    // Get proper image URL
    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;

        // If it's already a full URL, return as is
        if (imagePath.startsWith('http')) {
            return imagePath;
        }

        // Remove leading slash if present and construct full URL
        const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
        return `${'http://localhost:5000'}/${cleanPath}`;
    };

    // Helper to convert file to base64
    const toBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    };

    // --- Update handleSubcategorySubmit to only send name and image, no details ---
    const handleSubcategorySubmit = async (e) => {
        e.preventDefault();
        if (!selectedCategory) return;
        const subcategoryImageBase64 = subcategoryFormData.image ? await toBase64(subcategoryFormData.image) : null;
        const payload = {
            name: subcategoryFormData.name,
            subcategoryImageBase64
        };
        try {
            const response = await api.addSubcategory(selectedCategory._id, payload);
            // --- Subcategory Add/Edit/Delete: update local state instantly for manager ---
            // After successful add subcategory (manager):
            if (response.success) {
                setShowSubcategoryForm(false);
                if (user?.role === 'manager') {
                    setCategories(prev => prev.map(cat =>
                        cat._id === selectedCategory._id
                            ? { ...cat, subcategories: [...cat.subcategories, response.category.subcategories[response.category.subcategories.length - 1]] }
                            : cat
                    ));
                    // If details modal is open for this category, update modal state too
                    if (detailsModalCategory && detailsModalCategory._id === selectedCategory._id) {
                        setDetailsModalCategory(response.category);
                    }
                } else {
                    fetchCategories();
                }
                setSubcategoryFormData({ name: '', image: null });
                setSelectedCategory(null);
                toast.success('Subcategory added successfully');
            } else {
                toast.error(response.message || "Failed to add subcategory");
            }
        } catch (error) {
            toast.error(error.message || 'Error adding subcategory');
        }
    };

    // --- Add Subcategory Modal (refactored: only subcategory, no details) ---
    {showSubcategoryForm && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-md w-96 max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-semibold mb-4">Add Subcategory to {selectedCategory.name}</h2>
                <form onSubmit={handleSubcategorySubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Subcategory Name</label>
                        <input
                            type="text"
                            value={subcategoryFormData.name}
                            onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, name: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Subcategory Image</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, image: e.target.files[0] })}
                            className="mt-1 block w-full"
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setShowSubcategoryForm(false);
                                setSubcategoryFormData({
                                    name: '',
                                    image: null
                                });
                                setSelectedCategory(null);
                            }}
                            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                            Add Subcategory
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )}

    const validateForm = () => {
        if (!formData.name.trim()) {
            throw new Error('Category name is required');
        }

        formData.subcategories.forEach((sub, index) => {
            if (!sub.name.trim()) {
                throw new Error(`Subcategory name is required for subcategory ${index + 1}`);
            }

            sub.details.forEach((detail, detailIndex) => {
                if (!detail.price || detail.price <= 0) {
                    throw new Error(`Valid price is required for detail ${detailIndex + 1} in subcategory ${index + 1}`);
                }
                if (!detail.image) {
                    throw new Error(`Detail image is required for detail ${detailIndex + 1} in subcategory ${sub.name}`);
                }
            });
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setGlobalError("");
        try {
            // Validate form data
            validateForm();

            // Convert category image to base64
            const categoryImageBase64 = formData.categoryImage ? await toBase64(formData.categoryImage) : null;
            // Convert subcategory and detail images to base64
            const subcategories = await Promise.all(formData.subcategories.map(async (sub) => {
                const subcategoryImageBase64 = sub.image ? await toBase64(sub.image) : null;
                const details = await Promise.all(sub.details.map(async (detail) => ({
                    price: parseFloat(detail.price),
                    isLocked: detail.isLocked,
                    detailImageBase64: detail.image ? await toBase64(detail.image) : null
                })));
                return {
                    name: sub.name.trim(),
                    subcategoryImageBase64,
                    details
                };
            }));
            const payload = {
                name: formData.name.trim(),
                categoryImageBase64,
                subcategories: JSON.stringify(subcategories)
            };

            const response = await api.addCategory(payload);
            if (response.success) {
                await fetchCategories();
                setShowAddForm(false);
                setFormData(initialFormState);
                toast.success('Category added successfully');
            } else {
                toast.error(response.message || "Failed to add category");
            }
        } catch (error) {
            toast.error(error.message || 'Error adding category');
        } finally {
            setLoading(false);
        }
    };

    // Handle category edit
    const handleEditCategory = async (e) => {
        e.preventDefault();
        setLoading(true);
        setGlobalError("");
        try {
            const categoryImageBase64 = selectedCategory.newImage ? await toBase64(selectedCategory.newImage) : null;
            const payload = {
                name: selectedCategory.name.trim(),
                ...(categoryImageBase64 && { categoryImageBase64 })
            };
            const response = await api.updateCategory(selectedCategory._id, payload);
            if (response.success) {
                await fetchCategories();
                setShowEditCategoryModal(false);
                setSelectedCategory(null);
                toast.success('Category updated successfully');
            } else {
                toast.error(response.message || "Failed to update category");
            }
        } catch (error) {
            toast.error(error.message || 'Error updating category');
        } finally {
            setLoading(false);
        }
    };

    // Handle category delete
    const handleDeleteCategory = async (categoryId) => {
        confirmAction('Are you sure you want to delete this category? This action cannot be undone.', async () => {
            setLoading(true);
            setGlobalError("");
            try {
                const response = await api.deleteCategory(categoryId);
                if (response.success) {
                    await fetchCategories();
                    toast.success('Category deleted successfully');
                } else {
                    toast.error(response.message || "Failed to delete category");
                }
            } catch (error) {
                toast.error(error.message || 'Error deleting category');
            } finally {
                setLoading(false);
            }
        });
    };

    // Handle subcategory edit
    const handleEditSubcategory = async (e) => {
        e.preventDefault();
        setLoading(true);
        setGlobalError("");
        try {
            const subcategoryImageBase64 = selectedSubcategory.newImage ? await toBase64(selectedSubcategory.newImage) : null;
            const payload = {
                name: selectedSubcategory.name.trim(),
                ...(subcategoryImageBase64 && { subcategoryImageBase64 })
            };
            const response = await api.updateSubcategory(selectedCategory._id, selectedSubcategory._id, payload);
            // --- Subcategory Add/Edit/Delete: update local state instantly for manager ---
            // After successful edit subcategory (manager):
            if (response.success) {
                setShowEditSubcategoryModal(false);
                setSelectedSubcategory(null);
                setSelectedCategory(null);
                if (user?.role === 'manager') {
                    setCategories(prev => prev.map(cat =>
                        cat._id === selectedCategory._id
                            ? { ...cat, subcategories: cat.subcategories.map(sub => sub._id === response.category.subcategories.find(s => s._id === selectedSubcategory._id)._id ? response.category.subcategories.find(s => s._id === selectedSubcategory._id) : sub) }
                            : cat
                    ));
                    // If details modal is open for this category, update modal state too
                    if (detailsModalCategory && detailsModalCategory._id === selectedCategory._id) {
                        setDetailsModalCategory(response.category);
                        // If the edited subcategory is open in the modal, update it too
                        if (detailsModalSubcategory && detailsModalSubcategory._id === selectedSubcategory._id) {
                            setDetailsModalSubcategory(response.category.subcategories.find(s => s._id === selectedSubcategory._id));
                        }
                    }
                } else {
                    fetchCategories();
                }
                toast.success('Subcategory updated successfully');
            } else {
                toast.error(response.message || "Failed to update subcategory");
            }
        } catch (error) {
            toast.error(error.message || 'Error updating subcategory');
        } finally {
            setLoading(false);
        }
    };

    // Handle subcategory delete
    const handleDeleteSubcategory = async (categoryId, subcategoryId) => {
        confirmAction('Are you sure you want to delete this subcategory? This action cannot be undone.', async () => {
            setLoading(true);
            setGlobalError("");
            try {
                const response = await api.deleteSubcategory(categoryId, subcategoryId);
                // --- Subcategory Add/Edit/Delete: update local state instantly for manager ---
                // After successful delete subcategory (manager):
                if (response.success) {
                    if (user?.role === 'manager') {
                        setCategories(prev => prev.map(cat =>
                            cat._id === categoryId
                                ? { ...cat, subcategories: cat.subcategories.filter(sub => sub._id !== subcategoryId) }
                                : cat
                        ));
                        // If details modal is open for this category, update modal state too
                        if (detailsModalCategory && detailsModalCategory._id === categoryId) {
                            const updatedCat = {
                                ...detailsModalCategory,
                                subcategories: detailsModalCategory.subcategories.filter(sub => sub._id !== subcategoryId)
                            };
                            setDetailsModalCategory(updatedCat);
                            // If the deleted subcategory was open in the modal, close the modal
                            if (detailsModalSubcategory && detailsModalSubcategory._id === subcategoryId) {
                                setShowDetailsModal(false);
                                setDetailsModalSubcategory(null);
                            }
                        }
                    } else {
                        fetchCategories();
                    }
                    toast.success('Subcategory deleted successfully');
                } else {
                    toast.error(response.message || "Failed to delete subcategory");
                }
            } catch (error) {
                toast.error(error.message || 'Error deleting subcategory');
            } finally {
                setLoading(false);
            }
        });
    };

    // Handle detail edit function
    const handleEditDetail = async (e) => {
        e.preventDefault();
        setLoading(true);
        setGlobalError("");
        try {
            const detailImageBase64 = selectedDetail.newImage ? await toBase64(selectedDetail.newImage) : null;
            const payload = {
                price: selectedDetail.price,
                isLocked: selectedDetail.isLocked,
                ...(detailImageBase64 && { detailImageBase64 })
            };
            const categoryId = selectedDetail.categoryId;
            const subcategoryId = selectedDetail.subcategoryId;
            const detailId = selectedDetail._id;
            const response = await api.updateDetail(categoryId, subcategoryId, detailId, payload);
            if (response.success) {
                setShowEditDetailModal(false);
                setSelectedDetail(null);
                setSelectedSubcategory(null);
                setSelectedCategory(null);
                // Update modal state immediately, fallback to fetchCategories if not found
                const updatedCat = response.category;
                let updatedSub = null;
                if (updatedCat && updatedCat.subcategories) {
                    updatedSub = updatedCat.subcategories.find(s => s._id === detailsModalSubcategory._id);
                }
                if (updatedSub) {
                    setDetailsModalCategory(updatedCat);
                    setDetailsModalSubcategory(updatedSub);
                } else {
                    await fetchCategories();
                    setShowDetailsModal(false); // close modal if can't update instantly
                }
                toast.success('Detail updated successfully');
            } else {
                toast.error(response.message || "Failed to update detail");
            }
        } catch (error) {
            toast.error(error.message || 'Error updating detail');
        } finally {
            setLoading(false);
        }
    };

    // Handle detail delete function
    const handleDeleteDetail = async (categoryId, subcategoryId, detailId) => {
        confirmAction('Are you sure you want to delete this detail? This action cannot be undone.', async () => {
            setLoading(true);
            setGlobalError("");
            try {
                const response = await api.deleteDetail(categoryId, subcategoryId, detailId);
                if (response.success) {
                    // Update modal state immediately, fallback to fetchCategories if not found
                    const updatedCat = response.category;
                    let updatedSub = null;
                    if (updatedCat && updatedCat.subcategories) {
                        updatedSub = updatedCat.subcategories.find(s => s._id === detailsModalSubcategory._id);
                    }
                    if (updatedSub) {
                        setDetailsModalCategory(updatedCat);
                        setDetailsModalSubcategory(updatedSub);
                    } else {
                        await fetchCategories();
                        setShowDetailsModal(false); // close modal if can't update instantly
                    }
                    toast.success('Detail deleted successfully');
                } else {
                    toast.error(response.message || "Failed to delete detail");
                }
            } catch (error) {
                toast.error(error.message || 'Error deleting detail');
            } finally {
                setLoading(false);
            }
        });
    };

    //Edit Category Modal state variables are already declared at the top of the component

    // Handle Edit Subcategory
    // const handleEditSubcategory = async (e) => {
    //     e.preventDefault();
    //     setLoading(true);

    //     try {
    //         const formData = new FormData();
    //         formData.append('name', selectedSubcategory.name);

    //         if (selectedSubcategory.newImage) {
    //             formData.append('image', selectedSubcategory.newImage);
    //         }

    //         await api.updateSubcategory(
    //             selectedCategory._id,
    //             selectedSubcategory._id,
    //             formData
    //         );
    //         alert('Subcategory updated successfully');
    //         setShowEditSubcategoryModal(false);
    //         fetchCategories();
    //     } catch (error) {
    //         console.error('Error updating subcategory:', error);
    //         alert('Failed to update subcategory');
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    // // Handle Delete Subcategory
    // const handleDeleteSubcategory = async (categoryId, subcategoryId) => {
    //     if (window.confirm('Are you sure you want to delete this subcategory? This action cannot be undone.')) {
    //         setLoading(true);
    //         try {
    //             await api.deleteSubcategory(categoryId, subcategoryId);
    //             alert('Subcategory deleted successfully');
    //             fetchCategories();
    //         } catch (error) {
    //             console.error('Error deleting subcategory:', error);
    //             alert('Failed to delete subcategory');
    //         } finally {
    //             setLoading(false);
    //         }
    //     }
    // };

    // handleEditDetail and handleDeleteDetail functions are already defined above

    const toggleSubDetails = (catId, subIdx) => {
        setOpenSubDetails(prev => ({
            ...prev,
            [`${catId}-${subIdx}`]: !prev[`${catId}-${subIdx}`]
        }));
    };

    // Helper for confirm dialog using Toastify
    const confirmAction = (message, onConfirm) => {
        toast.info(
            <div>
                <div>{message}</div>
                <div style={{marginTop: 8, display: 'flex', gap: 8}}>
                    <button onClick={() => { toast.dismiss(); onConfirm(); }} style={{background:'#2563eb',color:'#fff',border:'none',padding:'4px 12px',borderRadius:4}}>Yes</button>
                    <button onClick={() => toast.dismiss()} style={{background:'#e5e7eb',color:'#111',border:'none',padding:'4px 12px',borderRadius:4}}>No</button>
                </div>
            </div>,
            { autoClose: false, closeOnClick: false, draggable: false, position: 'top-center' }
        );
    };

    return (
        <div className="p-6">
            <ToastContainer />
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Category Management</h1>
                {(user?.role === 'superadmin' || user?.role === 'admin') && (
                    <div className="flex-1 flex justify-end">
                        <button
                            onClick={() => setShowAddForm(!showAddForm)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow cursor-pointer"
                        >
                            <Plus size={20} />
                            Add Category
                        </button>
                    </div>
                )}
            </div>

            {globalError && (
                <div className="mb-4 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg shadow animate-pulse">
                    <strong className="font-bold">Error:</strong> {globalError}
                </div>
            )}

            {showAddForm && (
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                    <h2 className="text-xl font-semibold mb-4">Add New Category</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Category Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Category Image</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setFormData({ ...formData, categoryImage: e.target.files[0] })}
                                className="mt-1 block w-full"
                                required
                            />
                        </div>

                        {/* Subcategories Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-700">Subcategories</h3>
                            {formData.subcategories.map((subcategory, subIndex) => (
                                <div key={subIndex} className="border p-4 rounded-lg space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-md font-medium text-gray-700">Subcategory {subIndex + 1}</h4>
                                        {formData.subcategories.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newSubcategories = [...formData.subcategories];
                                                    newSubcategories.splice(subIndex, 1);
                                                    setFormData({ ...formData, subcategories: newSubcategories });
                                                }}
                                                className="text-red-600 hover:text-red-800 cursor-pointer"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Subcategory Name</label>
                                        <input
                                            type="text"
                                            value={subcategory.name}
                                            onChange={(e) => {
                                                const newSubcategories = [...formData.subcategories];
                                                newSubcategories[subIndex].name = e.target.value;
                                                setFormData({ ...formData, subcategories: newSubcategories });
                                            }}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Subcategory Image</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const newSubcategories = [...formData.subcategories];
                                                newSubcategories[subIndex].image = e.target.files[0];
                                                setFormData({ ...formData, subcategories: newSubcategories });
                                            }}
                                            className="mt-1 block w-full"
                                            required
                                        />
                                    </div>

                                    {/* Details Section */}
                                    <div className="space-y-4">
                                        <h4 className="text-md font-medium text-gray-700">Details</h4>
                                        {subcategory.details.map((detail, detailIndex) => (
                                            <div key={detailIndex} className="border p-4 rounded-lg space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <h5 className="text-sm font-medium text-gray-700">Detail {detailIndex + 1}</h5>
                                                    {subcategory.details.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newSubcategories = [...formData.subcategories];
                                                                newSubcategories[subIndex].details.splice(detailIndex, 1);
                                                                setFormData({ ...formData, subcategories: newSubcategories });
                                                            }}
                                                            className="text-red-600 hover:text-red-800 cursor-pointer"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Detail Image</label>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            const newSubcategories = [...formData.subcategories];
                                                            newSubcategories[subIndex].details[detailIndex].image = e.target.files[0];
                                                            setFormData({ ...formData, subcategories: newSubcategories });
                                                        }}
                                                        className="mt-1 block w-full"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Price</label>
                                                    <input
                                                        type="number"
                                                        value={detail.price}
                                                        min="0"
                                                        step="0.01"
                                                        onChange={(e) => {
                                                            if (e.target.value < 0) return;
                                                            const newSubcategories = [...formData.subcategories];
                                                            newSubcategories[subIndex].details[detailIndex].price = e.target.value;
                                                            setFormData({ ...formData, subcategories: newSubcategories });
                                                        }}
                                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                        required
                                                    />
                                                </div>
                                                <div className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={detail.isLocked}
                                                        onChange={(e) => {
                                                            const newSubcategories = [...formData.subcategories];
                                                            newSubcategories[subIndex].details[detailIndex].isLocked = e.target.checked;
                                                            setFormData({ ...formData, subcategories: newSubcategories });
                                                        }}
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <label className="ml-2 text-sm text-gray-700">Lock this detail</label>
                                                </div>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newSubcategories = [...formData.subcategories];
                                                newSubcategories[subIndex].details.push({
                                                    image: null,
                                                    price: '',
                                                    isLocked: false
                                                });
                                                setFormData({ ...formData, subcategories: newSubcategories });
                                            }}
                                            className="text-blue-600 hover:text-blue-700 cursor-pointer"
                                        >
                                            + Add Detail
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => {
                                    setFormData({
                                        ...formData,
                                        subcategories: [
                                            ...formData.subcategories,
                                            {
                                                name: '',
                                                image: null,
                                                details: [{ image: null, price: '', isLocked: false }]
                                            }
                                        ]
                                    });
                                }}
                                className="text-blue-600 hover:text-blue-700 cursor-pointer"
                            >
                                + Add Subcategory
                            </button>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAddForm(false);
                                    setFormData(initialFormState);
                                }}
                                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : 'Save Category'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Search categories..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subcategories</th>
                                {(user?.role === 'superadmin' || user?.role === 'admin') && (
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={(user?.role === 'superadmin' || user?.role === 'admin') ? 4 : 3} className="px-6 py-4 text-center">Loading...</td>
                                </tr>
                            ) : filteredVisibleCategories.length === 0 ? (
                                <tr>
                                    <td colSpan={(user?.role === 'superadmin' || user?.role === 'admin') ? 4 : 3} className="px-6 py-4 text-center">No categories found</td>
                                </tr>
                            ) : (
                                filteredVisibleCategories.map((category) => (
                                    <tr key={category._id}>
                                        <td className="px-6 py-4 whitespace-nowrap">{category.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 relative">
                                                    {getImageUrl(category.image) ? (
                                                        <>
                                                            <img
                                                                className="h-10 w-10 rounded-full object-cover"
                                                                src={getImageUrl(category.image)}
                                                                onError={(e) => handleImageError(`category-${category._id}`, e)}
                                                            />
                                                            {createFallbackDiv(category.name)}
                                                        </>
                                                    ) : (
                                                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-medium text-sm">
                                                            {category.name.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 align-top">
                                            <div className="flex flex-col gap-2">
                                                {category.subcategories?.length > 0 ? (
                                                    <table className="min-w-full border divide-y divide-gray-200 text-xs mb-1 mt-2 rounded-lg overflow-hidden shadow">
                                                        <thead className="bg-gray-100">
                                                            <tr>
                                                                <th className="px-4 py-2 text-left">#</th>
                                                                <th className="px-4 py-2 text-left">Name</th>
                                                                <th className="px-4 py-2 text-left">Image</th>
                                                                <th className="px-4 py-2 text-left">Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {category.subcategories.map((sub, subIdx) => (
                                                                <tr key={sub._id}>
                                                                    <td className="px-2 py-1">{subIdx + 1}</td>
                                                                    <td className="px-2 py-1">{sub.name}</td>
                                                                    <td className="px-2 py-1">
                                                                        {sub.image ? (
                                                                            <img
                                                                                src={getImageUrl(sub.image)}
                                                                                alt={sub.name}
                                                                                className="h-8 w-8 rounded-full object-cover"
                                                                                onError={e => { e.target.style.display = 'none'; }}
                                                                            />
                                                                        ) : (
                                                                            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-medium text-sm">
                                                                                {sub.name ? sub.name.charAt(0).toUpperCase() : '?'}
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-2 py-1">
                                                                        <button
                                                                            className="text-blue-600 hover:text-blue-900 mr-2 cursor-pointer"
                                                                            onClick={() => {
                                                                                setSelectedCategory(category);
                                                                                setSelectedSubcategory({ ...sub, newImage: null });
                                                                                setShowEditSubcategoryModal(true);
                                                                            }}
                                                                        >
                                                                            <Edit size={16} />
                                                                        </button>
                                                                        <button
                                                                            className="text-red-600 hover:text-red-900 mr-2 cursor-pointer"
                                                                            onClick={() => handleDeleteSubcategory(category._id, sub._id)}
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                        <button
                                                                            className="text-cyan-600 hover:text-cyan-900 cursor-pointer"
                                                                            onClick={() => {
                                                                                setDetailsModalCategory(category);
                                                                                setDetailsModalSubcategory(sub);
                                                                                setShowDetailsModal(true);
                                                                            }}
                                                                        >
                                                                            Details
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                ) : (
                                                    <div className="italic text-gray-400">No subcategories</div>
                                                )}
                                                {((user?.role === 'superadmin' || user?.role === 'admin' || user?.role === 'manager') && (
                                                    <button
                                                        className="text-blue-600 hover:text-blue-700 mt-2 cursor-pointer"
                                                        onClick={() => {
                                                            setSelectedCategory(category);
                                                            setShowSubcategoryForm(true);
                                                        }}
                                                    >
                                                        + Add Subcategory
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                        {(user?.role === 'superadmin' || user?.role === 'admin') && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    className="text-blue-600 hover:text-blue-900 mr-4 cursor-pointer"
                                                    onClick={() => {
                                                        setSelectedCategory({
                                                            ...category,
                                                            newImage: null
                                                        });
                                                        setShowEditCategoryModal(true);
                                                    }}
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    className="text-red-600 hover:text-red-900 cursor-pointer"
                                                    onClick={() => handleDeleteCategory(category._id)}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Subcategory Modal */}
            {showSubcategoryForm && selectedCategory && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-md w-96 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-semibold mb-4">Add Subcategory to {selectedCategory.name}</h2>
                        <form onSubmit={handleSubcategorySubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Subcategory Name</label>
                                <input
                                    type="text"
                                    value={subcategoryFormData.name}
                                    onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, name: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Subcategory Image</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, image: e.target.files[0] })}
                                    className="mt-1 block w-full"
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowSubcategoryForm(false);
                                        setSubcategoryFormData({
                                            name: '',
                                            image: null
                                        });
                                        setSelectedCategory(null);
                                    }}
                                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                                >
                                    Add Subcategory
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {showDetailsModal && detailsModalCategory && detailsModalSubcategory && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-2xl relative">
                        <button
                            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                            onClick={() => {
                                setShowDetailsModal(false);
                                setDetailsModalCategory(null);
                                setDetailsModalSubcategory(null);
                            }}
                        >
                            ×
                        </button>
                        <h2 className="text-xl font-semibold mb-4">Details for {detailsModalSubcategory.name}</h2>
                        {((user?.role === 'superadmin' || user?.role === 'admin' || user?.role === 'manager') && (
                            <button
                                className="mb-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer"
                                onClick={() => setShowAddDetailForm(true)}
                            >
                                + Add Detail
                            </button>
                        ))}
                        <table className="min-w-full border divide-y divide-gray-200 text-xs mb-1 mt-2 rounded-lg overflow-hidden shadow">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-2 text-left">#</th>
                                    <th className="px-4 py-2 text-left">Image</th>
                                    <th className="px-4 py-2 text-left">Price</th>
                                    <th className="px-4 py-2 text-left">Locked</th>
                                    <th className="px-4 py-2 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {detailsModalSubcategory.details && detailsModalSubcategory.details.length > 0 ? (
                                    detailsModalSubcategory.details.map((detail, dIdx) => (
                                        <tr key={detail._id}>
                                            <td className="px-2 py-1">{dIdx + 1}</td>
                                            <td className="px-2 py-1">
                                                {detail.image ? (
                                                    <img
                                                        src={getImageUrl(detail.image)}
                                                        alt="Detail"
                                                        className="h-8 w-8 rounded object-cover"
                                                        onError={e => { e.target.style.display = 'none'; }}
                                                    />
                                                ) : (
                                                    <div className="h-8 w-8 rounded bg-gray-200 flex items-center justify-center text-gray-500 font-medium text-xs">
                                                        ?
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-2 py-1">Rs. {detail.price}</td>
                                            <td className="px-2 py-1">
                                                {detail.isLocked ? (
                                                    <span className="text-red-600 font-medium">Locked</span>
                                                ) : (
                                                    <span className="text-green-600 font-medium">Unlocked</span>
                                                )}
                                            </td>
                                            <td className="px-2 py-1">
                                                <button
                                                    className="text-blue-600 hover:text-blue-900 mr-2 cursor-pointer"
                                                    onClick={() => {
                                                        setSelectedDetail({
                                                            ...detail,
                                                            newImage: null,
                                                            categoryId: detailsModalCategory._id,
                                                            subcategoryId: detailsModalSubcategory._id
                                                        });
                                                        setShowEditDetailModal(true);
                                                    }}
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    className="text-red-600 hover:text-red-900 cursor-pointer"
                                                    onClick={() => handleDeleteDetail(detailsModalCategory._id, detailsModalSubcategory._id, detail._id)}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="text-center text-gray-400 py-4">No details found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        {/* Add Detail Modal (reuse existing) */}
                        {showAddDetailForm && (
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                <div className="bg-white p-6 rounded-lg shadow-md w-96 max-h-[90vh] overflow-y-auto">
                                    <h2 className="text-xl font-semibold mb-4">Add Detail to {detailsModalSubcategory.name}</h2>
                                    <form onSubmit={async (e) => {
                                        e.preventDefault();
                                        const detailImageBase64 = detailFormData.image ? await toBase64(detailFormData.image) : null;
                                        const payload = { price: detailFormData.price, isLocked: detailFormData.isLocked, detailImageBase64 };
                                        try {
                                            const response = await api.addDetail(detailsModalCategory._id, detailsModalSubcategory._id, payload);
                                            if (response.success) {
                                                setShowAddDetailForm(false);
                                                setDetailFormData({ price: '', isLocked: false, image: null });
                                                // Update modal state immediately
                                                const updatedCat = response.category;
                                                const updatedSub = updatedCat.subcategories.find(s => s._id === detailsModalSubcategory._id);
                                                setDetailsModalCategory(updatedCat);
                                                setDetailsModalSubcategory(updatedSub);
                                                toast.success('Detail added successfully');
                                            } else {
                                                toast.error(response.message || 'Failed to add detail');
                                            }
                                        } catch (error) {
                                            toast.error(error.message || 'Error adding detail');
                                        }
                                    }} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Detail Image</label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => setDetailFormData({ ...detailFormData, image: e.target.files[0] })}
                                                className="mt-1 block w-full"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Price</label>
                                            <input
                                                type="number"
                                                value={detailFormData.price}
                                                min="0"
                                                step="0.01"
                                                onChange={(e) => setDetailFormData({ ...detailFormData, price: e.target.value })}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                required
                                            />
                                        </div>
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={detailFormData.isLocked}
                                                onChange={(e) => setDetailFormData({ ...detailFormData, isLocked: e.target.checked })}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <label className="ml-2 text-sm text-gray-700">Lock this detail</label>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowAddDetailForm(false);
                                                    setDetailFormData({ price: '', isLocked: false, image: null });
                                                }}
                                                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                                            >
                                                Add Detail
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                        {/* Edit Detail Modal (reuse existing) */}
                        {showEditDetailModal && selectedDetail && (
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-xl font-bold">Edit Detail</h2>
                                        <button
                                            onClick={() => setShowEditDetailModal(false)}
                                            className="text-gray-500 hover:text-gray-700"
                                        >
                                            ×
                                        </button>
                                    </div>
                                    <form onSubmit={handleEditDetail}>
                                        <div className="mb-4">
                                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="detailPrice">
                                                Price
                                            </label>
                                            <input
                                                id="detailPrice"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                                value={selectedDetail?.price || ''}
                                                onChange={(e) => setSelectedDetail({ ...selectedDetail, price: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <label className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    className="form-checkbox h-5 w-5 text-blue-600"
                                                    checked={selectedDetail?.isLocked || false}
                                                    onChange={(e) => setSelectedDetail({ ...selectedDetail, isLocked: e.target.checked })}
                                                />
                                                <span className="ml-2 text-gray-700">Locked</span>
                                            </label>
                                        </div>
                                        <div className="mb-4">
                                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="detailImage">
                                                Detail Image
                                            </label>
                                            <div className="flex items-center space-x-4">
                                                <div className="h-20 w-20 relative">
                                                    {(selectedDetail?.newImage ? URL.createObjectURL(selectedDetail.newImage) : getImageUrl(selectedDetail?.image)) ? (
                                                        <img
                                                            src={selectedDetail?.newImage ? URL.createObjectURL(selectedDetail.newImage) : getImageUrl(selectedDetail?.image)}
                                                            alt="Detail"
                                                            className="h-20 w-20 object-cover rounded-md"
                                                        />
                                                    ) : (
                                                        <div className="h-20 w-20 bg-gray-200 flex items-center justify-center rounded-md">
                                                            {/* <ImageIcon size={24} /> */}
                                                        </div>
                                                    )}
                                                </div>
                                                <input
                                                    id="detailImage"
                                                    type="file"
                                                    accept="image/*"
                                                    className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                    onChange={(e) => {
                                                        if (e.target.files[0]) {
                                                            setSelectedDetail({ ...selectedDetail, newImage: e.target.files[0] });
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => setShowEditDetailModal(false)}
                                                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-md mr-2"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
                                                disabled={loading}
                                            >
                                                {loading ? 'Updating...' : 'Update Detail'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Edit Category Modal */}
            {showEditCategoryModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Edit Category</h2>
                            <button
                                onClick={() => setShowEditCategoryModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleEditCategory}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="categoryName">
                                    Category Name
                                </label>
                                <input
                                    id="categoryName"
                                    type="text"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={selectedCategory?.name || ''}
                                    onChange={(e) => setSelectedCategory({ ...selectedCategory, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="categoryImage">
                                    Category Image
                                </label>
                                <div className="flex items-center space-x-4">
                                    <div className="h-20 w-20 relative">
                                        {(selectedCategory?.newImage ? URL.createObjectURL(selectedCategory.newImage) : getImageUrl(selectedCategory?.image)) ? (
                                            <img
                                                src={selectedCategory?.newImage ? URL.createObjectURL(selectedCategory.newImage) : getImageUrl(selectedCategory?.image)}
                                                alt={selectedCategory?.name}
                                                className="h-20 w-20 object-cover rounded-md"
                                            />
                                        ) : (
                                            <div className="h-20 w-20 bg-gray-200 flex items-center justify-center rounded-md">
                                                {/* <ImageIcon size={24} /> */}
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        id="categoryImage"
                                        type="file"
                                        accept="image/*"
                                        className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        onChange={(e) => {
                                            if (e.target.files[0]) {
                                                setSelectedCategory({ ...selectedCategory, newImage: e.target.files[0] });
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowEditCategoryModal(false)}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-md mr-2"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
                                    disabled={loading}
                                >
                                    {loading ? 'Updating...' : 'Update Category'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Subcategory Modal */}
            {showEditSubcategoryModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Edit Subcategory</h2>
                            <button
                                onClick={() => setShowEditSubcategoryModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleEditSubcategory}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="subcategoryName">
                                    Subcategory Name
                                </label>
                                <input
                                    id="subcategoryName"
                                    type="text"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={selectedSubcategory?.name || ''}
                                    onChange={(e) => setSelectedSubcategory({ ...selectedSubcategory, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="subcategoryImage">
                                    Subcategory Image
                                </label>
                                <div className="flex items-center space-x-4">
                                    <div className="h-20 w-20 relative">
                                        {(selectedSubcategory?.newImage ? URL.createObjectURL(selectedSubcategory.newImage) : getImageUrl(selectedSubcategory?.image)) ? (
                                            <img
                                                src={selectedSubcategory?.newImage ? URL.createObjectURL(selectedSubcategory.newImage) : getImageUrl(selectedSubcategory?.image)}
                                                alt={selectedSubcategory?.name}
                                                className="h-20 w-20 object-cover rounded-md"
                                            />
                                        ) : (
                                            <div className="h-20 w-20 bg-gray-200 flex items-center justify-center rounded-md">
                                                {/* <ImageIcon size={24} /> */}
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        id="subcategoryImage"
                                        type="file"
                                        accept="image/*"
                                        className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        onChange={(e) => {
                                            if (e.target.files[0]) {
                                                setSelectedSubcategory({ ...selectedSubcategory, newImage: e.target.files[0] });
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowEditSubcategoryModal(false)}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-md mr-2"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
                                    disabled={loading}
                                >
                                    {loading ? 'Updating...' : 'Update Subcategory'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Detail Modal */}
            {showEditDetailModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Edit Detail</h2>
                            <button
                                onClick={() => setShowEditDetailModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleEditDetail}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="detailPrice">
                                    Price
                                </label>
                                <input
                                    id="detailPrice"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={selectedDetail?.price || ''}
                                    onChange={(e) => setSelectedDetail({ ...selectedDetail, price: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        className="form-checkbox h-5 w-5 text-blue-600"
                                        checked={selectedDetail?.isLocked || false}
                                        onChange={(e) => setSelectedDetail({ ...selectedDetail, isLocked: e.target.checked })}
                                    />
                                    <span className="ml-2 text-gray-700">Locked</span>
                                </label>
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="detailImage">
                                    Detail Image
                                </label>
                                <div className="flex items-center space-x-4">
                                    <div className="h-20 w-20 relative">
                                        {(selectedDetail?.newImage ? URL.createObjectURL(selectedDetail.newImage) : getImageUrl(selectedDetail?.image)) ? (
                                            <img
                                                src={selectedDetail?.newImage ? URL.createObjectURL(selectedDetail.newImage) : getImageUrl(selectedDetail?.image)}
                                                alt="Detail"
                                                className="h-20 w-20 object-cover rounded-md"
                                            />
                                        ) : (
                                            <div className="h-20 w-20 bg-gray-200 flex items-center justify-center rounded-md">
                                                {/* <ImageIcon size={24} /> */}
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        id="detailImage"
                                        type="file"
                                        accept="image/*"
                                        className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        onChange={(e) => {
                                            if (e.target.files[0]) {
                                                setSelectedDetail({ ...selectedDetail, newImage: e.target.files[0] });
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowEditDetailModal(false)}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-md mr-2"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
                                    disabled={loading}
                                >
                                    {loading ? 'Updating...' : 'Update Detail'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {showAddDetailForm && selectedCategory && selectedSubcategory && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-md w-96 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-semibold mb-4">Add Detail to {selectedSubcategory.name}</h2>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            const detailImageBase64 = detailFormData.image ? await toBase64(detailFormData.image) : null;
                            const payload = { price: detailFormData.price, isLocked: detailFormData.isLocked, detailImageBase64 };
                            try {
                                const response = await api.addDetail(selectedCategory._id, selectedSubcategory._id, payload);
                                if (response.success) {
                                    await fetchCategories();
                                    setShowAddDetailForm(false);
                                    setDetailFormData({ price: '', isLocked: false, image: null });
                                    setSelectedCategory(null);
                                    setSelectedSubcategory(null);
                                    toast.success('Detail added successfully');
                                } else {
                                    toast.error(response.message || 'Failed to add detail');
                                }
                            } catch (error) {
                                toast.error(error.message || 'Error adding detail');
                            }
                        }} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Detail Image</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setDetailFormData({ ...detailFormData, image: e.target.files[0] })}
                                    className="mt-1 block w-full"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Price</label>
                                <input
                                    type="number"
                                    value={detailFormData.price}
                                    min="0"
                                    step="0.01"
                                    onChange={(e) => setDetailFormData({ ...detailFormData, price: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={detailFormData.isLocked}
                                    onChange={(e) => setDetailFormData({ ...detailFormData, isLocked: e.target.checked })}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label className="ml-2 text-sm text-gray-700">Lock this detail</label>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddDetailForm(false);
                                        setDetailFormData({ price: '', isLocked: false, image: null });
                                        setSelectedCategory(null);
                                        setSelectedSubcategory(null);
                                    }}
                                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                                >
                                    Add Detail
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default CategoryManagement;