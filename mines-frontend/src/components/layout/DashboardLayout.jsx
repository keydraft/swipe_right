"use client";

import React, { useState, useEffect } from "react";
import { Box, Typography, IconButton, Badge, Avatar, Divider, Menu, MenuItem, ListItemIcon } from "@mui/material";
import { NotificationsOutlined, SettingsOutlined, Logout } from "@mui/icons-material";
import Sidebar from "./Sidebar";
import { palette } from "@/theme";
import { useRouter } from "next/navigation";
import { authApi } from "@/services/api";

import Cookies from "js-cookie";
import { ability, defineAbilitiesFor } from "@/utils/ability";

export default function DashboardLayout({ children }) {
    const router = useRouter();
    const [anchorEl, setAnchorEl] = useState(null);
    const [user, setUser] = useState({ name: "Sivanesa", role: "SITE MANAGER" });
    const open = Boolean(anchorEl);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                setUser({
                    name: userData.username || "User",
                    role: userData.role || "SITE MANAGER"
                });
            } catch (e) {
                console.error("Error parsing user data", e);
            }
        }
    }, []);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = async () => {
        try {
            await authApi.logout();
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            // 1. Clear local storage
            localStorage.removeItem("user");
            
            // 2. Clear permissions and role cookies
            Cookies.remove("permissions");
            Cookies.remove("role");
            
            // 3. Reset CASL ability
            ability.update(defineAbilitiesFor([], '').rules);

            router.push("/login");
        }
    };

    return (
        <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: palette.background.paper }}>
            <Sidebar />
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    width: { sm: `calc(100% - 280px)` },
                    overflowX: "hidden",
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* Topbar/Header */}
                <Box sx={{
                    height: "70px",
                    backgroundColor: "#FFFFFF",
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    px: 4,
                    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.02)"
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton>
                            <Badge variant="dot" color="error" sx={{ '& .MuiBadge-badge': { right: 6, top: 6, backgroundColor: '#EF4444' } }}>
                                <NotificationsOutlined sx={{ color: '#4B5563' }} />
                            </Badge>
                        </IconButton>
                        <IconButton>
                            <SettingsOutlined sx={{ color: '#4B5563' }} />
                        </IconButton>

                        <Divider orientation="vertical" variant="middle" flexItem sx={{ mx: 2, height: '32px', alignSelf: 'center', borderColor: '#E5E7EB' }} />

                        <Box 
                            onClick={handleClick}
                            sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 2, 
                                cursor: 'pointer',
                                padding: '4px 8px',
                                borderRadius: '8px',
                                transition: 'background-color 0.2s',
                                '&:hover': {
                                    backgroundColor: 'rgba(0, 0, 0, 0.04)'
                                }
                            }}
                        >
                            <Box sx={{ textAlign: 'right' }}>
                                <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#1F2937', lineHeight: 1.2 }}>
                                    Hi {user.name}
                                </Typography>
                                <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                    {user.role}
                                </Typography>
                            </Box>
                            <Avatar src="/SR_logo.svg" sx={{ width: 44, height: 44, border: '2px solid #E5E7EB', backgroundColor: '#FFF', '& img': { objectFit: 'contain', padding: '4px' } }}>
                                {user.name.charAt(0)}
                            </Avatar>
                        </Box>

                        <Menu
                            anchorEl={anchorEl}
                            open={open}
                            onClose={handleClose}
                            onClick={handleClose}
                            PaperProps={{
                                elevation: 0,
                                sx: {
                                    overflow: 'visible',
                                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
                                    mt: 1.5,
                                    borderRadius: '12px',
                                    minWidth: '180px',
                                    '& .MuiMenuItem-root': {
                                        px: 2,
                                        py: 1.5,
                                        borderRadius: '8px',
                                        mx: 1,
                                        my: 0.5,
                                    },
                                    '&:before': {
                                        content: '""',
                                        display: 'block',
                                        position: 'absolute',
                                        top: 0,
                                        right: 14,
                                        width: 10,
                                        height: 10,
                                        bgcolor: 'background.paper',
                                        transform: 'translateY(-50%) rotate(45deg)',
                                        zIndex: 0,
                                    },
                                },
                            }}
                            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                        >
                            <MenuItem onClick={handleLogout} sx={{ color: '#EF4444', fontWeight: 600, '&:hover': { backgroundColor: '#FEF2F2' } }}>
                                <ListItemIcon>
                                    <Logout fontSize="small" sx={{ color: '#EF4444' }} />
                                </ListItemIcon>
                                Sign Out
                            </MenuItem>
                        </Menu>
                    </Box>
                </Box>

                {/* Page Content */}
                <Box sx={{ p: { xs: 3, md: 5 }, flexGrow: 1 }}>
                    {children}
                </Box>
            </Box>
        </Box>
    );
}
