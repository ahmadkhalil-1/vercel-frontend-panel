import React, { useEffect, useState } from 'react';
import CategoryManagement from './Components/Categories/CategoryManagement';
import ManagerManagement from './Components/Atomic/ManagerManagement';
import { useAuth } from './context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Sidebar, { SidebarItem } from './Components/Sidebar/Sidebar';
import { LayoutDashboard, FolderTree, Users, LogOut } from 'lucide-react';
import api from './api/api';

const Home = () => {
    const { user, logout } = useAuth();
    const [categories, setCategories] = useState([]);
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('dashboard');
    const [catError, setCatError] = useState("");
    const [sidebarExpanded, setSidebarExpanded] = useState(true);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setCatError("");
            const response = await api.getCategories();
            if (!response.success) {
                setCatError(response.message || "Failed to fetch categories");
                setCategories([]);
            } else {
                setCategories(response.categories);
            }
        } catch (error) {
            setCatError(error.message || 'Error fetching categories');
            setCategories([]);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex">
            <Sidebar onExpandChange={setSidebarExpanded}>
                <SidebarItem
                    icon={<LayoutDashboard className="w-6 h-6" />}
                    text="Dashboard"
                    active={activeSection === 'dashboard'}
                    onClick={() => setActiveSection('dashboard')}
                />
                <SidebarItem
                    icon={<FolderTree className="w-6 h-6" />}
                    text="Categories"
                    active={activeSection === 'categories'}
                    onClick={() => setActiveSection('categories')}
                />
                {user?.role === 'superadmin' && (
                    <SidebarItem
                        icon={<Users className="w-6 h-6" />}
                        text="Managers"
                        active={activeSection === 'users'}
                        onClick={() => setActiveSection('users')}
                    />
                )}
                <SidebarItem
                    icon={<LogOut className="w-6 h-6" />}
                    text="Logout"
                    onClick={logout}
                />
            </Sidebar>

            <div className={`flex-1 transition-all duration-300 ease-in-out ${sidebarExpanded ? 'ml-[15rem]' : 'ml-[3.5rem]'}`}>
                <nav className="bg-gradient-to-r from-white to-gray-50 shadow-lg border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-16">
                            <div className="flex items-center">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                        <LayoutDashboard className="w-5 h-5 text-white" />
                                    </div>
                                    <h1 className="text-xl font-bold bg-clip-text text-black">
                                        Admin Dashboard
                                    </h1>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-3 bg-white rounded-full px-4 py-2 shadow-md border border-gray-100 hover:shadow-lg transition-all duration-200">
                                    <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-800">
                                            {user?.name || 'User'}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {user?.email || 'user@example.com'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <span className="px-3 py-1 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 text-xs font-semibold uppercase tracking-wide shadow-sm">
                                        {user?.role || 'User'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </nav>

                <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    {/* Show backend error if any */}
                    {catError && (
                        <div className="mb-4 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg shadow animate-pulse">
                            <strong className="font-bold">Error:</strong> {catError}
                        </div>
                    )}
                    {activeSection === 'categories' ? (
                        <CategoryManagement />
                    ) : activeSection === 'users' ? (
                        <ManagerManagement />
                    ) : (
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-2xl font-bold mb-4">Welcome to the Dashboard</h2>
                            <p className="mb-6">Below is a summary of all categories with subcategories and details.</p>

                            {categories.length > 0 ? (
                                <div className="space-y-6">
                                    {categories.map((cat, index) => (
                                        <div key={index} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                            <div className="bg-gray-100 px-4 py-2 flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    {cat.image ? (
                                                        <img
                                                            src={cat.image}
                                                            alt={cat.name}
                                                            className="h-10 w-10 rounded-full object-cover"
                                                            onError={e => { e.target.style.display = 'none'; }}
                                                        />
                                                    ) : (
                                                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-medium text-lg">
                                                            {cat.name.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-800">{cat.name}</h3>
                                                        <p className="text-sm text-gray-600">ID: {cat._id}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Subcategories with their Details */}
                                            {cat.subcategories?.length > 0 && (
                                                <div className="p-4 border-t">
                                                    <h4 className="font-semibold text-gray-700 mb-4">Subcategories</h4>
                                                    <div className="space-y-4">
                                                        {cat.subcategories.map((sub, subIdx) => (
                                                            <div key={subIdx} className="border border-gray-300 rounded-lg overflow-hidden flex flex-col bg-gray-50 p-2">
                                                                <div className="flex items-center gap-3 mb-2">
                                                                    {sub.image ? (
                                                                        <img
                                                                            src={sub.image}
                                                                            alt={sub.name}
                                                                            className="h-8 w-8 rounded-full object-cover"
                                                                            onError={e => { e.target.style.display = 'none'; }}
                                                                        />
                                                                    ) : (
                                                                        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-medium text-sm">
                                                                            {sub.name ? sub.name.charAt(0).toUpperCase() : '?'}
                                                                        </div>
                                                                    )}
                                                                    <div>
                                                                        <h5 className="text-md font-medium text-gray-800">{sub.name}</h5>
                                                                        <p className="text-xs text-gray-500">ID: {sub._id}</p>
                                                                    </div>
                                                                </div>
                                                                {sub.details?.length > 0 ? (
                                                                    <table className="min-w-full border divide-y divide-gray-200 text-xs mb-1">
                                                                        <thead>
                                                                            <tr>
                                                                                <th className="px-2 py-1 text-left">Image</th>
                                                                                <th className="px-2 py-1 text-left">Price</th>
                                                                                <th className="px-2 py-1 text-left">Status</th>
                                                                                <th className="px-2 py-1 text-left">ID</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {sub.details.map((detail, dIdx) => (
                                                                                <tr key={dIdx}>
                                                                                    <td className="px-2 py-1">
                                                                                        {detail.image ? (
                                                                                            <img
                                                                                                src={detail.image}
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
                                                                                    <td className="px-2 py-1 text-gray-500">{detail._id}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                ) : (
                                                                    <div className="italic text-gray-400">No details available for this subcategory</div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Fallback: Main Category Details (if details are at category level) */}
                                            {cat.details?.length > 0 && (!cat.subcategories || cat.subcategories.length === 0) && (
                                                <div className="p-4 border-t">
                                                    <h4 className="font-semibold text-gray-700 mb-2">Category Details</h4>
                                                    <div className="overflow-x-auto">
                                                        <table className="min-w-full border divide-y divide-gray-200 text-sm text-left">
                                                            <thead className="bg-gray-50">
                                                                <tr>
                                                                    <th className="px-4 py-2 font-medium text-gray-600">Price</th>
                                                                    <th className="px-4 py-2 font-medium text-gray-600">Status</th>
                                                                    <th className="px-4 py-2 font-medium text-gray-600">ID</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="bg-white divide-y divide-gray-100">
                                                                {cat.details.map((detail, dIndex) => (
                                                                    <tr key={dIndex}>
                                                                        <td className="px-4 py-2 text-gray-800">Rs. {detail.price}</td>
                                                                        <td className="px-4 py-2">
                                                                            {detail.isLocked ? (
                                                                                <span className="text-red-600 font-medium">Locked</span>
                                                                            ) : (
                                                                                <span className="text-green-600 font-medium">Unlocked</span>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-gray-500">{detail._id}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500">No categories available.</p>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Home;