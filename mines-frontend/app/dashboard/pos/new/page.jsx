"use client";

import React, { useState } from "react";
import {
    Box, Typography, Button, TextField, Select, MenuItem,
    Stack, IconButton, Paper, Divider, InputAdornment, Checkbox
} from "@mui/material";
import {
    Close as CloseIcon, DescriptionOutlined as DocIcon,
    ScaleOutlined as ScaleIcon, AccountBalanceWalletOutlined as WalletIcon,
    KeyboardArrowDown as ArrowDownIcon
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { palette } from "@/theme";

export default function PosBillingEntryPage() {
    const router = useRouter();
    const [activeStep, setActiveStep] = useState(1);
    const [saleType, setSaleType] = useState("POS");
    const [isManualVehicle, setIsManualVehicle] = useState(false);
    const [vehicleNo, setVehicleNo] = useState("TN12AM2125");
    const [customerName, setCustomerName] = useState("");
    const [driverName, setDriverName] = useState("");
    const [productName, setProductName] = useState("");
    const [salesType, setSalesType] = useState("UPI");
    const [tareWeight, setTareWeight] = useState("12.03");

    const handleSaveDraft = () => {
        const newEntry = {
            id: Date.now(),
            consignorName: "RMK SANDS PVT LTD", // Default or from state if added
            billNumber: "FZ" + Math.floor(Math.random() * 1000000),
            posDate: new Date().toISOString().split('T')[0],
            partyName: customerName || "N/A",
            truckNo: vehicleNo || "N/A",
            productName: productName || "N/A",
            salaryType: salesType,
            tareWt: tareWeight,
            netWt: "0.0",
            color: "#FFFBEB", // Draft color
            status: "Draft"
        };

        const existingDrafts = JSON.parse(localStorage.getItem("pos_drafts") || "[]");
        localStorage.setItem("pos_drafts", JSON.stringify([...existingDrafts, newEntry]));
        
        router.push("/dashboard/pos");
    };

    const steps = [
        { id: 1, label: "Step 1", title: "Basic Employee Details", icon: <DocIcon /> },
        { id: 2, label: "Step 2", title: "Weight & Material", icon: <ScaleIcon /> },
        { id: 3, label: "Step 3", title: "Payment Details", icon: <WalletIcon /> },
    ];

    const inputStyle = {
        "& .MuiOutlinedInput-root": {
            borderRadius: "12px",
            backgroundColor: "#FFFFFF",
            "& fieldset": { borderColor: "#E5E7EB" },
            "&:hover fieldset": { borderColor: "#D1D5DB" },
        },
        "& .MuiInputBase-input": {
            padding: "12px 16px",
            fontSize: "14px",
            color: "#374151"
        }
    };

    const labelStyle = {
        fontSize: "13px",
        fontWeight: 600,
        color: "#6B7280",
        mb: 1
    };

    return (
        <Box sx={{ p: 0, backgroundColor: "#F8F9FA", minHeight: "100vh" }}>
            {/* Header / Cancel Button */}
            <Box sx={{ p: 2, mb: 2 }}>
                <Button
                    variant="outlined"
                    startIcon={<CloseIcon />}
                    onClick={() => router.back()}
                    sx={{
                        textTransform: "none",
                        borderRadius: "10px",
                        color: "#4B5563",
                        borderColor: "#D1D5DB",
                        fontWeight: 600,
                        backgroundColor: "#FFFFFF",
                        "&:hover": { backgroundColor: "#F9FAFB", borderColor: "#9CA3AF" }
                    }}
                >
                    Cancel Entry
                </Button>
            </Box>

            {/* Stepper Container */}
            <Paper sx={{ 
                mx: 2, 
                mb: 4, 
                borderRadius: "20px", 
                boxShadow: "0 4px 20px rgba(0,0,0,0.03)", 
                overflow: "hidden",
                border: "1px solid #F3F4F6"
            }}>
                {/* Stepper Header */}
                <Box sx={{ display: "flex", backgroundColor: "#FFFFFF", p: 0 }}>
                    {steps.map((step) => {
                        const isActive = activeStep === step.id;
                        const isCompleted = step.id < activeStep;
                        const isHighlighted = isActive || isCompleted;
                        return (
                            <Box 
                                key={step.id}
                                sx={{ 
                                    flex: 1, 
                                    display: "flex", 
                                    alignItems: "center", 
                                    p: 2.5,
                                    pl: isActive ? 4 : 2,
                                    backgroundColor: isActive ? "#1C319F" : "#FFFFFF",
                                    background: isHighlighted ? "#1C319F" : "#FFFFFF",
                                    color: isActive ? "#FFFFFF" : "#6B7280",
                                    position: "relative",
                                    transition: "all 0.3s ease",
                                    borderBottomRightRadius: isActive ? "80px" : 0,
                                    zIndex: isActive ? 1 : 0
                                }}
                            >
                                <Box sx={{ 
                                    width: 40, height: 40, 
                                    borderRadius: "50%", 
                                    backgroundColor: isHighlighted ? "rgba(255,255,255,0.2)" : "#F3F4F6",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    mr: 2
                                }}>
                                    {isHighlighted ? React.cloneElement(step.icon, { sx: { color: "#FFF" } }) : step.icon}
                                </Box>
                                <Box>
                                    <Typography sx={{ fontSize: "11px", fontWeight: 700, opacity: isActive ? 0.8 : 1 }}>{step.label}</Typography>
                                    <Typography sx={{ fontSize: "13px", fontWeight: 700 }}>{step.title}</Typography>
                                </Box>
                            </Box>
                        );
                    })}
                </Box>

                {/* Form Content */}
                <Box sx={{ p: 5 }}>
                    {/* Customer Details Section */}
                    <Box sx={{ mb: 6 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: "#111827" }}>Customer Details</Typography>
                            
                            {/* Sale Type Toggle */}
                            <Stack direction="row" sx={{ backgroundColor: "#F3F4F6", p: 0.5, borderRadius: "10px" }}>
                                <Button 
                                    onClick={() => setSaleType("POS")}
                                    sx={{ 
                                        borderRadius: "8px", px: 3, textTransform: "none", fontWeight: 700, fontSize: "13px",
                                        backgroundColor: saleType === "POS" ? "#FFFFFF" : "transparent",
                                        color: saleType === "POS" ? "#002C91" : "#9CA3AF",
                                        boxShadow: saleType === "POS" ? "0 2px 8px rgba(0,0,0,0.05)" : "none",
                                        "&:hover": { backgroundColor: saleType === "POS" ? "#FFFFFF" : "transparent" }
                                    }}
                                >
                                    POS
                                </Button>
                                <Button 
                                    onClick={() => setSaleType("Credit")}
                                    sx={{ 
                                        borderRadius: "8px", px: 3, textTransform: "none", fontWeight: 700, fontSize: "13px",
                                        backgroundColor: saleType === "Credit" ? "#FFFFFF" : "transparent",
                                        color: saleType === "Credit" ? "#002C91" : "#9CA3AF",
                                        boxShadow: saleType === "Credit" ? "0 2px 8px rgba(0,0,0,0.05)" : "none",
                                        "&:hover": { backgroundColor: saleType === "Credit" ? "#FFFFFF" : "transparent" }
                                    }}
                                >
                                    Credit
                                </Button>
                            </Stack>
                        </Box>

                        <Stack direction="row" spacing={3} sx={{ mb: 3 }}>
                            <Box sx={{ flex: 1 }}>
                                <Typography sx={labelStyle}>Sales Type</Typography>
                                <Select 
                                    fullWidth 
                                    size="small" 
                                    value={salesType} 
                                    onChange={(e) => setSalesType(e.target.value)}
                                    sx={{ borderRadius: "12px", "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E5E7EB" } }}
                                >
                                    <MenuItem value="UPI">UPI</MenuItem>
                                    <MenuItem value="Cash">Cash</MenuItem>
                                </Select>
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography sx={labelStyle}>Customer Name</Typography>
                                <Select 
                                    fullWidth 
                                    size="small" 
                                    displayEmpty 
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    sx={{ borderRadius: "12px", "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E5E7EB" } }}
                                >
                                    <MenuItem value="" disabled>Enter Customer Name</MenuItem>
                                    <MenuItem value="RV & CO">RV & CO</MenuItem>
                                    <MenuItem value="Sandeep Enterprises">Sandeep Enterprises</MenuItem>
                                    <MenuItem value="Global Builders">Global Builders</MenuItem>
                                </Select>
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography sx={labelStyle}>Vehicle No</Typography>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    {isManualVehicle ? (
                                        <TextField 
                                            fullWidth 
                                            size="small" 
                                            placeholder="Type Vehicle No" 
                                            value={vehicleNo}
                                            onChange={(e) => setVehicleNo(e.target.value)}
                                            sx={inputStyle} 
                                        />
                                    ) : (
                                        <Select 
                                            fullWidth 
                                            size="small" 
                                            value={vehicleNo} 
                                            onChange={(e) => setVehicleNo(e.target.value)}
                                            sx={{ borderRadius: "12px", "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E5E7EB" } }}
                                        >
                                            <MenuItem value="TN12AM2125">TN12AM2125</MenuItem>
                                            <MenuItem value="KA01MJ1234">KA01MJ1234</MenuItem>
                                            <MenuItem value="AP05BK9999">AP05BK9999</MenuItem>
                                        </Select>
                                    )}
                                    <Checkbox 
                                        checked={isManualVehicle}
                                        onChange={(e) => setIsManualVehicle(e.target.checked)}
                                        sx={{ 
                                            p: 0.5,
                                            color: "#E5E7EB",
                                            "&.Mui-checked": { color: "#2D3FE2" }
                                        }}
                                    />
                                </Stack>
                            </Box>
                        </Stack>

                        <Stack direction="row" spacing={3}>
                            <Box sx={{ flex: 1 }}>
                                <Typography sx={labelStyle}>Product Name</Typography>
                                <TextField 
                                    fullWidth 
                                    size="small" 
                                    placeholder="Enter Product Name" 
                                    value={productName}
                                    onChange={(e) => setProductName(e.target.value)}
                                    sx={inputStyle} 
                                />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography sx={labelStyle}>Driver Name</Typography>
                                <Select 
                                    fullWidth 
                                    size="small" 
                                    displayEmpty 
                                    value={driverName}
                                    onChange={(e) => setDriverName(e.target.value)}
                                    sx={{ borderRadius: "12px", "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E5E7EB" } }}
                                >
                                    <MenuItem value="" disabled>Enter Driver Name</MenuItem>
                                    <MenuItem value="Ramesh Kumar">Ramesh Kumar</MenuItem>
                                    <MenuItem value="Suresh Babu">Suresh Babu</MenuItem>
                                    <MenuItem value="Mahesh Singh">Mahesh Singh</MenuItem>
                                </Select>
                            </Box>
                            <Box sx={{ flex: 1 }} />
                        </Stack>
                    </Box>

                    {/* Weight Data Section */}
                    <Box sx={{ mb: 8 }}>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: "#111827", mb: 4 }}>Weight Data</Typography>
                        
                        <Box sx={{ maxWidth: "400px" }}>
                            <Typography sx={labelStyle}>Tare Weight</Typography>
                            <Stack direction="row" spacing={2}>
                                <TextField 
                                    fullWidth 
                                    size="small" 
                                    value={tareWeight}
                                    onChange={(e) => setTareWeight(e.target.value)}
                                    sx={{ 
                                        ...inputStyle,
                                        "& .MuiOutlinedInput-root": {
                                            ...inputStyle["& .MuiOutlinedInput-root"],
                                            backgroundColor: "#F3F7FF",
                                            border: "none"
                                        }
                                    }} 
                                />
                                <Button
                                    variant="contained"
                                    sx={{
                                        background: "#1C319F",
                                        borderRadius: "10px",
                                        px: 4,
                                        textTransform: "none",
                                        fontWeight: 700,
                                        "&:hover": { background: "#142375" }
                                    }}
                                >
                                    Fetch
                                </Button>
                            </Stack>
                        </Box>
                    </Box>

                    {/* Footer Actions */}
                    <Stack direction="row" justifyContent="center" alignItems="center" sx={{ position: "relative" }}>
                        <Button
                            variant="contained"
                            sx={{
                                background: "#1C319F",
                                borderRadius: "12px",
                                px: 10,
                                py: 1.5,
                                textTransform: "none",
                                fontWeight: 700,
                                fontSize: "16px",
                                boxShadow: "0 6px 20px rgba(28, 49, 159, 0.3)",
                                "&:hover": { background: "#142375" }
                            }}
                        >
                            Submit
                        </Button>
                        
                        <Button
                            variant="contained"
                            onClick={handleSaveDraft}
                            sx={{
                                background: "#707070 !important",
                                color: "#FFFFFF",
                                borderRadius: "10px",
                                px: 3,
                                py: 1,
                                textTransform: "none",
                                fontWeight: 600,
                                fontSize: "14px",
                                position: "absolute",
                                right: 0,
                                "&:hover": { background: "#4B5563 !important" }
                            }}
                        >
                            Save to Draft
                        </Button>
                    </Stack>
                </Box>
            </Paper>
        </Box>
    );
}
