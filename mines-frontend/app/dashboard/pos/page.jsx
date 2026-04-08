"use client";

import React, { useState } from "react";
import {
    Box, Typography, Card, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Button,
    Paper, Stack, TablePagination
} from "@mui/material";
import {
    AddOutlined as AddIcon, FileDownloadOutlined as DownloadIcon,
    PrintOutlined as PrintIcon, FilterListOutlined as FilterIcon,
    EditNoteOutlined as EditIcon, KeyboardArrowDown as ArrowDownIcon
} from "@mui/icons-material";
import { palette } from "@/theme";
import { useRouter } from "next/navigation";

export default function PosBillingListPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("POS List");

    const [billingList, setBillingList] = useState([]);

    React.useEffect(() => {
        const sampleData = [
            { id: 1, consignorName: "RMK SANDS PVT LTD", billNumber: "FZ010002026040125", posDate: "2026-04-07", partyName: "RV & CO", truckNo: "TN12AM2125", productName: "BLACK M-SAND", salaryType: "UPI", tareWt: "12.03", netWt: "0.0", color: "#E8FFD9" },
            { id: 2, consignorName: "RMK SANDS PVT LTD", billNumber: "FZ010002026040125", posDate: "2026-04-07", partyName: "RV & CO", truckNo: "TN12AM2125", productName: "BLACK M-SAND", salaryType: "Cash", tareWt: "16.01", netWt: "0.0", color: "#FFFBEB" },
            { id: 3, consignorName: "RMK SANDS PVT LTD", billNumber: "FZ010002026040125", posDate: "2026-04-07", partyName: "RV & CO", truckNo: "TN12AM2125", productName: "BLACK M-SAND", salaryType: "Cash", tareWt: "16.01", netWt: "54.03", color: "#E8FFD9" },
            { id: 4, consignorName: "RMK SANDS PVT LTD", billNumber: "FZ010002026040125", posDate: "2026-04-07", partyName: "RV & CO", truckNo: "TN12AM2125", productName: "BLACK M-SAND", salaryType: "Cash", tareWt: "16.01", netWt: "0.0", color: "#FFFBEB" },
            { id: 5, consignorName: "RMK SANDS PVT LTD", billNumber: "FZ010002026040125", posDate: "2026-04-07", partyName: "RV & CO", truckNo: "TN12AM2125", productName: "BLACK M-SAND", salaryType: "Cash", tareWt: "16.01", netWt: "0.0", color: "#E8FFD9" },
            { id: 6, consignorName: "RMK SANDS PVT LTD", billNumber: "FZ010002026040125", posDate: "2026-04-07", partyName: "RV & CO", truckNo: "TN12AM2125", productName: "BLACK M-SAND", salaryType: "Cash", tareWt: "16.01", netWt: "0.0", color: "#FFFBEB" },
            { id: 7, consignorName: "RMK SANDS PVT LTD", billNumber: "FZ010002026040125", posDate: "2026-04-07", partyName: "RV & CO", truckNo: "TN12AM2125", productName: "BLACK M-SAND", salaryType: "Cash", tareWt: "16.01", netWt: "0.0", color: "#E8FFD9" },
        ];
        const savedDrafts = JSON.parse(localStorage.getItem("pos_drafts") || "[]");
        setBillingList([...savedDrafts, ...sampleData]);
    }, []);

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const paginatedList = billingList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    const tableCellStyle = {
        fontWeight: 700,
        fontSize: "12px",
        color: "#202224",
        borderRight: "1px solid rgba(0,0,0,0.05)",
        textAlign: "center",
        padding: "12px 8px",
        whiteSpace: "nowrap"
    };

    const headerCellStyle = {
        ...tableCellStyle,
        color: "#4B5563",
        fontWeight: 600,
        backgroundColor: "#FFFFFF",
        borderBottom: "1px solid #F3F4F6"
    };

    return (
        <Box sx={{ p: 0, backgroundColor: "#F8F9FA", minHeight: "100vh" }}>
            {/* Action Bar */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
                backgroundColor: "#FFFFFF",
                p: 2,
                borderRadius: "12px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.02)"
            }}>
                <Stack direction="row" spacing={2}>
                    <Button
                        variant="contained"
                        onClick={() => setActiveTab("POS List")}
                        sx={{
                            background: activeTab === "POS List" ? "#1C319F" : "#E5E7EB",
                            color: activeTab === "POS List" ? "#FFFFFF" : "#6B7280",
                            textTransform: "none",
                            borderRadius: "8px",
                            fontWeight: 600,
                            px: 3,
                            "&:hover": { background: activeTab === "POS List" ? "#142375" : "#D1D5DB" }
                        }}
                    >
                        POS List
                    </Button>
                    {/* <Button
                        variant="contained"
                        onClick={() => setActiveTab("Unsettled POS List")}
                        sx={{
                            backgroundColor: activeTab === "Unsettled POS List" ? "#2D3FE2" : "#E5E7EB",
                            color: activeTab === "Unsettled POS List" ? "#FFFFFF" : "#6B7280",
                            textTransform: "none",
                            borderRadius: "8px",
                            fontWeight: 600,
                            px: 3,
                            "&:hover": { backgroundColor: activeTab === "Unsettled POS List" ? "#1E2BB8" : "#D1D5DB" }
                        }}
                    >
                        Unsettled POS List
                    </Button> */}
                </Stack>

                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => router.push("/dashboard/pos/new")}
                        sx={{
                            background: "#1C319F",
                            textTransform: "none",
                            borderRadius: "8px",
                            px: 3,
                            fontWeight: 600,
                            "&:hover": { background: "#142375" }
                        }}
                    >
                        New Entry
                    </Button>
                    <IconButton size="small" sx={{ color: "#4B5563" }}><DownloadIcon /></IconButton>
                    <IconButton size="small" sx={{ color: "#4B5563" }}><PrintIcon /></IconButton>
                    <IconButton size="small" sx={{ color: "#4B5563" }}><FilterIcon /></IconButton>
                </Stack>
            </Box>

            {/* Table Area */}
            <TableContainer component={Paper} sx={{ boxShadow: "none", borderRadius: "12px", border: "1px solid #F3F4F6", mb: 2 }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={headerCellStyle}>Consignor Name</TableCell>
                            <TableCell sx={headerCellStyle}>Bill Number</TableCell>
                            <TableCell sx={headerCellStyle}>POS Date</TableCell>
                            <TableCell sx={headerCellStyle}>Party Name</TableCell>
                            <TableCell sx={headerCellStyle}>Truck No</TableCell>
                            <TableCell sx={headerCellStyle}>Product Name</TableCell>
                            <TableCell sx={headerCellStyle}>Salary Type</TableCell>
                            <TableCell sx={headerCellStyle}>Tare Wt</TableCell>
                            <TableCell sx={headerCellStyle}>Net Wt</TableCell>
                            <TableCell sx={{ ...headerCellStyle, borderRight: "none" }}></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedList.map((row) => (
                            <TableRow
                                key={row.id}
                                sx={{
                                    backgroundColor: row.color,
                                    cursor: 'pointer',
                                    '&:hover': { opacity: 0.8 }
                                }}
                                onClick={() => router.push(`/dashboard/pos/edit/${row.id}`)}
                            >
                                <TableCell sx={tableCellStyle}>{row.consignorName}</TableCell>
                                <TableCell sx={tableCellStyle}>{row.billNumber}</TableCell>
                                <TableCell sx={tableCellStyle}>{row.posDate}</TableCell>
                                <TableCell sx={tableCellStyle}>{row.partyName}</TableCell>
                                <TableCell sx={tableCellStyle}>{row.truckNo}</TableCell>
                                <TableCell sx={tableCellStyle}>{row.productName}</TableCell>
                                <TableCell sx={tableCellStyle}>{row.salaryType}</TableCell>
                                <TableCell sx={tableCellStyle}>{row.tareWt}</TableCell>
                                <TableCell sx={tableCellStyle}>{row.netWt}</TableCell>
                                <TableCell sx={{ ...tableCellStyle, borderRight: "none", padding: "4px" }} onClick={(e) => e.stopPropagation()}>
                                    <Stack spacing={0}>
                                        <IconButton size="small" sx={{ color: "#4B5563", p: 0.5 }}><EditIcon sx={{ fontSize: "18px" }} /></IconButton>
                                        <IconButton size="small" sx={{ color: "#4B5563", p: 0.5 }}><PrintIcon sx={{ fontSize: "13px" }} /></IconButton>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={billingList.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{
                    borderTop: "1px solid #F3F4F6",
                    backgroundColor: "#FFFFFF",
                    borderRadius: "12px",
                    ".MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows": { color: "#6B7280", fontWeight: 500 }
                }}
            />
        </Box>
    );
}