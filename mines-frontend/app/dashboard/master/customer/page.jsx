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
    ArrowBackIos as BackIcon, ArrowForwardIos as NextIcon, CheckCircleOutlined as SaveIcon,
    AltRouteOutlined as RouteIcon
} from "@mui/icons-material";
import { palette } from "@/theme";
import { customerApi, productApi, adminApi } from "@/services/api";
import { useFormik, FormikProvider } from "formik";
import * as Yup from "yup";
import { phoneRegex, pincodeRegex, gstinRegex } from "@/utils/validationSchemas";
import Cookies from "js-cookie";

import { useApp } from "@/context/AppContext";

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

// ─── Table Cell Branch Dropdown ────────────────────────────
function TableCellBranchDropdown({ companyId, value, onChange }) {
    const [branches, setBranches] = React.useState([]);

    React.useEffect(() => {
        if (!companyId) { setBranches([]); return; }
        adminApi.getBranches(companyId).then(res => {
            if (res.success) {
                const list = res.data || [];
                setBranches(list);
            }
        }).catch(() => setBranches([]));
    }, [companyId]);

    return (
        <Select fullWidth size="small" value={value || ""} onChange={(e) => onChange(e.target.value)} variant="standard">
            <MenuItem value="">Select Branch</MenuItem>
            {branches.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
        </Select>
    );
}

// ─── Branch Name Resolver for Price Cards ────────────────────
function PriceBranchName({ branchId }) {
    const [name, setName] = React.useState('');
    React.useEffect(() => {
        if (!branchId) return;
        // We need to find the branch name - try fetching from all companies
        // This is a lightweight component that caches itself per branchId
        setName('');
    }, [branchId]);

    // Since we can't easily look up branch by ID alone, we render branchId short form
    // The actual name will be resolved from the admin API cache
    const [branchName, setBranchName] = React.useState('');
    React.useEffect(() => {
        if (!branchId) { setBranchName(''); return; }
        // Try to find branch name from any company
        const tryResolve = async () => {
            try {
                // Use a general search - find the branch across companies
                const stored = localStorage.getItem("user");
                if (stored) {
                    const user = JSON.parse(stored);
                    if (user.role === "ADMIN") {
                        const resp = await adminApi.getCompanies(0, 1000);
                        if (resp.success) {
                            for (const company of resp.data.content) {
                                const brResp = await adminApi.getBranches(company.id);
                                if (brResp.success) {
                                    const found = brResp.data.find(b => b.id === branchId);
                                    if (found) { setBranchName(found.name); return; }
                                }
                            }
                        }
                    }
                }
            } catch (e) { /* ignore */ }
        };
        tryResolve();
    }, [branchId]);

    return branchName ? <span style={{ opacity: 0.7, fontWeight: 400 }}> → {branchName}</span> : null;
}

export default function CustomerPage() {
    const userRole = typeof window !== 'undefined' ? Cookies.get("role") || "" : "";
    const { selectedCompany, selectedBranch } = useApp();
    // ─── Field Character Limits ──────────────────────────────
    const FIELD_LIMITS = {
        name: 50,
        phone: 10,
        email: 50,
        gstin: 15,
        'address.addressLine1': 100,
        'address.addressLine2': 100,
        'address.district': 50,
        'address.state': 50,
        'address.pincode': 6
    };

    const [searchQuery, setSearchQuery] = useState("");
    const [openModal, setOpenModal] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);

    // Pricing Step State
    const [pricingCompanyId, setPricingCompanyId] = useState("");
    const [pricingBranchId, setPricingBranchId] = useState("");
    const [pricingSiteIndex, setPricingSiteIndex] = useState(""); // Route mapping support
    const [pricingBranches, setPricingBranches] = useState([]);

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
            const companyId = selectedCompany?.id || selectedCompany?.companyId || null;
            const branchId = selectedBranch?.id || null;
            const response = await customerApi.getAll(page, rowsPerPage, searchQuery, companyId, branchId);
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
                }
            } catch (e) {
                console.error("Error parsing user data for company info", e);
            }
        }
        fetchInitialData();
    }, []);

    useEffect(() => {
        setPage(0);
    }, [selectedCompany, selectedBranch]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCustomers();
        }, 300);
        return () => clearTimeout(timer);
    }, [page, rowsPerPage, searchQuery, selectedCompany, selectedBranch]);

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
        const getFieldMeta = (name) => {
            const keys = name.replace(/\[(\d+)\]/g, '.$1').split('.');
            let meta = { touched: formik.touched, error: formik.errors, value: formik.values };
            for (const key of keys) {
                if (key === '') continue; // handle any double dots if they appear
                meta = {
                    touched: meta.touched?.[key],
                    error: meta.error?.[key],
                    value: meta.value?.[key]
                };
            }
            return meta;
        };

        const meta = getFieldMeta(field);
        const hasError = !!(meta.touched && meta.error);

        return (
            <Box sx={{ width: '100%', mb: 1.5 }}>
                <Typography sx={{ fontSize: '13px', color: '#374151', mb: 0.8, fontWeight: 600 }}>{label}</Typography>
                {isSelect ? (
                    <Box>
                        <Select
                            fullWidth size="small"
                            name={field}
                            value={meta.value || ""}
                            onChange={(e) => {
                                formik.handleChange(e);
                                if (field === "companyId") {
                                    formik.setFieldValue("branchId", "");
                                }
                            }}
                            onBlur={formik.handleBlur}
                            displayEmpty
                            error={hasError}
                            variant="outlined"
                            sx={{
                                borderRadius: '12px',
                                backgroundColor: '#F8FAFC',
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: hasError ? '#d32f2f' : '#E5E7EB' },
                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: hasError ? '#d32f2f' : '#CBD5E1' },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: hasError ? '#d32f2f' : '#0057FF', borderWidth: '1.5px' },
                                '& .MuiSelect-select': { color: meta.value ? '#111827' : '#9CA3AF' }
                            }}
                        >
                            <MenuItem value="">{placeholder}</MenuItem>
                            {options.map((opt, i) => <MenuItem key={i} value={opt.value}>{opt.label}</MenuItem>)}
                        </Select>
                        {hasError && <Typography sx={{ color: '#d32f2f', fontSize: '11px', mt: 0.5, ml: 1, fontWeight: 500 }}>{meta.error}</Typography>}
                    </Box>
                ) : (
                    <TextField
                        fullWidth size="small"
                        name={field}
                        type={type}
                        placeholder={placeholder}
                        variant="outlined"
                        value={meta.value || ""}
                        onChange={(e) => {
                            let val = e.target.value;
                            const limit = FIELD_LIMITS[field] || 255;

                            // Enforce character limit
                            if (val.length > limit) val = val.slice(0, limit);

                            // Uppercase (except email)
                            if (field !== 'email') {
                                val = val.toUpperCase();
                            }

                            // Field-specific character restrictions
                            const letterOnlyFields = ['address.district', 'address.state'];
                            const numericOnlyFields = ['phone', 'address.pincode'];

                            if (letterOnlyFields.includes(field)) {
                                val = val.replace(/[^A-Z\s]/g, '');
                            } else if (numericOnlyFields.includes(field)) {
                                val = val.replace(/[^0-9]/g, '');
                            } else if (field === 'gstin') {
                                val = val.replace(/[^A-Z0-9]/g, '');
                            } else if (field === 'name') {
                                val = val.replace(/[^A-Z0-9\s&.-]/g, '');
                            }

                            formik.setFieldValue(field, val);
                        }}
                        onBlur={formik.handleBlur}
                        error={hasError}
                        helperText={hasError ? meta.error : ""}
                        inputProps={{
                            maxLength: FIELD_LIMITS[field] || 255
                        }}
                        FormHelperTextProps={{ sx: { ml: 0.5, mt: 0.5, fontSize: '11px', fontWeight: 500 } }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                backgroundColor: '#F8FAFC',
                                '& fieldset': { borderColor: hasError ? '#d32f2f' : '#E5E7EB' },
                                '&:hover fieldset': { borderColor: hasError ? '#d32f2f' : '#CBD5E1' },
                                '&.Mui-focused fieldset': { borderColor: hasError ? '#d32f2f' : '#0057FF', borderWidth: '1.5px' }
                            }
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

    // When Company changes in pricing step, fetch branches
    const handlePricingCompanyChange = async (companyId) => {
        setPricingCompanyId(companyId);
        setPricingBranchId("");
        setPricingBranches([]);
        if (!companyId) return;
        try {
            const res = await adminApi.getBranches(companyId);
            if (res.success) setPricingBranches(res.data || []);
        } catch (e) { console.error(e); }
        // For Corporate: only load if a site is selected
        if (formik.values.type === 'CORPORATE' && pricingSiteIndex !== "") {
            handleLoadPrices(companyId, null, pricingSiteIndex);
        }
    };

    // Auto-populate all products for a Company+Branch (LOCAL) or Company (CORPORATE)
    const handleLoadPrices = (companyId, branchId, siteIdx = "") => {
        if (!companyId) return;
        const isLocal = formik.values.type === 'LOCAL';
        if (isLocal && !branchId) return;

        const isCorporateSite = !isLocal && siteIdx !== "";
        const targetPrices = isCorporateSite ? (formik.values.sites[siteIdx]?.prices || []) : formik.values.prices;

        // Check if prices already exist for this company+branch combo
        const existingPrices = targetPrices.filter(p => {
            if (isLocal) return p.companyId === companyId && p.branchId === branchId;
            return p.companyId === companyId;
        });

        // Find products that don't have a price row yet
        const existingProductIds = existingPrices.map(p => p.productId);
        const newPrices = products
            .filter(pr => !existingProductIds.includes(pr.id))
            .map(pr => ({
                productId: pr.id,
                companyId: companyId,
                branchId: isLocal ? branchId : null,
                rate: 0, cashRate: 0, creditRate: 0, transportRate: 0,
                uom: "TONS", tonnageLimit: 0, gstInclusive: false
            }));

        if (newPrices.length > 0) {
            if (isCorporateSite) {
                formik.setFieldValue(`sites[${siteIdx}].prices`, [...targetPrices, ...newPrices]);
            } else {
                formik.setFieldValue("prices", [...formik.values.prices, ...newPrices]);
            }
        }
    };

    // Remove a price configuration card
    const handleRemovePriceCard = (companyId, branchId) => {
        const isLocal = formik.values.type === 'LOCAL';
        const isCorporateSite = !isLocal && pricingSiteIndex !== "";
        const targetPrices = isCorporateSite ? (formik.values.sites[pricingSiteIndex]?.prices || []) : formik.values.prices;

        const remaining = targetPrices.filter(p => {
            if (isLocal) return !(p.companyId === companyId && p.branchId === branchId);
            return p.companyId !== companyId;
        });
        
        if (isCorporateSite) {
            formik.setFieldValue(`sites[${pricingSiteIndex}].prices`, remaining);
        } else {
            formik.setFieldValue("prices", remaining);
        }
    };

    // Group prices by company+branch for display
    const getGroupedPrices = () => {
        const groups = {};
        const isLocal = formik.values.type === 'LOCAL';
        const companiesList = allCompanies.length > 0 ? allCompanies : userCompanyInfo.map(c => ({ id: c.companyId, name: c.companyName }));
        const isCorporateSite = !isLocal && pricingSiteIndex !== "";
        const targetPrices = isCorporateSite ? (formik.values.sites[pricingSiteIndex]?.prices || []) : formik.values.prices;

        targetPrices.forEach((p, idx) => {
            const key = isLocal ? `${p.companyId}__${p.branchId}` : `${p.companyId}`;
            if (!groups[key]) {
                const company = companiesList.find(c => c.id === p.companyId);
                groups[key] = {
                    companyId: p.companyId,
                    branchId: p.branchId,
                    companyName: company?.name || 'Unknown',
                    branchName: '', // will be resolved
                    items: []
                };
            }
            groups[key].items.push({ ...p, _idx: idx });
        });
        return Object.values(groups);
    };

    const nextStep = async () => {
        if (activeStep === 0) {
            const errors = await formik.validateForm();
            if (Object.keys(errors).length > 0) {
                // Focus on errors
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
            // If Corporate, auto-select first site if none selected
            if (formik.values.type === 'CORPORATE' && pricingSiteIndex === "" && formik.values.sites.length > 0) {
                setPricingSiteIndex(0);
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
                                            <>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: "10px 20px" }}>
                                                {/* General Information */}
                                                <Box sx={{ width: '100%', mb: 1 }}><Typography sx={{ fontWeight: 800, fontSize: '16px', color: '#111827' }}>General Information</Typography></Box>
                                                <Box sx={{ width: 'calc(50% - 10px)' }}>{renderField("Customer Name *", "Enter full name", "name")}</Box>
                                                <Box sx={{ width: 'calc(50% - 10px)' }}>{renderField("Customer Type *", "Select type", "type", "text", true, [{ label: "LOCAL", value: "LOCAL" }, { label: "CORPORATE", value: "CORPORATE" }])}</Box>
                                                <Box sx={{ width: 'calc(50% - 10px)' }}>{renderField("Primary Phone *", "Enter phone number", "phone")}</Box>
                                                <Box sx={{ width: 'calc(50% - 10px)' }}>{renderField("Email Address", "Enter email address", "email")}</Box>
                                                <Box sx={{ width: 'calc(50% - 10px)' }}>{renderField("GSTIN Number", "Enter GSTIN", "gstin")}</Box>

                                                {/* Address Details */}
                                                <Box sx={{ width: '100%', mt: 2, mb: 1 }}><Typography sx={{ fontWeight: 800, fontSize: '16px', color: '#111827' }}>Address Details</Typography></Box>
                                                <Box sx={{ width: '100%' }}>{renderField("Address Line 1 *", "Room/Building/Street", "address.addressLine1")}</Box>
                                                <Box sx={{ width: '100%' }}>{renderField("Address Line 2", "Area/Landmark (optional)", "address.addressLine2")}</Box>
                                                <Box sx={{ width: 'calc(33.33% - 13.33px)' }}>{renderField("District *", "City/District", "address.district")}</Box>
                                                <Box sx={{ width: 'calc(33.33% - 13.33px)' }}>{renderField("State *", "Select state", "address.state")}</Box>
                                                <Box sx={{ width: 'calc(33.33% - 13.33px)' }}>{renderField("Pincode *", "6-digit code", "address.pincode")}</Box>
                                                </Box>

                                                {/* Client Sites for Corporate Customers */}
                                                {formik.values.type === 'CORPORATE' && (
                                                    <Box sx={{ width: '100%', mt: 4, mb: 1 }}>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                            <Typography sx={{ fontWeight: 800, fontSize: '16px', color: '#111827' }}>Destination Sites (Client Sites)</Typography>
                                                            <Button size="small" startIcon={<AddIcon />} variant="outlined" onClick={handleAddSite} sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}>
                                                                Add Site
                                                            </Button>
                                                        </Box>
                                                        {formik.values.sites.length === 0 ? (
                                                            <Box sx={{ p: 3, textAlign: 'center', border: '1px dashed #E5E7EB', borderRadius: '12px', bgcolor: '#F9FAFB' }}>
                                                                <Typography sx={{ color: '#6B7280', fontSize: '13px', fontWeight: 500 }}>No sites added. Click "Add Site" to define a destination for this corporate customer.</Typography>
                                                            </Box>
                                                        ) : (
                                                            <Stack spacing={2}>
                                                                {formik.values.sites.map((site, index) => (
                                                                    <Card key={index} sx={{ p: 2, borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: 'none', position: 'relative' }}>
                                                                        <IconButton size="small" onClick={() => {
                                                                            const newSites = [...formik.values.sites];
                                                                            newSites.splice(index, 1);
                                                                            formik.setFieldValue("sites", newSites);
                                                                        }} sx={{ position: 'absolute', top: 8, right: 8, color: '#EF4444' }}>
                                                                            <DeleteIcon fontSize="small" />
                                                                        </IconButton>
                                                                        <Typography sx={{ fontWeight: 700, fontSize: '14px', mb: 2, color: '#374151' }}>Site {index + 1}</Typography>
                                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: "10px 20px" }}>
                                                                            <Box sx={{ width: '100%' }}>{renderField(`Site Name *`, "Factory/Plant Name", `sites[${index}].siteName`)}</Box>
                                                                            <Box sx={{ width: '100%' }}>{renderField(`Address Line 1 *`, "Street/Area", `sites[${index}].address.addressLine1`)}</Box>
                                                                            <Box sx={{ width: 'calc(33.33% - 13.33px)' }}>{renderField(`District *`, "District", `sites[${index}].address.district`)}</Box>
                                                                            <Box sx={{ width: 'calc(33.33% - 13.33px)' }}>{renderField(`State *`, "State", `sites[${index}].address.state`)}</Box>
                                                                            <Box sx={{ width: 'calc(33.33% - 13.33px)' }}>{renderField(`Pincode *`, "Pincode", `sites[${index}].address.pincode`)}</Box>
                                                                        </Box>
                                                                    </Card>
                                                                ))}
                                                            </Stack>
                                                        )}
                                                    </Box>
                                                )}
                                            </>
                                        ) : (
                                            <Box>
                                                {/* ── Filter / Select Company & Branch ── */}
                                                <Card sx={{ mb: 3, p: 2.5, borderRadius: '16px', bgcolor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                                                    <Stack direction="row" spacing={2} alignItems="flex-end">
                                                        <Box sx={{ flex: 1 }}>
                                                            <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#64748B', mb: 0.5 }}>Source Company</Typography>
                                                            <Select fullWidth size="small" value={pricingCompanyId}
                                                                onChange={(e) => handlePricingCompanyChange(e.target.value)}
                                                                displayEmpty
                                                                sx={{ borderRadius: '10px', bgcolor: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E5E7EB' } }}>
                                                                <MenuItem value="">Select Company...</MenuItem>
                                                                {allCompanies.length > 0 ? allCompanies.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)
                                                                    : userCompanyInfo.map(c => <MenuItem key={c.companyId} value={c.companyId}>{c.companyName}</MenuItem>)}
                                                            </Select>
                                                        </Box>
                                                        {formik.values.type === 'LOCAL' ? (
                                                            <Box sx={{ flex: 1 }}>
                                                                <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#64748B', mb: 0.5 }}>Branch</Typography>
                                                                <Select fullWidth size="small" value={pricingBranchId}
                                                                    onChange={(e) => {
                                                                        setPricingBranchId(e.target.value);
                                                                        if (e.target.value && pricingCompanyId) {
                                                                            handleLoadPrices(pricingCompanyId, e.target.value);
                                                                        }
                                                                    }}
                                                                    displayEmpty disabled={!pricingCompanyId}
                                                                    sx={{ borderRadius: '10px', bgcolor: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E5E7EB' } }}>
                                                                    <MenuItem value="">Select Branch...</MenuItem>
                                                                    {pricingBranches.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
                                                                </Select>
                                                            </Box>
                                                        ) : (
                                                            <Box sx={{ flex: 1 }}>
                                                                <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#64748B', mb: 0.5 }}>Destination Site (Route Override)</Typography>
                                                                <Select fullWidth size="small" value={pricingSiteIndex}
                                                                    onChange={(e) => {
                                                                        setPricingSiteIndex(e.target.value);
                                                                        if (pricingCompanyId) handleLoadPrices(pricingCompanyId, null, e.target.value);
                                                                    }}
                                                                    displayEmpty
                                                                    sx={{ borderRadius: '10px', bgcolor: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E5E7EB' } }}>
                                                                    <MenuItem value="" disabled>Select Destination Site...</MenuItem>
                                                                    {formik.values.sites.map((s, idx) => (
                                                                        <MenuItem key={idx} value={idx}>{s.siteName || `Site ${idx + 1}`}</MenuItem>
                                                                    ))}
                                                                </Select>
                                                                {formik.values.sites.length === 0 && (
                                                                    <Typography sx={{ color: '#EF4444', fontSize: '11px', mt: 0.5 }}>Please add atleast one site in Step 1</Typography>
                                                                )}
                                                            </Box>
                                                        )}
                                                    </Stack>
                                                </Card>

                                                {/* ── All Saved Price Cards ── */}
                                                {(() => {
                                                    const isLocal = formik.values.type === 'LOCAL';
                                                    const grouped = getGroupedPrices();
                                                    const basePath = (!isLocal && pricingSiteIndex !== "") ? `sites[${pricingSiteIndex}].prices` : `prices`;

                                                    if (grouped.length === 0) {
                                                        return (
                                                            <Box sx={{ textAlign: 'center', py: 6, borderRadius: '16px', border: '1px dashed #CBD5E1', bgcolor: '#fff' }}>
                                                                <PriceIcon sx={{ fontSize: 48, color: '#CBD5E1', mb: 1 }} />
                                                                <Typography sx={{ color: '#94A3B8', fontWeight: 600, fontSize: '15px' }}>No pricing linked yet</Typography>
                                                                <Typography sx={{ color: '#CBD5E1', fontSize: '13px', mt: 0.5 }}>Link your first company & branch using the tool above</Typography>
                                                            </Box>
                                                        );
                                                    }

                                                    return (
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                                            {grouped.map((group, groupIdx) => {
                                                                const isActive = isLocal 
                                                                    ? (group.companyId === pricingCompanyId && group.branchId === pricingBranchId)
                                                                    : (group.companyId === pricingCompanyId);

                                                                return (
                                                                    <Card key={groupIdx} sx={{ 
                                                                        borderRadius: '16px', 
                                                                        overflow: 'hidden', 
                                                                        border: isActive ? '2px solid #0057FF' : '1px solid #E2E8F0', 
                                                                        boxShadow: isActive ? '0 8px 32px rgba(0,87,255,0.1)' : '0 2px 8px rgba(0,0,0,0.04)',
                                                                        transition: 'all 0.3s ease'
                                                                    }}>
                                                                        {/* Card Header */}
                                                                        <Box sx={{ 
                                                                            px: 3, py: 1.5, 
                                                                            background: isActive ? 'linear-gradient(135deg, #0057FF 0%, #003499 100%)' : 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', 
                                                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
                                                                        }}>
                                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#22C55E' }} />
                                                                                <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>
                                                                                    {group.companyName}
                                                                                    {isLocal && <PriceBranchName branchId={group.branchId} />}
                                                                                    {!isLocal && pricingSiteIndex !== "" && (
                                                                                        <span style={{ opacity: 0.7, fontWeight: 400 }}> → {formik.values.sites[pricingSiteIndex]?.siteName || 'Site'}</span>
                                                                                    )}
                                                                                </Typography>
                                                                                <Box sx={{ px: 1.5, py: 0.3, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.15)', fontSize: '11px', fontWeight: 600, color: '#F8FAFC' }}>
                                                                                    {group.items.length} products
                                                                                </Box>
                                                                            </Box>
                                                                            <IconButton size="small" onClick={() => handleRemovePriceCard(group.companyId, group.branchId)} sx={{ color: '#EF4444', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
                                                                                <DeleteIcon fontSize="small" sx={{ color: isActive ? '#fff' : '#EF4444' }} />
                                                                            </IconButton>
                                                                        </Box>
                                                                        {/* Product Rows */}
                                                                        <TableContainer>
                                                                            <Table size="small">
                                                                                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                                                                                    <TableRow>
                                                                                        <TableCell sx={{ fontWeight: 700, fontSize: '11px', color: '#64748B', letterSpacing: '0.5px' }}>PRODUCT</TableCell>
                                                                                        {isLocal ? (
                                                                                            <>
                                                                                                <TableCell sx={{ fontWeight: 700, fontSize: '11px', color: '#64748B', letterSpacing: '0.5px' }}>CASH RATE (₹)</TableCell>
                                                                                                <TableCell sx={{ fontWeight: 700, fontSize: '11px', color: '#64748B', letterSpacing: '0.5px' }}>CREDIT RATE (₹)</TableCell>
                                                                                            </>
                                                                                        ) : (
                                                                                            <>
                                                                                                <TableCell sx={{ fontWeight: 700, fontSize: '11px', color: '#64748B', letterSpacing: '0.5px' }}>RATE (₹)</TableCell>
                                                                                                <TableCell sx={{ fontWeight: 700, fontSize: '11px', color: '#64748B', letterSpacing: '0.5px' }}>TRANSPORT (₹)</TableCell>
                                                                                            </>
                                                                                        )}
                                                                                        <TableCell sx={{ fontWeight: 700, fontSize: '11px', color: '#64748B', letterSpacing: '0.5px' }}>UOM</TableCell>
                                                                                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '11px', color: '#64748B', letterSpacing: '0.5px' }}>GST INCL.</TableCell>
                                                                                    </TableRow>
                                                                                </TableHead>
                                                                                <TableBody>
                                                                                    {group.items.map((item, iIdx) => {
                                                                                        const productInfo = products.find(pr => pr.id === item.productId);
                                                                                        const realIdx = item._idx;
                                                                                        return (
                                                                                            <TableRow key={iIdx} sx={{ '&:hover': { bgcolor: '#F8FAFC' }, '&:last-child td': { borderBottom: 0 } }}>
                                                                                                <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '13px', width: '30%' }}>
                                                                                                    {productInfo?.name || 'Unknown Product'}
                                                                                                </TableCell>
                                                                                                {isLocal ? (
                                                                                                    <>
                                                                                                        <TableCell sx={{ width: '20%' }}>
                                                                                                            <TextField fullWidth size="small" type="number" placeholder="0"
                                                                                                                value={item.cashRate || ''}
                                                                                                                onChange={(e) => formik.setFieldValue(`${basePath}[${realIdx}].cashRate`, parseFloat(e.target.value) || 0)}
                                                                                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#fff' } }} />
                                                                                                        </TableCell>
                                                                                                        <TableCell sx={{ width: '20%' }}>
                                                                                                            <TextField fullWidth size="small" type="number" placeholder="0"
                                                                                                                value={item.creditRate || ''}
                                                                                                                onChange={(e) => formik.setFieldValue(`${basePath}[${realIdx}].creditRate`, parseFloat(e.target.value) || 0)}
                                                                                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#fff' } }} />
                                                                                                        </TableCell>
                                                                                                    </>
                                                                                                ) : (
                                                                                                    <>
                                                                                                        <TableCell sx={{ width: '20%' }}>
                                                                                                            <TextField fullWidth size="small" type="number" placeholder="0"
                                                                                                                value={item.rate || ''}
                                                                                                                onChange={(e) => formik.setFieldValue(`${basePath}[${realIdx}].rate`, parseFloat(e.target.value) || 0)}
                                                                                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#fff' } }} />
                                                                                                        </TableCell>
                                                                                                        <TableCell sx={{ width: '20%' }}>
                                                                                                            <TextField fullWidth size="small" type="number" placeholder="0"
                                                                                                                value={item.transportRate || ''}
                                                                                                                onChange={(e) => formik.setFieldValue(`${basePath}[${realIdx}].transportRate`, parseFloat(e.target.value) || 0)}
                                                                                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#fff' } }} />
                                                                                                        </TableCell>
                                                                                                    </>
                                                                                                )}
                                                                                                <TableCell sx={{ width: '15%' }}>
                                                                                                    <Select fullWidth size="small" value={item.uom || 'TONS'}
                                                                                                        onChange={(e) => formik.setFieldValue(`${basePath}[${realIdx}].uom`, e.target.value)}
                                                                                                        sx={{ borderRadius: '8px', bgcolor: '#fff' }}>
                                                                                                        <MenuItem value="TONS">TONS</MenuItem>
                                                                                                        <MenuItem value="UNIT">UNIT</MenuItem>
                                                                                                    </Select>
                                                                                                </TableCell>
                                                                                                <TableCell align="center">
                                                                                                    <Checkbox size="small" checked={!!item.gstInclusive}
                                                                                                        onChange={(e) => formik.setFieldValue(`${basePath}[${realIdx}].gstInclusive`, e.target.checked)} />
                                                                                                </TableCell>
                                                                                            </TableRow>
                                                                                        );
                                                                                    })}
                                                                                </TableBody>
                                                                            </Table>
                                                                        </TableContainer>
                                                                    </Card>
                                                                );
                                                            })}
                                                        </Box>
                                                    );
                                                })()}
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
                                                Pricing Configurations
                                            </Typography>
                                            {(() => {
                                                const sites = selectedCustomer.sites || [];
                                                const companiesList = allCompanies.length > 0 ? allCompanies : userCompanyInfo.map(c => ({ id: c.companyId, name: c.companyName }));
                                                
                                                let hasAnyPrices = false;

                                                // Build an array of entities to render (Sites only for Corporate)
                                                const entitesToRender = sites.map(s => ({ id: s.id || s.siteName, title: s.siteName, items: s.prices || [] }));

                                                const cards = entitesToRender.flatMap((entity, sIdx) => {
                                                    const entityPrices = entity.items;
                                                    if (!entityPrices || entityPrices.length === 0) return [];
                                                    
                                                    const groups = {};
                                                    entityPrices.forEach(p => {
                                                        const key = `${p.companyId}__${p.branchId}`;
                                                        if (!groups[key]) groups[key] = { companyId: p.companyId, branchId: p.branchId, items: [] };
                                                        groups[key].items.push(p);
                                                    });
                                                    
                                                    const groupList = Object.values(groups).filter(g =>
                                                        g.items.some(p => (p.rate || 0) > 0 || (p.transportRate || 0) > 0)
                                                    );

                                                    if (groupList.length > 0) hasAnyPrices = true;

                                                    return groupList.map((group, gIdx) => {
                                                        const companyName = companiesList.find(c => c.id === group.companyId)?.name 
                                                                         || selectedCustomer.companyName 
                                                                         || companiesList[0]?.name 
                                                                         || 'Unknown Company';
                                                        return (
                                                            <Card key={`entity-${sIdx}-${gIdx}`} sx={{ mb: 2, borderRadius: '12px', overflow: 'hidden', border: '1px solid #E2E8F0', opacity: entity.id === 'base' ? 0.8 : 1 }}>
                                                                <Box sx={{ px: 2.5, py: 1.5, background: entity.id === 'base' ? 'linear-gradient(135deg, #1E293B 0%, #334155 100%)' : 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
                                                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#22C55E' }} />
                                                                    <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                        {companyName} <PriceBranchName branchId={group.branchId} />
                                                                    </Typography>
                                                                    <Box sx={{ color: '#94A3B8' }}>→</Box>
                                                                    <Typography sx={{ color: '#38BDF8', fontWeight: 700, fontSize: '13px' }}>
                                                                        {entity.title}
                                                                    </Typography>
                                                                    <Box sx={{ px: 1, py: 0.2, ml: 'auto', borderRadius: '6px', bgcolor: 'rgba(255,255,255,0.15)', fontSize: '10px', fontWeight: 600, color: '#94A3B8' }}>
                                                                        {group.items.length} products
                                                                    </Box>
                                                                </Box>
                                                                <TableContainer>
                                                                    <Table size="small">
                                                                        <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                                                                            <TableRow>
                                                                                <TableCell sx={{ fontWeight: 700, fontSize: '10px', py: 1 }}>PRODUCT</TableCell>
                                                                                <TableCell sx={{ fontWeight: 700, fontSize: '10px', py: 1 }}>RATE</TableCell>
                                                                                <TableCell sx={{ fontWeight: 700, fontSize: '10px', py: 1 }}>TRANSPORT</TableCell>
                                                                                <TableCell sx={{ fontWeight: 700, fontSize: '10px', py: 1 }}>UOM</TableCell>
                                                                            </TableRow>
                                                                        </TableHead>
                                                                        <TableBody>
                                                                            {group.items.map((p, pIdx) => {
                                                                                const product = products.find(pr => pr.id === p.productId);
                                                                                return (
                                                                                    <TableRow key={pIdx} sx={{ '&:last-child td': { border: 0 } }}>
                                                                                        <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#111827' }}>{product?.name || p.productId}</TableCell>
                                                                                        <TableCell sx={{ fontWeight: 700, fontSize: '12px', color: '#059669' }}>₹{p.rate || 0}</TableCell>
                                                                                        <TableCell sx={{ fontSize: '12px', color: '#6B7280' }}>{p.transportRate > 0 ? `₹${p.transportRate}` : '—'}</TableCell>
                                                                                        <TableCell sx={{ fontSize: '11px', color: '#9CA3AF' }}>{p.uom || 'TONS'}</TableCell>
                                                                                    </TableRow>
                                                                                );
                                                                            })}
                                                                        </TableBody>
                                                                    </Table>
                                                                </TableContainer>
                                                            </Card>
                                                        );
                                                    });
                                                });
                                                
                                                if (!hasAnyPrices) {
                                                    return (
                                                        <Box sx={{ textAlign: 'center', py: 3, color: '#9CA3AF' }}>
                                                            <Typography sx={{ fontStyle: 'italic', fontSize: '13px' }}>No pricing configurations found</Typography>
                                                        </Box>
                                                    );
                                                }
                                                return cards;

                                            })()}
                                        </Card>
                                    ) : (
                                        <Card sx={{ flex: '1 1 100%', borderRadius: '16px', p: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
                                            <Typography sx={{ fontWeight: 800, fontSize: '16px', color: '#111827', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box sx={{ width: 4, height: 16, backgroundColor: '#10B981', borderRadius: 2 }} />
                                                Pricing Configurations
                                            </Typography>
                                            {(() => {
                                                const prices = selectedCustomer.prices || [];
                                                const companiesList = allCompanies.length > 0 ? allCompanies : userCompanyInfo.map(c => ({ id: c.companyId, name: c.companyName }));
                                                // Group by companyId + branchId
                                                const groups = {};
                                                prices.forEach(p => {
                                                    const key = `${p.companyId}__${p.branchId}`;
                                                    if (!groups[key]) groups[key] = { companyId: p.companyId, branchId: p.branchId, items: [] };
                                                    groups[key].items.push(p);
                                                });
                                                const groupList = Object.values(groups).filter(g =>
                                                    g.items.some(p => (p.cashRate || 0) > 0 || (p.creditRate || 0) > 0)
                                                );
                                                if (groupList.length === 0) {
                                                    return (
                                                        <Box sx={{ textAlign: 'center', py: 3, color: '#9CA3AF' }}>
                                                            <Typography sx={{ fontStyle: 'italic', fontSize: '13px' }}>No pricing configured</Typography>
                                                        </Box>
                                                    );
                                                }
                                                return groupList.map((group, gIdx) => {
                                                    const companyName = companiesList.find(c => c.id === group.companyId)?.name || 'Unknown Company';
                                                    return (
                                                        <Card key={gIdx} sx={{ mb: 2, borderRadius: '12px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                                                            <Box sx={{ px: 2.5, py: 1, background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#22C55E' }} />
                                                                <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '13px' }}>
                                                                    {companyName}
                                                                    <PriceBranchName branchId={group.branchId} />
                                                                </Typography>
                                                                <Box sx={{ px: 1, py: 0.2, borderRadius: '6px', bgcolor: 'rgba(255,255,255,0.15)', fontSize: '10px', fontWeight: 600, color: '#94A3B8' }}>
                                                                    {group.items.length} products
                                                                </Box>
                                                            </Box>
                                                            <TableContainer>
                                                                <Table size="small">
                                                                    <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                                                                        <TableRow>
                                                                            <TableCell sx={{ fontWeight: 700, fontSize: '10px', py: 1 }}>PRODUCT</TableCell>
                                                                            <TableCell sx={{ fontWeight: 700, fontSize: '10px', py: 1 }}>CASH RATE</TableCell>
                                                                            <TableCell sx={{ fontWeight: 700, fontSize: '10px', py: 1 }}>CREDIT RATE</TableCell>
                                                                            <TableCell sx={{ fontWeight: 700, fontSize: '10px', py: 1 }}>UOM</TableCell>
                                                                        </TableRow>
                                                                    </TableHead>
                                                                    <TableBody>
                                                                        {group.items.map((price, pIdx) => {
                                                                            const product = products.find(p => p.id === price.productId);
                                                                            return (
                                                                                <TableRow key={pIdx} sx={{ '&:last-child td': { border: 0 } }}>
                                                                                    <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#111827' }}>{product?.name || price.productId}</TableCell>
                                                                                    <TableCell sx={{ fontWeight: 700, fontSize: '12px', color: '#059669' }}>₹{price.cashRate || 0}</TableCell>
                                                                                    <TableCell sx={{ fontWeight: 700, fontSize: '12px', color: '#2563EB' }}>₹{price.creditRate || 0}</TableCell>
                                                                                    <TableCell sx={{ fontSize: '11px', color: '#9CA3AF' }}>{price.uom || 'TONS'}</TableCell>
                                                                                </TableRow>
                                                                            );
                                                                        })}
                                                                    </TableBody>
                                                                </Table>
                                                            </TableContainer>
                                                        </Card>
                                                    );
                                                });
                                            })()}
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
