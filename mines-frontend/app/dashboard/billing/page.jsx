"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Box, Typography, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Button,
    Paper, Stack, Chip, Checkbox, IconButton,
    TextField, Autocomplete, MenuItem, Select,
    FormControl, InputLabel, CircularProgress, Alert
} from "@mui/material";
import {
    ReceiptLongOutlined as InvoiceIcon,
    FilterListOutlined as FilterIcon,
    AddCircleOutline as PlusIcon,
    PrintOutlined as PrintIcon,
    HistoryOutlined as HistoryIcon,
    CalendarMonthOutlined as DateIcon
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { dcApi, customerApi, invoiceApi, adminApi } from "@/services/api";

export default function CorporateBillingPage() {
    const router = useRouter();
    const { user, selectedBranch, selectedCompany } = useApp();
    const isAdmin = user?.role === "ADMIN";

    // Organization filter
    const [companies, setCompanies] = useState([]);
    const [companyId, setCompanyId] = useState("");
    const [branches, setBranches] = useState([]);
    const [branchId, setBranchId] = useState("");

    // Customers & Filtering
    const [customers, setCustomers] = useState([]);
    const [customerId, setCustomerId] = useState(null);
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    
    // DCs List
    const [dcs, setDcs] = useState([]);
    const [selectedDcIds, setSelectedDcIds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [compiling, setCompiling] = useState(false);
    const [paymentTerms, setPaymentTerms] = useState("Net 30 Days");

    // ─── Initial Load ───────────────────────────────────────
    useEffect(() => {
        if (isAdmin) {
            adminApi.getCompanies().then(res => setCompanies(res.data || []));
        } else {
            setCompanyId(selectedCompany?.id || "");
            setBranchId(selectedBranch?.id || selectedCompany?.branchId || "");
        }
    }, [isAdmin, selectedCompany, selectedBranch]);

    useEffect(() => {
        if (companyId && isAdmin) {
            adminApi.getBranches(companyId).then(res => setBranches(res.data || []));
        }
    }, [companyId, isAdmin]);

    useEffect(() => {
        if (companyId) {
            customerApi.getAll(0, 100).then(res => {
                const corp = (res.content || []).filter(c => c.customerType === "CORPORATE");
                setCustomers(corp);
            });
        }
    }, [companyId]);

    // ─── Fetch DCs ──────────────────────────────────────────
    const fetchDcs = useCallback(async () => {
        if (!companyId || !branchId || !customerId) return;
        setLoading(true);
        try {
            // We need an endpoint to get COMPLETED but UNINVOICED DCs
            const res = await dcApi.getAll(0, 50, companyId, branchId, "COMPLETED");
            if (res.success) {
                // Filter locally for the specific customer and UNINVOICED (invoiceId is null)
                const filtered = (res.data.content || []).filter(item => 
                    item.customerId === customerId.id && !item.invoiceId
                );
                setDcs(filtered);
                setSelectedDcIds([]);
            }
        } catch (e) {
            console.error("Error fetching DCs:", e);
        } finally {
            setLoading(false);
        }
    }, [companyId, branchId, customerId]);

    useEffect(() => {
        fetchDcs();
    }, [fetchDcs]);

    // ─── Compile Invoice ────────────────────────────────────
    const handleCompile = async () => {
        if (selectedDcIds.length === 0) return;
        setCompiling(true);
        try {
            const res = await invoiceApi.compile({
                dcIds: selectedDcIds,
                paymentTerms,
                companyId,
                branchId,
                customerId: customerId.id
            });
            if (res.success) {
                alert("Invoice " + res.data.invoiceNumber + " compiled successfully!");
                fetchDcs();
            }
        } catch (e) {
            alert(e.response?.data?.message || "Error compiling invoice");
        } finally {
            setCompiling(false);
        }
    };

    const toggleSelection = (id) => {
        setSelectedDcIds(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (selectedDcIds.length === dcs.length) setSelectedDcIds([]);
        else setSelectedDcIds(dcs.map(d => d.id));
    };

    // ─── Styles ─────────────────────────────────────────────
    const tableCellStyle = {
        fontWeight: 600, fontSize: "13px", color: "#202224",
        borderRight: "1px solid rgba(0,0,0,0.05)",
        textAlign: "center", padding: "14px 10px", whiteSpace: "nowrap"
    };
    const headerCellStyle = {
        ...tableCellStyle, color: "#4B5563", fontWeight: 700,
        backgroundColor: "#FFFFFF", borderBottom: "1px solid #F3F4F6"
    };

    return (
        <Box sx={{ p: 0, backgroundColor: "#F8F9FA", minHeight: "100vh" }}>
            {/* Header */}
            <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: "#111827", letterSpacing: "-0.02em" }}>
                        Corporate Billing
                    </Typography>
                    <Typography sx={{ color: "#6B7280", fontWeight: 500, mt: 0.5 }}>
                        Compile Delivery Challans into Commercial Invoices
                    </Typography>
                </Box>
                <Button
                    variant="contained" startIcon={<HistoryIcon />}
                    onClick={() => router.push("/dashboard/billing/history")}
                    sx={{
                        background: "#FFFFFF", color: "#111827", textTransform: "none",
                        borderRadius: "12px", px: 3, fontWeight: 700, border: "1px solid #E5E7EB",
                        "&:hover": { background: "#F9FAFB" }
                    }}
                >
                    Invoice History
                </Button>
            </Box>

            {/* Filter Section */}
            <Paper sx={{ p: 4, mb: 4, borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", border: "1px solid #F3F4F6" }}>
                <GridContainer>
                    {isAdmin && (
                        <>
                            <Box sx={{ flex: 1 }}>
                                <Typography sx={{ fontSize: "12px", fontWeight: 800, color: "#9CA3AF", mb: 1 }}>COMPANY</Typography>
                                <Select fullWidth size="small" value={companyId} onChange={(e) => setCompanyId(e.target.value)} sx={{ borderRadius: "10px" }}>
                                    {companies.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                                </Select>
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography sx={{ fontSize: "12px", fontWeight: 800, color: "#9CA3AF", mb: 1 }}>BRANCH</Typography>
                                <Select fullWidth size="small" value={branchId} onChange={(e) => setBranchId(e.target.value)} sx={{ borderRadius: "10px" }}>
                                    {branches.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
                                </Select>
                            </Box>
                        </>
                    )}
                    <Box sx={{ flex: 2 }}>
                        <Typography sx={{ fontSize: "12px", fontWeight: 800, color: "#9CA3AF", mb: 1 }}>CORPORATE CUSTOMER</Typography>
                        <Autocomplete
                            options={customers}
                            getOptionLabel={(o) => `${o.name} (${o.customerCode})`}
                            value={customerId}
                            onChange={(_, val) => setCustomerId(val)}
                            renderInput={(params) => <TextField {...params} size="small" placeholder="Select customer..." sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }} />}
                        />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: "12px", fontWeight: 800, color: "#9CA3AF", mb: 1 }}>PAYMENT TERMS</Typography>
                        <Select fullWidth size="small" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} sx={{ borderRadius: "10px" }}>
                            {["Immediate", "Net 7 Days", "Net 15 Days", "Net 30 Days", "Net 60 Days"].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                        </Select>
                    </Box>
                </GridContainer>
            </Paper>

            {/* DCs Table */}
            <Paper sx={{ borderRadius: "20px", overflow: "hidden", border: "1px solid #F3F4F6", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
                <Box sx={{ p: 3, display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#FFFFFF" }}>
                    <Typography sx={{ fontWeight: 800, color: "#111827", fontSize: "18px" }}>
                        Un-invoiced Challans
                        {selectedDcIds.length > 0 && <Chip label={`${selectedDcIds.length} Selected`} size="small" sx={{ ml: 2, backgroundColor: "#EEF2FF", color: "#1C319F", fontWeight: 700 }} />}
                    </Typography>
                    <Button
                        variant="contained" disabled={selectedDcIds.length === 0 || compiling}
                        onClick={handleCompile}
                        startIcon={<InvoiceIcon />}
                        sx={{
                            background: "#1C319F", borderRadius: "10px", px: 4, textTransform: "none", fontWeight: 700,
                            boxShadow: "0 6px 20px rgba(28, 49, 159, 0.25)",
                            "&:hover": { background: "#142375" }
                        }}
                    >
                        {compiling ? "Compiling..." : "Compile & Generate Invoice"}
                    </Button>
                </Box>
                
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ ...headerCellStyle, width: 40 }}><Checkbox size="small" checked={dcs.length > 0 && selectedDcIds.length === dcs.length} onChange={toggleAll} /></TableCell>
                                <TableCell sx={headerCellStyle}>DC Number</TableCell>
                                <TableCell sx={headerCellStyle}>Date</TableCell>
                                <TableCell sx={headerCellStyle}>Vehicle No</TableCell>
                                <TableCell sx={headerCellStyle}>Product</TableCell>
                                <TableCell sx={headerCellStyle}>Net Weight</TableCell>
                                <TableCell sx={headerCellStyle}>Rate (₹)</TableCell>
                                <TableCell sx={{ ...headerCellStyle, borderRight: "none" }}>Amount (₹)</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}><CircularProgress size={24} /></TableCell></TableRow>
                            ) : dcs.length === 0 ? (
                                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6, color: "#9CA3AF" }}>No un-invoiced challans found for this customer.</TableCell></TableRow>
                            ) : dcs.map(dc => (
                                <TableRow key={dc.id} sx={{ "&:hover": { backgroundColor: "#F9FAFB" } }}>
                                    <TableCell sx={{ ...tableCellStyle, width: 40 }}><Checkbox size="small" checked={selectedDcIds.includes(dc.id)} onChange={() => toggleSelection(dc.id)} /></TableCell>
                                    <TableCell sx={{ ...tableCellStyle, fontWeight: 700, color: "#1C319F" }}>{dc.dcNumber}</TableCell>
                                    <TableCell sx={tableCellStyle}>{dc.dcDate}</TableCell>
                                    <TableCell sx={{ ...tableCellStyle, fontWeight: 700 }}>{dc.vehicleNo}</TableCell>
                                    <TableCell sx={tableCellStyle}>{dc.productName}</TableCell>
                                    <TableCell sx={tableCellStyle}>{dc.netWeight?.toFixed(2)} T</TableCell>
                                    <TableCell sx={tableCellStyle}>₹{dc.rate?.toFixed(2)}</TableCell>
                                    <TableCell sx={{ ...tableCellStyle, borderRight: "none", fontWeight: 700 }}>₹{Number(dc.amount || 0).toLocaleString("en-IN")}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
}

function GridContainer({ children }) {
    return <Stack direction={{ xs: "column", md: "row" }} spacing={3}>{children}</Stack>;
}
