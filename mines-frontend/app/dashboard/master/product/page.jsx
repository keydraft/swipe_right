"use client";

import React, { useState, useEffect } from "react";
import {
    Box, Typography, Card, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Button,
    TextField, InputAdornment, Tooltip, Dialog, DialogContent,
    Select, MenuItem, Switch, FormControlLabel, TablePagination
} from "@mui/material";
import {
    SearchOutlined as SearchIcon, AddOutlined as AddIcon, FileDownloadOutlined as DownloadIcon,
    PrintOutlined as PrintIcon, SortOutlined as SortIcon, VisibilityOutlined as ViewIcon,
    EditOutlined as EditIcon, DeleteOutline as DeleteIcon
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { palette } from "@/theme";
import { productApi, adminApi } from "@/services/api";
import { useFormik } from "formik";
import * as Yup from "yup";

export default function ProductPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [openModal, setOpenModal] = useState(false);
    const [products, setProducts] = useState([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
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
        hsnc: Yup.string()
            .matches(/^[0-9]{4,8}$/, "HSN Code must be 4-8 digits")
            .required("HSN Code is required"),
        gst: Yup.number().typeError("GST must be a number").required("GST is required").min(0, "Invalid GST").max(100, "Invalid GST"),
        rmType: Yup.string().required("RM Type is required"),
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const productResp = await productApi.getAll();
            if (productResp.success) {
                setProducts(productResp.data);
            }

            // Fetch companies to get branches for price mapping
            const companyResp = await adminApi.getCompanies();
            if (companyResp.success) {
                localStorage.setItem("companies", JSON.stringify(companyResp.data));
            }
            setIsInitialized(true);
        } catch (error) {
            console.error("Error fetching initial data:", error);
        }
    };

    const formik = useFormik({
        initialValues,
        validationSchema,
        onSubmit: async (values) => {
            const branchPrices = values.branchPrices || [];
            if (branchPrices.length === 0) {
                alert("Please ensure companies and sites are registered first.");
                return;
            }

            // Get companyId from the first branch price as products are tied to a company
            const companyId = branchPrices[0]?.companyId;
            if (!companyId) {
                alert("Internal error: Company ID not found for the selected branch.");
                return;
            }

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
                    await fetchInitialData();
                    handleCloseModal();
                } else {
                    alert("Failed to save product: " + (response.message || "Unknown error"));
                }
            } catch (error) {
                console.error("Error saving product:", error);
                alert("Failed to save product: " + (error.response?.data?.message || "An error occurred"));
            }
        },
    });

    const handleOpenModal = async () => {
        let availableBranches = [];

        try {
            const companyResp = await adminApi.getCompanies();
            if (companyResp.success) {
                const companies = companyResp.data;
                availableBranches = companies.flatMap(c => (c.branches || []).map(b => ({
                    id: b.id,
                    name: b.name,
                    companyId: c.id
                })));
            }
        } catch (error) {
            console.error("Error fetching companies:", error);
            // Fallback to localStorage if API fails
            const savedCompanies = localStorage.getItem("companies");
            if (savedCompanies) {
                const companies = JSON.parse(savedCompanies);
                availableBranches = companies.flatMap(c => (c.branches || []).map(b => ({
                    id: b.id,
                    name: b.name,
                    companyId: c.id
                })));
            }
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
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        formik.resetForm();
    };

    const handleBranchPriceChange = (index, value) => {
        const newBranchPrices = [...formik.values.branchPrices];
        newBranchPrices[index].rate = value;
        formik.setFieldValue("branchPrices", newBranchPrices);
    };


    const handleEditProduct = async (product) => {
        let currentBranches = [];
        try {
            const companyResp = await adminApi.getCompanies();
            if (companyResp.success) {
                currentBranches = companyResp.data.flatMap(c => (c.branches || []).map(b => ({
                    id: b.id,
                    name: b.name,
                    companyId: c.id
                })));
            }
        } catch (error) {
            console.error("Error fetching companies:", error);
            const savedCompanies = localStorage.getItem("companies");
            if (savedCompanies) {
                const companies = JSON.parse(savedCompanies);
                currentBranches = companies.flatMap(c => (c.branches || []).map(b => ({
                    id: b.id,
                    name: b.name,
                    companyId: c.id
                })));
            }
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
    };

    const handleDeleteProduct = async (id) => {
        if (window.confirm("Are you sure you want to delete this product?")) {
            try {
                const response = await productApi.delete(id);
                if (response.success) {
                    setProducts(products.filter(p => p.id !== id));
                }
            } catch (error) {
                console.error("Error deleting product:", error);
                alert("Failed to delete product: " + (error.response?.data?.message || "Unknown error"));
            }
        }
    };

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.hsnCode && product.hsnCode.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const paginatedProducts = filteredProducts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <Box sx={{ animation: "fadeIn 0.5s ease-out" }}>
            {/* Header Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h3" sx={{ fontWeight: 900, color: palette.text.secondary }}>
                    Product
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
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
            </Box>

            {/* Toolbar Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <TextField
                    variant="outlined"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
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
                    <Table sx={{ minWidth: 1000 }}>
                        <TableHead sx={{ backgroundColor: palette.background.paper }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>S No</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>Product Name</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>Short Name</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>HSNC</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>GST %</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>RM Type</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>Status</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600, color: palette.text.primary }}>Edit</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedProducts.map((product, index) => (
                                <TableRow key={product.id} sx={{ '&:hover': { backgroundColor: palette.background.paper } }}>
                                    <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                                    <TableCell sx={{ fontWeight: 500, color: palette.text.primary }}>{product.name}</TableCell>
                                    <TableCell>{product.shortName}</TableCell>
                                    <TableCell>{product.hsnCode}</TableCell>
                                    <TableCell>{product.gstPercentage}%</TableCell>
                                    <TableCell>{product.rmType}</TableCell>
                                    <TableCell>
                                        <Box sx={{
                                            display: 'inline-flex',
                                            px: 1.5,
                                            py: 0.5,
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            backgroundColor: product.active ? '#ECFDF5' : '#FEF2F2',
                                            color: product.active ? '#059669' : '#DC2626'
                                        }}>
                                            {product.active ? 'Active' : 'Inactive'}
                                        </Box>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                            <Tooltip title="Edit">
                                                <IconButton
                                                    size="small"
                                                    sx={{ color: '#0057FF' }}
                                                    onClick={() => handleEditProduct(product)}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton
                                                    size="small"
                                                    sx={{ color: '#EF4444' }}
                                                    onClick={() => handleDeleteProduct(product.id)}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredProducts.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                                        <Typography color="textSecondary">No products found</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={filteredProducts.length}
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
                        '.MuiTablePagination-select': {
                            fontSize: '13px',
                            fontWeight: 500
                        }
                    }}
                />
            </Card>

            {/* Simplified Modal for New Product (Placeholder) */}
            <Dialog
                open={openModal}
                onClose={handleCloseModal}
                maxWidth="md"
                fullWidth
                sx={{
                    '& .MuiDialog-container': {
                        marginLeft: { md: '280px' },
                        width: { md: 'calc(100% - 280px)' }
                    }
                }}
                PaperProps={{
                    sx: { borderRadius: '16px', padding: '0px', overflow: 'hidden' }
                }}
            >
                <DialogContent sx={{ p: 4, backgroundColor: '#fff' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {/* Top row: Name and Short Name */}
                        <Box sx={{ display: 'flex', gap: 3 }}>
                            <Box sx={{ flex: 1 }}>
                                <Typography sx={{ fontSize: '13px', color: '#9CA3AF', mb: 0.5 }}>Product Name</Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    name="name"
                                    placeholder="Enter Product Name"
                                    variant="outlined"
                                    value={formik.values.name}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    error={formik.touched.name && !!formik.errors.name}
                                    helperText={formik.touched.name && formik.errors.name}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', backgroundColor: '#fff' } }}
                                />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography sx={{ fontSize: '13px', color: '#9CA3AF', mb: 0.5 }}>Short Name</Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    name="shortName"
                                    placeholder="Enter Short Name"
                                    variant="outlined"
                                    value={formik.values.shortName}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    error={formik.touched.shortName && !!formik.errors.shortName}
                                    helperText={formik.touched.shortName && formik.errors.shortName}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', backgroundColor: '#fff' } }}
                                />
                            </Box>
                        </Box>

                        {/* Middle row: HSN and GST */}
                        <Box sx={{ display: 'flex', gap: 3 }}>
                            <Box sx={{ flex: 1 }}>
                                <Typography sx={{ fontSize: '13px', color: '#9CA3AF', mb: 0.5 }}>HSN Code</Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    name="hsnc"
                                    placeholder="HSN Code"
                                    variant="outlined"
                                    value={formik.values.hsnc}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    error={formik.touched.hsnc && !!formik.errors.hsnc}
                                    helperText={formik.touched.hsnc && formik.errors.hsnc}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', backgroundColor: '#fff' } }}
                                />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography sx={{ fontSize: '13px', color: '#9CA3AF', mb: 0.5 }}>GST %</Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    name="gst"
                                    placeholder="0"
                                    variant="outlined"
                                    value={formik.values.gst}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    error={formik.touched.gst && !!formik.errors.gst}
                                    helperText={formik.touched.gst && formik.errors.gst}
                                    InputProps={{
                                        sx: { position: 'relative' },
                                        startAdornment: (
                                            <Box sx={{
                                                position: 'absolute', top: -10, left: 10,
                                                backgroundColor: '#fff', px: 0.5, fontSize: '10px',
                                                color: '#9CA3AF', zIndex: 1
                                            }}>
                                                GST %
                                            </Box>
                                        )
                                    }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', backgroundColor: '#fff' } }}
                                />
                            </Box>
                        </Box>

                        {/* RM Type row */}
                        <Box>
                            <Typography sx={{ fontSize: '13px', color: '#9CA3AF', mb: 0.5 }}>RM Type</Typography>
                            <Select
                                fullWidth
                                size="small"
                                name="rmType"
                                displayEmpty
                                value={formik.values.rmType}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.rmType && !!formik.errors.rmType}
                                sx={{ borderRadius: '8px', backgroundColor: '#fff' }}
                            >
                                <MenuItem value="" disabled>Select RM Type</MenuItem>
                                <MenuItem value="CRUSHER">CRUSHER</MenuItem>
                                <MenuItem value="QUARRY">QUARRY</MenuItem>
                                <MenuItem value="BY_PRODUCT">BY PRODUCT</MenuItem>
                            </Select>
                        </Box>

                        {/* Branch Table Section */}
                        <TableContainer sx={{ mt: 1, borderTop: '1px solid #F3F4F6' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ color: '#3B82F6', fontWeight: 600, borderBottom: 'none', py: 2 }}>S.No</TableCell>
                                        <TableCell sx={{ color: '#3B82F6', fontWeight: 600, borderBottom: 'none' }}>Branch Name</TableCell>
                                        <TableCell sx={{ color: '#3B82F6', fontWeight: 600, borderBottom: 'none' }}>Price</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {(formik.values.branchPrices || []).map((plant, index) => (
                                        <TableRow key={index}>
                                            <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 2 }}>{index + 1}</TableCell>
                                            <TableCell sx={{ borderBottom: '1px solid #F3F4F6', color: '#374151', fontWeight: 500 }}>{plant.branchName}</TableCell>
                                            <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
                                                <TextField
                                                    size="small"
                                                    value={plant.rate}
                                                    onChange={(e) => handleBranchPriceChange(index, e.target.value)}
                                                    InputProps={{
                                                        sx: { position: 'relative', height: '36px' },
                                                        startAdornment: (
                                                            <Box sx={{
                                                                position: 'absolute', top: -12, left: 10,
                                                                backgroundColor: '#fff', px: 0.5, fontSize: '10px',
                                                                color: '#9CA3AF', zIndex: 1
                                                            }}>
                                                                Rate
                                                            </Box>
                                                        )
                                                    }}
                                                    sx={{ width: '150px', '& .MuiOutlinedInput-root': { borderRadius: '4px' } }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* Bottom Actions */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        name="status"
                                        checked={formik.values.status === "Active"}
                                        onChange={(e) => formik.setFieldValue("status", e.target.checked ? "Active" : "Inactive")}
                                        sx={{
                                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#3B82F6' },
                                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#3B82F6' }
                                        }}
                                    />
                                }
                                label="Active"
                                sx={{ color: '#4B5563', fontWeight: 500 }}
                            />

                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button
                                    variant="contained"
                                    onClick={formik.handleSubmit}
                                    disabled={!formik.values.name || !formik.values.shortName || !formik.values.hsnc || !formik.isValid}
                                    sx={{
                                        backgroundColor: '#3B82F6',
                                        color: '#fff',
                                        px: 4,
                                        py: 1,
                                        borderRadius: '4px',
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        '&:hover': { backgroundColor: '#2563EB' },
                                        '&.Mui-disabled': { backgroundColor: '#E5E7EB', color: '#9CA3AF' }
                                    }}
                                >
                                    Save
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={handleCloseModal}
                                    sx={{
                                        borderColor: '#FDBA74',
                                        color: '#FDBA74',
                                        px: 4,
                                        py: 1,
                                        borderRadius: '4px',
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        '&:hover': { borderColor: '#FB923C', backgroundColor: '#FFF7ED' }
                                    }}
                                >
                                    Cancel
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </DialogContent>
            </Dialog>
        </Box>
    );
}
