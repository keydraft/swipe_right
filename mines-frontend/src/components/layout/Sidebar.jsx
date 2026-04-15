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
import Link from "next/link";
import { palette } from "@/theme";

import { useContext } from "react";
import { AbilityContext } from "@/context/AbilityContext";
import { useAbility } from "@casl/react";

const DRAWER_WIDTH = 280;

export default function Sidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const [openMaster, setOpenMaster] = useState(false);
    const ability = useAbility(AbilityContext);

    const menuItems = [
        { text: "Dashboard", icon: <AspectRatioOutlined />, path: "/dashboard", action: 'read', subject: 'Dashboard' },
        {
            text: "Master",
            icon: <GridViewRounded />,
            isDropdown: true,
            open: openMaster,
            onClick: () => setOpenMaster(!openMaster),
            subItems: [
                { text: "Company", path: "/dashboard/master/company", action: 'read', subject: 'Company' },
                { text: "Employee", path: "/dashboard/master/employee", action: 'read', subject: 'Employee' },
                { text: "Customer", path: "/dashboard/master/customer", action: 'read', subject: 'Customer' },
                { text: "Transporter", path: "/dashboard/master/transporter", action: 'read', subject: 'Transporter' },
                { text: "Product", path: "/dashboard/master/product", action: 'read', subject: 'Product' },
                { text: "Truck", path: "/dashboard/master/truck", action: 'read', subject: 'Truck' },
            ],
        },
        { text: "POS", icon: <SignalCellularAltRounded />, path: "/dashboard/pos", action: 'read', subject: 'Pos' },
        { text: "Billing and Coupon", icon: <PaymentsOutlined />, path: "/dashboard/billing", action: 'read', subject: 'Billing' },
    ];

    const filteredMenuItems = menuItems.filter(item => {
        if (item.subItems) {
            item.subItems = item.subItems.filter(sub => ability.can(sub.action || 'read', sub.subject || 'all'));
            return item.subItems.length > 0;
        }
        return ability.can(item.action || 'read', item.subject || 'all');
    });

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: DRAWER_WIDTH,
                flexShrink: 0,
                "& .MuiDrawer-paper": {
                    width: DRAWER_WIDTH,
                    boxSizing: "border-box",
                    background: "linear-gradient(180deg, #0E1E5D 0%, #08457C 100%)",
                    borderRight: "none",
                    color: palette.text.white,
                    overflow: "hidden",
                    position: "relative",
                    msOverflowStyle: 'none',
                    scrollbarWidth: 'none',
                    '&::-webkit-scrollbar': { display: 'none' },
                    // Glass Decor Elements
                    '&::before': {
                        content: '""',
                        position: "absolute",
                        top: "-10%",
                        right: "-20%",
                        width: "250px",
                        height: "250px",
                        borderRadius: "50%",
                        background: "radial-gradient(circle, #266BFF 0%, transparent 70%)",
                        opacity: 0.2,
                        filter: "blur(60px)",
                        zIndex: 0,
                    },
                    '&::after': {
                        content: '""',
                        position: "absolute",
                        bottom: "15%",
                        left: "-10%",
                        width: "200px",
                        height: "200px",
                        borderRadius: "50%",
                        background: "radial-gradient(circle, #37A8B1 0%, transparent 70%)",
                        opacity: 0.15,
                        filter: "blur(50px)",
                        zIndex: 0,
                    }
                },
            }}
        >
            {/* Top Right Accent Glow (White Floor) */}
            <Box
                sx={{
                    position: "absolute",
                    top: "-40px",
                    right: "-40px",
                    width: "250px",
                    height: "250px",
                    background: "radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, transparent 75%)",
                    filter: "blur(60px)",
                    pointerEvents: "none",
                    zIndex: 0
                }}
            />

            {/* Background Multi-stop Glass Beam (Cross Box) */}
            <Box
                sx={{
                    position: "absolute",
                    top: "-20%",
                    left: "15%",
                    width: "120px",
                    height: "140%",
                    background: "linear-gradient(180deg, rgba(255, 255, 255, 0.25) 0%, #9AC9FF 30%, #37A8B1 60%, #08457C 85%, #266BFF 100%)",
                    opacity: 0.2,
                    transform: "rotate(20deg)",
                    filter: "blur(50px)",
                    pointerEvents: "none",
                    zIndex: 0
                }}
            />

            <Box sx={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column" }}>
                {/* ── Logo ──────────────────────────────────────*/}
                <Box sx={{ p: 4, pb: 2, display: "flex", justifyContent: "flex-start", alignItems: "center" }}>
                    <Image src="/SR_logo.svg" alt="SR Logo" width={36} height={50} priority style={{ objectFit: 'contain' }} />
                    <Typography variant="h6" sx={{ fontFamily: '"Poppins", sans-serif', fontWeight: 800, color: palette.text.white, ml: 1, fontSize: "24px", lineHeight: "35px" }}>
                        SWIPE RIGHT
                    </Typography>
                </Box>



                {/* ── Menu Label ──────────────────────────────────────── */}
                <Typography
                    variant="caption"
                    sx={{
                        px: 4,
                        mb: 1.5,
                        color: palette.text.white,
                        opacity: 0.8,
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
                    {filteredMenuItems.map((item) => {
                        const isActive = !item.isDropdown && pathname === item.path;
                        const isDropdownActive = item.isDropdown && item.subItems?.some(sub => pathname === sub.path);
                        const isExpanded = item.isDropdown && item.open;

                        return (
                            <React.Fragment key={item.text}>
                                <ListItem disablePadding sx={{ mb: 0.5 }}>
                                    <ListItemButton
                                        component={Link}
                                        href={item.isDropdown ? "#" : item.path}
                                        onClick={item.isDropdown ? (e) => { e.preventDefault(); item.onClick(); } : undefined}
                                        sx={{
                                            position: "relative",
                                            borderRadius: "8px",
                                            overflow: "hidden",
                                            backgroundColor: isActive ? "rgba(255, 255, 255, 0.12)" : isDropdownActive ? "rgba(215, 227, 255, 0.15)" : "transparent",
                                            backdropFilter: (isActive || isDropdownActive) ? "blur(10px)" : "none",
                                            border: (isActive || isDropdownActive) ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid transparent",
                                            boxShadow: (isActive || isDropdownActive) ? "0 4px 20px rgba(0,0,0,0.15)" : "none",
                                            background: isActive
                                                ? "linear-gradient(90deg, rgba(84, 88, 98, 0) 40%, rgba(255, 255, 255, 0.9) 100%)"
                                                : isDropdownActive
                                                    ? "linear-gradient(90deg, rgba(84, 88, 98, 0) 40%, rgba(255, 255, 255, 0.9) 100%)"
                                                    : "transparent",
                                            "&:hover": {
                                                backgroundColor: isActive ? "rgba(255, 255, 255, 0.2)" : isDropdownActive ? "rgba(255, 255, 255, 0.15)" : "rgba(255,255,255,0.06)",
                                                backdropFilter: "blur(5px)",
                                            },
                                        }}
                                    >
                                        {(isActive || isDropdownActive) && (
                                            <Box
                                                sx={{
                                                    position: "absolute",
                                                    left: 0,
                                                    height: "100%",
                                                    width: "3px",
                                                    backgroundColor: (isActive || isDropdownActive) ? palette.text.white : "transparent",
                                                }}
                                            />
                                        )}
                                        <ListItemIcon
                                            sx={{
                                                minWidth: 40,
                                                color: palette.text.white,
                                            }}
                                        >
                                            {item.icon}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={item.text}
                                            primaryTypographyProps={{
                                                fontSize: "0.95rem",
                                                fontWeight: (isActive || isDropdownActive) ? 600 : 500,
                                                color: palette.text.white,
                                            }}
                                        />
                                        {item.isDropdown &&
                                            (item.open ? (
                                                <ExpandLess sx={{ color: palette.text.white }} />
                                            ) : (
                                                <ExpandMore sx={{ color: palette.text.white }} />
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
                                                        component={Link}
                                                        href={subItem.path}
                                                        sx={{
                                                            pl: "56px",
                                                            py: 1,
                                                            mr: 3,
                                                            mb: 0.5,
                                                            position: "relative",
                                                            // borderTopRightRadius: "6px",
                                                            // borderBottomRightRadius: "6px",
                                                            background: isSubActive
                                                                ? "linear-gradient(90deg, rgba(84, 88, 98, 0) 0%, rgba(255, 255, 255, 0.1) 100%)"
                                                                : "transparent",
                                                            "&:hover": { backgroundColor: "rgba(255,255,255,0.06)" },
                                                        }}
                                                    >
                                                        {isSubActive && (
                                                            <Box
                                                                sx={{
                                                                    position: "absolute",
                                                                    left: 0,
                                                                    height: "70%",
                                                                    top: "15%",
                                                                    width: "4px",
                                                                    backgroundColor: palette.text.white,
                                                                    borderRadius: "0 4px 4px 0"
                                                                }}
                                                            />
                                                        )}
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
            </Box>
        </Drawer>
    );
}
