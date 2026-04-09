"use client";

import React, { useState, useEffect } from "react";
import {
    Box, Typography, Card, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Button,
    TextField, InputAdornment, Tooltip, Dialog, DialogContent,
    CircularProgress, Grid, Divider, TablePagination,
    Snackbar, Alert
} from "@mui/material";
import {
    SearchOutlined as SearchIcon, AddOutlined as AddIcon, 
    VisibilityOutlined as ViewIcon, EditOutlined as EditIcon, 
    DeleteOutline as DeleteIcon, FileDownloadOutlined as DownloadIcon,
    PrintOutlined as PrintIcon, SortOutlined as SortIcon
} from "@mui/icons-material";
import { palette } from "@/theme";
import { transporterApi } from "@/services/api";
import { useFormik } from "formik";
import * as Yup from "yup";
import { phoneRegex, panRegex, gstinRegex, pincodeRegex } from "@/utils/validationSchemas";

export default function TransporterPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [openModal, setOpenModal] = useState(false);
    const [transporters, setTransporters] = useState([]);
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
    const [selectedTransporter, setSelectedTransporter] = useState(null);

    // Pagination State
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalElements, setTotalElements] = useState(0);

    const fetchTransporters = async () => {
        setIsLoading(true);
        try {
            const response = await transporterApi.getAll(page, rowsPerPage, searchQuery);
            if (response.success) {
                setTransporters(response.data.content);
                setTotalElements(response.data.totalElements);
            }
        } catch (error) {
            console.error("Error fetching transporters:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTransporters();
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

    const transporterValidationSchema = Yup.object({
        iCode: Yup.string()
            .min(2, "Code must be at least 2 characters")
            .max(10, "Code must not exceed 10 characters")
            .required("Transporter Code is required"),
        name: Yup.string().required("Transporter name is required"),
        phone: Yup.string()
            .matches(phoneRegex, "Phone must be 10-12 digits")
            .required("Phone number is required"),
        email: Yup.string().email("Invalid email format"),
        gstin: Yup.string().matches(gstinRegex, "Invalid GSTIN format"),
        address: Yup.object({
            addressLine1: Yup.string().required("Address is required"),
            district: Yup.string().required("District is required"),
            state: Yup.string().required("State is required"),
            pincode: Yup.string()
                .matches(pincodeRegex, "Pincode must be 6 digits")
                .required("Pincode is required")
        })
    });

    const formik = useFormik({
        initialValues: {
            name: "",
            iCode: "",
            gstin: "",
            phone: "",
            address: {
                addressLine1: "",
                addressLine2: "",
                district: "",
                state: "",
                pincode: ""
            }
        },
        validationSchema: transporterValidationSchema,
        onSubmit: async (values) => {
            try {
                const response = await transporterApi.upsert(values, editingId);
                if (response.success) {
                    setShowSuccess(true);
                    setTimeout(() => {
                        handleCloseModal();
                        fetchTransporters();
                    }, 2000);
                }
            } catch (error) {
                console.error("Error saving transporter:", error);
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

    const handleEditTransporter = (transporter) => {
        setIsEditing(true);
        setEditingId(transporter.id);
        formik.setValues({
            name: transporter.name || "",
            iCode: transporter.iCode || "",
            gstin: transporter.gstin || "",
            phone: transporter.phone || "",
            address: transporter.address || {
                addressLine1: "",
                addressLine2: "",
                district: "",
                state: "",
                pincode: ""
            }
        });
        setOpenModal(true);
        setShowSuccess(false);
    };

    const handleViewTransporter = (transporter) => {
        setSelectedTransporter(transporter);
        setViewModalOpen(true);
    };

    const handleDeleteClick = (id) => {
        setDeleteTargetId(id);
        setDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        try {
            const response = await transporterApi.delete(deleteTargetId);
            if (response.success) {
                setSnackbar({ open: true, message: "Transporter deleted successfully", severity: "success" });
                fetchTransporters();
            } else {
                setSnackbar({ open: true, message: response.message || "Failed to delete transporter", severity: "error" });
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

    const renderField = (label, placeholder, type = "text", field = "") => {
        const fieldKeys = field.split('.');
        let value = formik.values;
        for (const key of fieldKeys) value = value?.[key];
        
        const error = fieldKeys.length > 1 
            ? formik.touched[fieldKeys[0]]?.[fieldKeys[1]] && formik.errors[fieldKeys[0]]?.[fieldKeys[1]]
            : formik.touched[field] && formik.errors[field];

        return (
            <Box sx={{ width: '100%', mb: 2 }}>
                <Typography sx={{ fontSize: '13px', color: '#374151', mb: 0.8, fontWeight: 600 }}>{label}</Typography>
                <TextField
                    fullWidth
                    size="small"
                    name={field}
                    type={type}
                    placeholder={placeholder}
                    variant="outlined"
                    value={value || ""}
                    onChange={(e) => {
                        if (field === "iCode" || field === "gstin") {
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
            </Box>
        );
    };

    return (
        <Box sx={{ animation: "fadeIn 0.5s ease-out" }}>
            {/* Header Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h3" sx={{ fontWeight: 900, color: palette.text.secondary }}>
                    Transporter
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
                    New Transporter
                </Button>
            </Box>

            {/* Toolbar Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <TextField
                    variant="outlined"
                    placeholder="Search transporters..."
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
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>Transporter Code</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>Name</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>Phone</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>GSTIN</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>City / District</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600, color: palette.text.primary }}>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                        <CircularProgress size={24} />
                                    </TableCell>
                                </TableRow>
                            ) : transporters.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                        <Typography color="textSecondary">No transporters found</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : transporters.map((t) => (
                                <TableRow key={t.id} sx={{ '&:hover': { backgroundColor: palette.background.paper } }}>
                                    <TableCell sx={{ fontWeight: 500, color: palette.text.primary }}>{t.iCode}</TableCell>
                                    <TableCell sx={{ fontWeight: 500 }}>{t.name}</TableCell>
                                    <TableCell>{t.phone}</TableCell>
                                    <TableCell>{t.gstin || '-'}</TableCell>
                                    <TableCell>{t.address?.district || '-'}</TableCell>
                                    <TableCell align="center">
                                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                            <Tooltip title="View">
                                                <IconButton onClick={() => handleViewTransporter(t)} size="small" sx={{ color: palette.primary.main }}>
                                                    <ViewIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Edit">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleEditTransporter(t)}
                                                    sx={{ color: '#0057FF' }}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleDeleteClick(t.id)}
                                                    sx={{ color: '#EF4444' }}
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
                                    Transporter Processed
                                </Typography>
                                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                                    The transporter record has been saved successfully
                                </Typography>
                            </Box>
                        ) : (
                            <Box>
                                <Typography variant="h4" sx={{ fontWeight: 900, mb: 3 }}>
                                    {isEditing ? "Edit Transporter" : "New Transporter"}
                                </Typography>
                                <form onSubmit={formik.handleSubmit}>
                                    <Grid container spacing={4}>
                                        <Grid item xs={12} md={6}>
                                            {renderField("Transporter Code", "Enter code (e.g. VRS)", "text", "iCode")}
                                            {renderField("Transporter Name", "Enter name", "text", "name")}
                                            {renderField("Phone Number", "Enter phone number", "text", "phone")}
                                            {renderField("GSTIN Number", "Enter GSTIN", "text", "gstin")}
                                        </Grid>

                                        <Grid item xs={12} md={6}>
                                            {renderField("Address Line 1", "Enter street address", "text", "address.addressLine1")}
                                            <Grid container spacing={2}>
                                                <Grid item xs={6}>
                                                    {renderField("District", "Enter district", "text", "address.district")}
                                                </Grid>
                                                <Grid item xs={6}>
                                                    {renderField("State", "Enter state", "text", "address.state")}
                                                </Grid>
                                            </Grid>
                                            {renderField("Pincode", "Enter pincode", "text", "address.pincode")}
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
                                                {isEditing ? "Update Transporter" : "Save Transporter"}
                                            </Button>
                                        </Grid>
                                    </Grid>
                                </form>
                            </Box>
                        )}
                    </Box>
                </DialogContent>
            </Dialog>

            {/* View Transporter Details Modal */}
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
                    {selectedTransporter && (
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Box>
                                    <Typography variant="h4" sx={{ fontWeight: 900, color: '#111827' }}>
                                        {selectedTransporter.name}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.5 }}>
                                        Code: {selectedTransporter.iCode} | Phone: {selectedTransporter.phone}
                                    </Typography>
                                </Box>
                                <Box sx={{ 
                                    px: 2, py: 1, borderRadius: '12px', 
                                    backgroundColor: '#EBFDF5',
                                    color: '#10B981',
                                    fontWeight: 700, fontSize: '13px'
                                }}>
                                    ACTIVE
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                                <Card sx={{ flex: '1 1 100%', borderRadius: '16px', p: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
                                    <Typography sx={{ fontWeight: 800, fontSize: '16px', color: '#111827', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 4, height: 16, backgroundColor: '#2D3FE2', borderRadius: 2 }} />
                                        Transporter Details
                                    </Typography>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
                                        <DetailItem label="Full Name" value={selectedTransporter.name} />
                                        <DetailItem label="Transporter Code" value={selectedTransporter.iCode} />
                                        <DetailItem label="Phone Number" value={selectedTransporter.phone} />
                                        <DetailItem label="GSTIN" value={selectedTransporter.gstin} />
                                        <DetailItem label="District" value={selectedTransporter.address?.district} />
                                        <DetailItem label="State" value={selectedTransporter.address?.state} />
                                        <DetailItem label="Pincode" value={selectedTransporter.address?.pincode} />
                                        <Box sx={{ gridColumn: '1 / -1' }}>
                                            <DetailItem label="Full Address" value={`${selectedTransporter.address?.addressLine1 || ""}, ${selectedTransporter.address?.addressLine2 || ""}`} />
                                        </Box>
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
                        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: '#111827' }}>Delete Transporter</Typography>
                        <Typography variant="body2" sx={{ color: '#6B7280', mb: 4, lineHeight: 1.6 }}>Are you sure you want to delete this transporter? This action cannot be undone and the record will be permanently removed.</Typography>
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
