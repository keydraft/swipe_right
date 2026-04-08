"use client";

import React, { useState, useEffect } from "react";
import {
    Box, Typography, Button, TextField, Select, MenuItem,
    Stack, IconButton, Paper, Divider, InputAdornment
} from "@mui/material";
import {
    Close as CloseIcon, DescriptionOutlined as DocIcon,
    ScaleOutlined as ScaleIcon, AccountBalanceWalletOutlined as WalletIcon,
    KeyboardArrowDown as ArrowDownIcon
} from "@mui/icons-material";
import { useRouter, useParams } from "next/navigation";
import { palette } from "@/theme";

export default function PosBillingEditPage() {
    const router = useRouter();
    const params = useParams();
    const [activeStep, setActiveStep] = useState(2);
    const [saleType, setSaleType] = useState("POS");
    
    // Form states for Step 2
    const [tareWeight, setTareWeight] = useState("12.03");
    const [netWeight, setNetWeight] = useState("64.1");
    const [loadWeight, setLoadWeight] = useState("52.07");
    
    const [ratePerUnit, setRatePerUnit] = useState("850.0");
    const [amount, setAmount] = useState("5690.98");
    const [teaCash, setTeaCash] = useState("50.0");
    const [totalAmount, setTotalAmount] = useState("5975.5");
    const [gstn, setGstn] = useState("");
    const [gstPercent, setGstPercent] = useState("5");
    const [gstAmount, setGstAmount] = useState("5975.5");

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
                    onClick={() => router.push("/dashboard/pos")}
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
                                    pl: isHighlighted ? 4 : 2,
                                    background: isHighlighted ? "#1C319F" : "#FFFFFF",
                                    color: isHighlighted ? "#FFFFFF" : "#6B7280",
                                    position: "relative",
                                    transition: "all 0.3s ease",
                                    borderBottomRightRadius: isActive ? "80px" : 0,
                                    zIndex: isActive ? 1 : 0,
                                    // Remove the divider look between consecutive highlighted steps
                                    "& + div": {
                                        borderLeft: isHighlighted && (step.id < activeStep) ? "none" : "1px solid #F3F4F6"
                                    }
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
                    {/* Step 2 Content */}
                    {activeStep === 2 && (
                        <>
                            {/* Weight Data Section */}
                            <Box sx={{ mb: 6 }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
                                    <Typography variant="h5" sx={{ fontWeight: 800, color: "#111827" }}>Weight Data</Typography>
                                    
                                    {/* Sale Type Toggle */}
                                    <Stack direction="row" sx={{ backgroundColor: "#F3F4F6", p: 0.5, borderRadius: "10px" }}>
                                        <Button 
                                            onClick={() => setSaleType("POS")}
                                            sx={{ 
                                                borderRadius: "8px", px: 3, textTransform: "none", fontWeight: 700, fontSize: "13px",
                                                backgroundColor: saleType === "POS" ? "#FFFFFF" : "transparent",
                                                color: saleType === "POS" ? "#002C91" : "#9CA3AF",
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
                                                "&:hover": { backgroundColor: saleType === "Credit" ? "#FFFFFF" : "transparent" }
                                            }}
                                        >
                                            Credit
                                        </Button>
                                    </Stack>
                                </Box>

                                <Stack direction="row" spacing={3}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography sx={labelStyle}>Tare Weight</Typography>
                                        <TextField fullWidth size="small" value={tareWeight} sx={{ ...inputStyle, "& .MuiOutlinedInput-root": { backgroundColor: "#F9FAFB" } }} disabled />
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography sx={labelStyle}>Net Weight</Typography>
                                        <TextField fullWidth size="small" value={netWeight} onChange={(e) => setNetWeight(e.target.value)} sx={{ ...inputStyle, "& .MuiOutlinedInput-root": { backgroundColor: "#F3F7FF" } }} />
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography sx={labelStyle}>Load Weight</Typography>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <TextField fullWidth size="small" value={loadWeight} onChange={(e) => setLoadWeight(e.target.value)} sx={{ ...inputStyle, "& .MuiOutlinedInput-root": { backgroundColor: "#F3F7FF" } }} />
                                            <Button
                                                variant="contained"
                                                sx={{
                                                    background: "#1C319F",
                                                    borderRadius: "10px",
                                                    px: 3,
                                                    height: "40px",
                                                    textTransform: "none",
                                                    fontWeight: 700,
                                                    "&:hover": { background: "#142375" }
                                                }}
                                            >
                                                Fetch
                                            </Button>
                                        </Stack>
                                    </Box>
                                </Stack>
                            </Box>

                            {/* Amount & Sales Section */}
                            <Box sx={{ mb: 8 }}>
                                <Typography variant="h5" sx={{ fontWeight: 800, color: "#111827", mb: 4 }}>Amount & Sales</Typography>
                                
                                <Stack spacing={3}>
                                    <Stack direction="row" spacing={3}>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography sx={labelStyle}>Rate Per Unit</Typography>
                                            <TextField fullWidth size="small" value={ratePerUnit} onChange={(e) => setRatePerUnit(e.target.value)} sx={inputStyle} />
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography sx={labelStyle}>Amount</Typography>
                                            <TextField fullWidth size="small" value={amount} onChange={(e) => setAmount(e.target.value)} sx={inputStyle} />
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography sx={labelStyle}>Tea Cash</Typography>
                                            <TextField fullWidth size="small" value={teaCash} onChange={(e) => setTeaCash(e.target.value)} sx={inputStyle} />
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography sx={labelStyle}>Total Amount</Typography>
                                            <Select fullWidth size="small" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} sx={{ borderRadius: "12px", "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E5E7EB" } }}>
                                                <MenuItem value="5975.5">5975.5</MenuItem>
                                            </Select>
                                        </Box>
                                    </Stack>

                                    <Stack direction="row" spacing={3}>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography sx={labelStyle}>GSTN</Typography>
                                            <Select fullWidth size="small" displayEmpty value={gstn} onChange={(e) => setGstn(e.target.value)} sx={{ borderRadius: "12px", "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E5E7EB" } }}>
                                                <MenuItem value="" disabled>Enter GSTN</MenuItem>
                                            </Select>
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography sx={labelStyle}>GST Percent</Typography>
                                            <Stack direction="row" spacing={1}>
                                                <Select fullWidth size="small" value={gstPercent} onChange={(e) => setGstPercent(e.target.value)} sx={{ borderRadius: "12px", "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E5E7EB" } }}>
                                                    <MenuItem value="5">5</MenuItem>
                                                    <MenuItem value="12">12</MenuItem>
                                                    <MenuItem value="18">18</MenuItem>
                                                </Select>
                                                <Box sx={{ width: 40, height: 40, border: "1px solid #E5E7EB", borderRadius: "8px" }} />
                                            </Stack>
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography sx={labelStyle}>GST Amount</Typography>
                                            <Select fullWidth size="small" value={gstAmount} onChange={(e) => setGstAmount(e.target.value)} sx={{ borderRadius: "12px", "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E5E7EB" } }}>
                                                <MenuItem value="5975.5">5975.5</MenuItem>
                                            </Select>
                                        </Box>
                                    </Stack>
                                </Stack>
                            </Box>

                            {/* Footer Actions */}
                            <Stack direction="row" justifyContent="center">
                                <Button
                                    variant="contained"
                                    onClick={() => setActiveStep(3)}
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
                            </Stack>
                        </>
                    )}

                    {/* Step 3 Content */}
                    {activeStep === 3 && (
                        <>
                            {/* Other Details Section */}
                            <Box sx={{ mb: 6 }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
                                    <Typography variant="h5" sx={{ fontWeight: 800, color: "#111827" }}>Other Details</Typography>
                                    <Stack direction="row" sx={{ backgroundColor: "#F3F4F6", p: 0.5, borderRadius: "10px" }}>
                                        <Button sx={{ borderRadius: "8px", px: 3, textTransform: "none", fontWeight: 700, fontSize: "13px", backgroundColor: "#FFFFFF", color: "#002C91" }}>POS</Button>
                                        <Button sx={{ borderRadius: "8px", px: 3, textTransform: "none", fontWeight: 700, fontSize: "13px", color: "#9CA3AF" }}>Credit</Button>
                                    </Stack>
                                </Box>

                                <Stack spacing={3}>
                                    <Stack direction="row" spacing={3}>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography sx={labelStyle}>Driver Name</Typography>
                                            <TextField fullWidth size="small" placeholder="Name" sx={inputStyle} />
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography sx={labelStyle}>Contact No</Typography>
                                            <Select fullWidth size="small" displayEmpty value="" sx={{ borderRadius: "12px", "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E5E7EB" } }}>
                                                <MenuItem value="" disabled>Enter Customer Name</MenuItem>
                                            </Select>
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography sx={labelStyle}>Remarks</Typography>
                                            <Stack direction="row" spacing={1}>
                                                <Select fullWidth size="small" value="TN12AM2125" sx={{ borderRadius: "12px", "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E5E7EB" } }}>
                                                    <MenuItem value="TN12AM2125">TN12AM2125</MenuItem>
                                                </Select>
                                                <Box sx={{ width: 40, height: 40, border: "1px solid #E5E7EB", borderRadius: "8px" }} />
                                            </Stack>
                                        </Box>
                                    </Stack>

                                    <Stack direction="row" spacing={3}>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography sx={labelStyle}>Transport Amount</Typography>
                                            <TextField fullWidth size="small" placeholder="Enter Bill Number" sx={inputStyle} />
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography sx={labelStyle}>Load Amount</Typography>
                                            <Select fullWidth size="small" displayEmpty value="" sx={{ borderRadius: "12px", "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E5E7EB" } }}>
                                                <MenuItem value="" disabled>Enter Customer Name</MenuItem>
                                            </Select>
                                        </Box>
                                        <Box sx={{ flex: 1 }} />
                                    </Stack>
                                </Stack>
                            </Box>

                            {/* Payment Details Section */}
                            <Box sx={{ mb: 8 }}>
                                <Typography variant="h5" sx={{ fontWeight: 800, color: "#111827", mb: 4 }}>Payment Details</Typography>
                                
                                <Box sx={{ display: "flex", gap: 3 }}>
                                    <Box sx={{ flex: 1 }}>
                                        <Stack spacing={3}>
                                            <Box>
                                                <Typography sx={labelStyle}>Total Amount</Typography>
                                                <TextField fullWidth size="small" value="5975.5" sx={inputStyle} />
                                            </Box>
                                            <Stack direction="row" spacing={2}>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography sx={labelStyle}>UPI Received</Typography>
                                                    <TextField fullWidth size="small" value="1975.5" sx={inputStyle} />
                                                </Box>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography sx={labelStyle}>Cash Received</Typography>
                                                    <TextField fullWidth size="small" value="4000" sx={inputStyle} />
                                                </Box>
                                            </Stack>
                                            <Box>
                                                <Typography sx={labelStyle}>Total Amount Received</Typography>
                                                <TextField fullWidth size="small" value="5975.5" sx={inputStyle} />
                                            </Box>
                                        </Stack>
                                    </Box>

                                    {/* Outstanding Balance Card */}
                                    <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-end", alignItems: "flex-start" }}>
                                        <Box sx={{ 
                                            width: "100%", 
                                            maxWidth: "350px", 
                                            p: 3, 
                                            borderRadius: "20px", 
                                            border: "1px solid #FFCDD2", 
                                            backgroundColor: "#FFF9F9",
                                            boxShadow: "0 4px 15px rgba(255, 0, 0, 0.03)"
                                        }}>
                                            <Typography sx={{ color: "#4B5563", fontSize: "14px", fontWeight: 600, mb: 1 }}>
                                                Old Outstanding Balance
                                            </Typography>
                                            <Typography sx={{ color: "#D32F2F", fontSize: "28px", fontWeight: 800, mb: 3 }}>
                                                ₹ 4,250.00
                                            </Typography>
                                            
                                            <Stack direction="row" spacing={4}>
                                                <Box>
                                                    <Typography sx={{ color: "#6B7280", fontSize: "12px", fontWeight: 700 }}>Vehicle No</Typography>
                                                    <Typography sx={{ color: "#4B5563", fontSize: "13px", fontWeight: 700 }}>TN-12-AM-2125</Typography>
                                                </Box>
                                                <Box>
                                                    <Typography sx={{ color: "#6B7280", fontSize: "12px", fontWeight: 700 }}>POS Number</Typography>
                                                    <Typography sx={{ color: "#4B5563", fontSize: "13px", fontWeight: 700 }}>TN-12-AM-2125</Typography>
                                                </Box>
                                            </Stack>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>

                            {/* Footer Actions */}
                            <Stack direction="row" justifyContent="center">
                                <Button
                                    variant="contained"
                                    onClick={() => {
                                        const drafts = JSON.parse(localStorage.getItem("pos_drafts") || "[]");
                                        const updatedDrafts = drafts.map(d => {
                                            if (d.id.toString() === params.id) {
                                                return { ...d, color: "#E8FFD9", status: "Submitted" };
                                            }
                                            return d;
                                        });
                                        localStorage.setItem("pos_drafts", JSON.stringify(updatedDrafts));
                                        router.push("/dashboard/pos");
                                    }}
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
                            </Stack>
                        </>
                    )}
                </Box>
            </Paper>
        </Box>
    );
}
