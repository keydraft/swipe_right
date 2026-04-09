"use client";

import React, { useState, useEffect } from "react";
import {
    Box, Typography, Card, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Button,
    TextField, InputAdornment, Tooltip, Dialog, DialogContent,
    CircularProgress, Grid, Divider, TablePagination
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

export default function TransporterPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [openModal, setOpenModal] = useState(false);
    const [transporters, setTransporters] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);

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
        name: Yup.string().required("Transporter name is required"),
        phone: Yup.string().required("Phone number is required"),
    });

    const formik = useFormik({
        initialValues: {
            name: "",
            icode: "",
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
            icode: transporter.icode || "",
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

    const handleDeleteTransporter = async (id) => {
        if (window.confirm("Are you sure you want to delete this transporter?")) {
            try {
                const response = await transporterApi.delete(id);
                if (response.success) {
                    fetchTransporters();
                }
            } catch (error) {
                console.error("Error deleting transporter:", error);
            }
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
            <Box sx={{ width: '100%' }}>
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
                        if (field === "icode" || field === "gstin") {
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
                                    <TableCell sx={{ fontWeight: 600, color: '#0057FF' }}>{t.icode}</TableCell>
                                    <TableCell sx={{ fontWeight: 500 }}>{t.name}</TableCell>
                                    <TableCell>{t.phone}</TableCell>
                                    <TableCell>{t.gstin || '-'}</TableCell>
                                    <TableCell>{t.address?.district || '-'}</TableCell>
                                    <TableCell align="center">
                                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                            <Tooltip title="View">
                                                <IconButton size="small" sx={{ color: palette.primary.main }}>
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
                                                    onClick={() => handleDeleteTransporter(t.id)}
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
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} md={6}>
                                            {renderField("Transporter Name", "Enter name", "text", "name")}
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            {renderField("Transporter Code", "Enter code", "text", "icode")}
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            {renderField("Phone Number", "Enter phone", "text", "phone")}
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            {renderField("GSTIN", "Enter GSTIN", "text", "gstin")}
                                        </Grid>

                                        <Grid item xs={12} sx={{ mt: 1 }}>
                                            <Divider />
                                            <Typography sx={{ fontWeight: 700, mt: 2, mb: 1, fontSize: '15px' }}>Address Details</Typography>
                                        </Grid>

                                        <Grid item xs={12}>
                                            {renderField("Address Line 1", "Enter address", "text", "address.addressLine1")}
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            {renderField("District", "Enter district", "text", "address.district")}
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            {renderField("State", "Enter state", "text", "address.state")}
                                        </Grid>
                                        <Grid item xs={12} md={6}>
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
        </Box>
    );
}
