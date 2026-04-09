"use client";

import React, { useState, useEffect } from "react";
import {
    Box, Typography, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Button,
    Paper, Stack, TablePagination, Chip, TextField, InputAdornment,
    Select, MenuItem
} from "@mui/material";
import {
    AddOutlined as AddIcon, FileDownloadOutlined as DownloadIcon,
    PrintOutlined as PrintIcon, FilterListOutlined as FilterIcon,
    EditNoteOutlined as EditIcon, SearchOutlined as SearchIcon,
    PaymentsOutlined as PayIcon
} from "@mui/icons-material";
import { palette } from "@/theme";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { dcApi, adminApi } from "@/services/api";
import Cookies from "js-cookie";

const statusConfig = {
    TARE_DONE: { label: "Tare Done", color: "#F59E0B", bg: "#FFFBEB" },
    UNPAID: { label: "Unpaid", color: "#EF4444", bg: "#FEF2F2" },
    COMPLETED: { label: "Completed", color: "#10B981", bg: "#E8FFD9" },
    INVOICED: { label: "Invoiced", color: "#3B82F6", bg: "#EFF6FF" }
};

export default function PosBillingListPage() {
    const router = useRouter();
    const { selectedCompany, selectedBranch } = useApp();
    const userRole = typeof window !== "undefined" ? Cookies.get("role") || "" : "";
    const isAdmin = userRole === "ADMIN" || userRole === "ROLE_ADMIN";

    // ─── Company/Branch context ─────────────────────────────
    const [companyId, setCompanyId] = useState("");
    const [branchId, setBranchId] = useState("");
    const [allCompanies, setAllCompanies] = useState([]);
    const [branches, setBranches] = useState([]);

    const [billingList, setBillingList] = useState([]);
    const [totalElements, setTotalElements] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);

    // ═══ Resolve company/branch ═════════════════════════════
    useEffect(() => {
        if (isAdmin) {
            adminApi.getCompanies(0, 1000).then(res => {
                if (res.success) setAllCompanies(res.data.content || []);
            });
        } else {
            const cId = selectedCompany?.companyId || selectedCompany?.id;
            const bId = selectedBranch?.id || selectedBranch?.branchId || selectedCompany?.branchId;
            if (cId) setCompanyId(cId);
            if (bId) setBranchId(bId);
        }
    }, [isAdmin, selectedCompany, selectedBranch]);

    useEffect(() => {
        if (!companyId) { setBranches([]); return; }
        adminApi.getBranches(companyId).then(res => {
            if (res.success) {
                const list = res.data || [];
                setBranches(list);
                if (list.length > 0 && !branchId) setBranchId(list[0].id);
            }
        }).catch(() => setBranches([]));
    }, [companyId]);

    // ─── Load DCs ───────────────────────────────────────────
    useEffect(() => {
        if (!companyId || !branchId) return;

        const loadDcs = async () => {
            setLoading(true);
            try {
                const res = await dcApi.getAll(page, rowsPerPage, companyId, branchId, null, search);
                if (res.success) {
                    setBillingList(res.data?.content || []);
                    setTotalElements(res.data?.totalElements || 0);
                }
            } catch (e) {
                console.error("Error loading DCs:", e);
            } finally {
                setLoading(false);
            }
        };
        loadDcs();
    }, [companyId, branchId, page, rowsPerPage, search]);

    const handleChangePage = (_, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); };

    const tableCellStyle = {
        fontWeight: 600, fontSize: "12px", color: "#202224",
        borderRight: "1px solid rgba(0,0,0,0.05)",
        textAlign: "center", padding: "12px 8px", whiteSpace: "nowrap"
    };
    const headerCellStyle = {
        ...tableCellStyle, color: "#4B5563", fontWeight: 700,
        backgroundColor: "#FFFFFF", borderBottom: "1px solid #F3F4F6"
    };
    const selectStyle = { borderRadius: "10px", backgroundColor: "#F9FAFB", height: "40px", fontSize: "13px" };

    const customerTypeLabel = (type) => {
        if (type === "GUEST") return "—";
        if (type === "LOCAL") return "Local";
        if (type === "CORPORATE") return "Corporate";
        return type;
    };

    return (
        <Box sx={{ p: 0, backgroundColor: "#F8F9FA", minHeight: "100vh" }}>
            {/* Admin: Company/Branch Picker */}
            {isAdmin && (
                <Box sx={{
                    display: "flex", gap: 2, mb: 2, backgroundColor: "#FFFFFF",
                    p: 2, borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                    alignItems: "center"
                }}>
                    <Typography sx={{ fontSize: "13px", fontWeight: 700, color: "#6B7280", minWidth: 70 }}>
                        Company:
                    </Typography>
                    <Select
                        size="small" value={companyId} displayEmpty
                        onChange={(e) => { setCompanyId(e.target.value); setBranchId(""); setPage(0); }}
                        sx={{ ...selectStyle, width: 220 }}
                    >
                        <MenuItem value="" disabled>Select Company</MenuItem>
                        {allCompanies.map(c => (
                            <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                        ))}
                    </Select>
                    <Typography sx={{ fontSize: "13px", fontWeight: 700, color: "#6B7280", minWidth: 60 }}>
                        Branch:
                    </Typography>
                    <Select
                        size="small" value={branchId} displayEmpty disabled={!companyId}
                        onChange={(e) => { setBranchId(e.target.value); setPage(0); }}
                        sx={{ ...selectStyle, width: 220 }}
                    >
                        <MenuItem value="" disabled>Select Branch</MenuItem>
                        {branches.map(b => (
                            <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                        ))}
                    </Select>
                </Box>
            )}

            {/* Action Bar */}
            <Box sx={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                mb: 3, backgroundColor: "#FFFFFF", p: 2,
                borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.02)"
            }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Button
                        variant="contained"
                        sx={{
                            background: "#1C319F", color: "#FFFFFF",
                            textTransform: "none", borderRadius: "8px", fontWeight: 600, px: 3,
                            "&:hover": { background: "#142375" }
                        }}
                    >
                        POS List
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => router.push("/dashboard/pos/pay-later")}
                        startIcon={<PayIcon />}
                        sx={{
                            background: "#E5E7EB", color: "#6B7280",
                            textTransform: "none", borderRadius: "8px", fontWeight: 600, px: 3,
                            "&:hover": { background: "#D1D5DB" }
                        }}
                    >
                        Pay Later
                    </Button>
                </Stack>

                <Stack direction="row" spacing={1.5} alignItems="center">
                    <TextField
                        size="small" placeholder="Search DC, Vehicle..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start"><SearchIcon sx={{ color: "#9CA3AF", fontSize: 20 }} /></InputAdornment>
                            )
                        }}
                        sx={{
                            width: 220,
                            "& .MuiOutlinedInput-root": { borderRadius: "10px", backgroundColor: "#F9FAFB" }
                        }}
                    />
                    <Button
                        variant="contained" startIcon={<AddIcon />}
                        onClick={() => router.push("/dashboard/pos/new")}
                        sx={{
                            background: "#1C319F", textTransform: "none",
                            borderRadius: "8px", px: 3, fontWeight: 600,
                            "&:hover": { background: "#142375" }
                        }}
                    >
                        New Entry
                    </Button>
                    <IconButton size="small" sx={{ color: "#4B5563" }}><DownloadIcon /></IconButton>
                    <IconButton size="small" sx={{ color: "#4B5563" }}><PrintIcon /></IconButton>
                </Stack>
            </Box>

            {/* Table */}
            <TableContainer component={Paper} sx={{
                boxShadow: "none", borderRadius: "12px",
                border: "1px solid #F3F4F6", mb: 2
            }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={headerCellStyle}>DC Number</TableCell>
                            <TableCell sx={headerCellStyle}>Date</TableCell>
                            <TableCell sx={headerCellStyle}>Type</TableCell>
                            <TableCell sx={headerCellStyle}>Customer</TableCell>
                            <TableCell sx={headerCellStyle}>Vehicle No</TableCell>
                            <TableCell sx={headerCellStyle}>Product</TableCell>
                            <TableCell sx={headerCellStyle}>Tare Wt</TableCell>
                            <TableCell sx={headerCellStyle}>Gross Wt</TableCell>
                            <TableCell sx={headerCellStyle}>Net Wt</TableCell>
                            <TableCell sx={headerCellStyle}>Mode</TableCell>
                            <TableCell sx={headerCellStyle}>Status</TableCell>
                            <TableCell sx={{ ...headerCellStyle, borderRight: "none" }}></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {billingList.length === 0 && !loading && (
                            <TableRow>
                                <TableCell colSpan={12} align="center" sx={{ py: 6, color: "#9CA3AF" }}>
                                    {(!companyId || !branchId) ? "Select a company and branch to view entries." : "No delivery challans found. Click \"New Entry\" to create one."}
                                </TableCell>
                            </TableRow>
                        )}
                        {billingList.map((row) => {
                            const sc = statusConfig[row.status] || statusConfig.TARE_DONE;
                            return (
                                <TableRow
                                    key={row.id}
                                    sx={{
                                        backgroundColor: sc.bg, cursor: "pointer",
                                        "&:hover": { opacity: 0.85 }, transition: "opacity 0.15s"
                                    }}
                                    onClick={() => router.push(`/dashboard/pos/edit/${row.id}`)}
                                >
                                    <TableCell sx={{ ...tableCellStyle, fontWeight: 700, color: "#1C319F" }}>
                                        {row.dcNumber}
                                    </TableCell>
                                    <TableCell sx={tableCellStyle}>{row.dcDate}</TableCell>
                                    <TableCell sx={tableCellStyle}>
                                        <Chip
                                            label={customerTypeLabel(row.customerType)}
                                            size="small"
                                            sx={{
                                                fontWeight: 700, fontSize: "11px",
                                                backgroundColor: row.customerType === "GUEST" ? "#F3F4F6"
                                                    : row.customerType === "LOCAL" ? "#E0F2FE" : "#F3E8FF",
                                                color: row.customerType === "GUEST" ? "#6B7280"
                                                    : row.customerType === "LOCAL" ? "#0369A1" : "#7C3AED"
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell sx={tableCellStyle}>{row.customerName || "—"}</TableCell>
                                    <TableCell sx={{ ...tableCellStyle, fontWeight: 700 }}>{row.vehicleNo}</TableCell>
                                    <TableCell sx={tableCellStyle}>{row.productName}</TableCell>
                                    <TableCell sx={tableCellStyle}>{row.tareWeight?.toFixed(2) || "—"}</TableCell>
                                    <TableCell sx={tableCellStyle}>{row.grossWeight?.toFixed(2) || "—"}</TableCell>
                                    <TableCell sx={{ ...tableCellStyle, fontWeight: 700 }}>
                                        {row.netWeight?.toFixed(2) || "—"}
                                    </TableCell>
                                    <TableCell sx={tableCellStyle}>
                                        <Chip label={row.saleMode} size="small"
                                            sx={{
                                                fontWeight: 700, fontSize: "11px",
                                                backgroundColor: row.saleMode === "POS" ? "#DCFCE7" : "#FEF3C7",
                                                color: row.saleMode === "POS" ? "#166534" : "#92400E"
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell sx={tableCellStyle}>
                                        <Chip label={sc.label} size="small"
                                            sx={{
                                                fontWeight: 700, fontSize: "11px",
                                                backgroundColor: "transparent",
                                                color: sc.color, border: `1px solid ${sc.color}`
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ ...tableCellStyle, borderRight: "none", padding: "4px" }}
                                        onClick={(e) => e.stopPropagation()}>
                                        <Stack spacing={0} direction="row" justifyContent="center">
                                            <IconButton 
                                                size="small" 
                                                sx={{ color: "#1C319F", p: 0.5 }}
                                                onClick={() => router.push(`/dashboard/pos/edit/${row.id}`)}
                                            >
                                                <EditIcon sx={{ fontSize: "18px" }} />
                                            </IconButton>
                                            <IconButton 
                                                size="small" 
                                                sx={{ color: "#4B5563", p: 0.5 }}
                                                onClick={() => router.push(`/dashboard/pos/print/${row.id}`)}
                                            >
                                                <PrintIcon sx={{ fontSize: "13px" }} />
                                            </IconButton>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination
                rowsPerPageOptions={[10, 20, 50]} component="div"
                count={totalElements} rowsPerPage={rowsPerPage} page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{
                    borderTop: "1px solid #F3F4F6", backgroundColor: "#FFFFFF",
                    borderRadius: "12px",
                    ".MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows": {
                        color: "#6B7280", fontWeight: 500
                    }
                }}
            />
        </Box>
    );
}