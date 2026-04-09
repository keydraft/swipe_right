"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Box, Typography, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Button,
    Paper, Stack, TextField, Chip, Checkbox,
    Divider, IconButton, Alert, CircularProgress,
    Autocomplete
} from "@mui/material";
import {
    ReceiptOutlined as InvoiceIcon,
    FilterListOutlined as FilterIcon,
    CheckCircleOutline as CheckIcon,
    PrintOutlined as PrintIcon,
    AddOutlined as AddIcon
} from "@mui/icons-material";
import { useApp } from "@/context/AppContext";
import { dcApi, invoiceApi, customerApi, adminApi } from "@/services/api";
import OrganizationPicker from "@/components/OrganizationPicker";

export default function CorporateInvoicingPage() {
    const { currentUser, selectedCompany, selectedBranch } = useApp();
    
    // Organization scoping
    const [org, setOrg] = useState({ 
        companyId: selectedCompany?.id || "", 
        branchId: (selectedBranch?.id || selectedCompany?.branchId) || "" 
    });

    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [pendingDcs, setPendingDcs] = useState([]);
    const [selectedDcIds, setSelectedDcIds] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Invoice details
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
    const [paymentTerms, setPaymentTerms] = useState("NET 30");
    const [compiling, setCompiling] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    // ─── Load Corporate Customers ──────────────────────────
    useEffect(() => {
        const loadCustomers = async () => {
            try {
                // Fetch all and filter client side for now, or use specific API
                const res = await customerApi.getAll(0, 100);
                if (res.success) {
                    // Filter for CORPORATE only
                    const corps = res.data.content.filter(c => c.customerType === "CORPORATE");
                    setCustomers(corps);
                }
            } catch (e) {
                console.error("Error loading customers", e);
            }
        };
        loadCustomers();
    }, []);

    // ─── Search Pending DCs ────────────────────────────────
    const fetchPendingDcs = useCallback(async () => {
        if (!selectedCustomer) return;
        setLoading(true);
        setSuccessMsg("");
        try {
            // Updated API call to fetch by customer and status COMPLETED/UNINVOICED
            const res = await dcApi.getAll(0, 100, org.companyId, org.branchId, "COMPLETED");
            if (res.success) {
                // Filter for this customer specifically if API returns all
                const filtered = res.data.content.filter(d => d.customerId === selectedCustomer.id && d.status !== "INVOICED");
                setPendingDcs(filtered);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [selectedCustomer, org]);

    useEffect(() => {
        if (selectedCustomer) fetchPendingDcs();
        else setPendingDcs([]);
    }, [selectedCustomer, fetchPendingDcs]);

    // ─── Selection Handlers ────────────────────────────────
    const handleToggleSelect = (id) => {
        setSelectedDcIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedDcIds(pendingDcs.map(d => d.id));
        } else {
            setSelectedDcIds([]);
        }
    };

    // ─── Compile Invoice ───────────────────────────────────
    const handleCompile = async () => {
        if (selectedDcIds.length === 0) return;
        setCompiling(true);
        try {
            const payload = {
                companyId: org.companyId,
                branchId: org.branchId,
                customerId: selectedCustomer.id,
                dcIds: selectedDcIds,
                invoiceDate,
                paymentTerms
            };
            const res = await invoiceApi.compile(payload);
            if (res.success) {
                setSuccessMsg(`Invoice ${res.data.invoiceNumber} generated successfully!`);
                setSelectedDcIds([]);
                fetchPendingDcs();
            }
        } catch (e) {
            alert(e.response?.data?.message || "Error generating invoice");
        } finally {
            setCompiling(false);
        }
    };

    // ─── Totals Calculation ────────────────────────────────
    const stats = pendingDcs.filter(d => selectedDcIds.includes(d.id)).reduce((acc, d) => {
        acc.total += (d.amount || 0);
        acc.gst += (d.gstAmount || 0);
        acc.net += (d.netWeight || 0);
        return acc;
    }, { total: 0, gst: 0, net: 0 });

    // ─── Styles ─────────────────────────────────────────────
    const headerStyle = { fontWeight: 700, fontSize: "12px", color: "#6B7280", textTransform: "uppercase" };
    const cellStyle = { fontWeight: 600, fontSize: "13px", color: "#111827" };

    return (
        <Box sx={{ p: 4, backgroundColor: "#F8F9FA", minHeight: "100vh" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: "#111827", mb: 0.5 }}>
                        Corporate Invoicing
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#6B7280" }}>
                        Select corporate clients to compile multiple Delivery Challans into a single Invoice.
                    </Typography>
                </Box>
                <Button 
                    variant="contained" startIcon={<InvoiceIcon />}
                    onClick={() => router.push("/dashboard/sales/invoice/list")}
                    sx={{ backgroundColor: "#1C319F", borderRadius: "10px", textTransform: "none", fontWeight: 700 }}
                >
                    View All Invoices
                </Button>
            </Stack>

            {/* Selection Panel */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3, borderRadius: "20px", border: "1px solid #E5E7EB", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
                        <Stack direction="row" spacing={2} mb={3}>
                            <OrganizationPicker 
                                org={org} 
                                setOrg={setOrg} 
                                adminOnly 
                            />
                            <Autocomplete
                                fullWidth
                                options={customers}
                                getOptionLabel={(option) => `${option.name} (${option.customerCode})`}
                                value={selectedCustomer}
                                onChange={(_, val) => setSelectedCustomer(val)}
                                renderInput={(params) => (
                                    <TextField {...params} label="Search Corporate Customer" size="small" 
                                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }} 
                                    />
                                )}
                            />
                        </Stack>

                        <TableContainer sx={{ maxHeight: 400 }}>
                            <Table stickyHeader size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell padding="checkbox">
                                            <Checkbox 
                                                indeterminate={selectedDcIds.length > 0 && selectedDcIds.length < pendingDcs.length}
                                                checked={pendingDcs.length > 0 && selectedDcIds.length === pendingDcs.length}
                                                onChange={handleSelectAll}
                                            />
                                        </TableCell>
                                        <TableCell sx={headerStyle}>DC Number</TableCell>
                                        <TableCell sx={headerStyle}>Date</TableCell>
                                        <TableCell sx={headerStyle}>Vehicle</TableCell>
                                        <TableCell sx={headerStyle}>Product</TableCell>
                                        <TableCell sx={headerStyle} align="right">Net Wt</TableCell>
                                        <TableCell sx={headerStyle} align="right">Amount (₹)</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading ? (
                                        <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell></TableRow>
                                    ) : pendingDcs.length === 0 ? (
                                        <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: "#9CA3AF" }}>No pending challans found</TableCell></TableRow>
                                    ) : (
                                        pendingDcs.map((dc) => (
                                            <TableRow key={dc.id} hover onClick={() => handleToggleSelect(dc.id)} sx={{ cursor: "pointer" }}>
                                                <TableCell padding="checkbox">
                                                    <Checkbox checked={selectedDcIds.includes(dc.id)} />
                                                </TableCell>
                                                <TableCell sx={{ ...cellStyle, color: "#1C319F" }}>{dc.dcNumber}</TableCell>
                                                <TableCell sx={cellStyle}>{dc.dcDate}</TableCell>
                                                <TableCell sx={cellStyle}>{dc.vehicleNo}</TableCell>
                                                <TableCell sx={cellStyle}>{dc.productName}</TableCell>
                                                <TableCell sx={cellStyle} align="right">{dc.netWeight?.toFixed(2)}</TableCell>
                                                <TableCell sx={cellStyle} align="right">{dc.amount?.toLocaleString("en-IN")}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, borderRadius: "20px", border: "1px solid #E5E7EB", boxShadow: "0 4px 12px rgba(0,0,0,0.02)", height: "100%" }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Invoice Details</Typography>
                        <Stack spacing={3}>
                            <Box>
                                <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "#6B7280", mb: 1 }}>Selected Customer</Typography>
                                <Typography sx={{ fontWeight: 700, color: "#111827" }}>
                                    {selectedCustomer ? `${selectedCustomer.name}` : "None Selected"}
                                </Typography>
                            </Box>
                            
                            <TextField 
                                label="Invoice Date" type="date" fullWidth size="small"
                                InputLabelProps={{ shrink: true }}
                                value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)}
                                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                            />

                            <TextField 
                                label="Payment Terms" fullWidth size="small"
                                placeholder="e.g. NET 30"
                                value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)}
                                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                            />

                            <Divider sx={{ my: 1 }} />

                            <Box sx={{ backgroundColor: "#F9FAFB", p: 2, borderRadius: "15px" }}>
                                <Stack direction="row" justifyContent="space-between" mb={1}>
                                    <Typography sx={{ fontSize: "13px", color: "#6B7280" }}>DCs Selected</Typography>
                                    <Typography sx={{ fontWeight: 700 }}>{selectedDcIds.length}</Typography>
                                </Stack>
                                <Stack direction="row" justifyContent="space-between" mb={1}>
                                    <Typography sx={{ fontSize: "13px", color: "#6B7280" }}>Total Net Weight</Typography>
                                    <Typography sx={{ fontWeight: 700 }}>{stats.net.toFixed(2)} T</Typography>
                                </Stack>
                                <Stack direction="row" justifyContent="space-between" mb={1}>
                                    <Typography sx={{ fontSize: "13px", color: "#6B7280" }}>Subtotal</Typography>
                                    <Typography sx={{ fontWeight: 700 }}>₹{stats.total.toLocaleString("en-IN")}</Typography>
                                </Stack>
                                <Stack direction="row" justifyContent="space-between" mb={2}>
                                    <Typography sx={{ fontSize: "13px", color: "#6B7280" }}>GST Total</Typography>
                                    <Typography sx={{ fontWeight: 700 }}>₹{stats.gst.toLocaleString("en-IN")}</Typography>
                                </Stack>
                                <Divider sx={{ mb: 2 }} />
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography sx={{ fontWeight: 800, color: "#111827" }}>Grand Total</Typography>
                                    <Typography sx={{ fontWeight: 900, color: "#1C319F", fontSize: "1.1rem" }}>
                                        ₹{(stats.total + stats.gst).toLocaleString("en-IN")}
                                    </Typography>
                                </Stack>
                            </Box>

                            <Button 
                                variant="contained" fullWidth size="large"
                                disabled={selectedDcIds.length === 0 || compiling}
                                onClick={handleCompile}
                                sx={{ 
                                    backgroundColor: "#10B981", borderRadius: "12px", 
                                    textTransform: "none", fontWeight: 800, py: 1.5,
                                    "&:hover": { backgroundColor: "#059669" }
                                }}
                            >
                                {compiling ? "Generating..." : "Generate Invoice"}
                            </Button>

                            {successMsg && (
                                <Alert severity="success" icon={<CheckIcon />} sx={{ borderRadius: "10px" }}>
                                    {successMsg}
                                </Alert>
                            )}
                        </Stack>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}

// ─── Helper Grid Import ─────────────────────────────────────
import { Grid } from "@mui/material";
import { useRouter } from "next/navigation";
