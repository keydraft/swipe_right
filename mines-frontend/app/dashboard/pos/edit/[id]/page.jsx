"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Box, Typography, Button, TextField, Select, MenuItem,
    Stack, IconButton, Paper, Divider, InputAdornment,
    CircularProgress, Alert
} from "@mui/material";
import {
    Close as CloseIcon, DescriptionOutlined as DocIcon,
    ScaleOutlined as ScaleIcon, AccountBalanceWalletOutlined as WalletIcon,
    CheckCircleOutline as CheckIcon
} from "@mui/icons-material";
import { useRouter, useParams } from "next/navigation";
import { dcApi } from "@/services/api";

export default function PosBillingEditPage() {
    const router = useRouter();
    const params = useParams();
    const dcId = params?.id;

    const [activeStep, setActiveStep] = useState(2);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dc, setDc] = useState(null);

    // Form states
    const [saleType, setSaleType] = useState("POS");
    const [tareWeight, setTareWeight] = useState("");
    const [netWeight, setNetWeight] = useState("");
    const [grossWeight, setGrossWeight] = useState("");

    const [ratePerUnit, setRatePerUnit] = useState("");
    const [amount, setAmount] = useState("");
    const [teaCash, setTeaCash] = useState("0");
    const [gstPercent, setGstPercent] = useState("5");
    const [gstAmount, setGstAmount] = useState("0");
    const [totalAmount, setTotalAmount] = useState("0");

    const [driverName, setDriverName] = useState("");
    const [remarks, setRemarks] = useState("");
    const [transportAmount, setTransportAmount] = useState("0");
    const [loadAmount, setLoadAmount] = useState("0");

    const [upiReceived, setUpiReceived] = useState("0");
    const [cashReceived, setCashReceived] = useState("0");
    const [totalReceived, setTotalReceived] = useState("0");

    const [outstanding, setOutstanding] = useState({ amount: 0, loading: false });

    // ─── Data Loading ────────────────────────────────────────
    useEffect(() => {
        if (!dcId) return;
        const loadData = async () => {
            setLoading(true);
            try {
                const res = await dcApi.getById(dcId);
                if (res.success) {
                    const data = res.data;
                    setDc(data);
                    setSaleType(data.saleMode);
                    setTareWeight(String(data.tareWeight || ""));
                    setGrossWeight(String(data.grossWeight || ""));
                    setNetWeight(String(data.netWeight || ""));
                    setRatePerUnit(String(data.rate || ""));
                    setAmount(String(data.amount || ""));
                    setTeaCash(String(data.teaCash || "0"));
                    setGstPercent(String(data.gstPercent || "5"));
                    setGstAmount(String(data.gstAmount || "0"));
                    setDriverName(data.driverName || "");
                    setRemarks(data.remarks || "");
                    setTransportAmount(String(data.transportAmount || "0"));
                    setLoadAmount(String(data.loadAmount || "0"));
                    setUpiReceived(String(data.upiAmount || "0"));
                    setCashReceived(String(data.cashAmount || "0"));
                    
                    fetchOutstanding(data.vehicleNo);
                }
            } catch (e) {
                console.error("Error loading DC:", e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [dcId]);

    const fetchOutstanding = async (vNo) => {
        setOutstanding(prev => ({ ...prev, loading: true }));
        try {
            const res = await dcApi.checkOutstanding(vNo);
            if (res.success) {
                setOutstanding({ amount: res.data.outstandingAmount, loading: false });
            }
        } catch {
            setOutstanding(prev => ({ ...prev, loading: false }));
        }
    };

    // ─── Calculations ───────────────────────────────────────
    useEffect(() => {
        const gross = parseFloat(grossWeight) || 0;
        const tare = parseFloat(tareWeight) || 0;
        const net = Math.max(0, gross - tare);
        setNetWeight(net.toFixed(2));

        const rate = parseFloat(ratePerUnit) || 0;
        const basicAmt = net * rate;
        setAmount(basicAmt.toFixed(2));

        const tea = parseFloat(teaCash) || 0;
        const gstP = parseFloat(gstPercent) || 0;
        const gstA = (basicAmt * gstP) / 100;
        setGstAmount(gstA.toFixed(2));

        const total = basicAmt + tea + gstA;
        setTotalAmount(total.toFixed(2));
    }, [grossWeight, tareWeight, ratePerUnit, teaCash, gstPercent]);

    useEffect(() => {
        const upi = parseFloat(upiReceived) || 0;
        const cash = parseFloat(cashReceived) || 0;
        setTotalReceived((upi + cash).toFixed(2));
    }, [upiReceived, cashReceived]);

    // ─── Handlers ──────────────────────────────────────────
    const handleFetchWeight = () => {
        // Mocking weight fetch
        const mockWeight = (Math.random() * 20 + 30).toFixed(2);
        setGrossWeight(mockWeight);
    };

    const handleSubmit = async () => {
        setSaving(true);
        try {
            const payload = {
                grossWeight: parseFloat(grossWeight),
                driverName,
                remarks,
                rate: parseFloat(ratePerUnit),
                paymentMethod: saleType === "POS" ? (parseFloat(upiReceived) > 0 && parseFloat(cashReceived) > 0 ? "MIXED" : (parseFloat(upiReceived) > 0 ? "UPI" : "CASH")) : null,
                upiAmount: parseFloat(upiReceived),
                cashAmount: parseFloat(cashReceived),
                teaCash: parseFloat(teaCash),
                transportAmount: parseFloat(transportAmount),
                loadAmount: parseFloat(loadAmount),
                gstAmount: parseFloat(gstAmount),
                gstPercent: parseFloat(gstPercent),
                gstBillRequested: parseFloat(gstAmount) > 0
            };

            const res = await dcApi.complete(dcId, payload);
            if (res.success) {
                router.push("/dashboard/pos");
            } else {
                alert(res.message);
            }
        } catch (e) {
            alert(e.response?.data?.message || "Error saving DC");
        } finally {
            setSaving(false);
        }
    };

    // ─── Styles ─────────────────────────────────────────────
    const steps = [
        { id: 1, label: "Step 1", title: "Basic Details", icon: <DocIcon /> },
        { id: 2, label: "Step 2", title: "Weight & Material", icon: <ScaleIcon /> },
        { id: 3, label: "Step 3", title: "Payment & Completion", icon: <WalletIcon /> },
    ];

    const inputStyle = {
        "& .MuiOutlinedInput-root": {
            borderRadius: "12px", backgroundColor: "#FFFFFF",
            "& fieldset": { borderColor: "#E5E7EB" },
            "&:hover fieldset": { borderColor: "#D1D5DB" },
        },
        "& .MuiInputBase-input": { padding: "12px 16px", fontSize: "14px", color: "#374151" }
    };
    const labelStyle = { fontSize: "13px", fontWeight: 600, color: "#6B7280", mb: 1 };

    if (loading) return (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
            <CircularProgress />
        </Box>
    );

    return (
        <Box sx={{ p: 0, backgroundColor: "#F8F9FA", minHeight: "100vh" }}>
            {/* Header / Cancel Button */}
            <Box sx={{ p: 2, mb: 2 }}>
                <Button
                    variant="outlined" startIcon={<CloseIcon />}
                    onClick={() => router.push("/dashboard/pos")}
                    sx={{
                        textTransform: "none", borderRadius: "10px", color: "#4B5563",
                        borderColor: "#D1D5DB", fontWeight: 600, backgroundColor: "#FFFFFF",
                        "&:hover": { backgroundColor: "#F9FAFB", borderColor: "#9CA3AF" }
                    }}
                >
                    Cancel Entry
                </Button>
            </Box>

            {/* Stepper Container */}
            <Paper sx={{
                mx: 2, mb: 4, borderRadius: "20px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                overflow: "hidden", border: "1px solid #F3F4F6"
            }}>
                {/* Stepper Header */}
                <Box sx={{ display: "flex", backgroundColor: "#FFFFFF", p: 0 }}>
                    {steps.map((step) => {
                        const isActive = activeStep === step.id;
                        const isCompleted = step.id < activeStep;
                        const isHighlighted = isActive || isCompleted;
                        return (
                            <Box key={step.id} sx={{
                                flex: 1, display: "flex", alignItems: "center", p: 2.5, pl: isHighlighted ? 4 : 2,
                                background: isHighlighted ? "#1C319F" : "#FFFFFF",
                                color: isHighlighted ? "#FFFFFF" : "#6B7280",
                                position: "relative", transition: "all 0.3s ease",
                                borderBottomRightRadius: isActive ? "80px" : 0, zIndex: isActive ? 1 : 0,
                                "& + div": { borderLeft: isHighlighted && (step.id < activeStep) ? "none" : "1px solid #F3F4F6" }
                            }}>
                                <Box sx={{
                                    width: 40, height: 40, borderRadius: "50%",
                                    backgroundColor: isHighlighted ? "rgba(255,255,255,0.2)" : "#F3F4F6",
                                    display: "flex", alignItems: "center", justifyContent: "center", mr: 2
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
                            <Box sx={{ mb: 6 }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
                                    <Typography variant="h5" sx={{ fontWeight: 800, color: "#111827" }}>Weight Data</Typography>
                                    <Stack direction="row" sx={{ backgroundColor: "#F3F4F6", p: 0.5, borderRadius: "10px" }}>
                                        {["POS", "Credit"].map(t => (
                                            <Button key={t}
                                                onClick={() => setSaleType(t)}
                                                sx={{
                                                    borderRadius: "8px", px: 3, textTransform: "none", fontWeight: 700, fontSize: "13px",
                                                    backgroundColor: saleType === t ? "#FFFFFF" : "transparent",
                                                    color: saleType === t ? "#1C319F" : "#9CA3AF",
                                                    "&:hover": { backgroundColor: saleType === t ? "#FFFFFF" : "transparent" }
                                                }}
                                            >
                                                {t}
                                            </Button>
                                        ))}
                                    </Stack>
                                </Box>

                                <Stack direction="row" spacing={3}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography sx={labelStyle}>Tare Weight ({dc.tareWeight} T)</Typography>
                                        <TextField fullWidth size="small" value={tareWeight} sx={{ ...inputStyle, "& .MuiOutlinedInput-root": { backgroundColor: "#F9FAFB" } }} disabled />
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography sx={labelStyle}>Gross Weight (T)</Typography>
                                        <Stack direction="row" spacing={1}>
                                            <TextField fullWidth size="small" value={grossWeight} onChange={(e) => setGrossWeight(e.target.value)} sx={{ ...inputStyle, "& .MuiOutlinedInput-root": { backgroundColor: "#F3F7FF" } }} />
                                            <Button variant="contained" onClick={handleFetchWeight} sx={{ background: "#1C319F", borderRadius: "10px", px: 3, height: "40px", textTransform: "none", fontWeight: 700 }}>Fetch</Button>
                                        </Stack>
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography sx={labelStyle}>Net Weight (T)</Typography>
                                        <TextField fullWidth size="small" value={netWeight} sx={{ ...inputStyle, "& .MuiOutlinedInput-root": { backgroundColor: "#F9FAFB" } }} disabled />
                                    </Box>
                                </Stack>
                            </Box>

                            <Box sx={{ mb: 8 }}>
                                <Typography variant="h5" sx={{ fontWeight: 800, color: "#111827", mb: 4 }}>Amount & Sales</Typography>
                                <Stack spacing={3}>
                                    <Stack direction="row" spacing={3}>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography sx={labelStyle}>Rate Per Unit (₹)</Typography>
                                            <TextField fullWidth size="small" value={ratePerUnit} onChange={(e) => setRatePerUnit(e.target.value)} sx={inputStyle} />
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography sx={labelStyle}>Amount (₹)</Typography>
                                            <TextField fullWidth size="small" value={amount} sx={{ ...inputStyle, "& .MuiOutlinedInput-root": { backgroundColor: "#F9FAFB" } }} disabled />
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography sx={labelStyle}>Tea Cash (₹)</Typography>
                                            <TextField fullWidth size="small" value={teaCash} onChange={(e) => setTeaCash(e.target.value)} sx={inputStyle} />
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography sx={labelStyle}>Total Amount (₹)</Typography>
                                            <TextField fullWidth size="small" value={totalAmount} sx={{ ...inputStyle, "& .MuiOutlinedInput-root": { backgroundColor: "#F9FAFB", fontWeight: 700, color: "#1C319F" } }} disabled />
                                        </Box>
                                    </Stack>

                                    <Stack direction="row" spacing={3}>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography sx={labelStyle}>GST Percent (%)</Typography>
                                            <Select fullWidth size="small" value={gstPercent} onChange={(e) => setGstPercent(e.target.value)} sx={{ borderRadius: "12px" }}>
                                                {["0", "5", "12", "18"].map(v => <MenuItem key={v} value={v}>{v}%</MenuItem>)}
                                            </Select>
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography sx={labelStyle}>GST Amount (₹)</Typography>
                                            <TextField fullWidth size="small" value={gstAmount} sx={{ ...inputStyle, "& .MuiOutlinedInput-root": { backgroundColor: "#F9FAFB" } }} disabled />
                                        </Box>
                                        <Box sx={{ flex: 2 }} />
                                    </Stack>
                                </Stack>
                            </Box>

                            <Stack direction="row" justifyContent="center">
                                <Button variant="contained" onClick={() => setActiveStep(3)} sx={{ background: "#1C319F", borderRadius: "12px", px: 10, py: 1.5, textTransform: "none", fontWeight: 700, fontSize: "16px", boxShadow: "0 6px 20px rgba(28, 49, 159, 0.3)" }}>
                                    Next: Payment Details
                                </Button>
                            </Stack>
                        </>
                    )}

                    {/* Step 3 Content */}
                    {activeStep === 3 && (
                        <>
                            <Box sx={{ mb: 6 }}>
                                <Typography variant="h5" sx={{ fontWeight: 800, color: "#111827", mb: 4 }}>Other Details</Typography>
                                <Stack spacing={3}>
                                    <Stack direction="row" spacing={3}>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography sx={labelStyle}>Driver Name</Typography>
                                            <TextField fullWidth size="small" value={driverName} onChange={(e) => setDriverName(e.target.value)} sx={inputStyle} />
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography sx={labelStyle}>Transport Amt (₹)</Typography>
                                            <TextField fullWidth size="small" value={transportAmount} onChange={(e) => setTransportAmount(e.target.value)} sx={inputStyle} />
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography sx={labelStyle}>Load Amt (₹)</Typography>
                                            <TextField fullWidth size="small" value={loadAmount} onChange={(e) => setLoadAmount(e.target.value)} sx={inputStyle} />
                                        </Box>
                                    </Stack>
                                    <Box>
                                        <Typography sx={labelStyle}>Remarks</Typography>
                                        <TextField fullWidth size="small" value={remarks} onChange={(e) => setRemarks(e.target.value)} sx={inputStyle} />
                                    </Box>
                                </Stack>
                            </Box>

                            <Box sx={{ mb: 8 }}>
                                <Typography variant="h5" sx={{ fontWeight: 800, color: "#111827", mb: 4 }}>Payment Details</Typography>
                                <Box sx={{ display: "flex", gap: 3 }}>
                                    <Box sx={{ flex: 1 }}>
                                        <Stack spacing={3}>
                                            <Box>
                                                <Typography sx={labelStyle}>Total Payable (₹)</Typography>
                                                <TextField fullWidth size="small" value={totalAmount} disabled sx={{ ...inputStyle, "& .MuiOutlinedInput-root": { backgroundColor: "#F9FAFB", fontWeight: 800 } }} />
                                            </Box>
                                            <Stack direction="row" spacing={2}>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography sx={labelStyle}>UPI Received (₹)</Typography>
                                                    <TextField fullWidth size="small" value={upiReceived} onChange={(e) => setUpiReceived(e.target.value)} sx={inputStyle} />
                                                </Box>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography sx={labelStyle}>Cash Received (₹)</Typography>
                                                    <TextField fullWidth size="small" value={cashReceived} onChange={(e) => setCashReceived(e.target.value)} sx={inputStyle} />
                                                </Box>
                                            </Stack>
                                            <Box>
                                                <Typography sx={labelStyle}>Total Received (₹)</Typography>
                                                <TextField fullWidth size="small" value={totalReceived} disabled sx={{ ...inputStyle, "& .MuiOutlinedInput-root": { backgroundColor: "#F0FDF4", fontWeight: 800, color: "#166534" } }} />
                                            </Box>
                                        </Stack>
                                    </Box>

                                    <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-end", alignItems: "flex-start" }}>
                                        <Box sx={{
                                            width: "100%", maxWidth: "350px", p: 3, borderRadius: "20px",
                                            border: "1px solid #FFCDD2", backgroundColor: "#FFF9F9",
                                            boxShadow: "0 4px 15px rgba(255, 0, 0, 0.03)"
                                        }}>
                                            <Typography sx={{ color: "#4B5563", fontSize: "14px", fontWeight: 600, mb: 1 }}>Old Outstanding Balance</Typography>
                                            <Typography sx={{ color: "#D32F2F", fontSize: "28px", fontWeight: 800, mb: 3 }}>
                                                {outstanding.loading ? "..." : `₹ ${outstanding.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
                                            </Typography>
                                            <Stack direction="row" spacing={4}>
                                                <Box>
                                                    <Typography sx={{ color: "#6B7280", fontSize: "12px", fontWeight: 700 }}>Vehicle No</Typography>
                                                    <Typography sx={{ color: "#4B5563", fontSize: "13px", fontWeight: 700 }}>{dc.vehicleNo}</Typography>
                                                </Box>
                                                <Box>
                                                    <Typography sx={{ color: "#6B7280", fontSize: "12px", fontWeight: 700 }}>DC Number</Typography>
                                                    <Typography sx={{ color: "#4B5563", fontSize: "13px", fontWeight: 700 }}>{dc.dcNumber}</Typography>
                                                </Box>
                                            </Stack>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>

                            <Stack direction="row" spacing={2} justifyContent="center">
                                <Button variant="outlined" onClick={() => setActiveStep(2)} sx={{ borderRadius: "12px", px: 4, textTransform: "none", fontWeight: 700 }}>Back</Button>
                                <Button variant="contained" onClick={handleSubmit} disabled={saving} sx={{ background: "#1C319F", borderRadius: "12px", px: 10, py: 1.5, textTransform: "none", fontWeight: 700, fontSize: "16px", boxShadow: "0 6px 20px rgba(28, 49, 159, 0.3)" }}>
                                    {saving ? "Processing..." : "Complete & Save DC"}
                                </Button>
                            </Stack>
                        </>
                    )}
                </Box>
            </Paper>
        </Box>
    );
}
