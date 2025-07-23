import { ChevronDown } from 'lucide-react'
import React, { useState } from 'react'
import { Avatar } from 'primereact/avatar';
import { useNavigate } from 'react-router-dom';
import img from "../../assets/Images/profile.jpg.png"
import api from '../../api/api';
import Toast from '../Toast';
import { LogOutIcon } from 'lucide-react';

const ProfileShow = () => {
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [toast, setToast] = useState(null);
    const authUser = JSON.parse(localStorage.getItem('authUser'));

    const handleToggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
    };

    const handleLogout = async () => {
        setDropdownOpen(false);
        try {
            const result = await api.logout();
            if (result.success) {
                setToast({ message: 'Logout successful!', type: 'success' });
                localStorage.removeItem('authUser');
                localStorage.removeItem('authToken')
                navigate('/login');
            }
            else {
                setToast({ message: 'Logout failed' });
            }
        }
        catch (error) {
            setToast({ message: 'Network error. Please try again.', type: 'error' });
        }

    };

    return (
        <div className="relative cursor-pointer">
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
            <div className='flex rounded-full border border-gray-300 mr-4'>
                <div
                    tabIndex={0}
                    role="button"
                    className='flex flex-row items-center justify-between w-full p-0.5'
                    onClick={handleToggleDropdown}
                >
                    <div className='flex items-center'>
                        <div className='relative'>
                            <Avatar
                                image={img}
                                className="mr-2 mt-1 ml-2 w-8 h-8"
                                shape="circle"
                            />
                            <div className='absolute top-[-0.8rem] left-56 w-4 h-4 bg-green-500 rounded-full'></div>
                        </div>
                        <div className='text-black'>
                            <div className='text-xs font-semibold'>{authUser.name}</div>
                            <div className='text-xs text-blue-500'>{authUser.email}</div>
                            <div className='text-xs'>+92 332 8900</div>
                        </div>
                    </div>
                    <ChevronDown className='text-black ml-2' />
                </div>
            </div>
            {dropdownOpen && (
                <ul
                    className="absolute left-5 mx-1.5 w-48 bg-white border-b border-gray-300 rounded-md text-xs z-10 shadow-md"
                >
                    <li
                        className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-gray-100 text-red-600"
                        onClick={handleLogout}
                    >
                        <LogOutIcon className="w-4 h-4" />
                        <span>Logout</span>
                    </li>
                </ul>
            )}
        </div>
    )
}

export default ProfileShow