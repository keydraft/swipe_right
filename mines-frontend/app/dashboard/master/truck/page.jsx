"use client";

import React, { useState, useEffect } from "react";
import {
    Box, Typography, Card, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Button,
    TextField, InputAdornment, Tooltip, Dialog, DialogContent,
    Select, MenuItem, CircularProgress, Grid, Divider, TablePagination
} from "@mui/material";
import {
    SearchOutlined as SearchIcon, AddOutlined as AddIcon, 
    VisibilityOutlined as ViewIcon, EditOutlined as EditIcon, 
    DeleteOutline as DeleteIcon, FileDownloadOutlined as DownloadIcon,
    PrintOutlined as PrintIcon, SortOutlined as SortIcon
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

    // Pagination State
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalElements, setTotalElements] = useState(0);

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            // Fetch dropdown data (non-paginated or large limit)
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
        ownershipType: Yup.string().required("Ownership type is required"),
        tareWeight: Yup.number().typeError("Must be a number").required("Tare weight is required"),
    });

    const formik = useFormik({
        initialValues: {
            truckNo: "",
            ownershipType: "OWN",
            ownerName: "",
            transporterId: "",
            customerId: "",
            make: "",
            model: "",
            engineNo: "",
            chassisNo: "",
            tareWeight: "",
            usageType: "",
            fuelType: ""
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

                const response = await truckApi.upsert(payload, editingId);
                if (response.success) {
                    setShowSuccess(true);
                    setTimeout(() => {
                        handleCloseModal();
                        fetchTrucks();
                    }, 2000);
                }
            } catch (error) {
                console.error("Error saving truck:", error);
            }
        },
    });

    const handleOpenModal = () => {
        setIsEditing(false);
        setEditingId(null);
        formik.resetForm();
        setOpenModal(true);
        setShowSuccess(false);
    };

    const handleEditTruck = (truck) => {
        setIsEditing(true);
        setEditingId(truck.id);
        formik.setValues({
            truckNo: truck.truckNo || "",
            ownershipType: truck.ownershipType || "OWN",
            ownerName: truck.ownerName || "",
            transporterId: truck.transporterId || "",
            customerId: truck.customerId || "",
            make: truck.make || "",
            model: truck.model || "",
            engineNo: truck.engineNo || "",
            chassisNo: truck.chassisNo || "",
            tareWeight: truck.tareWeight || "",
            usageType: truck.usageType || "",
            fuelType: truck.fuelType || ""
        });
        setOpenModal(true);
        setShowSuccess(false);
    };

    const handleDeleteTruck = async (id) => {
        if (window.confirm("Are you sure you want to delete this truck?")) {
            try {
                const response = await truckApi.delete(id);
                if (response.success) {
                    fetchTrucks();
                }
            } catch (error) {
                console.error("Error deleting truck:", error);
            }
        }
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        formik.resetForm();
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
                                    <TableCell sx={{ fontWeight: 600, color: '#0057FF' }}>{t.truckNo}</TableCell>
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
                                        {t.ownershipType === 'OWN' ? (t.ownerName || 'Company') :
                                         t.ownershipType === 'TRANSPORTER' ? t.transporterName :
                                         t.customerName}
                                    </TableCell>
                                    <TableCell>{t.tareWeight} kg</TableCell>
                                    <TableCell align="center">
                                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
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
                                                    onClick={() => handleDeleteTruck(t.id)}
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
                        p: showSuccess ? 0 : { xs: 3, sm: 6 },
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
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} md={6}>
                                            {renderField("Ownership Type", "Select type", true, "text", "ownershipType", [
                                                { label: "Owned", value: "OWN" },
                                                { label: "Transporter", value: "TRANSPORTER" },
                                                { label: "Customer", value: "CUSTOMER" }
                                            ])}
                                        </Grid>

                                        {formik.values.ownershipType === "TRANSPORTER" && (
                                            <Grid item xs={12}>
                                                {renderField("Select Transporter", "Choose transporter", true, "text", "transporterId", 
                                                    transporters.map(tr => ({ label: `${tr.name} (${tr.iCode})`, value: tr.id }))
                                                )}
                                            </Grid>
                                        )}

                                        {formik.values.ownershipType === "CUSTOMER" && (
                                            <Grid item xs={12}>
                                                {renderField("Select Customer", "Choose customer", true, "text", "customerId", 
                                                    customers.map(cu => ({ label: cu.name, value: cu.id }))
                                                )}
                                            </Grid>
                                        )}

                                        <Grid item xs={12} md={6}>
                                            {renderField("Owner Name (optional)", "Enter owner name", false, "text", "ownerName")}
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            {renderField("Tare Weight (kg)", "Enter weight", false, "number", "tareWeight")}
                                        </Grid>

                                        <Grid item xs={12} sx={{ mt: 1 }}>
                                            <Divider />
                                            <Typography sx={{ fontWeight: 700, mt: 2, mb: 1, fontSize: '15px' }}>Technical Details</Typography>
                                        </Grid>

                                        <Grid item xs={12} md={4}>
                                            {renderField("Make", "Enter make", false, "text", "make")}
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            {renderField("Model", "Enter model", false, "text", "model")}
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            {renderField("Fuel Type", "Enter fuel", false, "text", "fuelType")}
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            {renderField("Engine No", "Enter engine no", false, "text", "engineNo")}
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            {renderField("Chassis No", "Enter chassis no", false, "text", "chassisNo")}
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
        </Box>
    );
}
