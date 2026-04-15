"use client";

import React, { useState, useEffect } from "react";
import {
    Box, Typography, Card, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Button,
    TextField, InputAdornment, Tooltip, Dialog, DialogContent,
    CircularProgress, Grid, Divider, TablePagination,
    Snackbar, Alert, MenuItem, Chip, Stack
} from "@mui/material";
import {
    SearchOutlined as SearchIcon, AddOutlined as AddIcon,
    VisibilityOutlined as ViewIcon, EditOutlined as EditIcon,
    DeleteOutline as DeleteIcon, FileDownloadOutlined as DownloadIcon,
    PrintOutlined as PrintIcon, SortOutlined as SortIcon, Close as CloseIcon,
    LinkOutlined as ConnectIcon, BusinessOutlined as CompanyIcon,
    MoreVertOutlined as ActionIcon,
    LocationOnOutlined as BranchIcon,
    BadgeOutlined as IdIcon,
    PhoneOutlined as PhoneIcon,
    DraftsOutlined as EmailIcon,
    GiteOutlined as AddressIcon
} from "@mui/icons-material";
import { palette } from "@/theme";
import { transporterApi, adminApi } from "@/services/api";
import { useFormik } from "formik";
import * as Yup from "yup";
import { phoneRegex, gstinRegex, pincodeRegex } from "@/utils/validationSchemas";
import Cookies from "js-cookie";
import { useApp } from "@/context/AppContext";

