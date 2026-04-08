"use client";

import React, { useState, useEffect } from "react";
import {
    Box, Typography, Card, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Button,
    TextField, InputAdornment, Tooltip, Dialog, DialogContent,
    Select, MenuItem, Switch, FormControlLabel, TablePagination, Stack, Paper, Divider,
    Stepper, Step, StepLabel, Checkbox, CircularProgress, Grid
} from "@mui/material";
import {
    SearchOutlined as SearchIcon, AddOutlined as AddIcon, FileDownloadOutlined as DownloadIcon,
    PrintOutlined as PrintIcon, SortOutlined as SortIcon, VisibilityOutlined as ViewIcon,
    EditOutlined as EditIcon, DeleteOutline as DeleteIcon, Close as CloseIcon,
    AddCircleOutline as AddCircleIcon, AttachMoneyOutlined as PriceIcon,
    ArrowBackIos as BackIcon, ArrowForwardIos as NextIcon, CheckCircleOutlined as SaveIcon
} from "@mui/icons-material";
import { palette } from "@/theme";
import { customerApi, productApi } from "@/services/api";
import { useFormik, FormikProvider } from "formik";
import * as Yup from "yup";

const steps = ['Registry Information', 'Pricing & Sites'];

export default function CustomerPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [openModal, setOpenModal] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [customers, setCustomers] = useState([]);
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
        type: "LOCAL",
        phone: "",
        email: "",
        gstin: "",
        address: { addressLine1: "", addressLine2: "", district: "", state: "", pincode: "" },
        status: "Active",
        prices: [], // For Local
        sites: []  // For Corporate
    };

    const validationSchema = Yup.object({
        name: Yup.string().required("Customer name is required"),
        type: Yup.string().required("Type is required"),
        phone: Yup.string().required("Phone is required")
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

    const handleCloseModal = () => {
        setOpenModal(false);
        formik.resetForm();
    };

    const renderField = (label, placeholder, field, type = "text", isSelect = false, options = []) => {
        const fieldKeys = field.split('.');
        let value = formik.values;
        for (const key of fieldKeys) value = value?.[key];
        
        const error = fieldKeys.length > 1 
            ? formik.touched[fieldKeys[0]]?.[fieldKeys[1]] && formik.errors[fieldKeys[0]]?.[fieldKeys[1]]
            : formik.touched[field] && formik.errors[field];

        return (
            <Box sx={{ width: '100%', mb: 2 }}>
                <Typography sx={{ fontSize: '13px', color: '#374151', mb: 0.8, fontWeight: 600 }}>{label}</Typography>
                {isSelect ? (
                    <Select
                        fullWidth size="small"
                        name={field}
                        value={value || ""}
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
                        value={value || ""}
                        onChange={formik.handleChange}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', backgroundColor: '#F9FAFB', '& .MuiOutlinedInput-notchedOutline': { border: '1px solid #F3F4F6' } } }}
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

    const nextStep = () => {
        if (activeStep === 0) setActiveStep(1);
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
                                    <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>Name</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>Type</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>Phone</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>GSTIN</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 600, color: palette.text.primary }}>Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}><CircularProgress size={24} /></TableCell></TableRow>
                                ) : customers.length === 0 ? (
                                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}><Typography color="textSecondary">No customers found</Typography></TableCell></TableRow>
                                ) : customers.map((c) => (
                                    <TableRow key={c.id} sx={{ '&:hover': { backgroundColor: palette.background.paper } }}>
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
                                                <IconButton onClick={() => handleEditCustomer(c)} sx={{ color: '#0057FF' }} size="small"><EditIcon fontSize="small" /></IconButton>
                                                <IconButton sx={{ color: '#EF4444' }} size="small"><DeleteIcon fontSize="small" /></IconButton>
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
                        {renderStepper()}
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
                                            <Grid container spacing={3}>
                                                <Grid item xs={12} md={6}>
                                                    <Typography sx={{ fontWeight: 700, mb: 2, color: '#0057FF' }}>Basic Identification</Typography>
                                                    {renderField("Customer Full Name", "Enter name", "name")}
                                                    {renderField("Customer Type *", "Select type", "type", "text", true, [{ label: "LOCAL", value: "LOCAL" }, { label: "CORPORATE", value: "CORPORATE" }])}
                                                    {renderField("Primary Phone", "Enter phone", "phone")}
                                                    {renderField("Email Address", "Enter email", "email")}
                                                    {renderField("GSTIN Number", "Enter GSTIN", "gstin")}
                                                </Grid>
                                                <Grid item xs={12} md={6}>
                                                    <Typography sx={{ fontWeight: 700, mb: 2, color: '#0057FF' }}>Office / Billing Address</Typography>
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
            </Box>
        </FormikProvider>
    );
}
