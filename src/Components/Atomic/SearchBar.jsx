import React, { useState } from 'react';
import { Search } from 'lucide-react';

const SearchBar = () => {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <div className={`relative flex transition-all duration-300 ease-in-out ${isFocused ? 'w-[27rem]' : 'w-[16rem]'}`}>
            {/* Use the icon as a React component */}
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
            
            <input
                type="text"
                placeholder="Search "
                className="border-gray-300 border rounded-full pl-8 p-3 w-full text-sm shadow-sm placeholder:text-xs focus:outline-none"
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
            />
        </div>
    );
};

export default SearchBar;
