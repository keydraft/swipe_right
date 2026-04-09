"use client";

import React, { useState, useCallback } from "react";
import {
    Box, Typography, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Button,
    Paper, Stack, TextField, InputAdornment, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions,
    FormControl, InputLabel, Select, MenuItem, Alert
} from "@mui/material";
import {
    SearchOutlined as SearchIcon,
    ArrowBackOutlined as BackIcon,
    CheckCircleOutline as CheckIcon
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { dcApi } from "@/services/api";

export default function PosPayLaterPage() {
    const router = useRouter();
    const { selectedCompany, selectedBranch } = useApp();

    const [searchQuery, setSearchQuery] = useState("");
    const [unpaidDcs, setUnpaidDcs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    // Payment dialog
    const [payDialog, setPayDialog] = useState(false);
    const [selectedDc, setSelectedDc] = useState(null);
    const [payMethod, setPayMethod] = useState("CASH");
    const [payAmount, setPayAmount] = useState("");
    const [settling, setSettling] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    // ─── Search ─────────────────────────────────────────────
    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim()) return;
        setLoading(true);
        setSearched(true);
        setSuccessMsg("");
        try {
            const res = await dcApi.findUnpaidByVehicle(searchQuery.trim().toUpperCase());
            if (res.success) {
                setUnpaidDcs(res.data || []);
            } else {
                setUnpaidDcs([]);
            }
        } catch {
            setUnpaidDcs([]);
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    const handleKeyPress = (e) => {
        if (e.key === "Enter") handleSearch();
    };

    // ─── Settle Payment ─────────────────────────────────────
    const handleSettle = async () => {
        if (!selectedDc || !payAmount || parseFloat(payAmount) <= 0) return;
        setSettling(true);
        try {
            const res = await dcApi.settlePayment(selectedDc.id, payMethod, parseFloat(payAmount));
            if (res.success) {
                setPayDialog(false);
                setSelectedDc(null);
                setPayAmount("");
                setSuccessMsg(`Payment of ₹${parseFloat(payAmount).toLocaleString("en-IN")} settled for DC ${selectedDc.dcNumber}`);
                // Refresh the list
                handleSearch();
            }
        } catch (e) {
            alert(e.response?.data?.message || "Error settling payment");
        } finally {
            setSettling(false);
        }
    };

    const openPayDialog = (dc) => {
        setSelectedDc(dc);
        setPayAmount(dc.outstandingAmount?.toString() || dc.amount?.toString() || "");
        setPayMethod("CASH");
        setPayDialog(true);
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
            <Box sx={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                mb: 3, backgroundColor: "#FFFFFF", p: 2,
                borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.02)"
            }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Button
                        variant="outlined" startIcon={<BackIcon />}
                        onClick={() => router.push("/dashboard/pos")}
                        sx={{
                            textTransform: "none", borderRadius: "10px", color: "#4B5563",
                            borderColor: "#D1D5DB", fontWeight: 600,
                            "&:hover": { borderColor: "#9CA3AF" }
                        }}
                    >
                        Back to POS
                    </Button>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "#111827" }}>
                        POS Pay Later
                    </Typography>
                </Stack>
            </Box>

            {/* Search Bar */}
            <Paper sx={{
                p: 4, mb: 3, borderRadius: "16px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
                border: "1px solid #F3F4F6"
            }}>
                <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#6B7280", mb: 2 }}>
                    Search by Vehicle Number or Customer Name
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                    <TextField
                        fullWidth size="small"
                        placeholder="e.g. TN12AM2125 or customer name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyPress}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: "#9CA3AF" }} />
                                </InputAdornment>
                            )
                        }}
                        sx={{
                            maxWidth: 500,
                            "& .MuiOutlinedInput-root": {
                                borderRadius: "12px", backgroundColor: "#F9FAFB",
                                "& fieldset": { borderColor: "#E5E7EB" }
                            }
                        }}
                    />
                    <Button
                        variant="contained"
                        onClick={handleSearch}
                        disabled={loading || !searchQuery.trim()}
                        sx={{
                            background: "#1C319F", borderRadius: "10px", px: 4,
                            textTransform: "none", fontWeight: 700,
                            "&:hover": { background: "#142375" }
                        }}
                    >
                        {loading ? "Searching..." : "Search"}
                    </Button>
                </Stack>
            </Paper>

            {/* Success Message */}
            {successMsg && (
                <Alert
                    severity="success" icon={<CheckIcon />}
                    onClose={() => setSuccessMsg("")}
                    sx={{ mb: 3, borderRadius: "12px", fontWeight: 600 }}
                >
                    {successMsg}
                </Alert>
            )}

            {/* Results Table */}
            {searched && (
                <TableContainer component={Paper} sx={{
                    boxShadow: "none", borderRadius: "12px",
                    border: "1px solid #F3F4F6"
                }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={headerCellStyle}>DC Number</TableCell>
                                <TableCell sx={headerCellStyle}>Date</TableCell>
                                <TableCell sx={headerCellStyle}>Customer</TableCell>
                                <TableCell sx={headerCellStyle}>Vehicle No</TableCell>
                                <TableCell sx={headerCellStyle}>Product</TableCell>
                                <TableCell sx={headerCellStyle}>Net Wt</TableCell>
                                <TableCell sx={headerCellStyle}>Amount (₹)</TableCell>
                                <TableCell sx={headerCellStyle}>Paid (₹)</TableCell>
                                <TableCell sx={headerCellStyle}>Due (₹)</TableCell>
                                <TableCell sx={{ ...headerCellStyle, borderRight: "none" }}>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {unpaidDcs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} align="center" sx={{ py: 6, color: "#9CA3AF" }}>
                                        No unpaid bills found for "{searchQuery}"
                                    </TableCell>
                                </TableRow>
                            ) : (
                                unpaidDcs.map((dc) => (
                                    <TableRow key={dc.id} sx={{
                                        backgroundColor: "#FEF2F2",
                                        "&:hover": { backgroundColor: "#FEE2E2" },
                                        transition: "background-color 0.15s"
                                    }}>
                                        <TableCell sx={{ ...tableCellStyle, fontWeight: 700, color: "#1C319F" }}>
                                            {dc.dcNumber}
                                        </TableCell>
                                        <TableCell sx={tableCellStyle}>{dc.dcDate}</TableCell>
                                        <TableCell sx={tableCellStyle}>{dc.customerName || "—"}</TableCell>
                                        <TableCell sx={{ ...tableCellStyle, fontWeight: 700 }}>{dc.vehicleNo}</TableCell>
                                        <TableCell sx={tableCellStyle}>{dc.productName}</TableCell>
                                        <TableCell sx={tableCellStyle}>{dc.netWeight?.toFixed(2) || "—"}</TableCell>
                                        <TableCell sx={tableCellStyle}>
                                            {dc.amount ? `₹${Number(dc.amount).toLocaleString("en-IN")}` : "—"}
                                        </TableCell>
                                        <TableCell sx={tableCellStyle}>
                                            {dc.paidAmount ? `₹${Number(dc.paidAmount).toLocaleString("en-IN")}` : "₹0"}
                                        </TableCell>
                                        <TableCell sx={{ ...tableCellStyle, fontWeight: 700, color: "#EF4444" }}>
                                            {dc.outstandingAmount ? `₹${Number(dc.outstandingAmount).toLocaleString("en-IN")}` : "—"}
                                        </TableCell>
                                        <TableCell sx={{ ...tableCellStyle, borderRight: "none" }}>
                                            <Button
                                                variant="contained" size="small"
                                                onClick={() => openPayDialog(dc)}
                                                sx={{
                                                    background: "#10B981", borderRadius: "8px",
                                                    textTransform: "none", fontWeight: 700, fontSize: "12px",
                                                    "&:hover": { background: "#059669" }
                                                }}
                                            >
                                                Settle
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Payment Dialog */}
            <Dialog open={payDialog} onClose={() => setPayDialog(false)} maxWidth="xs" fullWidth
                PaperProps={{ sx: { borderRadius: "16px" } }}>
                <DialogTitle sx={{ fontWeight: 800, color: "#111827" }}>
                    Settle Payment
                </DialogTitle>
                <DialogContent>
                    {selectedDc && (
                        <Stack spacing={3} sx={{ mt: 1 }}>
                            <Box sx={{ backgroundColor: "#F9FAFB", p: 2, borderRadius: "10px" }}>
                                <Typography sx={{ fontSize: "12px", color: "#6B7280" }}>DC Number</Typography>
                                <Typography sx={{ fontWeight: 700, color: "#111827" }}>{selectedDc.dcNumber}</Typography>
                                <Typography sx={{ fontSize: "12px", color: "#6B7280", mt: 1 }}>
                                    {selectedDc.customerName} • {selectedDc.vehicleNo} • {selectedDc.productName}
                                </Typography>
                            </Box>

                            <FormControl fullWidth size="small">
                                <InputLabel>Payment Method</InputLabel>
                                <Select
                                    value={payMethod}
                                    label="Payment Method"
                                    onChange={(e) => setPayMethod(e.target.value)}
                                    sx={{ borderRadius: "12px" }}
                                >
                                    <MenuItem value="CASH">Cash</MenuItem>
                                    <MenuItem value="UPI">UPI</MenuItem>
                                </Select>
                            </FormControl>

                            <TextField
                                fullWidth size="small" label="Amount (₹)"
                                type="number"
                                value={payAmount}
                                onChange={(e) => setPayAmount(e.target.value)}
                                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                            />
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={() => setPayDialog(false)}
                        sx={{ textTransform: "none", color: "#6B7280" }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained" onClick={handleSettle} disabled={settling}
                        sx={{
                            background: "#10B981", borderRadius: "10px",
                            textTransform: "none", fontWeight: 700, px: 4,
                            "&:hover": { background: "#059669" }
                        }}
                    >
                        {settling ? "Processing..." : "Confirm Payment"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
