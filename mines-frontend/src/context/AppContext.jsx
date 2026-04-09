"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Initial load from storage
        const storedUser = localStorage.getItem("user");
        const storedCompany = localStorage.getItem("selectedCompany");
        const storedBranch = localStorage.getItem("selectedBranch");

        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                setUser(userData);
                
                if (storedCompany) {
                    setSelectedCompany(JSON.parse(storedCompany));
                } else if (userData.companies?.length > 0) {
                    setSelectedCompany(userData.companies[0]);
                }

                if (storedBranch) {
                    setSelectedBranch(JSON.parse(storedBranch));
                }
            } catch (e) {
                console.error("Error parsing stored user data", e);
            }
        }
        setLoading(false);
    }, []);

    const login = (userData, token) => {
        const roleValue = userData.roleName || userData.role || "";
        const normalizedUser = { ...userData, roleName: roleValue };

        setUser(normalizedUser);
        Cookies.set("token", token, { expires: 7 });
        Cookies.set("role", roleValue, { expires: 7 });
        localStorage.setItem("user", JSON.stringify(normalizedUser));
        
        if (userData.companies?.length > 0) {
            updateSelectedCompany(userData.companies[0]);
        }
    };

    const logout = () => {
        setUser(null);
        setSelectedCompany(null);
        setSelectedBranch(null);
        Cookies.remove("token");
        Cookies.remove("role");
        localStorage.clear();
        window.location.href = "/login";
    };

    const updateSelectedCompany = (company) => {
        setSelectedCompany(company);
        if (company) {
            localStorage.setItem("selectedCompany", JSON.stringify(company));
        } else {
            localStorage.removeItem("selectedCompany");
        }
        // Reset branch when company changes
        setSelectedBranch(null);
        localStorage.removeItem("selectedBranch");
    };

    const updateSelectedBranch = (branch) => {
        setSelectedBranch(branch);
        if (branch) {
            localStorage.setItem("selectedBranch", JSON.stringify(branch));
        } else {
            localStorage.removeItem("selectedBranch");
        }
    };

    return (
        <AppContext.Provider value={{
            user, loading, selectedCompany, selectedBranch,
            login, logout, updateSelectedCompany, updateSelectedBranch
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};
