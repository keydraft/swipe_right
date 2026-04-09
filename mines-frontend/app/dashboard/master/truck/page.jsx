"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    Box, Typography, Card, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Button,
    TextField, InputAdornment, Tooltip, Dialog, DialogContent,
    Select, MenuItem, CircularProgress, Grid, Divider, TablePagination,
    Snackbar, Alert
} from "@mui/material";
import {
    SearchOutlined as SearchIcon, AddOutlined as AddIcon,
    VisibilityOutlined as ViewIcon, EditOutlined as EditIcon,
    DeleteOutline as DeleteIcon, FileDownloadOutlined as DownloadIcon,
    PrintOutlined as PrintIcon, SortOutlined as SortIcon,
    CloudUploadOutlined as UploadIcon
} from "@mui/icons-material";
import { palette } from "@/theme";
import { truckApi, transporterApi, customerApi } from "@/services/api";
import { useFormik } from "formik";
import * as Yup from "yup";

export default function TruckPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [openModal, setOpenModal] = useState(false);
    const [trucks, setTrucks] = useState([]);
    const [transporters, setTransporters] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);

    // Notification State
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
    const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

    // Delete Confirmation State
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);

    // View Details State
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedTruck, setSelectedTruck] = useState(null);

    // File state
    const [selectedFiles, setSelectedFiles] = useState({
        rcFront: null,
        rcBack: null,
        insurance: null,
        permit: null,
        fc: null
    });
    const [existingFiles, setExistingFiles] = useState({
        rcFront: null,
        rcBack: null,
        insurance: null,
        permit: null,
        fc: null
    });

    // Pagination State
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalElements, setTotalElements] = useState(0);

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            const [transResp, custResp] = await Promise.all([
                transporterApi.getAll(0, 1000),
                customerApi.getAll(0, 1000)
            ]);

            if (transResp.success) setTransporters(transResp.data.content || []);
            if (custResp.success) setCustomers(custResp.data.content || []);

            await fetchTrucks();
        } catch (error) {
            console.error("Error fetching initial data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTrucks = async () => {
        try {
            const response = await truckApi.getAll(page, rowsPerPage, searchQuery);
            if (response.success) {
                setTrucks(response.data.content);
                setTotalElements(response.data.totalElements);
            }
        } catch (error) {
            console.error("Error fetching trucks:", error);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTrucks();
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

    const truckValidationSchema = Yup.object({
        truckNo: Yup.string().required("Truck number is required"),
        ownershipType: Yup.string().required("Ownership type is required"),
        tareWeight: Yup.number().typeError("Tare weight must be a number").required("Tare weight is required"),
        transporterId: Yup.string().when('ownershipType', {
            is: 'TRANSPORTER',
            then: (schema) => schema.required("Transporter selection is required"),
            otherwise: (schema) => schema.notRequired()
        }),
        customerId: Yup.string().when('ownershipType', {
            is: 'CUSTOMER',
            then: (schema) => schema.required("Customer selection is required"),
            otherwise: (schema) => schema.notRequired()
        })
    });

    const formik = useFormik({
        initialValues: {
            truckNo: "",
            ownershipType: "OWN",
            registerName: "",
            transporterId: "",
            customerId: "",
            make: "",
            model: "",
            engineNo: "",
            chassisNo: "",
            tareWeight: "",
            usageType: "Commercial",
            fuelType: "Diesel",
            insuranceValidity: "",
            permitValidity: "",
            fcValidity: ""
        },
        validationSchema: truckValidationSchema,
        onSubmit: async (values) => {
            try {
                const payload = {
                    ...values,
                    transporterId: values.ownershipType === "TRANSPORTER" ? values.transporterId : null,
                    customerId: values.ownershipType === "CUSTOMER" ? values.customerId : null,
                    tareWeight: parseFloat(values.tareWeight) || 0
                };

                const response = await truckApi.upsert(payload, selectedFiles, editingId);
                if (response.success) {
                    setShowSuccess(true);
                    setTimeout(() => {
                        handleCloseModal();
                        fetchTrucks();
                    }, 2000);
                }
            } catch (error) {
                console.error("Error saving truck:", error);
                setSnackbar({ open: true, message: "Error saving truck", severity: "error" });
            }
        },
    });

    const handleFileChange = (field, file) => {
        setSelectedFiles(prev => ({ ...prev, [field]: file }));
    };

    const handleOpenModal = () => {
        setIsEditing(false);
        setEditingId(null);
        formik.resetForm();
        setSelectedFiles({ rcFront: null, rcBack: null, insurance: null, permit: null, fc: null });
        setExistingFiles({ rcFront: null, rcBack: null, insurance: null, permit: null, fc: null });
        setOpenModal(true);
        setShowSuccess(false);
    };

    const handleEditTruck = (truck) => {
        setIsEditing(true);
        setEditingId(truck.id);
        formik.setValues({
            truckNo: truck.truckNo || "",
            ownershipType: truck.ownershipType || "OWN",
            registerName: truck.registerName || "",
            transporterId: truck.transporterId || "",
            customerId: truck.customerId || "",
            make: truck.make || "",
            model: truck.model || "",
            engineNo: truck.engineNo || "",
            chassisNo: truck.chassisNo || "",
            tareWeight: truck.tareWeight || "",
            usageType: truck.usageType || "Commercial",
            fuelType: truck.fuelType || "Diesel",
            insuranceValidity: truck.insuranceValidity || "",
            permitValidity: truck.permitValidity || "",
            fcValidity: truck.fcValidity || ""
        });
        setSelectedFiles({ rcFront: null, rcBack: null, insurance: null, permit: null, fc: null });
        setExistingFiles({
            rcFront: truck.rcFrontPath,
            rcBack: truck.rcBackPath,
            insurance: truck.insurancePath,
            permit: truck.permitPath,
            fc: truck.fcPath
        });
        setOpenModal(true);
        setShowSuccess(false);
    };

    const handleViewTruck = (truck) => {
        setSelectedTruck(truck);
        setViewModalOpen(true);
    };

    const handleDeleteClick = (id) => {
        setDeleteTargetId(id);
        setDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        try {
            const response = await truckApi.delete(deleteTargetId);
            if (response.success) {
                setSnackbar({ open: true, message: "Truck deleted successfully", severity: "success" });
                fetchTrucks();
            } else {
                setSnackbar({ open: true, message: response.message || "Failed to delete truck", severity: "error" });
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
        setSelectedFiles({ rcFront: null, rcBack: null, insurance: null, permit: null, fc: null });
        setExistingFiles({ rcFront: null, rcBack: null, insurance: null, permit: null, fc: null });
    };

    const renderUploadButton = (field, label) => {
        const hasExisting = !!existingFiles[field];
        const isSelected = !!selectedFiles[field];
        const serverPath = "http://localhost:8080/uploads/employees/";

        return (
            <Box sx={{ display: 'flex', gap: 1, width: '100%', alignItems: 'center' }}>
                <Button
                    component="label"
                    variant="contained"
                    disableElevation
                    startIcon={<UploadIcon />}
                    sx={{
                        flex: 1,
                        background: isSelected || hasExisting
                            ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                            : 'linear-gradient(135deg, #0057FF 0%, #003499 100%)',
                        textTransform: 'none',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        py: 1,
                        whiteSpace: 'nowrap',
                        height: '40px',
                        '&:hover': { background: isSelected || hasExisting ? '#059669' : '#003499' }
                    }}
                >
                    {isSelected || hasExisting ? "File Uploaded" : label}
                    <input hidden type="file" onChange={(e) => handleFileChange(field, e.target.files[0])} />
                </Button>
                {(hasExisting || isSelected) && (
                    <Button
                        variant="outlined"
                        onClick={() => {
                            if (isSelected) {
                                const fileUrl = URL.createObjectURL(selectedFiles[field]);
                                window.open(fileUrl, '_blank');
                            } else {
                                window.open(`${serverPath}${existingFiles[field]}`, '_blank');
                            }
                        }}
                        sx={{
                            minWidth: '70px',
                            height: '40px',
                            borderRadius: '8px',
                            borderColor: '#10B981',
                            color: '#10B981',
                            fontWeight: 700,
                            fontSize: '12px',
                            textTransform: 'uppercase',
                            '&:hover': { borderColor: '#059669', backgroundColor: '#F0FDF4' }
                        }}
                    >
                        VIEW
                    </Button>
                )}
                {!hasExisting && !isSelected && <Box sx={{ width: '70px', display: { xs: 'none', md: 'block' } }} />}
            </Box>
        );
    };

    const renderField = (label, placeholder, isSelect = false, type = "text", field = "", options = []) => {
        const value = formik.values[field] || "";
        const error = formik.touched[field] && formik.errors[field];

        return (
            <Box sx={{ width: '100%' }}>
                <Typography sx={{ fontSize: '13px', color: '#374151', mb: 0.8, fontWeight: 600 }}>{label}</Typography>
                {isSelect ? (
                    <Select
                        fullWidth size="small"
                        name={field}
                        value={value}
                        onChange={(e) => {
                            formik.handleChange(e);
                            if (field === "ownershipType") {
                                formik.setFieldValue("transporterId", "");
                                formik.setFieldValue("customerId", "");
                            }
                        }}
                        onBlur={formik.handleBlur}
                        error={!!error}
                        displayEmpty
                        sx={{ borderRadius: '12px', backgroundColor: '#F9FAFB', border: '1px solid #F3F4F6', '& .MuiSelect-select': { color: value ? '#111827' : '#9CA3AF' }, '& .MuiOutlinedInput-notchedOutline': { border: 'none' } }}
                    >
                        <MenuItem value="">{placeholder}</MenuItem>
                        {options.map((opt, i) => (
                            <MenuItem key={i} value={opt.value}>{opt.label}</MenuItem>
                        ))}
                    </Select>
                ) : (
                    <TextField
                        fullWidth size="small"
                        name={field}
                        type={type}
                        placeholder={placeholder}
                        variant="outlined"
                        value={value}
                        onChange={(e) => {
                            if (field === "truckNo") {
                                formik.setFieldValue(field, e.target.value.toUpperCase());
                            } else {
                                formik.handleChange(e);
                            }
                        }}
                        onBlur={formik.handleBlur}
                        error={!!error}
                        helperText={error}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                backgroundColor: '#F9FAFB',
                                '& .MuiOutlinedInput-notchedOutline': { border: error ? '1px solid #d32f2f' : '1px solid #F3F4F6' }
                            },
                            '& .MuiFormHelperText-root': { ml: 1 }
                        }}
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
                    Truck Management
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
                    New Truck
                </Button>
            </Box>

            {/* Toolbar Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <TextField
                    variant="outlined"
                    placeholder="Search trucks..."
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
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>Truck No</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>Type</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>Owner/Partner</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>Tare Weight</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600, color: palette.text.primary }}>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                        <CircularProgress size={24} />
                                    </TableCell>
                                </TableRow>
                            ) : trucks.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                        <Typography color="textSecondary">No trucks found</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : trucks.map((t) => (
                                <TableRow key={t.id} sx={{ '&:hover': { backgroundColor: palette.background.paper } }}>
                                    <TableCell sx={{ fontWeight: 500, color: palette.text.primary }}>{t.truckNo}</TableCell>
                                    <TableCell>
                                        <Box sx={{
                                            display: 'inline-block', px: 1.5, py: 0.5, borderRadius: '12px',
                                            fontSize: '11px', fontWeight: 800,
                                            backgroundColor: t.ownershipType === 'OWN' ? '#EBF5FF' : t.ownershipType === 'TRANSPORTER' ? '#F0FDF4' : '#FFF7ED',
                                            color: t.ownershipType === 'OWN' ? '#0057FF' : t.ownershipType === 'TRANSPORTER' ? '#16A34A' : '#EA580C'
                                        }}>
                                            {t.ownershipType}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        {t.ownershipType === 'OWN' ? (t.registerName || 'Company') :
                                            t.ownershipType === 'TRANSPORTER' ? t.transporterName :
                                                t.customerName}
                                    </TableCell>
                                    <TableCell>{t.tareWeight} kg</TableCell>
                                    <TableCell align="center">
                                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                            <Tooltip title="View">
                                                <IconButton onClick={() => handleViewTruck(t)} sx={{ color: palette.primary.main }} size="small"><ViewIcon fontSize="small" /></IconButton>
                                            </Tooltip>
                                            <Tooltip title="Edit">
                                                <IconButton
                                                    size="small"
                                                    sx={{ color: '#0057FF' }}
                                                    onClick={() => handleEditTruck(t)}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton
                                                    size="small"
                                                    sx={{ color: '#EF4444' }}
                                                    onClick={() => handleDeleteClick(t.id)}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
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
                        p: showSuccess ? 0 : { xs: 3, sm: 4 },
                        boxShadow: showSuccess ? 'none' : '0px 2px 12px rgba(0,0,0,0.03)',
                        width: '100%',
                    }}>
                        {showSuccess ? (
                            <Box sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                py: 6,
                                textAlign: 'center',
                                color: '#fff',
                                minHeight: '260px'
                            }}>
                                <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, fontSize: '32px' }}>
                                    Truck Registered
                                </Typography>
                                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                                    The truck record has been saved successfully
                                </Typography>
                            </Box>
                        ) : (
                            <Box>
                                <Typography variant="h4" sx={{ fontWeight: 900, mb: 3 }}>
                                    {isEditing ? "Edit Truck" : "New Truck Registry"}
                                </Typography>
                                <form onSubmit={formik.handleSubmit}>
                                    <Grid container spacing={4}>
                                        <Grid item xs={12} md={6}>
                                            {renderField("Truck Number", "Enter truck number (e.g. MH12AB1234)", false, "text", "truckNo")}
                                            {renderField("Ownership Type", "Select type", true, "text", "ownershipType", [
                                                { label: "Owned", value: "OWN" },
                                                { label: "Transporter", value: "TRANSPORTER" },
                                                { label: "Customer", value: "CUSTOMER" }
                                            ])}

                                            {formik.values.ownershipType === "TRANSPORTER" && (
                                                <Box sx={{ mt: 1 }}>
                                                    {renderField("Select Transporter", "Choose transporter", true, "text", "transporterId",
                                                        transporters.map(tr => ({ label: `${tr.name} (${tr.iCode})`, value: tr.id }))
                                                    )}
                                                </Box>
                                            )}

                                            {formik.values.ownershipType === "CUSTOMER" && (
                                                <Box sx={{ mt: 1 }}>
                                                    {renderField("Select Customer", "Choose customer", true, "text", "customerId",
                                                        customers.map(cu => ({ label: cu.name, value: cu.id }))
                                                    )}
                                                </Box>
                                            )}

                                            {renderField("Owner Name (optional)", "Enter owner name", false, "text", "ownerName")}
                                            {renderField("Tare Weight (kg)", "Enter weight", false, "number", "tareWeight")}
                                        </Grid>

                                        <Grid item xs={12} md={6}>
                                            <Grid container spacing={2}>
                                                <Grid item xs={6}>
                                                    {renderField("Make", "Enter make", false, "text", "make")}
                                                </Grid>
                                                <Grid item xs={6}>
                                                    {renderField("Model", "Enter model", false, "text", "model")}
                                                </Grid>
                                            </Grid>
                                            {renderField("Usage Type", "Select usage", true, "text", "usageType", [
                                                { label: "Commercial", value: "COMMERCIAL" },
                                                { label: "Passenger", value: "PASSENGER" }
                                            ])}
                                            {renderField("Fuel Type", "Select fuel", true, "text", "fuelType", [
                                                { label: "Petrol", value: "PETROL" },
                                                { label: "Diesel", value: "DIESEL" },
                                                { label: "EV", value: "EV" }
                                            ])}
                                            {renderField("Engine Number", "Enter engine no", false, "text", "engineNo")}
                                            {renderField("Chassis Number", "Enter chassis no", false, "text", "chassisNo")}
                                        </Grid>

                                        <Grid item xs={12}>
                                            <Divider sx={{ my: 1 }}>
                                                <Typography sx={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                    Documents & Validity
                                                </Typography>
                                            </Divider>
                                        </Grid>

                                        {/* RC Section */}
                                        <Grid item xs={12}>
                                            <Grid container spacing={2} alignItems="center" sx={{ mb: 2.5 }}>
                                                <Grid item xs={12} md={4}>
                                                    <Typography sx={{ fontSize: '13px', color: '#1E293B', fontWeight: 700 }}>RC (Registration Certificate)</Typography>
                                                </Grid>
                                                <Grid item xs={12} md={4}>
                                                    {renderUploadButton('rcFront', 'Upload RC Front')}
                                                </Grid>
                                                <Grid item xs={12} md={4}>
                                                    {renderUploadButton('rcBack', 'Upload RC Back')}
                                                </Grid>
                                            </Grid>
                                        </Grid>

                                        {/* Insurance Section */}
                                        <Grid item xs={12}>
                                            <Grid container spacing={2} alignItems="center" sx={{ mb: 2.5 }}>
                                                <Grid item xs={12} md={4}>
                                                    <Typography sx={{ fontSize: '13px', color: '#1E293B', fontWeight: 700 }}>Insurance Validity</Typography>
                                                </Grid>
                                                <Grid item xs={12} md={4}>
                                                    <TextField
                                                        fullWidth type="date" size="small"
                                                        name="insuranceValidity"
                                                        value={formik.values.insuranceValidity}
                                                        onChange={formik.handleChange}
                                                        InputLabelProps={{ shrink: true }}
                                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', backgroundColor: '#F8FAFC' } }}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} md={4}>
                                                    {renderUploadButton('insurance', 'Upload Insurance')}
                                                </Grid>
                                            </Grid>
                                        </Grid>

                                        {/* Permit Section */}
                                        <Grid item xs={12}>
                                            <Grid container spacing={2} alignItems="center" sx={{ mb: 2.5 }}>
                                                <Grid item xs={12} md={4}>
                                                    <Typography sx={{ fontSize: '13px', color: '#1E293B', fontWeight: 700 }}>Permit Validity</Typography>
                                                </Grid>
                                                <Grid item xs={12} md={4}>
                                                    <TextField
                                                        fullWidth type="date" size="small"
                                                        name="permitValidity"
                                                        value={formik.values.permitValidity}
                                                        onChange={formik.handleChange}
                                                        InputLabelProps={{ shrink: true }}
                                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', backgroundColor: '#F8FAFC' } }}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} md={4}>
                                                    {renderUploadButton('permit', 'Upload Permit')}
                                                </Grid>
                                            </Grid>
                                        </Grid>

                                        {/* FC Section */}
                                        <Grid item xs={12}>
                                            <Grid container spacing={2} alignItems="center" sx={{ mb: 1 }}>
                                                <Grid item xs={12} md={4}>
                                                    <Typography sx={{ fontSize: '13px', color: '#1E293B', fontWeight: 700 }}>FC Validity</Typography>
                                                </Grid>
                                                <Grid item xs={12} md={4}>
                                                    <TextField
                                                        fullWidth type="date" size="small"
                                                        name="fcValidity"
                                                        value={formik.values.fcValidity}
                                                        onChange={formik.handleChange}
                                                        InputLabelProps={{ shrink: true }}
                                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', backgroundColor: '#F8FAFC' } }}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} md={4}>
                                                    {renderUploadButton('fc', 'Upload FC')}
                                                </Grid>
                                            </Grid>
                                        </Grid>

                                        <Grid item xs={12} sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                            <Button
                                                onClick={handleCloseModal}
                                                sx={{ color: '#64748B', fontWeight: 700, textTransform: 'none' }}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                variant="contained"
                                                sx={{
                                                    background: 'linear-gradient(135deg, #0057FF 0%, #003499 100%)',
                                                    borderRadius: '8px',
                                                    px: 4, py: 1.2,
                                                    fontWeight: 700,
                                                    textTransform: 'none'
                                                }}
                                            >
                                                {isEditing ? "Update Truck" : "Register Truck"}
                                            </Button>
                                        </Grid>
                                    </Grid>
                                </form>
                            </Box>
                        )}
                    </Box>
                </DialogContent>
            </Dialog>

            {/* View Truck Details Modal */}
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
                    {selectedTruck && (
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Box>
                                    <Typography variant="h4" sx={{ fontWeight: 900, color: '#111827' }}>
                                        {selectedTruck.truckNo}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.5 }}>
                                        Make: {selectedTruck.make || "N/A"} | Model: {selectedTruck.model || "N/A"}
                                    </Typography>
                                </Box>
                                <Box sx={{
                                    px: 2, py: 1, borderRadius: '12px',
                                    backgroundColor: '#EBFDF5',
                                    color: '#10B981',
                                    fontWeight: 700, fontSize: '13px'
                                }}>
                                    {selectedTruck.ownershipType}
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                                <Card sx={{ flex: '1 1 100%', borderRadius: '16px', p: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
                                    <Typography sx={{ fontWeight: 800, fontSize: '16px', color: '#111827', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 4, height: 16, backgroundColor: '#2D3FE2', borderRadius: 2 }} />
                                        Ownership & Registration
                                    </Typography>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 3 }}>
                                        <DetailItem label="Truck Number" value={selectedTruck.truckNo} />
                                        <DetailItem label="Ownership Type" value={selectedTruck.ownershipType} />
                                        <DetailItem label="Owner/Partner" value={
                                            selectedTruck.ownershipType === 'OWN' ? (selectedTruck.ownerName || 'Company') :
                                                selectedTruck.ownershipType === 'TRANSPORTER' ? selectedTruck.transporterName :
                                                    selectedTruck.customerName
                                        } />
                                        <DetailItem label="Tare Weight" value={`${selectedTruck.tareWeight} kg`} />
                                        <DetailItem label="Usage Type" value={selectedTruck.usageType} />
                                        <DetailItem label="Fuel Type" value={selectedTruck.fuelType} />
                                    </Box>
                                </Card>

                                <Card sx={{ flex: '1 1 100%', borderRadius: '16px', p: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
                                    <Typography sx={{ fontWeight: 800, fontSize: '16px', color: '#111827', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 4, height: 16, backgroundColor: '#10B981', borderRadius: 2 }} />
                                        Technical Specifications
                                    </Typography>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
                                        <DetailItem label="Make" value={selectedTruck.make} />
                                        <DetailItem label="Model" value={selectedTruck.model} />
                                        <DetailItem label="Engine Number" value={selectedTruck.engineNo} />
                                        <DetailItem label="Chassis Number" value={selectedTruck.chassisNo} />
                                    </Box>
                                </Card>

                                <Card sx={{ flex: '1 1 100%', borderRadius: '16px', p: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
                                    <Typography sx={{ fontWeight: 800, fontSize: '16px', color: '#111827', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 4, height: 16, backgroundColor: '#F59E0B', borderRadius: 2 }} />
                                        Documents & Validity
                                    </Typography>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 3, mb: 3 }}>
                                        <DetailItem label="Insurance Validity" value={selectedTruck.insuranceValidity} />
                                        <DetailItem label="Permit Validity" value={selectedTruck.permitValidity} />
                                        <DetailItem label="FC Validity" value={selectedTruck.fcValidity} />
                                    </Box>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography sx={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', mb: 1.5 }}>
                                        Attached Documents
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                        {selectedTruck.rcFrontPath && <DocumentButton label="RC Front" path={selectedTruck.rcFrontPath} />}
                                        {selectedTruck.rcBackPath && <DocumentButton label="RC Back" path={selectedTruck.rcBackPath} />}
                                        {selectedTruck.insurancePath && <DocumentButton label="Insurance" path={selectedTruck.insurancePath} />}
                                        {selectedTruck.permitPath && <DocumentButton label="Permit" path={selectedTruck.permitPath} />}
                                        {selectedTruck.fcPath && <DocumentButton label="FC" path={selectedTruck.fcPath} />}
                                        {!selectedTruck.rcFrontPath && !selectedTruck.rcBackPath && !selectedTruck.insurancePath && !selectedTruck.permitPath && !selectedTruck.fcPath && (
                                            <Typography variant="body2" sx={{ color: '#9CA3AF', fontStyle: 'italic' }}>No documents uploaded</Typography>
                                        )}
                                    </Box>
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
                        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: '#111827' }}>Delete Truck</Typography>
                        <Typography variant="body2" sx={{ color: '#6B7280', mb: 4, lineHeight: 1.6 }}>Are you sure you want to delete this truck? This action cannot be undone and the record will be permanently removed.</Typography>
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

const DocumentButton = ({ label, path }) => (
    <Button
        variant="outlined"
        size="small"
        startIcon={<ViewIcon sx={{ fontSize: '16px' }} />}
        onClick={() => window.open(`http://localhost:8080/uploads/employees/${path}`, '_blank')}
        sx={{
            borderRadius: '8px',
            borderColor: '#E5E7EB',
            color: '#374151',
            textTransform: 'none',
            fontSize: '12px',
            fontWeight: 600,
            '&:hover': { backgroundColor: '#F9FAFB', borderColor: '#D1D5DB' }
        }}
    >
        {label}
    </Button>
);
