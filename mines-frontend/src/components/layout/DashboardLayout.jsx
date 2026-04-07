"use client";

import React from "react";
import { Box, Typography, IconButton, Badge, Avatar, Divider } from "@mui/material";
import { NotificationsOutlined, SettingsOutlined } from "@mui/icons-material";
import Sidebar from "./Sidebar";
import { palette } from "@/theme";

export default function DashboardLayout({ children }) {
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

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ textAlign: 'right' }}>
                                <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#1F2937', lineHeight: 1.2 }}>
                                    Hi Sivanesa
                                </Typography>
                                <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', letterSpacing: '0.05em' }}>
                                    SITE MANAGER
                                </Typography>
                            </Box>
                            <Avatar src="/SR_logo.svg" sx={{ width: 44, height: 44, border: '2px solid #E5E7EB', backgroundColor: '#FFF', '& img': { objectFit: 'contain', padding: '4px' } }}>
                                S
                            </Avatar>
                        </Box>
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
