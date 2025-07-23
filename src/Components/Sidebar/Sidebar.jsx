import { ArrowRight, ArrowLeft, Users } from "lucide-react";
import { createContext, useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from '../../api/api';

const SidebarContext = createContext();

export default function Sidebar({ children, onUserSelect, onExpandChange }) {
    const [expanded, setExpanded] = useState(true);
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [userError, setUserError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        setLoadingUsers(true);
        setUserError("");
        api.getUsersWithUnlockedImages()
            .then(data => {
                if (!data.success) {
                    setUserError(data.message || "Failed to fetch users");
                    setUsers([]);
                } else {
                    setUsers(data.users || []);
                }
                setLoadingUsers(false);
            })
            .catch(err => {
                setUserError("Server error: " + (err?.message || "Unknown error"));
                setLoadingUsers(false);
            });
    }, []);

    return (
        <aside
            className={`
                fixed top-0 left-0 h-screen z-40
                transition-all duration-300 ease-in-out
                ${expanded ? "w-[15rem]" : "w-[3.5rem]"}
            `}
        >
            <nav
                className={`
                    h-full flex bg-cyan-900 flex-col shadow-sm
                    transition-all duration-300 ease-in-out
                    ${expanded ? "w-[15rem]" : "w-[3.66rem]"}
                    overflow-y-auto
                `}
            >
                <div className="p-1 flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                        <p
                            onClick={() => navigate('/')} 
                            className={`overflow-hidden transition-all duration-300 ease-in-out cursor-pointer text-white text-xl mt-4 ml-5 font-semibold ${expanded ? "w-auto" : "w-0"}`}
                        >
                            Admin Panel
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setExpanded((curr) => {
                                const next = !curr;
                                if (onExpandChange) onExpandChange(next);
                                return next;
                            });
                        }}
                        className="rounded-full bg-cyan-800 border border-cyan-600 hover:border-white transition-all duration-300 ease-in-out mt-4 cursor-pointer mr-3"
                    >
                        {expanded ? <ArrowLeft className="text-white h-5 w-5" /> : <ArrowRight className="text-white h-5 w-5" />}
                    </button>
                </div>

                {/* Main nav items (children) */}
                <SidebarContext.Provider value={{ expanded }}>
                    <ul className="flex-1 px-3 mt-[-1rem] min-[450px]:mt-5 space-y-2">{children}</ul>
                </SidebarContext.Provider>
            </nav>
        </aside>
    );
}

export function SidebarItem({ icon, text, active, alert, onClick }) {
    const { expanded } = useContext(SidebarContext);

    return (
        <li
            onClick={onClick}
            className={`
                relative flex items-center
                font-semibold rounded-xl cursor-pointer
                transition-all duration-300 ease-in-out group
                ${expanded ? "px-6 py-4" : "justify-center h-10 w-10 mx-auto"}
                ${active ? "bg-cyan-950 text-white" : " text-white hover:bg-cyan-950"}
            `}
        >
            {icon}
            <span className={`overflow-hidden transition-all duration-300 ease-in-out text-white text-sm ${expanded ? "w-auto ml-3" : "w-0"}`}>
                {text}
            </span>
            {alert && (
                <div className={`absolute right-2 w-2 h-2 rounded bg-indigo-400 ${expanded ? "" : "top-2"}`} />
            )}
            {!expanded && (
                <div
                    className={`
                        z-30 absolute left-full rounded-md px-2 py-1 ml-6
                        bg-cyan-600 text-white text-sm invisible opacity-20 -translate-x-3 
                        transition-all duration-300 ease-in-out
                        group-hover:visible group-hover:opacity-100 group-hover:translate-x-0
                    `}
                >
                    {text}
                </div>
            )}
        </li>
    );
}
