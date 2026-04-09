"use client";

import React, { useState, useEffect } from "react";
import {
    Box, Typography, Card, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Button,
    TextField, InputAdornment, Tooltip, Dialog, DialogContent,
    Select, MenuItem, Switch, FormControlLabel, TablePagination, Stack, Paper, Divider,
    Stepper, Step, StepLabel, Checkbox, CircularProgress, Grid,
    Snackbar, Alert
} from "@mui/material";
import {
    SearchOutlined as SearchIcon, AddOutlined as AddIcon, FileDownloadOutlined as DownloadIcon,
    PrintOutlined as PrintIcon, SortOutlined as SortIcon, VisibilityOutlined as ViewIcon,
    EditOutlined as EditIcon, DeleteOutline as DeleteIcon, Close as CloseIcon,
    AddCircleOutline as AddCircleIcon, AttachMoneyOutlined as PriceIcon,
    ArrowBackIos as BackIcon, ArrowForwardIos as NextIcon, CheckCircleOutlined as SaveIcon
} from "@mui/icons-material";
import { palette } from "@/theme";
import { customerApi, productApi, adminApi } from "@/services/api";
import { useFormik, FormikProvider } from "formik";
import * as Yup from "yup";
import { phoneRegex, pincodeRegex, gstinRegex } from "@/utils/validationSchemas";
import Cookies from "js-cookie";

const steps = ['Registry Information', 'Pricing & Sites'];

// ─── Branch Dropdown Component ────────────────────────────
function CustomerBranchDropdown({ companyId, value, onChange, renderField }) {
    const [branches, setBranches] = React.useState([]);

    React.useEffect(() => {
        if (!companyId) { setBranches([]); return; }
        adminApi.getBranches(companyId).then(res => {
            if (res.success) {
                const list = res.data || [];
                setBranches(list);
                if (!value && list.length > 0) onChange(list[0].id);
            }
        }).catch(() => setBranches([]));
    }, [companyId]);

    return renderField("Branch *", "Select Branch", "branchId", "text", true,
        branches.map(b => ({ label: b.name, value: b.id }))
    );
}