// ─── Assignment Modal Component ───────────────────────────
function AssignmentModal({ open, onClose, transporter, onAssigned, setSnackbar }) {
    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState("");
    const [selectedBranch, setSelectedBranch] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            adminApi.getCompanies(0, 1000).then(res => {
                if (res.success) setCompanies(res.data.content);
            });
        }
    }, [open]);

    useEffect(() => {
        if (selectedCompany) {
            adminApi.getBranches(selectedCompany).then(res => {
                if (res.success) setBranches(res.data);
            });
        } else {
            setBranches([]);
        }
        setSelectedBranch("");
    }, [selectedCompany]);

    const handleAssign = async () => {
        if (!selectedCompany || !selectedBranch) return;
        setIsSubmitting(true);
        try {
            const res = await transporterApi.assign({
                transporterId: transporter.id,
                companyId: selectedCompany,
                branchId: selectedBranch
            });
            if (res.success) {
                setSnackbar({ open: true, message: "Assigned successfully", severity: "success" });
                onAssigned();
                onClose();
            } else {
                setSnackbar({ open: true, message: res.message || "Failed to assign", severity: "error" });
            }
        } catch (error) {
            setSnackbar({ open: true, message: error.response?.data?.message || "An error occurred", severity: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}>
            <DialogContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>Connect to Branch</Typography>
                    <IconButton onClick={onClose}><CloseIcon /></IconButton>
                </Box>
                <Typography sx={{ mb: 3, color: 'text.secondary', fontSize: '14px' }}>
                    Link <b>{transporter?.name}</b> to a specific company and branch.
                </Typography>

                <TextField
                    select
                    fullWidth
                    label="Select Company"
                    value={selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value)}
                    sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                >
                    {companies.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                </TextField>

                <TextField
                    select
                    fullWidth
                    label="Select Branch"
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    disabled={!selectedCompany}
                    sx={{ mb: 4, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                >
                    {branches.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
                </TextField>

                <Button
                    fullWidth
                    variant="contained"
                    onClick={handleAssign}
                    disabled={!selectedBranch || isSubmitting}
                    sx={{
                        background: 'linear-gradient(135deg, #0057FF 0%, #003499 100%)',
                        borderRadius: '12px', height: '48px', fontWeight: 700, textTransform: 'none'
                    }}
                >
                    {isSubmitting ? <CircularProgress size={20} color="inherit" /> : "Confirm Assignment"}
                </Button>
            </DialogContent>
        </Dialog>
    );
}

export default function TransporterPage() {
    const userRole = typeof window !== 'undefined' ? Cookies.get("role") || "" : "";
    const { selectedCompany, selectedBranch } = useApp();
    const [searchQuery, setSearchQuery] = useState("");
    const [openModal, setOpenModal] = useState(false);
    const [transporters, setTransporters] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);

    // Assignment States
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [targetTransporter, setTargetTransporter] = useState(null);

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
            const companyId = selectedCompany?.id || selectedCompany?.companyId || null;
            const branchId = selectedBranch?.id || null;
            const response = await transporterApi.getAll(page, rowsPerPage, searchQuery, companyId, branchId);
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
        setPage(0); // Reset page on selection change
    }, [selectedCompany, selectedBranch]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTransporters();
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

    const transporterValidationSchema = Yup.object({
        iCode: Yup.string()
            .min(2, "Code must be at least 2 characters")
            .max(10, "Code must not exceed 10 characters"),
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
            email: "",
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
                setSnackbar({ open: true, message: "Error saving transporter", severity: "error" });
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
            email: transporter.email || "",
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

    const handleOpenAssign = (transporter) => {
        setTargetTransporter(transporter);
        setAssignModalOpen(true);
    };

    const handleUnassign = async (assignmentId) => {
        try {
            const res = await transporterApi.removeAssignment(assignmentId);
            if (res.success) {
                setSnackbar({ open: true, message: "Unassigned successfully", severity: "success" });
                fetchTransporters();
                // If view modal is open, refresh selected transporter
                if (viewModalOpen && selectedTransporter) {
                    const updated = { ...selectedTransporter, assignments: selectedTransporter.assignments.filter(a => a.id !== assignmentId) };
                    setSelectedTransporter(updated);
                }
            }
        } catch (error) {
            setSnackbar({ open: true, message: "Failed to unassign", severity: "error" });
        }
    };

    const renderField = (label, placeholder, isSelect = false, type = "text", field = "", options = []) => {
        if (typeof field !== 'string') return null;
        const fieldKeys = field.split('.');
        let value = formik.values;
        for (const key of fieldKeys) value = value?.[key];

        const error = fieldKeys.length > 1
            ? formik.touched[fieldKeys[0]]?.[fieldKeys[1]] && formik.errors[fieldKeys[0]]?.[fieldKeys[1]]
            : formik.touched[field] && formik.errors[field];

        return (
            <Box sx={{ width: '100%', mb: 0 }}>
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
                    onChange={(e) => {
                        let val = e.target.value;
                        const limit = field === "phone" ? 10 : 
                                      field === "gstin" ? 15 : 
                                      field === "address.pincode" ? 6 : 
                                      field === "iCode" ? 10 : 
                                      field === "name" ? 50 : 100;
                        
                        if (val.length > limit) val = val.slice(0, limit);
                        
                        // Enforce uppercase
                        if (field === "iCode" || field === "gstin") {
                            val = val.toUpperCase();
                        }
                        
                        // Strict format enforcement
                        if (field === "phone" || field === "address.pincode") {
                            val = val.replace(/[^0-9]/g, '');
                        } else if (field === "address.district" || field === "address.state") {
                            val = val.replace(/[^A-Za-z\s]/g, '');
                            val = val.toUpperCase();
                        } else if (field === "name") {
                            val = val.replace(/[^A-Za-z0-9\s&.-]/g, '');
                            val = val.toUpperCase();
                        }

                        // Handle nested fields explicitly
                        if (fieldKeys.length > 1) {
                            formik.setFieldValue(fieldKeys[0], {
                                ...formik.values[fieldKeys[0]],
                                [fieldKeys[1]]: val
                            });
                        } else {
                            formik.setFieldValue(field, val);
                        }
                    }}
                    onBlur={formik.handleBlur}
                    error={!!error}
                    helperText={error}
                    inputProps={{
                        maxLength: field === "phone" ? 10 : 
                                   field === "gstin" ? 15 : 
                                   field === "address.pincode" ? 6 : 
                                   field === "iCode" ? 10 : 
                                   field === "name" ? 50 : 100
                    }}
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
                    {isSelect && options.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
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
                    Transporter Master
                </Typography>
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
                        New Transporter
                    </Button>
                )}
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
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>Code</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>Name</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>Phone</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>Linked Company</TableCell>
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
                            ) : transporters.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                        <Typography color="textSecondary">No transporters found</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : transporters.map((t) => (
                                <TableRow key={t.id} sx={{ '&:hover': { backgroundColor: palette.background.paper } }}>
                                    <TableCell sx={{ fontWeight: 600, color: '#0057FF' }}>{t.iCode}</TableCell>
                                    <TableCell sx={{ fontWeight: 500 }}>{t.name}</TableCell>
                                    <TableCell>{t.phone}</TableCell>
                                    <TableCell>
                                        <Stack direction="row" spacing={0.5} sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {t.assignments?.length > 0 ? (
                                                t.assignments.slice(0, 2).map((a) => (
                                                    <Chip 
                                                        key={a.id} 
                                                        label={a.companyName} 
                                                        size="small" 
                                                        sx={{ fontSize: '10px', height: '20px', borderRadius: '4px', backgroundColor: '#F1F5F9' }} 
                                                    />
                                                ))
                                            ) : (
                                                <Typography variant="caption" sx={{ color: 'text.disabled' }}>No Assignments</Typography>
                                            )}
                                            {t.assignments?.length > 2 && (
                                                <Chip label={`+${t.assignments.length - 2}`} size="small" variant="outlined" sx={{ fontSize: '10px', height: '20px', borderRadius: '4px' }} />
                                            )}
                                        </Stack>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                            <Tooltip title="Connect to Branch">
                                                <IconButton onClick={() => handleOpenAssign(t)} size="small" sx={{ color: '#0ea5e9' }}>
                                                    <ConnectIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="View">
                                                <IconButton onClick={() => handleViewTransporter(t)} size="small" sx={{ color: palette.primary.main }}>
                                                    <ViewIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            {(userRole !== 'PARTNER' && userRole !== 'ROLE_PARTNER') && (
                                                <>
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
                />
            </Card>

            {/* Registration Modal */}
            <Dialog open={openModal} onClose={handleCloseModal} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '24px', p: 1, backgroundColor: showSuccess ? '#2D3FE2' : '#F8FAFC' } }}>
                <DialogContent>
                    <Box sx={{ backgroundColor: showSuccess ? 'transparent' : '#fff', borderRadius: '16px', p: showSuccess ? 0 : { xs: 3, sm: 4 }, boxShadow: showSuccess ? 'none' : '0px 2px 12px rgba(0,0,0,0.03)' }}>
                        {showSuccess ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, textAlign: 'center', color: '#fff' }}>
                                <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>Success!</Typography>
                                <Typography variant="body1">Transporter record updated successfully.</Typography>
                            </Box>
                        ) : (
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                    <Typography variant="h4" sx={{ fontWeight: 900 }}>{isEditing ? "Edit Transporter" : "New Transporter"}</Typography>
                                    <IconButton onClick={handleCloseModal}><CloseIcon /></IconButton>
                                </Box>
                                <form onSubmit={formik.handleSubmit}>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                                        {/* Basic Details Section */}
                                        <Box sx={{ width: '100%', mt: 1, mb: 0.5 }}>
                                            <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: '16px', borderLeft: '4px solid #0057FF', pl: 1.5 }}>
                                                Basic Details
                                            </Typography>
                                        </Box>
                                        
                                        <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 10px)' } }}>{renderField("Transporter Code", "Optional", false, "text", "iCode")}</Box>
                                        <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 10px)' } }}>{renderField("Transporter Name *", "Enter full name", false, "text", "name")}</Box>
                                        <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 10px)' } }}>{renderField("Phone Number *", "10-digit mobile number", false, "text", "phone")}</Box>
                                        <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 10px)' } }}>{renderField("GSTIN Number", "GST Identification Number", false, "text", "gstin")}</Box>
                                        <Box sx={{ width: '100%' }}>{renderField("Email Address", "Email for communication", false, "text", "email")}</Box>
                                        
                                        {/* Address Details Section */}
                                        <Box sx={{ width: '100%', mt: 2, mb: 0.5 }}>
                                            <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: '16px', borderLeft: '4px solid #0057FF', pl: 1.5 }}>
                                                Address Details
                                            </Typography>
                                        </Box>
                                        
                                        <Box sx={{ width: '100%' }}>{renderField("Address Line 1 *", "Room/Building/Street", false, "text", "address.addressLine1")}</Box>
                                        <Box sx={{ width: '100%' }}>{renderField("Address Line 2", "Area/Landmark", false, "text", "address.addressLine2")}</Box>
                                        <Box sx={{ width: { xs: '100%', sm: 'calc(33.33% - 13.33px)' } }}>{renderField("District *", "City or District", false, "text", "address.district")}</Box>
                                        <Box sx={{ width: { xs: '100%', sm: 'calc(33.33% - 13.33px)' } }}>{renderField("State *", "State/Province", false, "text", "address.state")}</Box>
                                        <Box sx={{ width: { xs: '100%', sm: 'calc(33.33% - 13.33px)' } }}>{renderField("Pincode *", "6-digit postal code", false, "text", "address.pincode")}</Box>
                                    </Box>

                                    <Box sx={{ mt: 5, pt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2, borderTop: '1px solid #F1F5F9' }}>
                                        <Button 
                                            onClick={handleCloseModal} 
                                            sx={{ 
                                                fontWeight: 700, 
                                                textTransform: 'none',
                                                color: '#64748B',
                                                '&:hover': { backgroundColor: '#F8FAFC' }
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button 
                                            type="submit" 
                                            variant="contained" 
                                            sx={{ 
                                                background: 'linear-gradient(135deg, #0057FF 0%, #003499 100%)', 
                                                borderRadius: '12px', 
                                                px: 5, 
                                                py: 1.2,
                                                fontWeight: 700, 
                                                textTransform: 'none',
                                                boxShadow: '0 4px 12px rgba(0, 87, 255, 0.25)'
                                            }}
                                        >
                                            {isEditing ? "Update Transporter" : "Register Transporter"}
                                        </Button>
                                    </Box>
                                </form>
                            </Box>
                        )}
                    </Box>
                </DialogContent>
            </Dialog>

            {/* Assignment Modal */}
            <AssignmentModal 
                open={assignModalOpen} 
                onClose={() => setAssignModalOpen(false)} 
                transporter={targetTransporter} 
                onAssigned={fetchTransporters}
                setSnackbar={setSnackbar}
            />

            {/* View Modal */}
            <Dialog open={viewModalOpen} onClose={() => setViewModalOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '24px', p: 2, backgroundColor: '#F8FAFC' } }}>
                <DialogContent>
                    {selectedTransporter && (
                        <Box sx={{ p: 1 }}>
                            {/* Header Section */}
                            <Box sx={{ 
                                mb: 4, 
                                p: 3, 
                                borderRadius: '24px', 
                                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                                color: '#fff',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
                            }}>
                                <Box>
                                    <Typography sx={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', mb: 0.5 }}>Transporter Profile</Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>{selectedTransporter.name}</Typography>
                                    <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                                        <Chip label={selectedTransporter.iCode} size="small" sx={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 600, border: '1px solid rgba(255,255,255,0.2)' }} />
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <PhoneIcon sx={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }} />
                                            <Typography sx={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)' }}>{selectedTransporter.phone}</Typography>
                                        </Stack>
                                    </Stack>
                                </Box>
                                <Box sx={{ backgroundColor: 'rgba(255,255,255,0.1)', p: 2, borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <IdIcon sx={{ fontSize: '40px', color: 'rgba(255,255,255,0.4)' }} />
                                </Box>
                            </Box>

                            <Grid container spacing={3}>
                                {/* Left Side: Profile Info */}
                                <Grid item xs={12} md={7}>
                                    <Card sx={{ p: 4, borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                        <Typography sx={{ fontWeight: 800, fontSize: '18px', mb: 3, color: '#1e293b' }}>Basic Information</Typography>
                                        <Grid container spacing={3}>
                                            <Grid item xs={6}>
                                                <DetailItem 
                                                    label="GSTIN Number" 
                                                    value={selectedTransporter.gstin} 
                                                    icon={<CompanyIcon sx={{ fontSize: '16px', color: '#6366f1' }} />}
                                                />
                                            </Grid>
                                            <Grid item xs={6}>
                                                <DetailItem 
                                                    label="Contact Email" 
                                                    value={selectedTransporter.email} 
                                                    icon={<EmailIcon sx={{ fontSize: '16px', color: '#6366f1' }} />}
                                                />
                                            </Grid>
                                            <Grid item xs={12}>
                                                <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
                                            </Grid>
                                            <Grid item xs={12}>
                                                <DetailItem 
                                                    label="Address Details" 
                                                    value={`${selectedTransporter.address?.addressLine1}, ${selectedTransporter.address?.addressLine2 || ""}`} 
                                                    icon={<AddressIcon sx={{ fontSize: '16px', color: '#6366f1' }} />}
                                                />
                                            </Grid>
                                            <Grid item xs={6}>
                                                <DetailItem label="District" value={selectedTransporter.address?.district} />
                                            </Grid>
                                            <Grid item xs={6}>
                                                <DetailItem label="State & Pincode" value={`${selectedTransporter.address?.state} - ${selectedTransporter.address?.pincode}`} />
                                            </Grid>
                                        </Grid>
                                    </Card>
                                </Grid>

                                {/* Right Side: Assignments */}
                                <Grid item xs={12} md={5}>
                                    <Card sx={{ p: 4, borderRadius: '24px', backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', height: '100%' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                            <Typography sx={{ fontWeight: 800, fontSize: '18px', color: '#1e293b' }}>Linked Units</Typography>
                                            <Chip 
                                                label={`${selectedTransporter.assignments?.length || 0} Active`} 
                                                size="small" 
                                                sx={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 700, fontSize: '11px' }} 
                                            />
                                        </Box>

                                        <Stack spacing={2}>
                                            {selectedTransporter.assignments?.length > 0 ? (
                                                selectedTransporter.assignments.map(a => (
                                                    <Box key={a.id} sx={{ 
                                                        p: 2, 
                                                        borderRadius: '16px', 
                                                        backgroundColor: '#fff', 
                                                        border: '1px solid #e2e8f0', 
                                                        transition: 'all 0.2s',
                                                        '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }
                                                    }}>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                            <Box>
                                                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                                                                    <CompanyIcon sx={{ fontSize: '14px', color: '#64748b' }} />
                                                                    <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>{a.companyName}</Typography>
                                                                </Stack>
                                                                <Stack direction="row" spacing={1} alignItems="center">
                                                                    <BranchIcon sx={{ fontSize: '14px', color: '#94a3b8' }} />
                                                                    <Typography sx={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>{a.branchName}</Typography>
                                                                </Stack>
                                                            </Box>
                                                            <Tooltip title="Unlink Unit">
                                                                <IconButton 
                                                                    size="small" 
                                                                    sx={{ color: '#ef4444', backgroundColor: '#fee2e2', '&:hover': { backgroundColor: '#fecaca' } }} 
                                                                    onClick={() => handleUnassign(a.id)}
                                                                >
                                                                    <CloseIcon sx={{ fontSize: '14px' }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Box>
                                                    </Box>
                                                ))
                                            ) : (
                                                <Box sx={{ py: 6, textAlign: 'center', backgroundColor: '#f1f5f9', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
                                                    <CompanyIcon sx={{ fontSize: '40px', color: '#cbd5e1', mb: 1 }} />
                                                    <Typography sx={{ color: '#94a3b8', fontSize: '13px', fontWeight: 500 }}>No organizational units<br/>linked yet</Typography>
                                                </Box>
                                            )}
                                        </Stack>
                                    </Card>
                                </Grid>
                            </Grid>

                            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                                <Button 
                                    onClick={() => setViewModalOpen(false)} 
                                    variant="outlined" 
                                    sx={{ 
                                        px: 6, 
                                        py: 1, 
                                        borderRadius: '12px', 
                                        textTransform: 'none', 
                                        fontWeight: 700,
                                        color: '#64748b',
                                        borderColor: '#e2e8f0',
                                        '&:hover': { backgroundColor: '#f8fafc', borderColor: '#cbd5e1' }
                                    }}
                                >
                                    Done Viewing
                                </Button>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>{snackbar.message}</Alert>
            </Snackbar>

            <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} PaperProps={{ sx: { borderRadius: '20px', p: 2 } }}>
                <DialogContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>Delete Transporter?</Typography>
                    <Typography color="textSecondary" sx={{ mb: 3 }}>This will also remove all branch connections.</Typography>
                    <Stack direction="row" spacing={2} justifyContent="center">
                        <Button onClick={() => setDeleteConfirmOpen(false)} variant="outlined">Cancel</Button>
                        <Button onClick={handleConfirmDelete} variant="contained" color="error">Delete</Button>
                    </Stack>
                </DialogContent>
            </Dialog>
        </Box>
    );
}

// Helper Components for the View Modal
const DetailItem = ({ label, value, icon }) => (
    <Box sx={{ mb: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            {icon}
            <Typography sx={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {label}
            </Typography>
        </Stack>
        <Typography sx={{ fontSize: '14px', color: '#334155', fontWeight: 600, ml: icon ? 3 : 0 }}>
            {value || "—"}
        </Typography>
    </Box>
);
