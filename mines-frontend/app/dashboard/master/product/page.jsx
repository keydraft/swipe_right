"use client";

import React, { useState, useEffect } from "react";
import {
    Box, Typography, Card, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Button,
    TextField, InputAdornment, Tooltip, Dialog, DialogContent,
    Select, MenuItem, Switch, FormControlLabel, TablePagination, CircularProgress, Grid, Divider, Snackbar, Alert
} from "@mui/material";
import {
    SearchOutlined as SearchIcon, AddOutlined as AddIcon, FileDownloadOutlined as DownloadIcon,
    PrintOutlined as PrintIcon, SortOutlined as SortIcon, VisibilityOutlined as ViewIcon,
    EditOutlined as EditIcon, DeleteOutline as DeleteIcon, Close as CloseIcon
} from "@mui/icons-material";
import { palette } from "@/theme";
import { productApi, adminApi } from "@/services/api";
import { useFormik } from "formik";
import * as Yup from "yup";
import Cookies from "js-cookie";

export default function ProductPage() {
    const userRole = typeof window !== 'undefined' ? Cookies.get("role") || "" : "";
    const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem("user") || "{}") : {};
    const associations = user.companies || [];
    const defaultCompanyId = associations.length > 0 ? associations[0].companyId : "";
    const defaultBranchId = associations.length > 0 ? associations[0].branchId : "";

    const [searchQuery, setSearchQuery] = useState("");
    const [openModal, setOpenModal] = useState(false);
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);

    // View Details State
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    // Pagination State
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalElements, setTotalElements] = useState(0);

    // Notification State
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
    const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

    // Delete Confirmation State
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);

    const initialValues = {
        name: "",
        shortName: "",
        hsnc: "",
        gst: "0",
        rmType: "",
        status: "Active",
        companyId: "",
        branchPrices: []
    };

    const validationSchema = Yup.object({
        name: Yup.string().required("Product name is required"),
        shortName: Yup.string().required("Short name is required"),
        hsnc: Yup.string().required("HSN Code is required"),
        gst: Yup.number().typeError("GST must be a number").min(0).max(100).required("GST is required"),
        rmType: Yup.string().required("RM Type is required"),
        companyId: Yup.string().required("Company is required")
    });

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            await fetchProducts();

            if (userRole === 'ROLE_ADMIN' || userRole === 'ADMIN') {
                const companyResp = await adminApi.getCompanies(0, 500); // Get companies for branch info
                if (companyResp.success) {
                    localStorage.setItem("companies", JSON.stringify(companyResp.data.content));
                }
            }
        } catch (error) {
            console.error("Error fetching initial product data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await productApi.getAll(page, rowsPerPage, searchQuery);
            if (response.success) {
                setProducts(response.data.content);
                setTotalElements(response.data.totalElements);
            }
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchProducts();
        }, 300);
        return () => clearTimeout(timer);
    }, [page, rowsPerPage, searchQuery]);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const formik = useFormik({
        initialValues,
        validationSchema,
        onSubmit: async (values) => {
            const payload = {
                name: values.name,
                shortName: values.shortName,
                hsnCode: values.hsnc,
                gstPercentage: parseFloat(values.gst),
                rmType: values.rmType || "CRUSHER",
                active: values.status === "Active",
                companyId: values.companyId,
                prices: values.branchPrices.map(p => ({
                    branchId: p.branchId,
                    rate: parseFloat(p.rate)
                }))
            };

            try {
                const response = await productApi.upsert(payload, isEditing ? editingId : null);
                if (response.success) {
                    setShowSuccess(true);
                    setTimeout(() => {
                        handleCloseModal();
                        fetchProducts();
                    }, 2000);
                }
            } catch (error) {
                console.error("Error saving product:", error);
            }
        },
    });

    const handleOpenModal = () => {
        let initialBranchPrices = [];
        let initialCompanyId = "";

        if (userRole === 'ROLE_ADMIN' || userRole === 'ADMIN') {
            const savedCompanies = localStorage.getItem("companies");
            if (savedCompanies) {
                const companies = JSON.parse(savedCompanies);
                initialCompanyId = companies.length > 0 ? companies[0].id : "";
                if (initialCompanyId) {
                    const comp = companies.find(c => c.id === initialCompanyId);
                    if (comp) {
                        initialBranchPrices = (comp.branches || []).map(b => ({
                            branchId: b.id,
                            branchName: b.name,
                            rate: "0",
                            companyId: comp.id
                        }));
                    }
                }
            }
        } else {
            // Non-admin roles (MANAGER, SITEOPERATOR, etc.)
            if (associations.length > 0) {
                initialCompanyId = defaultCompanyId;
                initialBranchPrices = associations
                    .filter(assoc => assoc.branchId) // Only show specific assigned branches
                    .map(assoc => ({
                        branchId: assoc.branchId,
                        branchName: assoc.branchName,
                        rate: "0",
                        companyId: assoc.companyId
                    }));
            }
        }

        formik.setValues({ ...initialValues, companyId: initialCompanyId, branchPrices: initialBranchPrices });
        setIsEditing(false);
        setEditingId(null);
        setOpenModal(true);
        setShowSuccess(false);
    };

    const handleEditProduct = (product) => {
        let initialBranchPrices = [];
        const prodCompanyId = product.companyId || "";

        if (userRole === 'ROLE_ADMIN' || userRole === 'ADMIN') {
            const savedCompanies = localStorage.getItem("companies");
            if (savedCompanies && prodCompanyId) {
                const companies = JSON.parse(savedCompanies);
                const comp = companies.find(c => c.id === prodCompanyId);
                if (comp) {
                    initialBranchPrices = (comp.branches || []).map(b => {
                        const existing = (product.prices || []).find(p => p.branchId === b.id);
                        return {
                            branchId: b.id,
                            branchName: b.name,
                            rate: existing ? existing.rate.toString() : "0",
                            companyId: comp.id
                        };
                    });
                }
            }
        } else {
            // For non-admins, only show branches assigned to them
            initialBranchPrices = associations
                .filter(assoc => assoc.branchId && assoc.companyId === prodCompanyId)
                .map(assoc => {
                    const existing = (product.prices || []).find(p => p.branchId === assoc.branchId);
                    return {
                        branchId: assoc.branchId,
                        branchName: assoc.branchName,
                        rate: existing ? existing.rate.toString() : "0",
                        companyId: assoc.companyId
                    };
                });
        }

        formik.setValues({
            name: product.name || "",
            shortName: product.shortName || "",
            hsnc: product.hsnCode || "",
            gst: product.gstPercentage?.toString() || "0",
            rmType: product.rmType || "",
            status: product.active ? "Active" : "Inactive",
            companyId: prodCompanyId,
            branchPrices: initialBranchPrices
        });
        setIsEditing(true);
        setEditingId(product.id);
        setOpenModal(true);
        setShowSuccess(false);
    };

    const handleViewProduct = (product) => {
        setSelectedProduct(product);
        setViewModalOpen(true);
    };

    const handleDeleteClick = (id) => {
        setDeleteTargetId(id);
        setDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        try {
            const response = await productApi.delete(deleteTargetId);
            if (response.success) {
                setSnackbar({ open: true, message: "Product deleted successfully", severity: "success" });
                fetchProducts();
            } else {
                setSnackbar({ open: true, message: response.message || "Failed to delete product", severity: "error" });
            }
        } catch (error) {
            setSnackbar({ open: true, message: "An error occurred while deleting", severity: "error" });
        } finally {
            setDeleteConfirmOpen(false);
            setDeleteTargetId(null);
        }
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        formik.resetForm();
    };

    const renderField = (label, placeholder, isSelect = false, type = "text", field = "", options = []) => {
        const value = formik.values[field];
        const error = formik.touched[field] && formik.errors[field];

        return (
            <Box sx={{ width: '100%', mb: 1.5 }}>
                <Typography sx={{ fontSize: '13px', color: '#374151', mb: 0.8, fontWeight: 600 }}>{label}</Typography>
                <TextField
                    fullWidth
                    size="small"
                    name={field}
                    type={type}
                    select={isSelect}
                    placeholder={placeholder}
                    variant="outlined"
                    value={value || ""}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={!!error}
                    helperText={error}
                    FormHelperTextProps={{ sx: { ml: 0, mt: 0.5, fontSize: '11px', fontWeight: 500 } }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                            backgroundColor: '#F8FAFC',
                            transition: 'all 0.2s',
                            '& fieldset': { borderColor: '#E5E7EB' },
                            '&:hover fieldset': { borderColor: '#CBD5E1' },
                            '&.Mui-focused fieldset': { borderColor: '#0057FF', borderWidth: '1.5px' }
                        }
                    }}
                >
                    {isSelect && options.map((opt, i) => (
                        <MenuItem key={i} value={opt.value}>
                            {opt.label}
                        </MenuItem>
                    ))}
                </TextField>
            </Box>
        );
    };

    return (
        <Box sx={{ animation: "fadeIn 0.5s ease-out" }}>
            {/* Header Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h3" sx={{ fontWeight: 900, color: palette.text.secondary }}>
                    Product
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenModal}
                    sx={{
                        background: 'linear-gradient(135deg, #0057FF 0%, #003499 100%)',
                        textTransform: 'none',
                        fontWeight: 600,
                        height: '36px',
                        borderRadius: '4px'
                    }}
                >
                    New Product
                </Button>
            </Box>

            {/* Toolbar Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <TextField
                    variant="outlined"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setPage(0);
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: palette.text.secondary }} />
                            </InputAdornment>
                        ),
                        sx: {
                            borderRadius: '15px',
                            backgroundColor: palette.background.default,
                            width: '300px',
                            height: '40px'
                        }
                    }}
                />

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Download">
                        <IconButton sx={{ backgroundColor: palette.background.default, border: `1px solid ${palette.divider}`, borderRadius: '8px' }}>
                            <DownloadIcon sx={{ color: palette.text.secondary }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Print">
                        <IconButton sx={{ backgroundColor: palette.background.default, border: `1px solid ${palette.divider}`, borderRadius: '8px' }}>
                            <PrintIcon sx={{ color: palette.text.secondary }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Sort">
                        <IconButton sx={{ backgroundColor: palette.background.default, border: `1px solid ${palette.divider}`, borderRadius: '8px' }}>
                            <SortIcon sx={{ color: palette.text.secondary }} />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* Table Section */}
            <Card sx={{
                borderRadius: "16px",
                boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
                border: `1px solid ${palette.divider}`,
                overflow: 'hidden'
            }}>
                <TableContainer>
                    <Table>
                        <TableHead sx={{ backgroundColor: palette.background.paper }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>Product Name</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>Short Name</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>HSNC</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>GST %</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600, color: palette.text.primary }}>Status</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600, color: palette.text.primary }}>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}><CircularProgress size={24} /></TableCell></TableRow>
                            ) : products.length === 0 ? (
                                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}><Typography color="textSecondary">No products found</Typography></TableCell></TableRow>
                            ) : products.map((p) => (
                                <TableRow key={p.id} sx={{ '&:hover': { backgroundColor: palette.background.paper } }}>
                                    <TableCell sx={{ fontWeight: 600 }}>{p.name}</TableCell>
                                    <TableCell>{p.shortName}</TableCell>
                                    <TableCell>{p.hsnCode}</TableCell>
                                    <TableCell>{p.gstPercentage}%</TableCell>
                                    <TableCell align="center">
                                        <Box sx={{
                                            display: 'inline-flex', px: 1.5, py: 0.5, borderRadius: '6px',
                                            fontSize: '11px', fontWeight: 800,
                                            backgroundColor: p.active ? '#ECFDF5' : '#FEF2F2',
                                            color: p.active ? '#059669' : '#DC2626'
                                        }}>
                                            {p.active ? 'Active' : 'Inactive'}
                                        </Box>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                            <Tooltip title="View">
                                                <IconButton onClick={() => handleViewProduct(p)} sx={{ color: palette.primary.main }} size="small"><ViewIcon fontSize="small" /></IconButton>
                                            </Tooltip>
                                            <Tooltip title="Edit">
                                                <IconButton onClick={() => handleEditProduct(p)} sx={{ color: '#0057FF' }} size="small"><EditIcon fontSize="small" /></IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton onClick={() => handleDeleteClick(p.id)} sx={{ color: '#EF4444' }} size="small"><DeleteIcon fontSize="small" /></IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={totalElements}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    sx={{
                        borderTop: `1px solid rgba(0,0,0,0.04)`,
                        '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                            fontSize: '13px',
                            color: 'text.secondary',
                            fontWeight: 500
                        },
                    }}
                />
            </Card>

            {/* Modal Section */}
            <Dialog
                open={openModal}
                onClose={handleCloseModal}
                maxWidth="md"
                fullWidth
                sx={{
                    '& .MuiDialog-container': {
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginLeft: { md: '280px' },
                        width: { md: 'calc(100% - 280px)' }
                    },
                    '& .MuiBackdrop-root': {
                        marginLeft: { md: '280px' }
                    }
                }}
                PaperProps={{
                    sx: {
                        borderRadius: '24px',
                        padding: '16px',
                        backgroundColor: showSuccess ? '#2D3FE2' : '#F8FAFC',
                        transition: 'background-color 0.3s'
                    }
                }}
            >
                <DialogContent sx={{
                    minHeight: '400px',
                    '&::-webkit-scrollbar': { display: 'none' },
                    msOverflowStyle: 'none',
                    scrollbarWidth: 'none',
                    p: { xs: 2, sm: 4 }
                }}>
                    <Box sx={{
                        backgroundColor: showSuccess ? 'transparent' : '#fff',
                        borderRadius: '16px',
                        p: showSuccess ? 0 : { xs: 3, sm: 6 },
                        boxShadow: showSuccess ? 'none' : '0px 2px 12px rgba(0,0,0,0.03)',
                        width: '100%',
                    }}>
                        {showSuccess ? (
                            <Box sx={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                py: 6, textAlign: 'center', color: '#fff', minHeight: '260px'
                            }}>
                                <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, fontSize: '32px' }}>Product Processed</Typography>
                                <Typography variant="body1" sx={{ opacity: 0.9 }}>The product record has been saved successfully</Typography>
                            </Box>
                        ) : (
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                                        <Typography variant="h4" sx={{ fontWeight: 900, fontSize: '24px', background: 'linear-gradient(to right, #111827, #374151)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                            {isEditing ? "Edit Product" : "New Product"}
                                        </Typography>
                                        <IconButton onClick={handleCloseModal} sx={{ color: '#64748B' }}><CloseIcon /></IconButton>
                                    </Box>

                                    <form onSubmit={formik.handleSubmit}>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: "10px 20px" }}>
                                            {/* Basic Information */}
                                            <Box sx={{ width: '100%', mb: 1 }}><Typography sx={{ fontWeight: 800, fontSize: '16px', color: '#111827' }}>General Information</Typography></Box>
                                            
                                            <Box sx={{ width: 'calc(50% - 10px)' }}>{renderField("Product Name *", "Enter product name", false, "text", "name")}</Box>
                                            <Box sx={{ width: 'calc(50% - 10px)' }}>{renderField("Short Name *", "Enter short name", false, "text", "shortName")}</Box>
                                            <Box sx={{ width: 'calc(50% - 10px)' }}>{renderField("HSN Code *", "Enter HSN code", false, "text", "hsnc")}</Box>
                                            <Box sx={{ width: 'calc(50% - 10px)' }}>{renderField("GST Percentage *", "Enter GST %", false, "number", "gst")}</Box>
                                            <Box sx={{ width: 'calc(50% - 10px)' }}>
                                                {renderField("RM Type *", "Select type", true, "text", "rmType", [
                                                    { label: "CRUSHER", value: "CRUSHER" },
                                                    { label: "QUARRY", value: "QUARRY" },
                                                    { label: "BY PRODUCT", value: "BY_PRODUCT" }
                                                ])}
                                            </Box>
                                            <Box sx={{ width: 'calc(50% - 10px)' }}>
                                                {renderField("Status *", "Select status", true, "text", "status", [
                                                    { label: "Active", value: "Active" },
                                                    { label: "Inactive", value: "Inactive" }
                                                ])}
                                            </Box>

                                            {/* Company & Branch Pricing */}
                                            <Box sx={{ width: '100%', mt: 2, mb: 1 }}><Typography sx={{ fontWeight: 800, fontSize: '16px', color: '#111827' }}>Pricing & Branch Control</Typography></Box>
                                            
                                            {(userRole === 'ROLE_ADMIN' || userRole === 'ADMIN') && (
                                                <Box sx={{ width: '100%', mb: 2 }}>
                                                    <Typography sx={{ fontSize: '13px', color: '#374151', mb: 0.8, fontWeight: 600 }}>Company *</Typography>
                                                    <TextField
                                                        fullWidth size="small"
                                                        select
                                                        name="companyId"
                                                        value={formik.values.companyId}
                                                        onChange={(e) => {
                                                            formik.handleChange(e);
                                                            const savedCompanies = localStorage.getItem("companies");
                                                            if (savedCompanies) {
                                                                const companies = JSON.parse(savedCompanies);
                                                                const comp = companies.find(c => c.id === e.target.value);
                                                                if (comp) {
                                                                    const newPrices = (comp.branches || []).map(b => ({
                                                                        branchId: b.id, branchName: b.name, rate: "0", companyId: comp.id
                                                                    }));
                                                                    formik.setFieldValue("branchPrices", newPrices);
                                                                }
                                                            }
                                                        }}
                                                        disabled={isEditing}
                                                        variant="outlined"
                                                        sx={{
                                                            '& .MuiOutlinedInput-root': { borderRadius: '12px', backgroundColor: '#F8FAFC' }
                                                        }}
                                                    >
                                                        <MenuItem value="" disabled>Select Company to load branches</MenuItem>
                                                        {(typeof window !== 'undefined' ? JSON.parse(localStorage.getItem("companies") || "[]") : []).map(c => (
                                                            <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                                                        ))}
                                                    </TextField>
                                                </Box>
                                            )}

                                            {formik.values.branchPrices.length > 0 && (
                                                <TableContainer component={Box} sx={{ 
                                                    width: '100%', 
                                                    mt: 1, 
                                                    border: '1px solid #E5E7EB', 
                                                    borderRadius: '16px', 
                                                    overflow: 'hidden',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                                                }}>
                                                    <Table size="small">
                                                        <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
                                                            <TableRow>
                                                                <TableCell sx={{ fontWeight: 800, fontSize: '12px', color: '#6B7280', textTransform: 'uppercase', py: 1.5 }}>Branch Name</TableCell>
                                                                <TableCell sx={{ fontWeight: 800, fontSize: '12px', color: '#6B7280', textTransform: 'uppercase', py: 1.5, width: '220px' }} align="right">Price (₹)</TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {formik.values.branchPrices.map((bp, idx) => (
                                                                <TableRow key={idx} sx={{ '&:hover': { backgroundColor: '#F9FAFB' } }}>
                                                                    <TableCell sx={{ fontWeight: 600, color: '#374151', borderBottom: '1px solid #F3F4FB' }}>{bp.branchName}</TableCell>
                                                                    <TableCell sx={{ borderBottom: '1px solid #F3F4FB' }} align="right">
                                                                        <TextField
                                                                            size="small"
                                                                            type="number"
                                                                            placeholder="0"
                                                                            value={bp.rate}
                                                                            onChange={(e) => {
                                                                                const newPrices = [...formik.values.branchPrices];
                                                                                newPrices[idx].rate = e.target.value;
                                                                                formik.setFieldValue("branchPrices", newPrices);
                                                                            }}
                                                                            InputProps={{
                                                                                startAdornment: <InputAdornment position="start"><Typography sx={{ fontWeight: 700, fontSize: '14px', color: '#94A3B8' }}>₹</Typography></InputAdornment>,
                                                                            }}
                                                                            sx={{ 
                                                                                width: '160px',
                                                                                '& .MuiOutlinedInput-root': { 
                                                                                    borderRadius: '10px', 
                                                                                    backgroundColor: '#fff',
                                                                                    '& fieldset': { borderColor: '#E5E7EB' }
                                                                                } 
                                                                            }}
                                                                        />
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>
                                            )}
                                        </Box>

                                        <Box sx={{ mt: 6, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                            <Button onClick={handleCloseModal} sx={{ color: '#64748B', fontWeight: 700, textTransform: 'none', fontSize: '15px' }}>Cancel</Button>
                                            <Button
                                                type="submit"
                                                variant="contained"
                                                sx={{
                                                    background: 'linear-gradient(135deg, #0057FF 0%, #003499 100%)',
                                                    borderRadius: '12px', px: 4, py: 1.2, fontWeight: 700, textTransform: 'none',
                                                    boxShadow: '0 4px 12px rgba(0, 87, 255, 0.25)'
                                                }}
                                            >
                                                {isEditing ? "Update Product" : "Save Product"}
                                            </Button>
                                        </Box>
                                    </form>
                                </Box>
                        )}
                    </Box>
                </DialogContent>
            </Dialog>

            {/* View Product Details Modal */}
            <Dialog
                open={viewModalOpen}
                onClose={() => setViewModalOpen(false)}
                maxWidth="md"
                fullWidth
                sx={{
                    '& .MuiDialog-container': {
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginLeft: { md: '280px' },
                        width: { md: 'calc(100% - 280px)' }
                    },
                    '& .MuiBackdrop-root': {
                        marginLeft: { md: '280px' }
                    }
                }}
                PaperProps={{
                    sx: {
                        borderRadius: '24px',
                        padding: '16px',
                        backgroundColor: '#F8FAFC'
                    }
                }}
            >
                <DialogContent sx={{ p: { xs: 2, sm: 4 } }}>
                    {selectedProduct && (
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Box>
                                    <Typography variant="h4" sx={{ fontWeight: 900, color: '#111827' }}>
                                        {selectedProduct.name}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.5 }}>
                                        Short Name: {selectedProduct.shortName} | HSN: {selectedProduct.hsnCode}
                                    </Typography>
                                </Box>
                                <Box sx={{
                                    px: 2, py: 1, borderRadius: '12px',
                                    backgroundColor: selectedProduct.active ? '#EBFDF5' : '#FEF2F2',
                                    color: selectedProduct.active ? '#10B981' : '#EF4444',
                                    fontWeight: 700, fontSize: '13px'
                                }}>
                                    {selectedProduct.active ? 'ACTIVE' : 'INACTIVE'}
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                                <Card sx={{ flex: '1 1 100%', borderRadius: '16px', p: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
                                    <Typography sx={{ fontWeight: 800, fontSize: '16px', color: '#111827', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 4, height: 16, backgroundColor: '#2D3FE2', borderRadius: 2 }} />
                                        Basic Information
                                    </Typography>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
                                        <DetailItem label="Full Name" value={selectedProduct.name} />
                                        <DetailItem label="Short Name" value={selectedProduct.shortName} />
                                        <DetailItem label="HSN Code" value={selectedProduct.hsnCode} />
                                        <DetailItem label="GST Percentage" value={`${selectedProduct.gstPercentage}%`} />
                                        <DetailItem label="RM Type" value={selectedProduct.rmType} />
                                        <DetailItem label="Status" value={selectedProduct.active ? "Active" : "Inactive"} />
                                    </Box>
                                </Card>

                                <Card sx={{ flex: '1 1 100%', borderRadius: '16px', p: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
                                    <Typography sx={{ fontWeight: 800, fontSize: '16px', color: '#111827', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 4, height: 16, backgroundColor: '#10B981', borderRadius: 2 }} />
                                        Plant Pricing List
                                    </Typography>
                                    <TableContainer component={Box} sx={{ mt: 1, border: '1px solid #E5E7EB', borderRadius: '16px', overflow: 'hidden' }}>
                                        <Table size="small">
                                            <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 800, fontSize: '12px', color: '#6B7280', textTransform: 'uppercase', py: 1.5 }}>Branch Name</TableCell>
                                                    <TableCell sx={{ fontWeight: 800, fontSize: '12px', color: '#6B7280', textTransform: 'uppercase', py: 1.5 }} align="right">Price (₹)</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {(selectedProduct.prices || []).map((price, idx) => (
                                                    <TableRow key={idx} sx={{ '&:hover': { backgroundColor: '#F9FAFB' } }}>
                                                        <TableCell sx={{ fontWeight: 600, color: '#374151', borderBottom: '1px solid #F3F4FB' }}>{price.branchName || "Branch"}</TableCell>
                                                        <TableCell sx={{ borderBottom: '1px solid #F3F4FB', fontWeight: 800, color: '#0057FF' }} align="right">
                                                            ₹{price.rate?.toLocaleString()}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Card>
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                                <Button
                                    onClick={() => setViewModalOpen(false)}
                                    variant="contained"
                                    sx={{
                                        borderRadius: '12px', px: 6, py: 1.2,
                                        textTransform: 'none', fontWeight: 700,
                                        backgroundColor: '#111827',
                                        '&:hover': { backgroundColor: '#000' }
                                    }}
                                >
                                    Close
                                </Button>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>

            {/* Notification Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%', borderRadius: '12px', fontWeight: 600 }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
                sx={{
                    '& .MuiDialog-container': { alignItems: 'center', justifyContent: 'center', marginLeft: { md: '280px' }, width: { md: 'calc(100% - 280px)' } },
                    '& .MuiBackdrop-root': { marginLeft: { md: '280px' } }
                }}
                PaperProps={{ sx: { borderRadius: '24px', padding: '16px', maxWidth: '400px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' } }}
            >
                <DialogContent>
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                        <Box sx={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: '#FEF2F2', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto', mb: 3 }}>
                            <DeleteIcon sx={{ fontSize: '32px', color: '#EF4444' }} />
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: '#111827' }}>Delete Product</Typography>
                        <Typography variant="body2" sx={{ color: '#6B7280', mb: 4, lineHeight: 1.6 }}>Are you sure you want to delete this product? This action cannot be undone and the record will be permanently removed.</Typography>
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                            <Button
                                onClick={() => setDeleteConfirmOpen(false)}
                                variant="outlined"
                                sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, color: '#6B7280', px: 4, py: 1, border: '1px solid #E5E7EB', '&:hover': { backgroundColor: '#F9FAFB' } }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleConfirmDelete}
                                variant="contained"
                                sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, backgroundColor: '#EF4444', px: 4, py: 1, '&:hover': { backgroundColor: '#DC2626' }, boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' }}
                            >
                                Delete
                            </Button>
                        </Box>
                    </Box>
                </DialogContent>
            </Dialog>
        </Box>
    );
}

// Helper Components for the View Modal
const DetailItem = ({ label, value }) => (
    <Box>
        <Typography sx={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', mb: 0.5 }}>
            {label}
        </Typography>
        <Typography sx={{ fontSize: '14px', color: '#374151', fontWeight: 600 }}>
            {value || "—"}
        </Typography>
    </Box>
);
