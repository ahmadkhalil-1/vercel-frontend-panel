// API Configuration
const API_BASE_URL = 'http://localhost:5000';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
};

const api = {
    // Auth APIs
    register: async (userData) => {
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });
        return response.json();
    },

    login: async (credentials) => {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        });
        return response.json();
    },

    logout: async () => {
        const response = await fetch(`${API_BASE_URL}/api/auth/logout`);
        return response.json();
    },

    // Category APIs
    getAuthHeaders: () => {
        const token = localStorage.getItem('token');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    },

    getCategories: async () => {
        const response = await fetch(`${API_BASE_URL}/api/categories/`, {
            headers: getAuthHeaders()
        });
        return response.json();
    },

    addSubcategory: async (categoryId, data) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/categories/${categoryId}/subcategories`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    addCategory: async (data) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/categories/add`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    deleteCategory: async (id) => {
        const response = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return response.json();
    },

    // Update category
    updateCategory: async (id, data) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    // Update subcategory
    updateSubcategory: async (categoryId, subcategoryId, data) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/categories/${categoryId}/subcategories/${subcategoryId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    // Delete subcategory
    deleteSubcategory: async (categoryId, subcategoryId) => {
        const response = await fetch(`${API_BASE_URL}/api/categories/${categoryId}/subcategories/${subcategoryId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return response.json();
    },

    // Update detail
    updateDetail: async (categoryId, subcategoryId, detailId, data) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/categories/${categoryId}/subcategories/${subcategoryId}/details/${detailId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    // Delete detail
    deleteDetail: async (categoryId, subcategoryId, detailId) => {
        const response = await fetch(`${API_BASE_URL}/api/categories/${categoryId}/subcategories/${subcategoryId}/details/${detailId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return response.json();
    },

    addDetail: async (categoryId, subcategoryId, data) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/categories/${categoryId}/subcategories/${subcategoryId}/details`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    // Manager APIs
    getManagers: async () => {
        const response = await fetch(`${API_BASE_URL}/api/managers`, {
            headers: getAuthHeaders()
        });
        return response.json();
    },
    addManager: async (managerData) => {
        const response = await fetch(`${API_BASE_URL}/api/managers`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(managerData)
        });
        return response.json();
    },
    updateManager: async (id, managerData) => {
        const response = await fetch(`${API_BASE_URL}/api/managers/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(managerData)
        });
        return response.json();
    },
    deleteManager: async (id) => {
        const response = await fetch(`${API_BASE_URL}/api/managers/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return response.json();
    },

    // Users with unlocked images (for sidebar)
    getUsersWithUnlockedImages: async () => {
        const response = await fetch(`${API_BASE_URL}/api/users/with-unlocked-images`, {
            headers: getAuthHeaders()
        });
        return response.json();
    },
};

export default api;