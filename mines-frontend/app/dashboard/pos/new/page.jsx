"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Box, Typography, Button, TextField, Select, MenuItem,
    Stack, Paper, Chip, Alert, CircularProgress,
    Autocomplete
} from "@mui/material";
import {
    Close as CloseIcon, DescriptionOutlined as DocIcon,
    ScaleOutlined as ScaleIcon, AccountBalanceWalletOutlined as WalletIcon,
    WarningAmberOutlined as WarningIcon
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { palette } from "@/theme";
import { useApp } from "@/context/AppContext";
import { dcApi, customerApi, productApi, truckApi, adminApi } from "@/services/api";
import Cookies from "js-cookie";

export default function PosNewEntryPage() {
    const router = useRouter();
    const { user, selectedCompany, selectedBranch } = useApp();
    const userRole = typeof window !== "undefined" ? Cookies.get("role") || "" : "";
    const isAdmin = userRole === "ADMIN" || userRole === "ROLE_ADMIN";

    // ─── Company/Branch state (Admin picks, others inherit) ──
    const [companyId, setCompanyId] = useState("");
    const [branchId, setBranchId] = useState("");
    const [allCompanies, setAllCompanies] = useState([]);
    const [branches, setBranches] = useState([]);

    // ─── Form State ─────────────────────────────────────────
    const [saleMode, setSaleMode] = useState("POS");
    const [customerType, setCustomerType] = useState("GUEST");
    const [customerId, setCustomerId] = useState(null);
    const [guestName, setGuestName] = useState("");
    const [vehicleNo, setVehicleNo] = useState("");
    const [truckId, setTruckId] = useState(null);
    const [driverName, setDriverName] = useState("");
    const [productId, setProductId] = useState(null);
    const [tareWeight, setTareWeight] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("CASH");
    const [gstBillRequested, setGstBillRequested] = useState(false);

    // ─── Lookup Data ────────────────────────────────────────
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [trucks, setTrucks] = useState([]);
    const [saving, setSaving] = useState(false);
    const [outstanding, setOutstanding] = useState(null);

    // ═══════════════════════════════════════════════════════
    //  Step 1: Resolve company/branch
    // ═══════════════════════════════════════════════════════

    useEffect(() => {
        if (isAdmin) {
            // Admin: load all companies for picker
            adminApi.getCompanies(0, 1000).then(res => {
                if (res.success) setAllCompanies(res.data.content || []);
            });
        } else {
            // Others: use their context
            const cId = selectedCompany?.companyId || selectedCompany?.id;
            const bId = selectedBranch?.id || selectedBranch?.branchId || selectedCompany?.branchId;
            if (cId) setCompanyId(cId);
            if (bId) setBranchId(bId);
        }
    }, [isAdmin, selectedCompany, selectedBranch]);

    // Load branches when company changes
    useEffect(() => {
        if (!companyId) { setBranches([]); return; }
        adminApi.getBranches(companyId).then(res => {
            if (res.success) {
                const list = res.data || [];
                setBranches(list);
                // Auto-select first branch
                if (list.length > 0 && !branchId) {
                    setBranchId(list[0].id);
                }
            }
        }).catch(() => setBranches([]));
    }, [companyId]);

    // ═══════════════════════════════════════════════════════
    //  Step 2: Load master data when company is resolved
    // ═══════════════════════════════════════════════════════

    useEffect(() => {
        if (!companyId) return;

        const loadData = async () => {
            try {
                const [custRes, prodRes, truckRes] = await Promise.all([
                    customerApi.getAll(0, 500, "", companyId, branchId),
                    productApi.getByCompany(companyId),
                    truckApi.getAll(0, 500, "", companyId, branchId)
                ]);
                if (custRes.success) {
                    const list = custRes.data?.content || custRes.data || [];
                    setCustomers(list);
                }
                if (prodRes.success) {
                    const list = prodRes.data?.content || prodRes.data || [];
                    setProducts(list);
                }
                if (truckRes.success) {
                    const list = truckRes.data?.content || truckRes.data || [];
                    setTrucks(list);
                }
            } catch (e) {
                console.error("Error loading master data:", e);
            }
        };
        loadData();
    }, [companyId]);

    // ─── Outstanding check when vehicle changes ─────────────
    const checkOutstanding = useCallback(async (vNo) => {
        if (!vNo || vNo.length < 4) { setOutstanding(null); return; }
        try {
            const res = await dcApi.checkOutstanding(vNo);
            if (res.success && res.data?.hasOutstanding) {
                setOutstanding(res.data);
            } else {
                setOutstanding(null);
            }
        } catch { setOutstanding(null); }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => checkOutstanding(vehicleNo), 500);
        return () => clearTimeout(timer);
    }, [vehicleNo, checkOutstanding]);

    // ─── Filter customers by type ───────────────────────────
    const filteredCustomers = customers.filter(c => {
        if (saleMode === "POS") return c.type === "LOCAL";
        if (saleMode === "CREDIT") return c.type === customerType;
        return true;
    });

    // ─── Customer Type options based on sale mode ───────────
    const customerTypeOptions = saleMode === "POS"
        ? [{ value: "GUEST", label: "— (Guest)" }, { value: "LOCAL", label: "Local" }]
        : [{ value: "LOCAL", label: "Local" }, { value: "CORPORATE", label: "Corporate" }];

    // Reset customer type when sale mode changes
    useEffect(() => {
        setCustomerType(saleMode === "POS" ? "GUEST" : "LOCAL");
        setCustomerId(null);
        setGuestName("");
    }, [saleMode]);

    // ─── Submit ─────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!companyId || !branchId) {
            alert("Please select a company and branch.");
            return;
        }
        if (!productId) { alert("Please select a product."); return; }
        if (!vehicleNo.trim()) { alert("Please enter vehicle number."); return; }
        if (customerType === "GUEST" && !guestName.trim()) { alert("Please enter customer name."); return; }
        if (customerType !== "GUEST" && !customerId) { alert("Please select a customer."); return; }
        if (!tareWeight || parseFloat(tareWeight) <= 0) { alert("Please enter tare weight."); return; }

        setSaving(true);
        try {
            const payload = {
                saleMode,
                customerType,
                customerId: customerType !== "GUEST" ? customerId : null,
                guestName: customerType === "GUEST" ? guestName : null,
                vehicleNo: vehicleNo.toUpperCase().trim(),
                truckId: customerType !== "GUEST" ? truckId : null,
                driverName,
                productId,
                tareWeight: parseFloat(tareWeight),
                paymentMethod: saleMode === "POS" ? paymentMethod : null,
                gstBillRequested,
                companyId,
                branchId
            };

            const res = await dcApi.create(payload);
            if (res.success) {
                router.push("/dashboard/pos");
            } else {
                alert(res.message || "Failed to create DC");
            }
        } catch (e) {
            alert(e.response?.data?.message || "Error creating DC");
        } finally {
            setSaving(false);
        }
    };

    // ─── Styles ─────────────────────────────────────────────
    const inputStyle = {
        "& .MuiOutlinedInput-root": {
            borderRadius: "12px", backgroundColor: "#FFFFFF",
            "& fieldset": { borderColor: "#E5E7EB" },
            "&:hover fieldset": { borderColor: "#D1D5DB" },
        },
        "& .MuiInputBase-input": { padding: "12px 16px", fontSize: "14px", color: "#374151" }
    };
    const labelStyle = { fontSize: "13px", fontWeight: 600, color: "#6B7280", mb: 1 };
    const selectStyle = { borderRadius: "12px", "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E5E7EB" } };

    const steps = [
        { id: 1, label: "Step 1", title: "Customer & Product", icon: <DocIcon /> },
        { id: 2, label: "Step 2", title: "Weight & Material", icon: <ScaleIcon /> },
        { id: 3, label: "Step 3", title: "Payment", icon: <WalletIcon /> },
    ];

    return (
        <Box sx={{ p: 0, backgroundColor: "#F8F9FA", minHeight: "100vh" }}>
            {/* Header */}
            <Box sx={{ p: 2, mb: 2 }}>
                <Button
                    variant="outlined" startIcon={<CloseIcon />}
                    onClick={() => router.back()}
                    sx={{
                        textTransform: "none", borderRadius: "10px", color: "#4B5563",
                        borderColor: "#D1D5DB", fontWeight: 600, backgroundColor: "#FFFFFF",
                        "&:hover": { backgroundColor: "#F9FAFB", borderColor: "#9CA3AF" }
                    }}
                >
                    Cancel Entry
                </Button>
            </Box>

            {/* Main Card */}
            <Paper sx={{
                mx: 2, mb: 4, borderRadius: "20px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                overflow: "hidden", border: "1px solid #F3F4F6"
            }}>
                {/* Stepper Header */}
                <Box sx={{ display: "flex", backgroundColor: "#FFFFFF", p: 0 }}>
                    {steps.map((step) => (
                        <Box
                            key={step.id}
                            sx={{
                                flex: 1, display: "flex", alignItems: "center", p: 2.5,
                                backgroundColor: step.id === 1 ? "#1C319F" : "#FFFFFF",
                                color: step.id === 1 ? "#FFFFFF" : "#6B7280",
                                position: "relative", transition: "all 0.3s ease",
                                borderBottomRightRadius: step.id === 1 ? "80px" : 0,
                                zIndex: step.id === 1 ? 1 : 0
                            }}
                        >
                            <Box sx={{
                                width: 40, height: 40, borderRadius: "50%",
                                backgroundColor: step.id === 1 ? "rgba(255,255,255,0.2)" : "#F3F4F6",
                                display: "flex", alignItems: "center", justifyContent: "center", mr: 2
                            }}>
                                {step.id === 1
                                    ? React.cloneElement(step.icon, { sx: { color: "#FFF" } })
                                    : step.icon}
                            </Box>
                            <Box>
                                <Typography sx={{ fontSize: "11px", fontWeight: 700, opacity: step.id === 1 ? 0.8 : 1 }}>
                                    {step.label}
                                </Typography>
                                <Typography sx={{ fontSize: "13px", fontWeight: 700 }}>
                                    {step.title}
                                </Typography>
                            </Box>
                        </Box>
                    ))}
                </Box>

                {/* Form Content */}
                <Box sx={{ p: 5 }}>
                    {/* ─── Outstanding Warning ────────────────────── */}
                    {outstanding && (
                        <Alert severity="warning" icon={<WarningIcon />}
                            sx={{ mb: 4, borderRadius: "12px", "& .MuiAlert-message": { fontWeight: 600 } }}>
                            This vehicle ({outstanding.vehicleNo}) has ₹{Number(outstanding.outstandingAmount).toLocaleString("en-IN")} outstanding.
                            Settle in POS Pay Later.
                        </Alert>
                    )}

                    {/* ─── Admin: Company & Branch Selection ──────── */}
                    {isAdmin && (
                        <Box sx={{ mb: 5 }}>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: "#111827", mb: 3 }}>
                                Organization
                            </Typography>
                            <Stack direction="row" spacing={3}>
                                <Box sx={{ flex: 1 }}>
                                    <Typography sx={labelStyle}>Company *</Typography>
                                    <Select
                                        fullWidth size="small" value={companyId} displayEmpty
                                        onChange={(e) => { setCompanyId(e.target.value); setBranchId(""); }}
                                        sx={selectStyle}
                                    >
                                        <MenuItem value="" disabled>Select Company</MenuItem>
                                        {allCompanies.map(c => (
                                            <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                                        ))}
                                    </Select>
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography sx={labelStyle}>Branch *</Typography>
                                    <Select
                                        fullWidth size="small" value={branchId} displayEmpty
                                        onChange={(e) => setBranchId(e.target.value)}
                                        sx={selectStyle}
                                        disabled={!companyId}
                                    >
                                        <MenuItem value="" disabled>Select Branch</MenuItem>
                                        {branches.map(b => (
                                            <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                                        ))}
                                    </Select>
                                </Box>
                                <Box sx={{ flex: 1 }} />
                            </Stack>
                        </Box>
                    )}

                    {/* ─── Section: Customer Details ──────────────── */}
                    <Box sx={{ mb: 5 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: "#111827" }}>
                                Customer Details
                            </Typography>
                            {/* Sale Mode Toggle */}
                            <Stack direction="row" sx={{ backgroundColor: "#F3F4F6", p: 0.5, borderRadius: "10px" }}>
                                {["POS", "Credit"].map(mode => (
                                    <Button
                                        key={mode}
                                        onClick={() => setSaleMode(mode.toUpperCase())}
                                        sx={{
                                            borderRadius: "8px", px: 3, textTransform: "none",
                                            fontWeight: 700, fontSize: "13px",
                                            backgroundColor: saleMode === mode.toUpperCase() ? "#FFFFFF" : "transparent",
                                            color: saleMode === mode.toUpperCase() ? "#002C91" : "#9CA3AF",
                                            boxShadow: saleMode === mode.toUpperCase() ? "0 2px 8px rgba(0,0,0,0.05)" : "none",
                                            "&:hover": { backgroundColor: saleMode === mode.toUpperCase() ? "#FFFFFF" : "transparent" }
                                        }}
                                    >
                                        {mode}
                                    </Button>
                                ))}
                            </Stack>
                        </Box>

                        {/* Row 1: Customer Type + Customer/Name + Vehicle */}
                        <Stack direction="row" spacing={3} sx={{ mb: 3 }}>
                            {/* Customer Type */}
                            <Box sx={{ flex: 1 }}>
                                <Typography sx={labelStyle}>Customer Type</Typography>
                                <Select
                                    fullWidth size="small" value={customerType}
                                    onChange={(e) => { setCustomerType(e.target.value); setCustomerId(null); setGuestName(""); }}
                                    sx={selectStyle}
                                >
                                    {customerTypeOptions.map(opt => (
                                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                    ))}
                                </Select>
                            </Box>

                            {/* Customer Name / Guest Name */}
                            <Box sx={{ flex: 1 }}>
                                <Typography sx={labelStyle}>
                                    {customerType === "GUEST" ? "Customer Name" : "Select Customer"}
                                </Typography>
                                {customerType === "GUEST" ? (
                                    <TextField
                                        fullWidth size="small" placeholder="Enter customer name"
                                        value={guestName}
                                        onChange={(e) => setGuestName(e.target.value)}
                                        sx={inputStyle}
                                    />
                                ) : (
                                    <Autocomplete
                                        options={filteredCustomers}
                                        getOptionLabel={(opt) => `${opt.customerCode || ""} — ${opt.name}`}
                                        value={filteredCustomers.find(c => c.id === customerId) || null}
                                        onChange={(_, val) => setCustomerId(val?.id || null)}
                                        renderInput={(params) => (
                                            <TextField {...params} size="small" placeholder="Search customer..."
                                                sx={inputStyle} />
                                        )}
                                        sx={{ "& .MuiAutocomplete-inputRoot": { borderRadius: "12px" } }}
                                        isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                                        noOptionsText="No customers found"
                                    />
                                )}
                            </Box>

                            {/* Vehicle No */}
                            <Box sx={{ flex: 1 }}>
                                <Typography sx={labelStyle}>Vehicle No</Typography>
                                {customerType === "GUEST" ? (
                                    <TextField
                                        fullWidth size="small" placeholder="e.g. TN12AM2125"
                                        value={vehicleNo}
                                        onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                                        sx={inputStyle}
                                    />
                                ) : (
                                    <Autocomplete
                                        options={trucks}
                                        getOptionLabel={(opt) => opt.truckNo || ""}
                                        value={trucks.find(t => t.id === truckId) || null}
                                        onChange={(_, val) => {
                                            setTruckId(val?.id || null);
                                            setVehicleNo(val?.truckNo || "");
                                            if (val?.tareWeight) setTareWeight(String(val.tareWeight));
                                        }}
                                        renderInput={(params) => (
                                            <TextField {...params} size="small" placeholder="Search truck..."
                                                sx={inputStyle} />
                                        )}
                                        sx={{ "& .MuiAutocomplete-inputRoot": { borderRadius: "12px" } }}
                                        isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                                        noOptionsText="No trucks found"
                                    />
                                )}
                            </Box>
                        </Stack>

                        {/* Row 2: Product + Driver */}
                        <Stack direction="row" spacing={3}>
                            <Box sx={{ flex: 1 }}>
                                <Typography sx={labelStyle}>Product Name</Typography>
                                <Autocomplete
                                    options={products}
                                    getOptionLabel={(opt) => opt.name || ""}
                                    value={products.find(p => p.id === productId) || null}
                                    onChange={(_, val) => setProductId(val?.id || null)}
                                    renderInput={(params) => (
                                        <TextField {...params} size="small" placeholder="Search product..."
                                            sx={inputStyle} />
                                    )}
                                    sx={{ "& .MuiAutocomplete-inputRoot": { borderRadius: "12px" } }}
                                    isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                                    noOptionsText="No products found"
                                />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography sx={labelStyle}>Driver Name</Typography>
                                <TextField
                                    fullWidth size="small" placeholder="Enter driver name"
                                    value={driverName}
                                    onChange={(e) => setDriverName(e.target.value)}
                                    sx={inputStyle}
                                />
                            </Box>
                            <Box sx={{ flex: 1 }} />
                        </Stack>
                    </Box>

                    {/* ─── Section: Weight Data ───────────────────── */}
                    <Box sx={{ mb: 5 }}>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: "#111827", mb: 4 }}>
                            Weight Data
                        </Typography>
                        <Box sx={{ maxWidth: "400px" }}>
                            <Typography sx={labelStyle}>Tare Weight (Tonnes)</Typography>
                            <TextField
                                fullWidth size="small" type="number"
                                value={tareWeight}
                                onChange={(e) => setTareWeight(e.target.value)}
                                placeholder="0.00"
                                sx={{
                                    ...inputStyle,
                                    "& .MuiOutlinedInput-root": {
                                        ...inputStyle["& .MuiOutlinedInput-root"],
                                        backgroundColor: "#F3F7FF"
                                    }
                                }}
                            />
                        </Box>
                    </Box>

                    {/* ─── Section: Payment (POS only) ────────────── */}
                    {saleMode === "POS" && (
                        <Box sx={{ mb: 5 }}>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: "#111827", mb: 4 }}>
                                Payment Method
                            </Typography>
                            <Stack direction="row" spacing={2}>
                                {["CASH", "UPI"].map(method => (
                                    <Chip
                                        key={method} label={method}
                                        onClick={() => setPaymentMethod(method)}
                                        sx={{
                                            px: 3, py: 2.5, fontSize: "14px", fontWeight: 700,
                                            borderRadius: "10px", cursor: "pointer",
                                            backgroundColor: paymentMethod === method ? "#1C319F" : "#F3F4F6",
                                            color: paymentMethod === method ? "#FFFFFF" : "#6B7280",
                                            "&:hover": {
                                                backgroundColor: paymentMethod === method ? "#142375" : "#E5E7EB"
                                            }
                                        }}
                                    />
                                ))}
                            </Stack>
                        </Box>
                    )}

                    {/* ─── Actions ────────────────────────────────── */}
                    <Stack direction="row" justifyContent="center" alignItems="center" sx={{ position: "relative", mt: 4 }}>
                        <Button
                            variant="contained" onClick={handleSubmit} disabled={saving}
                            sx={{
                                background: "#1C319F", borderRadius: "12px", px: 10, py: 1.5,
                                textTransform: "none", fontWeight: 700, fontSize: "16px",
                                boxShadow: "0 6px 20px rgba(28, 49, 159, 0.3)",
                                "&:hover": { background: "#142375" },
                                "&.Mui-disabled": { background: "#9CA3AF" }
                            }}
                        >
                            {saving ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Save & Generate DC"}
                        </Button>
                    </Stack>
                </Box>
            </Paper>
        </Box>
    );
}
