"use client";

import React, { useState } from "react";
import {
    Box,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Collapse,
    Typography,
    InputBase,
} from "@mui/material";
import {
    AspectRatioOutlined,
    GridViewRounded,
    SignalCellularAltRounded,
    PaymentsOutlined,
    ExpandLess,
    ExpandMore,
    Search,
} from "@mui/icons-material";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { palette } from "@/theme";

const DRAWER_WIDTH = 280;

export default function Sidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const [openMaster, setOpenMaster] = useState(false);

    const menuItems = [
        { text: "Dashboard", icon: <AspectRatioOutlined />, path: "/dashboard" },
        {
            text: "Master",
            icon: <GridViewRounded />,
            isDropdown: true,
            open: openMaster,
            onClick: () => setOpenMaster(!openMaster),
            subItems: [
                { text: "Company", path: "/dashboard/master/company" },
                { text: "Employee", path: "/dashboard/master/employee" },
                { text: "Customer", path: "/dashboard/master/customer" },
                { text: "Product", path: "/dashboard/master/product" },
                { text: "Truck", path: "/dashboard/master/truck" },
            ],
        },
        { text: "POS", icon: <SignalCellularAltRounded />, path: "/dashboard/pos" },
        { text: "Billing and Coupon", icon: <PaymentsOutlined />, path: "/dashboard/billing" },
    ];

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: DRAWER_WIDTH,
                flexShrink: 0,
                "& .MuiDrawer-paper": {
                    width: DRAWER_WIDTH,
                    boxSizing: "border-box",
                    backgroundColor: "#1F212A",
                    borderRight: "none",
                    color: palette.text.white,
                    msOverflowStyle: 'none', // IE and Edge
                    scrollbarWidth: 'none', // Firefox
                    '&::-webkit-scrollbar': {
                        display: 'none', // Chrome, Safari and Opera
                    },
                },
            }}
        >
            {/* ── Logo ──────────────────────────────────────*/}
            <Box sx={{ p: 4, pb: 2, display: "flex", justifyContent: "flex-start", alignItems: "center" }}>
                <Image src="/SR_logo.svg" alt="SR Logo" width={36} height={50} priority style={{ objectFit: 'contain' }} />
                <Typography variant="h6" sx={{ fontFamily: '"Poppins", sans-serif', fontWeight: 800, color: palette.text.white, ml: 1, fontSize: "24px", lineHeight: "35px" }}>
                    SWIPE RIGHT
                </Typography>
            </Box>

            {/* ── Search Bar ──────────────────────────────────────── */}
            <Box sx={{ px: 3, mb: 4 }}>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        backgroundColor: "rgba(255,255,255,0.05)",
                        borderRadius: "8px",
                        px: 2,
                        py: 0.8,
                        border: "1px solid rgba(255,255,255,0.1)",
                        transition: "all 0.3s",
                        "&:focus-within": {
                            borderColor: palette.secondary.main,
                            backgroundColor: "rgba(255,255,255,0.08)",
                        }
                    }}
                >
                    <Search sx={{ color: palette.text.muted, mr: 1, fontSize: 20 }} />
                    <InputBase
                        placeholder="Search..."
                        sx={{ color: palette.text.white, width: "100%", fontSize: "0.9rem" }}
                    />
                </Box>
            </Box>

            {/* ── Menu Label ──────────────────────────────────────── */}
            <Typography
                variant="caption"
                sx={{
                    px: 4,
                    mb: 1.5,
                    color: palette.text.muted,
                    fontWeight: 700,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    fontSize: "0.75rem",
                }}
            >
                MENU
            </Typography>

            {/* ── Nav Items ───────────────────────────────────────── */}
            <List sx={{ px: 2 }}>
                {menuItems.map((item) => {
                    const isActive = !item.isDropdown && pathname === item.path;
                    const isDropdownActive = item.isDropdown && item.open;

                    return (
                        <React.Fragment key={item.text}>
                            <ListItem disablePadding sx={{ mb: 0.5 }}>
                                <ListItemButton
                                    onClick={item.isDropdown ? item.onClick : () => router.push(item.path)}
                                    sx={{
                                        position: "relative",
                                        borderRadius: "8px",
                                        overflow: "hidden",
                                        backgroundColor: isActive ? "rgba(21, 101, 192, 0.2)" : isDropdownActive ? "#545862" : "transparent",
                                        "&:hover": {
                                            backgroundColor: isActive ? "rgba(21, 101, 192, 0.3)" : isDropdownActive ? "#545862" : "rgba(255,255,255,0.06)",
                                        },
                                    }}
                                >
                                    {isDropdownActive && (
                                        <Box
                                            sx={{
                                                position: "absolute",
                                                left: 0,
                                                // top: "10%",
                                                // bottom: "10%",
                                                height: "100%",
                                                width: "4px",
                                                backgroundColor: palette.text.white,
                                                // borderRadius: "8px",
                                            }}
                                        />
                                    )}
                                    <ListItemIcon
                                        sx={{
                                            minWidth: 40,
                                            color: isActive ? palette.secondary.main : palette.text.muted,
                                        }}
                                    >
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={item.text}
                                        primaryTypographyProps={{
                                            fontSize: "0.95rem",
                                            fontWeight: isActive ? 600 : 500,
                                            color: isActive ? palette.text.white : palette.text.muted,
                                        }}
                                    />
                                    {item.isDropdown &&
                                        (item.open ? (
                                            <ExpandLess sx={{ color: palette.text.muted }} />
                                        ) : (
                                            <ExpandMore sx={{ color: palette.text.muted }} />
                                        ))}
                                </ListItemButton>
                            </ListItem>

                            {/* Sub Items Collapse */}
                            {item.isDropdown && (
                                <Collapse in={item.open} timeout="auto" unmountOnExit>
                                    <List component="div" disablePadding sx={{ mt: 0.5, mb: 1, position: "relative" }}>
                                        {/* Vertical Hierarchy Line */}
                                        <Box
                                            sx={{
                                                position: "absolute",
                                                left: "35px",
                                                top: 0,
                                                bottom: "16px",
                                                width: "2px",
                                                backgroundColor: "rgba(255,255,255,0.15)",
                                                zIndex: 1,
                                            }}
                                        />

                                        {item.subItems.map((subItem) => {
                                            const isSubActive = pathname === subItem.path;
                                            return (
                                                <ListItemButton
                                                    key={subItem.text}
                                                    onClick={() => router.push(subItem.path)}
                                                    sx={{
                                                        pl: "56px",
                                                        py: 1,
                                                        mr: 3,
                                                        mb: 0.5,
                                                        position: "relative",
                                                        // borderTopRightRadius: "6px",
                                                        // borderBottomRightRadius: "6px",
                                                        background: isSubActive
                                                            ? "linear-gradient(to right, #FFFFFF00 0%, #9999991A 10%)"
                                                            : "transparent",
                                                        "&:hover": { backgroundColor: "rgba(255,255,255,0.06)" },
                                                        borderRight: isSubActive ? `2px solid ${palette.text.white}` : "2px solid transparent",
                                                    }}
                                                >
                                                    {/* Hollow Circle Indicator for Active Sub-item */}
                                                    {isSubActive && (
                                                        <Box
                                                            sx={{
                                                                position: "absolute",
                                                                left: "31px",
                                                                top: "50%",
                                                                transform: "translateY(-50%)",
                                                                width: "10px",
                                                                height: "10px",
                                                                borderRadius: "50%",
                                                                border: `2px solid ${palette.text.white}`,
                                                                backgroundColor: palette.background.darkCard,
                                                                zIndex: 2,
                                                            }}
                                                        />
                                                    )}
                                                    <ListItemText
                                                        primary={subItem.text}
                                                        primaryTypographyProps={{
                                                            fontSize: "0.9rem",
                                                            fontWeight: 400,
                                                            color: palette.text.white,
                                                        }}
                                                    />
                                                </ListItemButton>
                                            );
                                        })}
                                    </List>
                                </Collapse>
                            )}
                        </React.Fragment>
                    );
                })}
            </List>
        </Drawer>
    );
}
