"use client";

import React, { useState, useEffect } from "react";
import {
    Box, Typography, Card, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Button,
    TextField, InputAdornment, Tooltip, Dialog, DialogContent,
    Select, MenuItem, Switch, FormControlLabel, TablePagination, CircularProgress, Grid, Divider
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

export default function ProductPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [openModal, setOpenModal] = useState(false);
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);

    // Pagination State
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalElements, setTotalElements] = useState(0);
    
    const initialValues = {
        name: "",
        shortName: "",
        hsnc: "",
        gst: "0",
        rmType: "",
        status: "Active",
        branchPrices: []
    };

    const validationSchema = Yup.object({
        name: Yup.string().required("Product name is required"),
        shortName: Yup.string().required("Short name is required"),
        hsnc: Yup.string().required("HSN Code is required"),
        gst: Yup.number().typeError("GST must be a number").required("GST is required"),
        rmType: Yup.string().required("RM Type is required"),
    });

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            await fetchProducts();
            
            const companyResp = await adminApi.getCompanies(0, 500); // Get companies for branch info
            if (companyResp.success) {
                  localStorage.setItem("companies", JSON.stringify(companyResp.data.content));
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
            const branchPrices = values.branchPrices || [];
            const companyId = branchPrices[0]?.companyId;
            
            const payload = {
                name: values.name,
                shortName: values.shortName,
                hsnCode: values.hsnc,
                gstPercentage: parseFloat(values.gst),
                rmType: values.rmType || "CRUSHER",
                active: values.status === "Active",
                companyId: companyId,
                prices: branchPrices.map(p => ({
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

    const handleOpenModal = async () => {
        let availableBranches = [];
        const savedCompanies = localStorage.getItem("companies");
        if (savedCompanies) {
            const companies = JSON.parse(savedCompanies);
            availableBranches = companies.flatMap(c => (c.branches || []).map(b => ({
                id: b.id,
                name: b.name,
                companyId: c.id
            })));
        }

        const initialBranchPrices = availableBranches.map(branch => ({
            branchId: branch.id,
            branchName: branch.name,
            rate: "0",
            companyId: branch.companyId
        }));

        formik.setValues({ ...initialValues, branchPrices: initialBranchPrices });
        setIsEditing(false);
        setEditingId(null);
        setOpenModal(true);
        setShowSuccess(false);
    };

    const handleEditProduct = async (product) => {
        let currentBranches = [];
        const savedCompanies = localStorage.getItem("companies");
        if (savedCompanies) {
            const companies = JSON.parse(savedCompanies);
            currentBranches = companies.flatMap(c => (c.branches || []).map(b => ({
                id: b.id,
                name: b.name,
                companyId: c.id
            })));
        }

        const mergedPlantPrices = currentBranches.map(branch => {
            const existing = (product.prices || []).find(p => p.branchId === branch.id);
            return {
                branchId: branch.id,
                branchName: branch.name,
                rate: existing ? existing.rate.toString() : "0",
                companyId: branch.companyId
            };
        });

        formik.setValues({
            name: product.name || "",
            shortName: product.shortName || "",
            hsnc: product.hsnCode || "",
            gst: product.gstPercentage?.toString() || "0",
            rmType: product.rmType || "",
            status: product.active ? "Active" : "Inactive",
            branchPrices: mergedPlantPrices
        });
        setIsEditing(true);
        setEditingId(product.id);
        setOpenModal(true);
        setShowSuccess(false);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        formik.resetForm();
    };

    const renderField = (label, placeholder, isSelect = false, type = "text", field = "", options = []) => {
        const value = formik.values[field];
        const error = formik.touched[field] && formik.errors[field];

        return (
            <Box sx={{ width: '100%' }}>
                <Typography sx={{ fontSize: '13px', color: '#374151', mb: 0.8, fontWeight: 600 }}>{label}</Typography>
                {isSelect ? (
                    <Select
                        fullWidth size="small"
                        name={field}
                        value={value}
                        onChange={formik.handleChange}
                        displayEmpty
                        sx={{ borderRadius: '12px', backgroundColor: '#F9FAFB', border: '1px solid #F3F4F6', '& .MuiSelect-select': { color: value ? '#111827' : '#9CA3AF' }, '& .MuiOutlinedInput-notchedOutline': { border: 'none' } }}
                    >
                        <MenuItem value="">{placeholder}</MenuItem>
                        {options.map((opt, i) => <MenuItem key={i} value={opt.value}>{opt.label}</MenuItem>)}
                    </Select>
                ) : (
                    <TextField
                        fullWidth size="small"
                        name={field}
                        type={type}
                        placeholder={placeholder}
                        variant="outlined"
                        value={value}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={!!error}
                        helperText={error}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', backgroundColor: '#F9FAFB', '& .MuiOutlinedInput-notchedOutline': { border: '1px solid #F3F4F6' } } }}
                    />
                )}
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
                                            <Tooltip title="Edit">
                                                <IconButton onClick={() => handleEditProduct(p)} sx={{ color: '#0057FF' }} size="small"><EditIcon fontSize="small" /></IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton sx={{ color: '#EF4444' }} size="small"><DeleteIcon fontSize="small" /></IconButton>
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
                                <Typography variant="h4" sx={{ fontWeight: 900, mb: 3 }}>
                                    {isEditing ? "Edit Product" : "New Product"}
                                </Typography>
                                <form onSubmit={formik.handleSubmit}>
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} md={6}>
                                            {renderField("Product Name", "Enter name", false, "text", "name")}
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            {renderField("Short Name", "Enter short name", false, "text", "shortName")}
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            {renderField("HSN Code", "Enter HSN", false, "text", "hsnc")}
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            {renderField("GST (%)", "Enter GST", false, "number", "gst")}
                                        </Grid>
                                        <Grid item xs={12}>
                                            {renderField("RM Type", "Select type", true, "text", "rmType", [
                                                { label: "CRUSHER", value: "CRUSHER" },
                                                { label: "QUARRY", value: "QUARRY" },
                                                { label: "BY PRODUCT", value: "BY_PRODUCT" }
                                            ])}
                                        </Grid>

                                        <Grid item xs={12} sx={{ mt: 1 }}>
                                            <Divider />
                                            <Typography sx={{ fontWeight: 700, mt: 2, mb: 1, fontSize: '15px' }}>Plant Pricing</Typography>
                                        </Grid>

                                        {formik.values.branchPrices.map((bp, idx) => (
                                            <Grid item xs={12} md={6} key={idx}>
                                                <Box sx={{ p: 2, border: '1px solid #F3F4FB', borderRadius: '12px', backgroundColor: '#F9FAFB' }}>
                                                    <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#6B7280', mb: 1 }}>{bp.branchName}</Typography>
                                                    <TextField
                                                        fullWidth size="small"
                                                        type="number"
                                                        placeholder="Enter rate"
                                                        value={bp.rate}
                                                        onChange={(e) => {
                                                            const newPrices = [...formik.values.branchPrices];
                                                            newPrices[idx].rate = e.target.value;
                                                            formik.setFieldValue("branchPrices", newPrices);
                                                        }}
                                                        sx={{ '& .MuiOutlinedInput-root': { backgroundColor: '#fff', borderRadius: '8px' } }}
                                                    />
                                                </Box>
                                            </Grid>
                                        ))}

                                        <Grid item xs={12} sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                            <Button onClick={handleCloseModal} sx={{ color: '#64748B', fontWeight: 700, textTransform: 'none' }}>Cancel</Button>
                                            <Button
                                                type="submit"
                                                variant="contained"
                                                sx={{
                                                    background: 'linear-gradient(135deg, #0057FF 0%, #003499 100%)',
                                                    borderRadius: '8px', px: 4, py: 1.2, fontWeight: 700, textTransform: 'none'
                                                }}
                                            >
                                                {isEditing ? "Update Product" : "Save Product"}
                                            </Button>
                                        </Grid>
                                    </Grid>
                                </form>
                            </Box>
                        )}
                    </Box>
                </DialogContent>
            </Dialog>
        </Box>
    );
}
