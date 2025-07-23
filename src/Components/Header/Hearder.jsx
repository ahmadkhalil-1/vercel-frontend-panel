import React from 'react';
import ProfileShow from '../Atomic/ProfileShow';
import SearchBar from '../Atomic/SearchBar';

const Header = ({ isSidebarExpanded }) => {
    return (
        <header className={`
            transition-all duration-300 ease-in-out
            bg-white shadow-md
        `}>
            <div className='flex justify-between items-center p-4 flex-wrap'>
                <div className='flex-grow mx-2'>
                    <SearchBar />
                </div>
                <div className='ml-4'>
                    <ProfileShow />
                </div>
            </div>
        </header>
    );
}

export default Header;