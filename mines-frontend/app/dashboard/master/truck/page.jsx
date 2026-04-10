"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    Box, Typography, Card, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Button,
    TextField, InputAdornment, Tooltip, Dialog, DialogContent,
    Select, MenuItem, CircularProgress, Grid, Divider, TablePagination,
    Snackbar, Alert, Stepper, Step, StepLabel
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

// ─── Branch Dropdown Component ────────────────────────────
function BranchDropdown({ companyId, value, onChange, renderField }) {
    const [branches, setBranches] = React.useState([]);

    React.useEffect(() => {
        if (!companyId) { setBranches([]); return; }
        adminApi.getBranches(companyId).then(res => {
            if (res.success) {
                const list = res.data || [];
                setBranches(list);
                // Auto-select first branch if none selected
                if (!value && list.length > 0) {
                    onChange(list[0].id);
                }
            }
        }).catch(() => setBranches([]));
    }, [companyId]);

    return renderField("Branch *", "Select Branch", true, "text", "branchId",
        branches.map(b => ({ label: b.name, value: b.id }))
    );
}

export default function TruckPage() {
    const userRole = typeof window !== 'undefined' ? Cookies.get("role") || "" : "";
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
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                setCurrentUser(userData);
                if (userData.role === "ADMIN") {
                    adminApi.getCompanies(0, 1000).then(resp => {
                        if (resp.success) {
                            setAllCompanies(resp.data.content);
                        }
                    });
                } else if (userData.companies) {
                    setUserCompanyInfo(userData.companies);
                    if (userData.companies.length > 0) {
                        formik.setFieldValue("companyId", userData.companies[0].companyId);
                        formik.setFieldValue("branchId", userData.companies[0].branchId || "");
                    }
                }
            } catch (e) {
                console.error("Error parsing user data", e);
            }
        }
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
            companyId: "",
            branchId: "",
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
            // Only submit on the final step
            if (activeStep !== steps.length - 1) {
                setSubmitting(false);
                return;
            }
            try {
                const payload = {
                    ...values,
                    companyId: values.companyId || null,
                    branchId: values.branchId || null,
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

    const steps = ["General Truck Details", "Documents & Validity"];

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
            companyId: truck.companyId || (userCompanyInfo.length > 0 ? userCompanyInfo[0].companyId : ""),
            branchId: truck.branchId || (userCompanyInfo.length > 0 ? userCompanyInfo[0].branchId : ""),
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
                    
                    <Box sx={{ width: itemWidth }}>
                        {currentUser?.role === "ADMIN" 
                            ? renderField("Company *", "Select Company", true, "text", "companyId", allCompanies.map(c => ({ label: c.name, value: c.id })))
                            : renderField("Company *", "Select Company", true, "text", "companyId", userCompanyInfo.map(c => ({ label: c.companyName, value: c.companyId })))
                        }
                    </Box>
                    <Box sx={{ width: itemWidth }}>
                        <BranchDropdown
                            companyId={formik.values.companyId}
                            value={formik.values.branchId}
                            onChange={(val) => formik.setFieldValue("branchId", val)}
                            renderField={renderField}
                        />
                    </Box>

                    <Box sx={{ width: itemWidth }}>{renderField("Truck Number *", "Enter truck number (e.g. MH12AB1234)", false, "text", "truckNo")}</Box>
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
                    <Box sx={{ width: itemWidth }}>{renderField("Usage Type", "Select usage", true, "text", "usageType", [
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
                    <Box sx={{ width: itemWidth }}>{renderField("Insurance Validity", "yyyy-mm-dd", false, "date", "insuranceValidity")}</Box>
                    <Box sx={{ width: itemWidth }}>
                        <Typography sx={{ fontSize: '13px', color: '#374151', mb: 0.8, fontWeight: 600 }}>Upload Insurance</Typography>
                        {renderUploadButton("Upload Insurance", "insurance")}
                    </Box>

                    <Box sx={{ width: '100%', mt: 2, mb: 1 }}><Typography sx={{ fontWeight: 800, fontSize: '16px', color: '#111827' }}>Permit Details</Typography></Box>
                    <Box sx={{ width: itemWidth }}>{renderField("Permit Validity", "yyyy-mm-dd", false, "date", "permitValidity")}</Box>
                    <Box sx={{ width: itemWidth }}>
                        <Typography sx={{ fontSize: '13px', color: '#374151', mb: 0.8, fontWeight: 600 }}>Upload Permit</Typography>
                        {renderUploadButton("Upload Permit", "permit")}
                    </Box>

                    <Box sx={{ width: '100%', mt: 2, mb: 1 }}><Typography sx={{ fontWeight: 800, fontSize: '16px', color: '#111827' }}>FC Details</Typography></Box>
                    <Box sx={{ width: itemWidth }}>{renderField("FC Validity", "yyyy-mm-dd", false, "date", "fcValidity")}</Box>
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
                                    <TableCell sx={{ fontWeight: 700, color: '#0057FF' }}>{t.truckCode || 'N/A'}</TableCell>
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
                                            {(userRole !== 'PARTNER' && userRole !== 'ROLE_PARTNER') && (
                                                <>
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
        onClick={() => window.open(`http://localhost:8080/uploads/${path}`, '_blank')}
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
