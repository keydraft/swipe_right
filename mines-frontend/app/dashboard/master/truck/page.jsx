"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    Box, Typography, Card, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Button,
    TextField, InputAdornment, Tooltip, Dialog, DialogContent,
    Select, MenuItem, CircularProgress, Grid, Divider, TablePagination,
    Snackbar, Alert, Stepper, Step, StepLabel, Chip
} from "@mui/material";
import {
    SearchOutlined as SearchIcon, AddOutlined as AddIcon,
    VisibilityOutlined as ViewIcon, EditOutlined as EditIcon,
    DeleteOutline as DeleteIcon, FileDownloadOutlined as DownloadIcon,
    PrintOutlined as PrintIcon, SortOutlined as SortIcon,
    CloudUploadOutlined as UploadIcon, Close as CloseIcon,
    MoreVertOutlined as ActionIcon
} from "@mui/icons-material";
import { palette } from "@/theme";
import { truckApi, transporterApi, customerApi, adminApi } from "@/services/api";
import { useFormik } from "formik";
import * as Yup from "yup";
import Cookies from "js-cookie";
import { useApp } from "@/context/AppContext";
import {
    ApartmentOutlined as CompanyIcon,
    AccountTreeOutlined as BranchIcon,
    LocalShippingOutlined as GlobalTruckIcon,
    CheckCircleOutline as ActiveIcon,
    LinkOffOutlined as UnlinkIcon,
    BusinessOutlined as FactoryIcon
} from "@mui/icons-material";

// ─── Shared UI Components ─────────────────────────────────