export default function CustomerPage() {
    const userRole = typeof window !== 'undefined' ? Cookies.get("role") || "" : "";
    const [searchQuery, setSearchQuery] = useState("");
    const [openModal, setOpenModal] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);

    // View Details State
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

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
        companyId: "",
        branchId: "",
        name: "",
        type: "LOCAL",
        phone: "",
        email: "",
        gstin: "",
        address: { addressLine1: "", addressLine2: "", district: "", state: "", pincode: "" },
        status: "Active",
        prices: [], // For Local
        sites: []  // For Corporate
    };

    const [userCompanyInfo, setUserCompanyInfo] = useState([]);
    const [allCompanies, setAllCompanies] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    const validationSchema = Yup.object({
        name: Yup.string().required("Customer name is required"),
        type: Yup.string().required("Type is required"),
        phone: Yup.string()
            .matches(phoneRegex, "Phone must be 10-12 digits")
            .required("Phone number is required"),
        email: Yup.string().email("Invalid email format"),
        gstin: Yup.string()
            .matches(gstinRegex, "Invalid GSTIN format"),
        address: Yup.object({
            addressLine1: Yup.string().required("Address line 1 is required"),
            district: Yup.string().required("District is required"),
            state: Yup.string().required("State is required"),
            pincode: Yup.string()
                .matches(pincodeRegex, "Pincode must be 6 digits")
                .required("Pincode is required")
        })
    });

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            const prodResp = await productApi.getAll(0, 500);
            if (prodResp.success) setProducts(prodResp.data.content || []);
            await fetchCustomers();
        } catch (error) {
            console.error("Error fetching initial customer data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCustomers = async () => {
        try {
            const response = await customerApi.getAll(page, rowsPerPage, searchQuery);
            if (response.success) {
                setCustomers(response.data.content);
                setTotalElements(response.data.totalElements);
            }
        } catch (error) {
            console.error("Error fetching customers:", error);
        }
    };

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                setCurrentUser(userData);
                if (userData.role === "ADMIN") {
                    // Fetch all companies for admin
                    adminApi.getCompanies(0, 1000).then(resp => {
                        if (resp.success) {
                            setAllCompanies(resp.data.content);
                        }
                    });
                } else if (userData.companies) {
                    setUserCompanyInfo(userData.companies);
                    // Default to first company/branch if valid
                    if (userData.companies.length > 0) {
                        formik.setFieldValue("companyId", userData.companies[0].companyId);
                        formik.setFieldValue("branchId", userData.companies[0].branchId || "");
                    }
                }
            } catch (e) {
                console.error("Error parsing user data for company info", e);
            }
        }
        fetchInitialData();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCustomers();
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
                ...values,
                active: values.status === "Active"
            };
            try {
                const response = await customerApi.upsert(payload, editingId);
                if (response.success) {
                    setShowSuccess(true);
                    setTimeout(() => {
                        handleCloseModal();
                        fetchCustomers();
                    }, 2000);
                }
            } catch (error) {
                console.error("Error saving customer:", error);
            }
        }
    });

    const handleOpenModal = () => {
        setIsEditing(false);
        setEditingId(null);
        setActiveStep(0);
        formik.resetForm();
        setOpenModal(true);
        setShowSuccess(false);
    };

    const handleEditCustomer = (customer) => {
        setIsEditing(true);
        setEditingId(customer.id);
        setActiveStep(0);
        formik.setValues({
            companyId: customer.companyId || (userCompanyInfo.length > 0 ? userCompanyInfo[0].companyId : ""),
            branchId: customer.branchId || (userCompanyInfo.length > 0 ? userCompanyInfo[0].branchId : ""),
            name: customer.name || "",
            type: customer.type || "LOCAL",
            phone: customer.phone || "",
            email: customer.email || "",
            gstin: customer.gstin || "",
            address: customer.address || { addressLine1: "", addressLine2: "", district: "", state: "", pincode: "" },
            status: customer.active ? "Active" : "Inactive",
            prices: customer.prices || [],
            sites: customer.sites || []
        });
        setOpenModal(true);
        setShowSuccess(false);
    };

    const handleViewCustomer = (customer) => {
        setSelectedCustomer(customer);
        setViewModalOpen(true);
    };

    const handleDeleteClick = (id) => {
        setDeleteTargetId(id);
        setDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        try {
            const response = await customerApi.delete(deleteTargetId);
            if (response.success) {
                setSnackbar({ open: true, message: "Customer deleted successfully", severity: "success" });
                fetchCustomers();
            } else {
                setSnackbar({ open: true, message: response.message || "Failed to delete customer", severity: "error" });
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

    const renderField = (label, placeholder, field, type = "text", isSelect = false, options = []) => {
        const fieldKeys = field.split('.');
        let value = formik.values;
        for (const key of fieldKeys) value = value?.[key];

        const getFieldMeta = (name) => {
            const keys = name.split('.');
            let meta = { touched: formik.touched, error: formik.errors };
            for (const key of keys) {
                meta = {
                    touched: meta.touched?.[key],
                    error: meta.error?.[key]
                };
            }
            return meta;
        };

        const meta = getFieldMeta(field);
        const hasError = !!(meta.touched && meta.error);

        return (
            <Box sx={{ width: '100%', mb: 2 }}>
                <Typography sx={{ fontSize: '13px', color: '#374151', mb: 0.8, fontWeight: 600 }}>{label}</Typography>
                {isSelect ? (
                    <Box>
                        <Select
                            fullWidth size="small"
                            name={field}
                            value={value || ""}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            displayEmpty
                            error={hasError}
                            sx={{ borderRadius: '12px', backgroundColor: '#F9FAFB', border: hasError ? '1px solid #d32f2f' : '1px solid #F3F4F6', '& .MuiSelect-select': { color: value ? '#111827' : '#9CA3AF' }, '& .MuiOutlinedInput-notchedOutline': { border: 'none' } }}
                        >
                            <MenuItem value="">{placeholder}</MenuItem>
                            {options.map((opt, i) => <MenuItem key={i} value={opt.value}>{opt.label}</MenuItem>)}
                        </Select>
                        {hasError && <Typography sx={{ color: '#d32f2f', fontSize: '11px', mt: 0.5, ml: 1 }}>{meta.error}</Typography>}
                    </Box>
                ) : (
                    <TextField
                        fullWidth size="small"
                        name={field}
                        type={type}
                        placeholder={placeholder}
                        value={value || ""}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={hasError}
                        helperText={hasError ? meta.error : ""}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                backgroundColor: '#F9FAFB',
                                '& .MuiOutlinedInput-notchedOutline': { border: hasError ? '1px solid #d32f2f' : '1px solid #F3F4F6' }
                            },
                            '& .MuiFormHelperText-root': { ml: 1 }
                        }}
                    />
                )}
            </Box>
        );
    };

    const handleAddSite = () => {
        const newSite = {
            siteName: "",
            address: { addressLine1: "", addressLine2: "", district: "", state: "", pincode: "" },
            phone: "", alternatePhone: "", driverSalary: 0, prices: []
        };
        formik.setFieldValue("sites", [...formik.values.sites, newSite]);
    };

    const handleAddPrice = (targetField) => {
        const newPrice = { productId: "", rate: 0, cashRate: 0, creditRate: 0, transportRate: 0, uom: "TONS", tonnageLimit: 0, gstInclusive: false };
        if (targetField === 'prices') {
            formik.setFieldValue("prices", [...formik.values.prices, newPrice]);
        } else {
            const parts = targetField.split('.');
            const idx = parseInt(parts[0].match(/\d+/)[0]);
            const sites = [...formik.values.sites];
            sites[idx].prices.push(newPrice);
            formik.setFieldValue("sites", sites);
        }
    };

    const nextStep = async () => {
        if (activeStep === 0) {
            const errors = await formik.validateForm();
            if (errors.name || errors.phone || errors.email || errors.gstin || errors.address) {
                // Touch all fields to show errors
                formik.setTouched({
                    name: true,
                    type: true,
                    phone: true,
                    email: true,
                    gstin: true,
                    address: {
                        addressLine1: true,
                        district: true,
                        state: true,
                        pincode: true
                    }
                });
                return;
            }
            setActiveStep(1);
        }
        else formik.handleSubmit();
    };

    const renderStepper = () => {
        const fillPercentage = ((activeStep + 1) / steps.length) * 100;
        return (
            <Box sx={{ width: '100%', mb: 4, pt: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 8, mb: 2 }}>
                    {steps.map((label, index) => {
                        const isActive = activeStep === index;
                        const isCompleted = activeStep > index;
                        return (
                            <Box key={index} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '160px' }}>
                                <Box sx={{
                                    width: 40, height: 40, borderRadius: '50%',
                                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                                    backgroundColor: isCompleted ? '#EBFDF5' : '#F3F4F6',
                                    color: isCompleted ? '#10B981' : (isActive ? '#0057FF' : '#9CA3AF'),
                                    fontWeight: 'bold', fontSize: '16px', mb: 1,
                                    border: isActive ? '2px solid #0057FF' : 'none'
                                }}>
                                    {index + 1}
                                </Box>
                                <Typography sx={{ color: (isActive || isCompleted) ? '#374151' : 'transparent', fontSize: '13px', fontWeight: 600, textAlign: 'center' }}>
                                    {isActive || isCompleted ? label : ""}
                                </Typography>
                            </Box>
                        );
                    })}
                </Box>
                <Box sx={{ width: '100%', height: '6px', backgroundColor: '#FFFFFF', borderRadius: '4px', position: 'relative', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)' }}>
                    <Box sx={{
                        position: 'absolute', top: 0, left: 0, height: '100%',
                        background: 'linear-gradient(135deg, #0057FF 0%, #003499 100%)',
                        borderRadius: '4px', width: `${fillPercentage}%`, transition: 'width 0.4s ease-in-out'
                    }} />
                </Box>
            </Box>
        );
    };

    return (
        <FormikProvider value={formik}>
            <Box sx={{ animation: "fadeIn 0.5s ease-out" }}>
                {/* Header Section */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h3" sx={{ fontWeight: 900, color: palette.text.secondary }}>Customer</Typography>
                    {(userRole !== 'PARTNER' && userRole !== 'ROLE_PARTNER') && (
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
                            New Customer
                        </Button>
                    )}
                </Box>

                {/* Toolbar Section */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, }}>
                    <TextField
                        variant="outlined"
                        placeholder="Search customers..."
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
                <Card sx={{ borderRadius: "16px", boxShadow: "0 4px 24px rgba(0,0,0,0.04)", border: `1px solid ${palette.divider}`, overflow: 'hidden' }}>
                    <TableContainer>
                        <Table sx={{ minWidth: 1000 }}>
                            <TableHead sx={{ backgroundColor: palette.background.paper }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>Code</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>Name</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>Type</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>Phone</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>GSTIN</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 600, color: palette.text.primary }}>Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}><CircularProgress size={24} /></TableCell></TableRow>
                                ) : customers.length === 0 ? (
                                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}><Typography color="textSecondary">No customers found</Typography></TableCell></TableRow>
                                ) : customers.map((c) => (
                                    <TableRow key={c.id} sx={{ '&:hover': { backgroundColor: palette.background.paper } }}>
                                        <TableCell sx={{ fontWeight: 700, color: '#0057FF' }}>{c.customerCode || 'N/A'}</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>{c.name}</TableCell>
                                        <TableCell>
                                            <Box sx={{ px: 1.5, py: 0.5, borderRadius: '12px', fontSize: '11px', fontWeight: 800, display: 'inline-block', bgcolor: c.type === 'CORPORATE' ? '#EBF5FF' : '#F0FDF4', color: c.type === 'CORPORATE' ? '#0057FF' : '#16A34A' }}>
                                                {c.type}
                                            </Box>
                                        </TableCell>
                                        <TableCell>{c.phone}</TableCell>
                                        <TableCell>{c.gstin || '-'}</TableCell>
                                        <TableCell align="center">
                                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                                <Tooltip title="View">
                                                    <IconButton onClick={() => handleViewCustomer(c)} sx={{ color: palette.primary.main }} size="small"><ViewIcon fontSize="small" /></IconButton>
                                                </Tooltip>
                                                {(userRole !== 'PARTNER' && userRole !== 'ROLE_PARTNER') && (
                                                    <>
                                                        <IconButton onClick={() => handleEditCustomer(c)} sx={{ color: '#0057FF' }} size="small"><EditIcon fontSize="small" /></IconButton>
                                                        <IconButton onClick={() => handleDeleteClick(c.id)} sx={{ color: '#EF4444' }} size="small"><DeleteIcon fontSize="small" /></IconButton>
                                                    </>
                                                )}
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
                        {!showSuccess && renderStepper()}
                        <Box sx={{
                            backgroundColor: showSuccess ? 'transparent' : '#fff',
                            borderRadius: '16px',
                            p: showSuccess ? 0 : { xs: 3, sm: 6 },
                            boxShadow: showSuccess ? 'none' : '0px 2px 12px rgba(0,0,0,0.03)',
                            width: '100%',
                        }}>
                            {showSuccess ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6, textAlign: 'center', color: '#fff', minHeight: '260px' }}>
                                    <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, fontSize: '32px' }}>Customer Registered</Typography>
                                    <Typography variant="body1" sx={{ opacity: 0.9 }}>The record has been saved successfully</Typography>
                                </Box>
                            ) : (
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                        <Typography variant="h4" sx={{ fontWeight: 900 }}>{isEditing ? 'Edit Customer' : 'New Customer'}</Typography>
                                        <IconButton onClick={handleCloseModal}><CloseIcon /></IconButton>
                                    </Box>

                                    <Box sx={{ minHeight: '400px', mt: 4 }}>
                                        {activeStep === 0 ? (
                                            <Grid container spacing={4}>
                                                <Grid item xs={12} md={6}>
                                                {currentUser?.role === "ADMIN" ? (
                                                        <>
                                                            {renderField("Company *", "Select Company", "companyId", "text", true, allCompanies.map(c => ({ label: c.name, value: c.id })))}
                                                            {formik.values.companyId && (
                                                                <Box sx={{ mt: 1 }}>
                                                                    <CustomerBranchDropdown
                                                                        companyId={formik.values.companyId}
                                                                        value={formik.values.branchId}
                                                                        onChange={(val) => formik.setFieldValue("branchId", val)}
                                                                        renderField={renderField}
                                                                    />
                                                                </Box>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <>
                                                            {renderField("Company *", "Select Company", "companyId", "text", true, userCompanyInfo.map(c => ({ label: c.companyName, value: c.companyId })))}
                                                            {formik.values.companyId && (
                                                                <Box sx={{ mt: 1 }}>
                                                                    <CustomerBranchDropdown
                                                                        companyId={formik.values.companyId}
                                                                        value={formik.values.branchId}
                                                                        onChange={(val) => formik.setFieldValue("branchId", val)}
                                                                        renderField={renderField}
                                                                    />
                                                                </Box>
                                                            )}
                                                        </>
                                                    )}
                                                    {renderField("Customer Full Name", "Enter name", "name")}
                                                    {renderField("Customer Type *", "Select type", "type", "text", true, [{ label: "LOCAL", value: "LOCAL" }, { label: "CORPORATE", value: "CORPORATE" }])}
                                                    {renderField("Primary Phone", "Enter phone", "phone")}
                                                    {renderField("Email Address", "Enter email", "email")}
                                                    {renderField("GSTIN Number", "Enter GSTIN", "gstin")}
                                                </Grid>
                                                <Grid item xs={12} md={6}>
                                                    {renderField("Address Line 1", "Enter address", "address.addressLine1")}
                                                    {renderField("Address Line 2", "Enter address", "address.addressLine2")}
                                                    <Stack direction="row" spacing={2}>
                                                        <Box sx={{ flex: 1 }}>{renderField("District", "Enter district", "address.district")}</Box>
                                                        <Box sx={{ flex: 1 }}>{renderField("State", "Enter state", "address.state")}</Box>
                                                    </Stack>
                                                    {renderField("Pincode", "Enter pincode", "address.pincode")}
                                                </Grid>
                                            </Grid>
                                        ) : (
                                            <Box>
                                                {formik.values.type === 'CORPORATE' ? (
                                                    <Box>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                                            <Typography sx={{ fontWeight: 700, color: '#0057FF' }}>Delivery Sites & Pricing</Typography>
                                                            <Button startIcon={<AddCircleIcon />} onClick={handleAddSite} variant="contained" size="small" sx={{ borderRadius: '8px', background: '#1E293B', textTransform: 'none' }}>Add New Site</Button>
                                                        </Box>
                                                        {formik.values.sites.map((site, sIdx) => (
                                                            <Card key={sIdx} sx={{ mb: 3, p: 3, border: `1px solid ${palette.divider}`, bgcolor: '#F9FAFB', borderRadius: '16px' }}>
                                                                <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                                                                    <TextField fullWidth size="small" label="Site Name" value={site.siteName} onChange={(e) => formik.setFieldValue(`sites[${sIdx}].siteName`, e.target.value)} sx={{ bgcolor: '#fff', borderRadius: '8px' }} />
                                                                    <TextField fullWidth size="small" label="Site Phone" value={site.phone} onChange={(e) => formik.setFieldValue(`sites[${sIdx}].phone`, e.target.value)} sx={{ bgcolor: '#fff', borderRadius: '8px' }} />
                                                                </Stack>
                                                                <Box sx={{ bgcolor: '#fff', borderRadius: '12px', overflow: 'hidden', border: `1px solid ${palette.divider}` }}>
                                                                    <Table size="small">
                                                                        <TableHead sx={{ bgcolor: palette.background.paper }}>
                                                                            <TableRow>
                                                                                <TableCell sx={{ fontWeight: 700 }}>PRODUCT</TableCell>
                                                                                <TableCell sx={{ fontWeight: 700 }}>TRANSPORT</TableCell>
                                                                                <TableCell sx={{ fontWeight: 700 }}>RATE</TableCell>
                                                                                <TableCell sx={{ fontWeight: 700 }}>UOM</TableCell>
                                                                                <TableCell align="center" sx={{ fontWeight: 700 }}>GST</TableCell>
                                                                            </TableRow>
                                                                        </TableHead>
                                                                        <TableBody>
                                                                            {site.prices.map((p, pIdx) => (
                                                                                <TableRow key={pIdx}>
                                                                                    <TableCell sx={{ width: '25%' }}>
                                                                                        <Select fullWidth size="small" value={p.productId} onChange={(e) => formik.setFieldValue(`sites[${sIdx}].prices[${pIdx}].productId`, e.target.value)} variant="standard">
                                                                                            {products.map(pr => <MenuItem key={pr.id} value={pr.id}>{pr.name}</MenuItem>)}
                                                                                        </Select>
                                                                                    </TableCell>
                                                                                    <TableCell><TextField fullWidth size="small" type="number" value={p.transportRate} onChange={(e) => formik.setFieldValue(`sites[${sIdx}].prices[${pIdx}].transportRate`, e.target.value)} variant="standard" /></TableCell>
                                                                                    <TableCell><TextField fullWidth size="small" type="number" value={p.rate} onChange={(e) => formik.setFieldValue(`sites[${sIdx}].prices[${pIdx}].rate`, e.target.value)} variant="standard" /></TableCell>
                                                                                    <TableCell>
                                                                                        <Select fullWidth size="small" value={p.uom} onChange={(e) => formik.setFieldValue(`sites[${sIdx}].prices[${pIdx}].uom`, e.target.value)} variant="standard">
                                                                                            <MenuItem value="TONS">TONS</MenuItem><MenuItem value="UNIT">UNIT</MenuItem>
                                                                                        </Select>
                                                                                    </TableCell>
                                                                                    <TableCell align="center"><Checkbox size="small" checked={p.gstInclusive} onChange={(e) => formik.setFieldValue(`sites[${sIdx}].prices[${pIdx}].gstInclusive`, e.target.checked)} /></TableCell>
                                                                                </TableRow>
                                                                            ))}
                                                                        </TableBody>
                                                                    </Table>
                                                                    <Button fullWidth size="small" onClick={() => handleAddPrice(`sites[${sIdx}].prices`)} sx={{ bgcolor: '#F9FAFB', color: '#0057FF', fontWeight: 700, py: 1 }}>+ Add Product Config</Button>
                                                                </Box>
                                                            </Card>
                                                        ))}
                                                    </Box>
                                                ) : (
                                                    <Box>
                                                        <Typography sx={{ fontWeight: 700, mb: 2, color: '#0057FF' }}>Price Management (Local Model)</Typography>
                                                        <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${palette.divider}`, borderRadius: '12px' }}>
                                                            <Table size="small">
                                                                <TableHead sx={{ bgcolor: palette.background.paper }}>
                                                                    <TableRow>
                                                                        <TableCell sx={{ fontWeight: 700 }}>PRODUCT NAME</TableCell>
                                                                        <TableCell sx={{ fontWeight: 700 }}>CASH RATE</TableCell>
                                                                        <TableCell sx={{ fontWeight: 700 }}>CREDIT RATE</TableCell>
                                                                        <TableCell sx={{ fontWeight: 700 }}>UOM</TableCell>
                                                                        <TableCell align="center" sx={{ fontWeight: 700 }}>GST</TableCell>
                                                                    </TableRow>
                                                                </TableHead>
                                                                <TableBody>
                                                                    {formik.values.prices.map((p, idx) => (
                                                                        <TableRow key={idx}>
                                                                            <TableCell sx={{ width: '30%' }}>
                                                                                <Select fullWidth size="small" value={p.productId} onChange={(e) => formik.setFieldValue(`prices[${idx}].productId`, e.target.value)} variant="standard">
                                                                                    {products.map(pr => <MenuItem key={pr.id} value={pr.id}>{pr.name}</MenuItem>)}
                                                                                </Select>
                                                                            </TableCell>
                                                                            <TableCell><TextField fullWidth size="small" type="number" value={p.cashRate} onChange={(e) => formik.setFieldValue(`prices[${idx}].cashRate`, e.target.value)} variant="standard" /></TableCell>
                                                                            <TableCell><TextField fullWidth size="small" type="number" value={p.creditRate} onChange={(e) => formik.setFieldValue(`prices[${idx}].creditRate`, e.target.value)} variant="standard" /></TableCell>
                                                                            <TableCell>
                                                                                <Select fullWidth size="small" value={p.uom} onChange={(e) => formik.setFieldValue(`prices[${idx}].uom`, e.target.value)} variant="standard">
                                                                                    <MenuItem value="TONS">TONS</MenuItem><MenuItem value="UNIT">UNIT</MenuItem>
                                                                                </Select>
                                                                            </TableCell>
                                                                            <TableCell align="center"><Checkbox size="small" checked={p.gstInclusive} onChange={(e) => formik.setFieldValue(`prices[${idx}].gstInclusive`, e.target.checked)} /></TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </TableContainer>
                                                        <Button onClick={() => handleAddPrice('prices')} sx={{ mt: 2, fontWeight: 700, color: '#0057FF' }}>+ Add Local Price Configuration</Button>
                                                    </Box>
                                                )}
                                            </Box>
                                        )}

                                        <Divider sx={{ my: 3 }} />
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Button disabled={activeStep === 0} onClick={() => setActiveStep(0)} startIcon={<BackIcon />} sx={{ fontWeight: 700, color: '#64748B' }}>Back</Button>
                                            <Button
                                                variant="contained"
                                                onClick={nextStep}
                                                endIcon={activeStep === 0 ? <NextIcon /> : <SaveIcon />}
                                                sx={{ background: activeStep === 0 ? '#1E293B' : 'linear-gradient(135deg, #0057FF 0%, #003499 100%)', px: 4, borderRadius: '8px', fontWeight: 700, textTransform: 'none' }}
                                            >
                                                {activeStep === 0 ? 'Next' : 'Save Record'}
                                            </Button>
                                        </Box>
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    </DialogContent>
                </Dialog>

                {/* View Customer Details Modal */}
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
                        {selectedCustomer && (
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                    <Box>
                                        <Typography variant="h4" sx={{ fontWeight: 900, color: '#111827' }}>
                                            {selectedCustomer.name}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.5 }}>
                                            Type: {selectedCustomer.type} | Phone: {selectedCustomer.phone}
                                        </Typography>
                                    </Box>
                                    <Box sx={{
                                        px: 2, py: 1, borderRadius: '12px',
                                        backgroundColor: selectedCustomer.active ? '#EBFDF5' : '#FEF2F2',
                                        color: selectedCustomer.active ? '#10B981' : '#EF4444',
                                        fontWeight: 700, fontSize: '13px'
                                    }}>
                                        {selectedCustomer.active ? 'ACTIVE' : 'INACTIVE'}
                                    </Box>
                                </Box>

                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                                    <Card sx={{ flex: '1 1 100%', borderRadius: '16px', p: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
                                        <Typography sx={{ fontWeight: 800, fontSize: '16px', color: '#111827', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box sx={{ width: 4, height: 16, backgroundColor: '#2D3FE2', borderRadius: 2 }} />
                                            Basic Information
                                        </Typography>
                                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
                                            <DetailItem label="Customer Code" value={selectedCustomer.customerCode || "N/A"} />
                                            <DetailItem label="Full Name" value={selectedCustomer.name} />
                                            <DetailItem label="Customer Type" value={selectedCustomer.type} />
                                            <DetailItem label="Phone Number" value={selectedCustomer.phone} />
                                            <DetailItem label="Email ID" value={selectedCustomer.email} />
                                            <DetailItem label="GSTIN" value={selectedCustomer.gstin} />
                                            <Box sx={{ gridColumn: '1 / -1' }}>
                                                <DetailItem label="Address" value={`${selectedCustomer.address?.addressLine1 || ""}, ${selectedCustomer.address?.addressLine2 || ""}, ${selectedCustomer.address?.district || ""}, ${selectedCustomer.address?.state || ""}, ${selectedCustomer.address?.pincode || ""}`} />
                                            </Box>
                                        </Box>
                                    </Card>

                                    {selectedCustomer.type === 'CORPORATE' ? (
                                        <Card sx={{ flex: '1 1 100%', borderRadius: '16px', p: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
                                            <Typography sx={{ fontWeight: 800, fontSize: '16px', color: '#111827', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box sx={{ width: 4, height: 16, backgroundColor: '#10B981', borderRadius: 2 }} />
                                                Delivery Sites ({selectedCustomer.sites?.length || 0})
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                {(selectedCustomer.sites || []).map((site, idx) => (
                                                    <Box key={idx} sx={{ p: 2, border: '1px solid #F3F4F6', borderRadius: '12px' }}>
                                                        <Typography sx={{ fontWeight: 700, color: '#0057FF' }}>{site.siteName}</Typography>
                                                        <Typography variant="body2" sx={{ color: '#6B7280' }}>{site.phone}</Typography>
                                                        <Box sx={{ mt: 2 }}>
                                                            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '8px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                                                                <Table size="small">
                                                                    <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                                                                        <TableRow>
                                                                            <TableCell sx={{ fontWeight: 700, fontSize: '10px', py: 1 }}>PRODUCT</TableCell>
                                                                            <TableCell sx={{ fontWeight: 700, fontSize: '10px', py: 1 }}>TRANSPORT</TableCell>
                                                                            <TableCell sx={{ fontWeight: 700, fontSize: '10px', py: 1 }}>RATE</TableCell>
                                                                            <TableCell sx={{ fontWeight: 700, fontSize: '10px', py: 1 }}>UOM</TableCell>
                                                                        </TableRow>
                                                                    </TableHead>
                                                                    <TableBody>
                                                                        {site.prices?.map((p, pIdx) => {
                                                                            const product = products.find(pr => pr.id === p.productId);
                                                                            return (
                                                                                <TableRow key={pIdx} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                                                    <TableCell sx={{ fontSize: '11px', fontWeight: 600 }}>{product?.name || p.productId}</TableCell>
                                                                                    <TableCell sx={{ fontSize: '11px', color: '#6B7280' }}>{p.transportRate > 0 ? `₹${p.transportRate}` : 'None'}</TableCell>
                                                                                    <TableCell sx={{ fontSize: '11px', fontWeight: 700 }}>₹{p.rate}</TableCell>
                                                                                    <TableCell sx={{ fontSize: '10px', color: '#9CA3AF' }}>{p.uom || 'TONS'}</TableCell>
                                                                                </TableRow>
                                                                            );
                                                                        })}
                                                                    </TableBody>
                                                                </Table>
                                                            </TableContainer>
                                                        </Box>
                                                    </Box>
                                                ))}
                                            </Box>
                                        </Card>
                                    ) : (
                                        <Card sx={{ flex: '1 1 100%', borderRadius: '16px', p: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
                                            <Typography sx={{ fontWeight: 800, fontSize: '16px', color: '#111827', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box sx={{ width: 4, height: 16, backgroundColor: '#10B981', borderRadius: 2 }} />
                                                Pricing Configurations
                                            </Typography>
                                            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '12px', border: '1px solid #F3F4F6', overflow: 'hidden' }}>
                                                <Table size="small">
                                                    <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                                                        <TableRow>
                                                            <TableCell sx={{ fontWeight: 700, py: 1.5 }}>PRODUCT</TableCell>
                                                            <TableCell sx={{ fontWeight: 700, py: 1.5 }}>CASH RATE</TableCell>
                                                            <TableCell sx={{ fontWeight: 700, py: 1.5 }}>CREDIT RATE</TableCell>
                                                            <TableCell sx={{ fontWeight: 700, py: 1.5 }}>UOM</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {(selectedCustomer.prices || []).length > 0 ? (
                                                            (selectedCustomer.prices || []).map((price, idx) => {
                                                                const product = products.find(p => p.id === price.productId);
                                                                return (
                                                                    <TableRow key={idx} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                                        <TableCell sx={{ fontWeight: 600, color: '#111827' }}>{product?.name || price.productId}</TableCell>
                                                                        <TableCell sx={{ fontWeight: 700, color: '#059669' }}>₹{price.cashRate}</TableCell>
                                                                        <TableCell sx={{ fontWeight: 700, color: '#2563EB' }}>₹{price.creditRate}</TableCell>
                                                                        <TableCell sx={{ color: '#6B7280', fontSize: '12px' }}>{price.uom || 'TONS'}</TableCell>
                                                                    </TableRow>
                                                                );
                                                            })
                                                        ) : (
                                                            <TableRow>
                                                                <TableCell colSpan={4} align="center" sx={{ py: 3, color: '#9CA3AF italic' }}>No pricing configured</TableCell>
                                                            </TableRow>
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </Card>
                                    )}
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
                            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: '#111827' }}>Delete Customer</Typography>
                            <Typography variant="body2" sx={{ color: '#6B7280', mb: 4, lineHeight: 1.6 }}>Are you sure you want to delete this customer? This action cannot be undone and the record will be permanently removed.</Typography>
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
        </FormikProvider>
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