const DetailItem = ({ label, value, icon: Icon, color = palette.text.primary }) => (
    <Box sx={{ mb: 2, display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        {Icon && (
            <Box sx={{
                mt: 0.5,
                p: 0.75,
                borderRadius: '8px',
                backgroundColor: 'rgba(0, 87, 255, 0.05)',
                color: palette.primary.main,
                display: 'flex'
            }}>
                <Icon sx={{ fontSize: '18px' }} />
            </Box>
        )}
        <Box>
            <Typography sx={{ fontSize: '12px', fontWeight: 600, color: palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.3 }}>
                {label}
            </Typography>
            <Typography sx={{ fontSize: '14px', fontWeight: 700, color }}>
                {value || "-"}
            </Typography>
        </Box>
    </Box>
);

const AssignBranchModal = ({ open, onClose, truckId, onAssigned }) => {
    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [selectedCompanies, setSelectedCompanies] = useState([]);
    const [selectedBranches, setSelectedBranches] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            adminApi.getCompanies(0, 500).then(res => setCompanies(res.data.content || []));
        }
    }, [open]);

    useEffect(() => {
        if (selectedCompanies.length > 0) {
            Promise.all(selectedCompanies.map(compId => adminApi.getBranches(compId)))
                .then(responses => {
                    const allBranches = responses.flatMap(res => res.success ? res.data : []);
                    const uniqueBranches = Array.from(new Map(allBranches.map(b => [b.id, b])).values());
                    setBranches(uniqueBranches);
                });
        } else {
            setBranches([]);
            setSelectedBranches([]);
        }
    }, [selectedCompanies]);

    const handleAssign = async () => {
        if (selectedBranches.length === 0) return;
        setIsSubmitting(true);
        try {
            await truckApi.assign({ 
                truckId, 
                companyIds: selectedCompanies, 
                branchIds: selectedBranches 
            });
            onAssigned();
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
            setSelectedCompanies([]);
            setSelectedBranches([]);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}>
            <DialogContent>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 3, color: '#111827' }}>Link to Branch</Typography>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Typography sx={{ fontSize: '13px', fontWeight: 600, mb: 1, color: '#374151' }}>Target Companies</Typography>
                        <Select
                            multiple
                            fullWidth
                            size="small"
                            value={selectedCompanies}
                            onChange={(e) => setSelectedCompanies(e.target.value)}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((id) => (
                                        <Chip 
                                            key={id} 
                                            label={companies.find(c => c.id === id)?.name || id} 
                                            size="small" 
                                            onMouseDown={(e) => e.stopPropagation()}
                                            sx={{ backgroundColor: '#EEF2FF', color: '#4338CA', fontWeight: 600 }}
                                        />
                                    ))}
                                </Box>
                            )}
                            sx={{ borderRadius: '12px' }}
                        >
                            {companies.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                        </Select>
                    </Grid>
                    <Grid item xs={12}>
                        <Typography sx={{ fontSize: '13px', fontWeight: 600, mb: 1, color: '#374151' }}>Target Branches</Typography>
                        <Select
                            multiple
                            fullWidth
                            size="small"
                            value={selectedBranches}
                            onChange={(e) => setSelectedBranches(e.target.value)}
                            disabled={selectedCompanies.length === 0}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((id) => (
                                        <Chip 
                                            key={id} 
                                            label={branches.find(b => b.id === id)?.name || id} 
                                            size="small" 
                                            onMouseDown={(e) => e.stopPropagation()}
                                            sx={{ backgroundColor: '#ECFDF5', color: '#059669', fontWeight: 600 }}
                                        />
                                    ))}
                                </Box>
                            )}
                            sx={{ borderRadius: '12px' }}
                        >
                            {branches.map(b => (
                                <MenuItem key={b.id} value={b.id}>
                                    <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{b.name}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {companies.find(c => c.id === (b.companyId || b.company?.id))?.name}
                                        </Typography>
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </Grid>
                </Grid>
                <Box sx={{ mt: 5, display: 'flex', gap: 2 }}>
                    <Button fullWidth onClick={onClose} sx={{ borderRadius: '12px', py: 1.5, fontWeight: 700, color: '#6B7280', textTransform: 'none' }}>Cancel</Button>
                    <Button 
                        fullWidth 
                        variant="contained" 
                        onClick={handleAssign} 
                        disabled={selectedBranches.length === 0 || isSubmitting} 
                        sx={{ 
                            borderRadius: '12px', 
                            py: 1.5, 
                            fontWeight: 700, 
                            textTransform: 'none',
                            background: 'linear-gradient(135deg, #0057FF 0%, #003499 100%)',
                            boxShadow: '0 4px 12px rgba(0, 87, 255, 0.2)'
                        }}
                    >
                        {isSubmitting ? <CircularProgress size={20} color="inherit" /> : `Link Truck to ${selectedBranches.length} Sites`}
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default function TruckPage() {
    const userRole = typeof window !== 'undefined' ? Cookies.get("role") || "" : "";
    const { selectedCompany, selectedBranch } = useApp();
    const [searchQuery, setSearchQuery] = useState("");
    const [openModal, setOpenModal] = useState(false);
    const [trucks, setTrucks] = useState([]);
    const [transporters, setTransporters] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [activeStep, setActiveStep] = useState(0);

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
    const [allCompanies, setAllCompanies] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [userCompanyInfo, setUserCompanyInfo] = useState([]);
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

    const steps = ["General Truck Details", "Documents & Validity"];

    const truckValidationSchema = Yup.object({
        truckNo: Yup.string().required("Truck number is required"),
        ownershipType: Yup.string().required("Ownership type is required"),
        tareWeight: Yup.number().typeError("Tare weight must be a number").required("Tare weight is required"),
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
            fuelType: "DIESEL",
            insuranceValidity: "",
            permitValidity: "",
            fcValidity: ""
        },
        validationSchema: truckValidationSchema,
        onSubmit: async (values, { setSubmitting }) => {
            if (activeStep !== steps.length - 1) {
                setSubmitting(false);
                return;
            }
            try {
                const payload = {
                    ...values,
                    transporterId: values.ownershipType === "TRANSPORTER" && values.transporterId ? values.transporterId : null,
                    customerId: values.ownershipType === "CUSTOMER" && values.customerId ? values.customerId : null,
                    tareWeight: parseFloat(values.tareWeight) || 0,
                    insuranceValidity: values.insuranceValidity || null,
                    permitValidity: values.permitValidity || null,
                    fcValidity: values.fcValidity || null
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

    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [assigningTruckId, setAssigningTruckId] = useState(null);

    const fetchTrucks = async () => {
        try {
            const companyId = selectedCompany?.id || selectedCompany?.companyId || null;
            const branchId = selectedBranch?.id || null;
            const response = await truckApi.getAll(page, rowsPerPage, searchQuery, companyId, branchId);
            if (response.success) {
                setTrucks(response.data.content);
                setTotalElements(response.data.totalElements);
            }
        } catch (error) {
            console.error("Error fetching trucks:", error);
        }
    };

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            const companyId = selectedCompany?.id || selectedCompany?.companyId || null;
            const branchId = selectedBranch?.id || null;

            const custResp = await customerApi.getAll(0, 1000, "", companyId, branchId);
            if (custResp.success) setCustomers(custResp.data.content || []);
            
            // Fetch transporters globally since trucks are master records
            const transResp = await transporterApi.getAll(0, 1000, "", companyId, branchId);
            if (transResp.success) setTransporters(transResp.data.content || []);

            await fetchTrucks();
        } catch (error) {
            console.error("Error fetching initial data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
        setPage(0);
    }, [selectedCompany, selectedBranch]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTrucks();
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
    const handleNext = async () => {
        if (activeStep === 0) {
            const fieldsToValidate = ["truckNo", "ownershipType", "tareWeight"];
            if (formik.values.ownershipType === "TRANSPORTER") fieldsToValidate.push("transporterId");
            if (formik.values.ownershipType === "CUSTOMER") fieldsToValidate.push("customerId");

            const touchedFields = fieldsToValidate.reduce((acc, field) => ({ ...acc, [field]: true }), {});
            formik.setTouched(touchedFields);

            const errors = await formik.validateForm();
            const hasErrors = fieldsToValidate.some(field => errors[field]);
            if (hasErrors) return;
        }
        setActiveStep((prev) => prev + 1);
    };

    const handleBack = () => setActiveStep((prev) => prev - 1);

    const isStepComplete = () => {
        if (activeStep === 0) {
            const { truckNo, ownershipType, tareWeight, transporterId, customerId } = formik.values;
            if (!truckNo || !ownershipType || !tareWeight) return false;
            if (ownershipType === "TRANSPORTER" && !transporterId) return false;
            if (ownershipType === "CUSTOMER" && !customerId) return false;
            return true;
        }
        return true;
    };

    const renderStepper = () => {
        const fillPercentage = ((activeStep + 1) / steps.length) * 100;
        return (
            <Box sx={{ width: '100%', mb: 4, pt: 1, display: showSuccess ? 'none' : 'block' }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: { xs: 2, sm: 8 }, mb: 2 }}>
                    {steps.map((label, index) => {
                        const isActive = activeStep === index;
                        const isCompleted = activeStep > index;
                        return (
                            <Box key={index} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '200px' }}>
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
                                <Typography sx={{
                                    color: (isActive || isCompleted) ? '#374151' : 'transparent',
                                    fontSize: '13px', fontWeight: 600, textAlign: 'center', height: '20px'
                                }}>
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
                        borderRadius: '4px', width: `${fillPercentage}%`,
                        transition: 'width 0.4s ease-in-out'
                    }} />
                </Box>
            </Box>
        );
    };

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
        setActiveStep(0);
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
            fuelType: truck.fuelType || "DIESEL",
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
        setActiveStep(0);
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

    const handleUnassign = async (assignmentId) => {
        try {
            const res = await truckApi.removeAssignment(assignmentId);
            if (res.success) {
                setSnackbar({ open: true, message: "Unlinked successfully", severity: "success" });
                // If it's the selected truck in view modal, we need to update its local state
                if (selectedTruck) {
                    const updatedAssignments = selectedTruck.assignments.filter(a => a.id !== assignmentId);
                    setSelectedTruck({ ...selectedTruck, assignments: updatedAssignments });
                }
                fetchTrucks();
            }
        } catch (error) {
            setSnackbar({ open: true, message: "Error unlinking", severity: "error" });
        }
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        formik.resetForm();
        setActiveStep(0);
        setSelectedFiles({ rcFront: null, rcBack: null, insurance: null, permit: null, fc: null });
        setExistingFiles({ rcFront: null, rcBack: null, insurance: null, permit: null, fc: null });
    };

    const renderUploadButton = (label, field) => {
        const hasExisting = !!existingFiles[field];
        const isSelected = !!selectedFiles[field];
        const serverPath = "http://localhost:8080/uploads/";
        const fileName = isSelected ? selectedFiles[field].name : (hasExisting ? "File Uploaded" : label);

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
                        py: 1.2,
                        whiteSpace: 'nowrap',
                        height: '40px',
                        '&:hover': { background: isSelected || hasExisting ? '#059669' : '#003499' }
                    }}
                >
                    {fileName}
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
                            } else if (type === "number") {
                                const val = e.target.value.replace(/[^0-9.]/g, '');
                                formik.setFieldValue(field, val);
                            } else {
                                formik.handleChange(e);
                            }
                        }}
                        onBlur={formik.handleBlur}
                        error={!!error}
                        helperText={error}
                        InputLabelProps={type === "date" ? { shrink: true } : {}}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                backgroundColor: '#F9FAFB',
                                '& .MuiOutlinedInput-notchedOutline': { border: '1px solid #F3F4F6' }
                            },
                            '& .MuiFormHelperText-root': { ml: 1 }
                        }}
                    />
                )}
            </Box>
        );
    };

    const renderStepContent = () => {
        const itemWidth = "calc(50% - 12px)";
        const gap = "24px";

        if (activeStep === 0) {
            return (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: gap }}>
                    <Box sx={{ width: '100%', mb: 1 }}><Typography sx={{ fontWeight: 800, fontSize: '16px', color: '#111827' }}>Basic Information</Typography></Box>
                    
                    <Box sx={{ width: itemWidth }}>{renderField("Vehicle Number *", "Enter truck number (e.g. MH12AB1234)", false, "text", "truckNo")}</Box>
                    <Box sx={{ width: itemWidth }}>{renderField("Ownership Type *", "Select type", true, "text", "ownershipType", [
                        { label: "Owned", value: "OWN" },
                        { label: "Transporter", value: "TRANSPORTER" },
                        { label: "Customer", value: "CUSTOMER" }
                    ])}</Box>

                    {formik.values.ownershipType === "TRANSPORTER" && (
                        <Box sx={{ width: itemWidth }}>
                            {renderField("Select Transporter *", "Choose transporter", true, "text", "transporterId",
                                transporters.map(tr => ({ label: `${tr.name} (${tr.iCode})`, value: tr.id }))
                            )}
                        </Box>
                    )}

                    {formik.values.ownershipType === "CUSTOMER" && (
                        <Box sx={{ width: itemWidth }}>
                            {renderField("Select Customer *", "Choose customer", true, "text", "customerId",
                                customers.map(cu => ({ label: cu.name, value: cu.id }))
                            )}
                        </Box>
                    )}

                    <Box sx={{ width: itemWidth }}>{renderField("Owner Name (optional)", "Enter owner name", false, "text", "registerName")}</Box>
                    <Box sx={{ width: itemWidth }}>{renderField("Tare Weight (kg) *", "Enter weight", false, "number", "tareWeight")}</Box>

                    <Box sx={{ width: '100%', mt: 2, mb: 1 }}><Typography sx={{ fontWeight: 800, fontSize: '16px', color: '#111827' }}>Technical Specifications</Typography></Box>
                    <Box sx={{ width: itemWidth }}>{renderField("Make", "Enter make", false, "text", "make")}</Box>
                    <Box sx={{ width: itemWidth }}>{renderField("Model", "Enter model", false, "text", "model")}</Box>
                    <Box sx={{ width: itemWidth }}>{renderField("Vehicle Type", "Select vehicle type", true, "text", "usageType", [
                        { label: "Commercial", value: "Commercial" },
                        { label: "Passenger", value: "Passenger" }
                    ])}</Box>
                    <Box sx={{ width: itemWidth }}>{renderField("Fuel Type", "Select fuel", true, "text", "fuelType", [
                        { label: "Petrol", value: "PETROL" },
                        { label: "Diesel", value: "DIESEL" },
                        { label: "EV", value: "EV" }
                    ])}</Box>
                    <Box sx={{ width: itemWidth }}>{renderField("Engine Number", "Enter engine no", false, "text", "engineNo")}</Box>
                    <Box sx={{ width: itemWidth }}>{renderField("Chassis Number", "Enter chassis no", false, "text", "chassisNo")}</Box>
                </Box>
            );
        }

        if (activeStep === 1) {
            return (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: gap }}>
                    <Box sx={{ width: '100%', mb: 1 }}><Typography sx={{ fontWeight: 800, fontSize: '16px', color: '#111827' }}>Registration Certificate (RC)</Typography></Box>
                    <Box sx={{ width: itemWidth }}>
                        <Typography sx={{ fontSize: '13px', color: '#374151', mb: 0.8, fontWeight: 600 }}>RC Front</Typography>
                        {renderUploadButton("Upload RC Front", "rcFront")}
                    </Box>
                    <Box sx={{ width: itemWidth }}>
                        <Typography sx={{ fontSize: '13px', color: '#374151', mb: 0.8, fontWeight: 600 }}>RC Back</Typography>
                        {renderUploadButton("Upload RC Back", "rcBack")}
                    </Box>

                    <Box sx={{ width: '100%', mt: 2, mb: 1 }}><Typography sx={{ fontWeight: 800, fontSize: '16px', color: '#111827' }}>Insurance Details</Typography></Box>
                    <Box sx={{ width: itemWidth }}>{renderField("Insurance expiry date ", "yyyy-mm-dd", false, "date", "insuranceValidity")}</Box>
                    <Box sx={{ width: itemWidth }}>
                        <Typography sx={{ fontSize: '13px', color: '#374151', mb: 0.8, fontWeight: 600 }}>Upload Insurance</Typography>
                        {renderUploadButton("Upload Insurance", "insurance")}
                    </Box>

                    <Box sx={{ width: '100%', mt: 2, mb: 1 }}><Typography sx={{ fontWeight: 800, fontSize: '16px', color: '#111827' }}>Permit Details</Typography></Box>
                    <Box sx={{ width: itemWidth }}>{renderField("Permit expiry date ", "yyyy-mm-dd", false, "date", "permitValidity")}</Box>
                    <Box sx={{ width: itemWidth }}>
                        <Typography sx={{ fontSize: '13px', color: '#374151', mb: 0.8, fontWeight: 600 }}>Upload Permit</Typography>
                        {renderUploadButton("Upload Permit", "permit")}
                    </Box>

                    <Box sx={{ width: '100%', mt: 2, mb: 1 }}><Typography sx={{ fontWeight: 800, fontSize: '16px', color: '#111827' }}>FC Details</Typography></Box>
                    <Box sx={{ width: itemWidth }}>{renderField("FC expiry date", "yyyy-mm-dd", false, "date", "fcValidity")}</Box>
                    <Box sx={{ width: itemWidth }}>
                        <Typography sx={{ fontSize: '13px', color: '#374151', mb: 0.8, fontWeight: 600 }}>Upload FC</Typography>
                        {renderUploadButton("Upload FC", "fc")}
                    </Box>
                </Box>
            );
        }
    };

    return (
        <Box sx={{ animation: "fadeIn 0.5s ease-out" }}>
            {/* Header Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h3" sx={{ fontWeight: 900, color: palette.text.secondary }}>
                    Truck Management
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
                        New Truck
                    </Button>
                )}
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
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>Code</TableCell>
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
                                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                        <CircularProgress size={24} />
                                    </TableCell>
                                </TableRow>
                            ) : trucks.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                        <Typography color="textSecondary">No trucks found</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : trucks.map((t) => (
                                <TableRow key={t.id} sx={{ '&:hover': { backgroundColor: palette.background.paper } }}>
                                    <TableCell sx={{ fontWeight: 800, color: '#0057FF' }}>{t.truckCode || 'N/A'}</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: palette.text.primary }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <GlobalTruckIcon sx={{ fontSize: 18, color: palette.primary.main }} />
                                            {t.truckNo}
                                        </Box>
                                    </TableCell>
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
                                    <TableCell>
                                        <Typography sx={{ fontWeight: 600, color: '#4B5563' }}>{t.tareWeight} kg</Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                            <Tooltip title="Link to Branch">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => {
                                                        setAssigningTruckId(t.id);
                                                        setAssignModalOpen(true);
                                                    }}
                                                    sx={{ color: '#10B981', backgroundColor: '#F0FDF4' }}
                                                >
                                                    <AddIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="View Details">
                                                <IconButton onClick={() => handleViewTruck(t)} sx={{ color: palette.primary.main, backgroundColor: 'rgba(0, 87, 255, 0.05)' }} size="small"><ViewIcon fontSize="small" /></IconButton>
                                            </Tooltip>
                                            <Tooltip title="Edit">
                                                <IconButton
                                                    size="small"
                                                    sx={{ color: '#0057FF', backgroundColor: 'rgba(0, 87, 255, 0.05)' }}
                                                    onClick={() => handleEditTruck(t)}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton
                                                    size="small"
                                                    sx={{ color: '#EF4444', backgroundColor: '#FEF2F2' }}
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
                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                justifyContent: 'center', py: 6, textAlign: 'center',
                                color: '#fff', minHeight: '260px'
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
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                                    <Typography variant="h4" sx={{ fontWeight: 900 }}>
                                        {isEditing ? "Edit Truck" : "New Truck Registry"}
                                    </Typography>
                                    <IconButton onClick={handleCloseModal} sx={{ color: '#64748B' }}>
                                        <CloseIcon />
                                    </IconButton>
                                </Box>

                                {renderStepper()}

                                <Box>
                                    <Box sx={{ minHeight: '350px' }}>
                                        {renderStepContent()}
                                    </Box>

                                    <Box sx={{ mt: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Button
                                            onClick={activeStep === 0 ? handleCloseModal : handleBack}
                                            sx={{ color: '#64748B', fontWeight: 700, textTransform: 'none', fontSize: '15px' }}
                                        >
                                            {activeStep === 0 ? "Cancel" : "Back"}
                                        </Button>
                                        <Box sx={{ display: 'flex', gap: 2 }}>
                                            {activeStep < steps.length - 1 ? (
                                                <Button
                                                    variant="contained"
                                                    onClick={handleNext}
                                                    disabled={!isStepComplete()}
                                                    sx={{
                                                        background: 'linear-gradient(135deg, #0057FF 0%, #003499 100%)',
                                                        borderRadius: '12px', px: 4, py: 1.2,
                                                        fontWeight: 700, textTransform: 'none',
                                                        boxShadow: '0 4px 12px rgba(0, 87, 255, 0.25)',
                                                        '&:disabled': { background: '#E2E8F0' }
                                                    }}
                                                >
                                                    Next Step
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="contained"
                                                    disabled={formik.isSubmitting}
                                                    onClick={() => formik.handleSubmit()}
                                                    sx={{
                                                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                                        borderRadius: '12px', px: 4, py: 1.2,
                                                        fontWeight: 700, textTransform: 'none',
                                                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                                                    }}
                                                >
                                                    {formik.isSubmitting ? <CircularProgress size={24} color="inherit" /> : (isEditing ? "Update Truck" : "Complete Registration")}
                                                </Button>
                                            )}
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        )}
                    </Box>
                </DialogContent>
            </Dialog>

            {/* View Modal */}
            <Dialog open={viewModalOpen} onClose={() => setViewModalOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '24px', p: 2, backgroundColor: '#F8FAFC' } }}>
                <DialogContent>
                    {selectedTruck && (
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
                                    <Typography sx={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', mb: 0.5 }}>Vehicle Master Profile</Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>{selectedTruck.truckNo}</Typography>
                                    <Box sx={{ display: 'flex', gap: 2, mt: 1, alignItems: 'center' }}>
                                        <Box sx={{ px: 1.5, py: 0.5, borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', fontSize: '11px', fontWeight: 700 }}>
                                            {selectedTruck.truckCode}
                                        </Box>
                                        <Typography sx={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <FactoryIcon sx={{ fontSize: 16 }} /> {selectedTruck.make || "N/A"} {selectedTruck.model}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ backgroundColor: 'rgba(255,255,255,0.1)', p: 2, borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <GlobalTruckIcon sx={{ fontSize: '40px', color: 'rgba(255,255,255,0.4)' }} />
                                </Box>
                            </Box>

                            <Grid container spacing={3}>
                                {/* Left Side: Details */}
                                <Grid item xs={12} md={7}>
                                    <Card sx={{ p: 4, borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                        <Typography sx={{ fontWeight: 800, fontSize: '18px', mb: 3, color: '#1e293b' }}>Technical Specifications</Typography>
                                        <Grid container spacing={3}>
                                            <Grid item xs={6}><DetailItem label="Ownership" value={selectedTruck.ownershipType} /></Grid>
                                            <Grid item xs={6}><DetailItem label="Partner" value={selectedTruck.transporterName || selectedTruck.customerName || "OWN"} /></Grid>
                                            <Grid item xs={6}><DetailItem label="Tare Weight" value={`${selectedTruck.tareWeight} KG`} /></Grid>
                                            <Grid item xs={6}><DetailItem label="Fuel Type" value={selectedTruck.fuelType} /></Grid>
                                            <Grid item xs={12}><Divider sx={{ borderStyle: 'dashed' }} /></Grid>
                                            <Grid item xs={6}><DetailItem label="Engine No" value={selectedTruck.engineNo} /></Grid>
                                            <Grid item xs={6}><DetailItem label="Chassis No" value={selectedTruck.chassisNo} /></Grid>
                                        </Grid>

                                        <Typography sx={{ fontWeight: 800, fontSize: '18px', mt: 4, mb: 3, color: '#1e293b' }}>Documents & Validity</Typography>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12}>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                    {selectedTruck.rcFrontPath && <Button variant="outlined" size="small" onClick={() => window.open(`http://localhost:8080/uploads/${selectedTruck.rcFrontPath}`)} sx={{ borderRadius: '8px', textTransform: 'none' }}>RC Front</Button>}
                                                    {selectedTruck.rcBackPath && <Button variant="outlined" size="small" onClick={() => window.open(`http://localhost:8080/uploads/${selectedTruck.rcBackPath}`)} sx={{ borderRadius: '8px', textTransform: 'none' }}>RC Back</Button>}
                                                    {selectedTruck.insurancePath && <Button variant="outlined" size="small" onClick={() => window.open(`http://localhost:8080/uploads/${selectedTruck.insurancePath}`)} sx={{ borderRadius: '8px', textTransform: 'none' }}>Insurance</Button>}
                                                    {selectedTruck.permitPath && <Button variant="outlined" size="small" onClick={() => window.open(`http://localhost:8080/uploads/${selectedTruck.permitPath}`)} sx={{ borderRadius: '8px', textTransform: 'none' }}>Permit</Button>}
                                                    {selectedTruck.fcPath && <Button variant="outlined" size="small" onClick={() => window.open(`http://localhost:8080/uploads/${selectedTruck.fcPath}`)} sx={{ borderRadius: '8px', textTransform: 'none' }}>FC</Button>}
                                                </Box>
                                            </Grid>
                                            <Grid item xs={4}><DetailItem label="Insurance Exp" value={selectedTruck.insuranceValidity} color="#EF4444" /></Grid>
                                            <Grid item xs={4}><DetailItem label="Permit Exp" value={selectedTruck.permitValidity} color="#EF4444" /></Grid>
                                            <Grid item xs={4}><DetailItem label="FC Exp" value={selectedTruck.fcValidity} color="#EF4444" /></Grid>
                                        </Grid>
                                    </Card>
                                </Grid>

                                {/* Right Side: Linked Branches */}
                                <Grid item xs={12} md={5}>
                                    <Card sx={{ p: 4, borderRadius: '24px', backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', height: '100%' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                            <Typography sx={{ fontWeight: 800, fontSize: '18px', color: '#1e293b' }}>Linked Branches</Typography>
                                            <Box sx={{ backgroundColor: '#e0f2fe', color: '#0369a1', px: 1.5, py: 0.5, borderRadius: '8px', fontSize: '11px', fontWeight: 700 }}>
                                                {selectedTruck.assignments?.length || 0} Active
                                            </Box>
                                        </Box>

                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            {selectedTruck.assignments?.length > 0 ? (
                                                selectedTruck.assignments.map(a => (
                                                    <Box key={a.id} sx={{ p: 2, borderRadius: '16px', backgroundColor: '#fff', border: '1px solid #e2e8f0' }}>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                            <Box>
                                                                <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>{a.companyName}</Typography>
                                                                <Typography sx={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>{a.branchName}</Typography>
                                                            </Box>
                                                            <IconButton size="small" sx={{ color: '#ef4444', backgroundColor: '#fee2e2' }} onClick={() => handleUnassign(a.id)}>
                                                                <UnlinkIcon sx={{ fontSize: '14px' }} />
                                                            </IconButton>
                                                        </Box>
                                                    </Box>
                                                ))
                                            ) : (
                                                <Box sx={{ py: 6, textAlign: 'center', backgroundColor: '#f1f5f9', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
                                                    <Typography sx={{ color: '#94a3b8', fontSize: '13px' }}>Not linked to any branch</Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </Card>
                                </Grid>
                            </Grid>

                            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                                <Button onClick={() => setViewModalOpen(false)} variant="outlined" sx={{ borderRadius: '12px', px: 6, py: 1, textTransform: 'none', fontWeight: 700 }}>
                                    Close Window
                                </Button>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>

            <AssignBranchModal open={assignModalOpen} onClose={() => setAssignModalOpen(false)} truckId={assigningTruckId} onAssigned={fetchTrucks} />

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%', borderRadius: '12px', fontWeight: 600 }}>{snackbar.message}</Alert>
            </Snackbar>

            <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} PaperProps={{ sx: { borderRadius: '24px', padding: '16px', maxWidth: '400px' } }}>
                <DialogContent>
                    <Box sx={{ textAlign: 'center' }}>
                        <DeleteIcon sx={{ fontSize: '48px', color: '#EF4444', mb: 2 }} />
                        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>Delete Truck?</Typography>
                        <Typography variant="body2" sx={{ color: '#6B7280', mb: 4 }}>This will permanently remove the truck and all its branch associations.</Typography>
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                            <Button onClick={() => setDeleteConfirmOpen(false)} variant="outlined" sx={{ borderRadius: '12px', px: 4 }}>Cancel</Button>
                            <Button onClick={handleConfirmDelete} variant="contained" color="error" sx={{ borderRadius: '12px', px: 4 }}>Delete Now</Button>
                        </Box>
                    </Box>
                </DialogContent>
            </Dialog>
        </Box>
    );
}
