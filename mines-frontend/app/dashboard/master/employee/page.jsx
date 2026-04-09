"use client";

import React, { useState, useEffect } from "react";
import {
    Box, Typography, Card, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Button,
    TextField, InputAdornment, Tooltip, Dialog, DialogContent,
    Select, MenuItem, Switch, FormControlLabel, Radio, RadioGroup,
    TablePagination, Stepper, Step, StepLabel, CircularProgress,
    Snackbar, Alert
} from "@mui/material";
import {
    SearchOutlined as SearchIcon, AddOutlined as AddIcon, FileDownloadOutlined as DownloadIcon,
    PrintOutlined as PrintIcon, SortOutlined as SortIcon, VisibilityOutlined as ViewIcon,
    MoreVertOutlined as ActionIcon, CloudUploadOutlined as UploadIcon,
    EditOutlined as EditIcon, DeleteOutline as DeleteIcon
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { palette } from "@/theme";
import { employeeApi, adminApi } from "@/services/api";
import { useFormik } from "formik";
import * as Yup from "yup";
import { aadhaarRegex, panRegex, phoneRegex, pincodeRegex, ifscRegex } from "@/utils/validationSchemas";

export default function EmployeePage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [openModal, setOpenModal] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const router = useRouter();

    const [employees, setEmployees] = useState([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [roles, setRoles] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [availableBranches, setAvailableBranches] = useState([]);
    const [currentUserRank, setCurrentUserRank] = useState(0);

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalElements, setTotalElements] = useState(0);

    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Notification State
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
    const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

    // Delete Confirmation State
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);

    // View Details State
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    const handleChangePage = (event, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // File state
    const [files, setFiles] = useState({
        passbook: null,
        aadhaar: null,
        pan: null,
        drivingLicense: null
    });

    const [existingFiles, setExistingFiles] = useState({
        passbook: null,
        aadhaar: null,
        pan: null,
        drivingLicense: null
    });

    // Initial values for Formik
    const initialValues = {
        firstName: "", lastName: "", gender: "male", role: "", companyId: "", branchId: "",
        dateOfBirth: "", dateOfJoining: "", addressLine1: "", addressLine2: "", district: "", state: "",
        pincode: "", contactNumber: "", username: "", password: "",
        salaryType: "", basicSalary: "", bankAccountHolderName: "", bankName: "",
        bankAccountNumber: "", ifscCode: "", aadhaarNumber: "", panNumber: "", drivingLicenseNumber: ""
    };

    // Yup validation schema
    const employeeValidationSchema = Yup.object({
        firstName: Yup.string().required("First name is required"),
        lastName: Yup.string().required("Last name is required"),
        gender: Yup.string().required("Gender is required"),
        role: Yup.string().required("Role is required"),
        companyId: Yup.string().required("Company is required"),
        branchId: Yup.string().required("Branch is required"),
        contactNumber: Yup.string()
            .matches(phoneRegex, "Phone must be 10-12 digits")
            .required("Contact number is required"),
        pincode: Yup.string()
            .matches(pincodeRegex, "Pincode must be 6 digits")
            .required("Pincode is required"),
        addressLine1: Yup.string().max(50, "Address cannot exceed 50 characters").required("Address is required"),
        district: Yup.string().required("District is required"),
        state: Yup.string().required("State is required"),
        username: Yup.string().required("Username is required"),
        password: isEditing
            ? Yup.string().min(6, "Password must be at least 6 characters")
            : Yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
        dateOfBirth: Yup.string().required("Date of Birth is required"),
        dateOfJoining: Yup.string().required("Date of Joining is required"),

        // Optional but validated if provided
        salaryType: Yup.string().required("Salary type is required"),
        basicSalary: Yup.number().typeError("Basic salary must be a number").required("Basic salary is required"),
        bankAccountNumber: Yup.string().matches(/^[0-9]{9,18}$/, "Account number must be 9-18 digits"),
        ifscCode: Yup.string().matches(ifscRegex, "Invalid IFSC format"),
        aadhaarNumber: Yup.string().matches(aadhaarRegex, "Aadhar number must be 12 digits"),
        panNumber: Yup.string().matches(panRegex, "Invalid PAN format"),
        drivingLicenseNumber: Yup.string().min(5, "Too short"),
    });

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            const [roleResp, compResp] = await Promise.all([
                adminApi.getRoles(),
                adminApi.getCompanies(0, 500)
            ]);

            if (roleResp.success) setRoles(roleResp.data);
            if (compResp.success) setCompanies(compResp.data.content);

            // Get current user rank from localStorage
            const savedUser = localStorage.getItem("user");
            if (savedUser) {
                const user = JSON.parse(savedUser);
                const userRole = roleResp.data.find(r => r.name === user.roleName);
                if (userRole) setCurrentUserRank(userRole.rank);
            }

            await fetchEmployees();
        } catch (error) {
            console.error("Error fetching initial employee data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const response = await employeeApi.getAll(page, rowsPerPage, searchQuery);
            if (response.success) {
                setEmployees(response.data.content);
                setTotalElements(response.data.totalElements);
            }
        } catch (error) {
            console.error("Error fetching employees:", error);
        }
    };

    useEffect(() => {
        fetchInitialData();
        setIsInitialized(true);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchEmployees();
        }, 300);
        return () => clearTimeout(timer);
    }, [page, rowsPerPage, searchQuery]);

    const formik = useFormik({
        initialValues,
        validationSchema: employeeValidationSchema,
        validateOnBlur: true,
        validateOnChange: false,
        onSubmit: async (values) => {
            try {
                // Ensure correct data types and add ID if editing
                const payload = {
                    ...values,
                    id: editingId || null,
                    companyId: values.companyId || null,
                    branchId: values.branchId || null,
                    basicSalary: parseFloat(values.basicSalary) || 0,
                    active: true
                };

                // If editing and password is empty, remove it so we don't overwrite it
                if (isEditing && !values.password) {
                    delete payload.password;
                }

                const response = await employeeApi.upsert(payload, files);
                if (response.success) {
                    setShowSuccess(true);
                    setTimeout(() => {
                        handleCloseModal();
                        fetchEmployees();
                    }, 2000);
                }
            } catch (error) {
                console.error("Error saving employee:", error);
                setSnackbar({
                    open: true,
                    message: "Failed to save employee: " + (error.response?.data?.message || "Unknown error"),
                    severity: "error"
                });
            }
        },
    });

    const filteredRoles = React.useMemo(() => {
        const list = roles.filter(role => role.rank > currentUserRank);
        return list;
    }, [roles, currentUserRank]);

    // Debug logging for validation errors
    useEffect(() => {
        if (Object.keys(formik.errors).length > 0) {
            console.log("Formik Validation Errors:", formik.errors);
            console.log("Current Formik Values:", formik.values);
        }
    }, [formik.errors, formik.isSubmitting]);

    const handleOpenModal = () => {
        setIsEditing(false);
        setEditingId(null);
        setAvailableBranches([]);
        formik.resetForm();
        setFiles({ passbook: null, aadhaar: null, pan: null, drivingLicense: null });
        setExistingFiles({ passbook: null, aadhaar: null, pan: null, drivingLicense: null });
        setOpenModal(true);
        setShowSuccess(false);
        setActiveStep(0);
    };

    const handleEditEmployee = (employee) => {
        setIsEditing(true);
        setEditingId(employee.id);

        console.log("Mapping employee for edit:", employee);

        // Find the company to populate its branches
        const compId = employee.company?.id || employee.companyId || "";
        const company = companies.find(c => c.id === compId);
        if (company) {
            setAvailableBranches(company.branches || []);
        } else {
            setAvailableBranches([]);
        }

        formik.setValues({
            firstName: employee.firstName || "",
            lastName: employee.lastName || "",
            gender: (employee.gender || "male").toLowerCase(),
            role: employee.role?.roleName || employee.role || employee.designation || "",
            companyId: employee.company?.id || employee.companyId || "",
            branchId: employee.branch?.id || employee.branchId || "",
            dateOfBirth: employee.dateOfBirth?.split('T')[0] || "",
            dateOfJoining: employee.dateOfJoining?.split('T')[0] || "",
            addressLine1: employee.address?.addressLine1 || employee.addressLine1 || "",
            addressLine2: employee.address?.addressLine2 || employee.addressLine2 || "",
            district: employee.address?.district || employee.district || "",
            state: employee.address?.state || employee.state || "",
            pincode: employee.address?.pincode || employee.pincode || "",
            contactNumber: employee.contactNumber || employee.phone || "",
            username: employee.user?.username || employee.username || "",
            password: "",
            salaryType: employee.salaryType || "MONTHLY",
            basicSalary: employee.basicSalary || 0,
            bankAccountHolderName: employee.bankAccountHolderName || "",
            bankName: employee.bankName || "",
            bankAccountNumber: employee.bankAccountNumber || "",
            ifscCode: (employee.ifscCode || "").toUpperCase(),
            aadhaarNumber: employee.aadhaarNumber ? String(employee.aadhaarNumber) : "",
            panNumber: (employee.panNumber || "").toUpperCase(),
            drivingLicenseNumber: (employee.drivingLicenseNumber || "").toUpperCase()
        });

        setFiles({ passbook: null, aadhaar: null, pan: null, drivingLicense: null });
        setExistingFiles({
            passbook: employee.passbookFilePath,
            aadhaar: employee.aadhaarFilePath,
            pan: employee.panFilePath,
            drivingLicense: employee.drivingLicenseFilePath
        });
        setOpenModal(true);
        setShowSuccess(false);
        setActiveStep(0);
    };

    const handleViewEmployee = (employee) => {
        setSelectedEmployee(employee);
        setViewModalOpen(true);
    };

    const handleDeleteEmployee = (id) => {
        setDeleteTargetId(id);
        setDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (deleteTargetId) {
            try {
                const response = await employeeApi.delete(deleteTargetId);
                if (response.success) {
                    fetchEmployees();
                    setDeleteConfirmOpen(false);
                    setDeleteTargetId(null);
                    setSnackbar({ open: true, message: "Employee deleted successfully", severity: "success" });
                } else {
                    setSnackbar({ open: true, message: response.message || "Failed to delete employee", severity: "error" });
                }
            } catch (error) {
                console.error("Error deleting employee:", error);
                setSnackbar({ open: true, message: "An error occurred while deleting the employee", severity: "error" });
            }
        }
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setActiveStep(0);
        formik.resetForm();
        setShowSuccess(false);
        setIsEditing(false);
        setEditingId(null);
        setAvailableBranches([]);
        setExistingFiles({ passbook: null, aadhaar: null, pan: null, drivingLicense: null });
    };

    const generatePassword = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
        let password = "";
        for (let i = 0; i < 10; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        formik.setFieldValue("password", password);
    };

    const handleFileUpload = (field, file) => {
        setFiles(prev => ({ ...prev, [field]: file }));
    };

    const handleNext = async () => {
        // If editing, skip validation blocks for navigation
        if (isEditing) {
            setActiveStep((prev) => prev + 1);
            return;
        }

        const errors = await formik.validateForm();
        if (activeStep === 0) {
            const step1Fields = ['firstName', 'lastName', 'gender', 'role', 'companyId', 'branchId', 'contactNumber', 'addressLine1', 'district', 'state', 'pincode', 'dateOfBirth', 'dateOfJoining'];
            const touchedFields = step1Fields.reduce((acc, field) => ({ ...acc, [field]: true }), {});
            formik.setTouched(touchedFields);
            const step1Errors = step1Fields.filter(key => errors[key]);
            if (step1Errors.length > 0) return;
        }
        setActiveStep((prev) => prev + 1);
    };
    const handleBack = () => setActiveStep((prev) => prev - 1);

    const isStepComplete = () => {
        // If we are editing, allow navigation between steps freely
        if (isEditing) return true;

        if (activeStep === 0) {
            const requiredStep0 = ['firstName', 'lastName', 'gender', 'role', 'companyId', 'branchId', 'contactNumber', 'addressLine1', 'district', 'state', 'pincode', 'dateOfBirth', 'dateOfJoining'];
            const errors = formik.errors;
            return requiredStep0.every(field => !!formik.values[field]) && !requiredStep0.some(field => !!errors[field]);
        }
        if (activeStep === 1) {
            const requiredStep1Fields = ['salaryType', 'basicSalary'];
            const errors = formik.errors;
            // Aadhaar and PAN are required documents
            const docsUploaded = (!!files.aadhaar || !!existingFiles.aadhaar) && (!!files.pan || !!existingFiles.pan);
            return requiredStep1Fields.every(field => !!formik.values[field]) &&
                !requiredStep1Fields.some(field => !!errors[field]) &&
                docsUploaded;
        }
        if (activeStep === 2) {
            return !!formik.values.username && !!formik.values.password && !formik.errors.username && !formik.errors.password;
        }
        return true;
    };

    const steps = ["Basic Employee Details", "Documents & Access", "Login Access"];

    const renderStepper = () => {
        const fillPercentage = ((activeStep + 1) / steps.length) * 100;

        return (
            <Box sx={{ width: '100%', mb: 4, pt: 1, display: showSuccess ? 'none' : 'block' }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: { xs: 2, sm: 8 }, mb: 2 }}>
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
                                    fontWeight: 'bold',
                                    fontSize: '16px',
                                    mb: 1,
                                    border: isActive ? '2px solid #0057FF' : 'none'
                                }}>
                                    {index + 1}
                                </Box>
                                <Typography sx={{
                                    color: (isActive || isCompleted) ? '#374151' : 'transparent',
                                    fontSize: '13px', fontWeight: 600, textAlign: 'center',
                                    height: '20px'
                                }}>
                                    {isActive || isCompleted ? label : ""}
                                </Typography>
                            </Box>
                        );
                    })}
                </Box>

                <Box sx={{ width: '100%', px: 0 }}>
                    <Box sx={{ width: '100%', height: '6px', backgroundColor: '#FFFFFF', borderRadius: '4px', position: 'relative', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)' }}>
                        <Box sx={{
                            position: 'absolute', top: 0, left: 0, height: '100%',
                            background: 'linear-gradient(135deg, #0057FF 0%, #003499 100%)',
                            borderRadius: '4px',
                            width: `${fillPercentage}%`,
                            transition: 'width 0.4s ease-in-out'
                        }} />
                    </Box>
                </Box>
            </Box>
        );
    };

    const renderField = (label, placeholder, isSelect = false, type = "text", field = "") => {
        const value = formik.values[field] || "";
        const error = formik.touched[field] && formik.errors[field];

        if (type === "radio") {
            return (
                <Box sx={{ width: '100%' }}>
                    <Typography sx={{ fontSize: '13px', color: '#374151', mb: 0.8, fontWeight: 600 }}>{label}</Typography>
                    <RadioGroup
                        row
                        name={field}
                        value={value}
                        onChange={formik.handleChange}
                    >
                        <FormControlLabel value="male" control={<Radio size="small" sx={{ color: '#D1D5DB', '&.Mui-checked': { color: '#2D3FE2' } }} />} label={<Typography sx={{ fontSize: '13px', color: '#6B7280' }}>Male</Typography>} />
                        <FormControlLabel value="female" control={<Radio size="small" sx={{ color: '#D1D5DB', '&.Mui-checked': { color: '#2D3FE2' } }} />} label={<Typography sx={{ fontSize: '13px', color: '#6B7280' }}>Female</Typography>} />
                        <FormControlLabel value="others" control={<Radio size="small" sx={{ color: '#D1D5DB', '&.Mui-checked': { color: '#2D3FE2' } }} />} label={<Typography sx={{ fontSize: '13px', color: '#6B7280' }}>Others</Typography>} />
                    </RadioGroup>
                </Box>
            );
        }

        let options = [];
        if (field === "role") options = filteredRoles.map(r => ({ label: r.name, value: r.name }));
        else if (field === "companyId") options = companies.map(c => ({ label: c.name, value: c.id }));
        else if (field === "branchId") options = availableBranches.map(b => ({ label: b.name, value: b.id }));
        else if (field === "salaryType") options = [{ label: "Monthly", value: "MONTHLY" }, { label: "Daily", value: "DAILY" }, { label: "Hourly", value: "HOURLY" }];

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
                            if (field === "companyId") {
                                const company = companies.find(c => c.id === e.target.value);
                                setAvailableBranches(company ? company.branches : []);
                                formik.setFieldValue("branchId", "");
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
                        type={field === "password" ? "text" : type}
                        placeholder={placeholder}
                        variant="outlined"
                        value={value}
                        onChange={(e) => {
                            const letterOnlyFields = ['firstName', 'lastName', 'district', 'state', 'bankAccountHolderName', 'bankName'];
                            const numericOnlyFields = ['contactNumber', 'aadhaarNumber', 'bankAccountNumber', 'pincode', 'basicSalary'];
                            const alphanumericFields = ['drivingLicenseNumber', 'panNumber', 'ifscCode'];

                            if (letterOnlyFields.includes(field)) {
                                const val = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                                formik.setFieldValue(field, val);
                            } else if (numericOnlyFields.includes(field)) {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                formik.setFieldValue(field, val);
                            } else if (alphanumericFields.includes(field)) {
                                // Allow letters, numbers, and common delimiters for DL/IFSC
                                const val = e.target.value.replace(/[^a-zA-Z0-9\s-]/g, '').toUpperCase();
                                formik.setFieldValue(field, val);
                            } else if (field === "password") {
                                // Prevent manual typing for password field
                                return;
                            } else {
                                formik.handleChange(e);
                            }
                        }}
                        onBlur={formik.handleBlur}
                        error={!!error}
                        helperText={error}
                        InputProps={field === "password" ? {
                            endAdornment: (
                                <InputAdornment position="end">
                                    <Button
                                        size="small"
                                        onClick={generatePassword}
                                        sx={{
                                            fontSize: '10px',
                                            minWidth: 'auto',
                                            color: '#0057FF',
                                            fontWeight: 700,
                                            mr: 1,
                                            '&:hover': { backgroundColor: 'rgba(0, 87, 255, 0.04)' }
                                        }}
                                    >
                                        GENERATE
                                    </Button>
                                </InputAdornment>
                            )
                        } : {}}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', backgroundColor: field === "password" ? '#F3F4F6' : '#F9FAFB', '& .MuiOutlinedInput-notchedOutline': { border: '1px solid #F3F4F6' } } }}
                        inputProps={{
                            readOnly: field === "password",
                            ...(field.includes('addressLine') ? { maxLength: 50 } : {})
                        }}
                    />
                )}
            </Box>
        );
    };

    const renderUploadButton = (label, field) => {
        const hasExisting = !!existingFiles[field];
        const isUploaded = !!files[field];
        const fileName = isUploaded ? files[field].name : (hasExisting ? "File Uploaded" : label);
        const serverPath = "http://localhost:8080/uploads/employees/";

        return (
            <Box>
                <input
                    type="file"
                    id={`file-${field}`}
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileUpload(field, e.target.files[0])}
                />
                <Box sx={{ display: 'flex', gap: 1, mt: label === "Upload Passbook" ? 0 : 2.5 }}>
                    <label htmlFor={`file-${field}`} style={{ flex: 1 }}>
                        <Button
                            component="span"
                            variant="contained"
                            disableElevation
                            fullWidth
                            startIcon={<UploadIcon />}
                            sx={{
                                background: isUploaded || hasExisting
                                    ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                                    : 'linear-gradient(135deg, #0057FF 0%, #003499 100%)',
                                borderRadius: '8px',
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '13px',
                                py: 1.2,
                                '&:hover': { background: isUploaded || hasExisting ? '#059669' : '#003499' }
                            }}
                        >
                            {fileName}
                        </Button>
                    </label>
                    {hasExisting && !isUploaded && (
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => window.open(serverPath + existingFiles[field], "_blank")}
                            sx={{
                                borderRadius: '8px',
                                border: '1px solid #10B981',
                                color: '#10B981',
                                minWidth: '60px',
                                '&:hover': { border: '1px solid #059669', backgroundColor: 'rgba(16, 185, 129, 0.04)' }
                            }}
                        >
                            VIEW
                        </Button>
                    )}
                </Box>
            </Box>
        );
    };

    const renderSuccessStep = () => (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 6,
            px: 4,
            backgroundColor: '#2D3FE2',
            borderRadius: '24px',
            color: '#fff',
            textAlign: 'center',
            minHeight: '260px'
        }}>
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, fontSize: '32px' }}>
                Employee Added Successfully
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, fontSize: '15px' }}>
                Employee record has been created and saved successfully
            </Typography>
        </Box>
    );

    const renderStepContent = () => {
        const itemWidth = "calc(50% - 12px)";
        const gap = "24px";

        if (showSuccess) return renderSuccessStep();

        switch (activeStep) {
            case 0:
                return (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: gap }}>
                        <Box sx={{ width: itemWidth }}>{renderField("First Name", "Enter the first name", false, "text", "firstName")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("Last Name", "Enter the last name", false, "text", "lastName")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("Gender", "", false, "radio", "gender")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("Role", "Select role", true, "text", "role")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("Company", "Select company", true, "text", "companyId")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("Branch", "Select branch", true, "text", "branchId")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("Date of Birth", "yyyy-mm-dd", false, "date", "dateOfBirth")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("Date of Joining", "yyyy-mm-dd", false, "date", "dateOfJoining")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("Address Line 1", "Enter address", false, "text", "addressLine1")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("Address Line 2", "Enter address", false, "text", "addressLine2")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("District", "Choose district", false, "text", "district")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("State", "Choose State", false, "text", "state")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("Pincode", "Choose Pincode", false, "text", "pincode")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("Contact Number", "Enter contact number", false, "text", "contactNumber")}</Box>
                    </Box>
                );
            case 1:
                return (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: gap }}>
                        {/* Salary Details */}
                        <Box sx={{ width: '100%', mt: 1 }}><Typography sx={{ fontWeight: 800, fontSize: '16px', color: '#111827' }}>Salary Details</Typography></Box>
                        <Box sx={{ width: itemWidth }}>{renderField("Salary Type", "Select salary type", true, "text", "salaryType")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("Basic Salary", "Enter basic salary", false, "text", "basicSalary")}</Box>

                        {/* Bank Details */}
                        <Box sx={{ width: '100%', mt: 1 }}><Typography sx={{ fontWeight: 800, fontSize: '16px', color: '#111827' }}>Bank Details</Typography></Box>
                        <Box sx={{ width: itemWidth }}>{renderField("Account Holder Name", "Enter name", false, "text", "bankAccountHolderName")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("Bank Name", "Enter bank name", false, "text", "bankName")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("Account Number", "Enter account number", false, "text", "bankAccountNumber")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("IFSC Code", "Enter IFSC code", false, "text", "ifscCode")}</Box>

                        {/* Upload Passbook */}
                        <Box sx={{ width: itemWidth, mt: 1 }}>
                            <Typography sx={{ fontSize: '13px', color: '#374151', mb: 0.8, fontWeight: 600 }}>Upload Passbook</Typography>
                            {renderUploadButton("Upload Passbook", "passbook")}
                        </Box>
                        <Box sx={{ width: itemWidth }}></Box>

                        {/* Upload Documents */}
                        <Box sx={{ width: '100%', mt: 1 }}><Typography sx={{ fontWeight: 800, fontSize: '16px', color: '#111827' }}>Upload Documents</Typography></Box>
                        <Box sx={{ width: itemWidth }}>{renderField("Aadhaar Number", "Enter aadhaar number", false, "text", "aadhaarNumber")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderUploadButton("Upload Aadhaar", "aadhaar")}</Box>

                        <Box sx={{ width: itemWidth }}>{renderField("PAN Number", "Enter PAN number", false, "text", "panNumber")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderUploadButton("Upload PAN", "pan")}</Box>

                        <Box sx={{ width: itemWidth }}>{renderField("Driving License Number", "Enter driving license number", false, "text", "drivingLicenseNumber")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderUploadButton("Upload Driving License", "drivingLicense")}</Box>
                    </Box>
                );
            case 2:
                return (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: gap }}>
                        <Box sx={{ width: itemWidth }}>{renderField("User Name", "Enter user name", false, "text", "username")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("Password", "Enter password", false, "password", "password")}</Box>
                    </Box>
                );
            default: return null;
        }
    };

    const filteredEmployees = employees.filter(employee =>
        (employee.firstName + " " + employee.lastName).toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.designation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.phone?.includes(searchQuery)
    );

    return (
        <Box sx={{ animation: "fadeIn 0.5s ease-out" }}>
            {/* Header Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h3" sx={{ fontWeight: 900, color: palette.text.secondary }}>
                    Employee
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
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
                        New Employee
                    </Button>
                </Box>
            </Box>

            {/* Toolbar Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, }}>
                <TextField
                    variant="outlined"
                    placeholder="Search employees..."
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
                    <Table sx={{ minWidth: 800 }}>
                        <TableHead sx={{ backgroundColor: palette.background.paper }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>Emp Code</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>First Name</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>Last Name</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>Role</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>Phone No</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>Pincode</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600, color: palette.text.primary }}>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                                        <CircularProgress size={24} />
                                    </TableCell>
                                </TableRow>
                            ) : employees.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                                        <Typography color="textSecondary">No employees found</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : employees.map((employee) => (
                                <TableRow key={employee.id} sx={{ '&:hover': { backgroundColor: palette.background.paper } }}>
                                    <TableCell sx={{ fontWeight: 500, color: palette.text.primary, fontSize: '13px' }}>{employee.employeeCode}</TableCell>
                                    <TableCell>{employee.firstName}</TableCell>
                                    <TableCell>{employee.lastName}</TableCell>
                                    <TableCell>{employee.designation}</TableCell>
                                    <TableCell>{employee.phone}</TableCell>
                                    <TableCell>{employee.address?.pincode}</TableCell>
                                    <TableCell align="center">
                                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                            <Tooltip title="View">
                                                <IconButton 
                                                    size="small" 
                                                    sx={{ color: palette.primary.main }}
                                                    onClick={() => handleViewEmployee(employee)}
                                                >
                                                    <ViewIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Edit">
                                                <IconButton
                                                    size="small"
                                                    sx={{ color: '#0057FF' }}
                                                    onClick={() => handleEditEmployee(employee)}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton
                                                    size="small"
                                                    sx={{ color: '#EF4444' }}
                                                    onClick={() => handleDeleteEmployee(employee.id)}
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
                        '.MuiTablePagination-select': {
                            fontSize: '13px',
                            fontWeight: 500
                        }
                    }}
                />
            </Card>

            {/* Modal for New Employee */}
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
                        {renderStepContent()}
                        {!showSuccess && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, gap: 2 }}>
                                {activeStep > 0 && (
                                    <Button
                                        variant="outlined"
                                        onClick={handleBack}
                                        sx={{ borderRadius: '12px', px: 4, textTransform: 'none', fontWeight: 600, color: '#6B7280', border: '1px solid #E5E7EB' }}
                                    >
                                        Back
                                    </Button>
                                )}
                                <Button
                                    variant="contained"
                                    onClick={activeStep < 2 ? handleNext : formik.handleSubmit}
                                    disabled={!isStepComplete()}
                                    sx={{
                                        backgroundColor: '#2D3FE2',
                                        borderRadius: '12px',
                                        px: 8,
                                        py: 1.5,
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        fontSize: '16px',
                                        '&:hover': { backgroundColor: '#1E2BB8' },
                                        '&.Mui-disabled': {
                                            backgroundColor: '#E5E7EB',
                                            color: '#9CA3AF'
                                        }
                                    }}
                                >
                                    {activeStep < 2 ? "Next" : "Submit"}
                                </Button>
                            </Box>
                        )}
                    </Box>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog 
                open={deleteConfirmOpen} 
                onClose={() => setDeleteConfirmOpen(false)}
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
                        maxWidth: '400px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                    }
                }}
            >
                <DialogContent>
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                        <Box sx={{ 
                            width: 64, height: 64, borderRadius: '50%', 
                            backgroundColor: '#FEF2F2', display: 'flex', 
                            justifyContent: 'center', alignItems: 'center', 
                            margin: '0 auto', mb: 3 
                        }}>
                            <DeleteIcon sx={{ fontSize: '32px', color: '#EF4444' }} />
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: '#111827' }}>
                            Delete Employee
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#6B7280', mb: 4, lineHeight: 1.6 }}>
                            Are you sure you want to delete this employee? This action cannot be undone and the record will be permanently removed.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                            <Button
                                onClick={() => setDeleteConfirmOpen(false)}
                                variant="outlined"
                                sx={{ 
                                    borderRadius: '12px', 
                                    textTransform: 'none', 
                                    fontWeight: 600, 
                                    color: '#6B7280', 
                                    px: 4,
                                    py: 1,
                                    border: '1px solid #E5E7EB',
                                    '&:hover': { backgroundColor: '#F9FAFB' }
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleConfirmDelete}
                                variant="contained"
                                sx={{ 
                                    borderRadius: '12px', 
                                    textTransform: 'none', 
                                    fontWeight: 600, 
                                    backgroundColor: '#EF4444', 
                                    px: 4,
                                    py: 1,
                                    '&:hover': { backgroundColor: '#DC2626' },
                                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
                                }}
                            >
                                Delete
                            </Button>
                        </Box>
                    </Box>
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

            {/* View Employee Details Modal */}
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
                    {selectedEmployee && (
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Box>
                                    <Typography variant="h4" sx={{ fontWeight: 900, color: '#111827' }}>
                                        {selectedEmployee.firstName} {selectedEmployee.lastName}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.5 }}>
                                        Employee ID: {selectedEmployee.id.substring(0, 8)} | Code: {selectedEmployee.employeeCode || "N/A"}
                                    </Typography>
                                </Box>
                                <Box sx={{ 
                                    px: 2, py: 1, borderRadius: '12px', 
                                    backgroundColor: selectedEmployee.active ? '#EBFDF5' : '#FEF2F2',
                                    color: selectedEmployee.active ? '#10B981' : '#EF4444',
                                    fontWeight: 700, fontSize: '13px'
                                }}>
                                    {selectedEmployee.active ? 'ACTIVE' : 'INACTIVE'}
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                                {/* Personal & Hierarchy */}
                                <Card sx={{ flex: '1 1 100%', borderRadius: '16px', p: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
                                    <Typography sx={{ fontWeight: 800, fontSize: '16px', color: '#111827', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 4, height: 16, backgroundColor: '#2D3FE2', borderRadius: 2 }} />
                                        Personal & Company Information
                                    </Typography>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 3 }}>
                                        <DetailItem label="Gender" value={selectedEmployee.gender} />
                                        <DetailItem label="Role" value={selectedEmployee.role?.roleName || selectedEmployee.designation || "N/A"} />
                                        <DetailItem label="Date of Birth" value={selectedEmployee.dateOfBirth} />
                                        <DetailItem label="Date of Joining" value={selectedEmployee.dateOfJoining} />
                                        <DetailItem label="Contact Number" value={selectedEmployee.contactNumber || selectedEmployee.phone} />
                                        <DetailItem label="Email" value={selectedEmployee.email || "N/A"} />
                                        <DetailItem label="Company" value={selectedEmployee.company?.name || selectedEmployee.companyName || "N/A"} />
                                        <DetailItem label="Branch" value={selectedEmployee.branch?.name || selectedEmployee.branchName || "N/A"} />
                                        <DetailItem label="Pincode" value={selectedEmployee.address?.pincode || selectedEmployee.pincode || "N/A"} />
                                        <Box sx={{ gridColumn: '1 / -1' }}>
                                            <DetailItem label="Address" value={`${selectedEmployee.address?.addressLine1 || ""}, ${selectedEmployee.address?.addressLine2 || ""}, ${selectedEmployee.address?.district || ""}, ${selectedEmployee.address?.state || ""}`} />
                                        </Box>
                                    </Box>
                                </Card>

                                {/* Salary & Bank */}
                                <Card sx={{ flex: '1 1 calc(50% - 12px)', borderRadius: '16px', p: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
                                    <Typography sx={{ fontWeight: 800, fontSize: '16px', color: '#111827', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 4, height: 16, backgroundColor: '#10B981', borderRadius: 2 }} />
                                        Salary & Bank Details
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <DetailItem label="Salary Type" value={selectedEmployee.salaryType} />
                                        <DetailItem label="Basic Salary" value={`₹${selectedEmployee.basicSalary?.toLocaleString()}`} />
                                        <DetailItem label="Bank Name" value={selectedEmployee.bankName} />
                                        <DetailItem label="Account Holder" value={selectedEmployee.bankAccountHolderName} />
                                        <DetailItem label="Account Number" value={selectedEmployee.bankAccountNumber} />
                                        <DetailItem label="IFSC Code" value={selectedEmployee.ifscCode} />
                                    </Box>
                                </Card>

                                {/* Documents */}
                                <Card sx={{ flex: '1 1 calc(50% - 12px)', borderRadius: '16px', p: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
                                    <Typography sx={{ fontWeight: 800, fontSize: '16px', color: '#111827', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 4, height: 16, backgroundColor: '#F59E0B', borderRadius: 2 }} />
                                        Documents & Login
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <DetailItem label="Username" value={selectedEmployee.user?.username || selectedEmployee.username} />
                                        <DetailItem label="Aadhaar Number" value={selectedEmployee.aadhaarNumber} />
                                        <DetailItem label="PAN Number" value={selectedEmployee.panNumber} />
                                        <DetailItem label="Driving License" value={selectedEmployee.drivingLicenseNumber || "N/A"} />
                                        
                                        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                            {selectedEmployee.passbookFilePath && <DocumentBadge label="Passbook" path={selectedEmployee.passbookFilePath} />}
                                            {selectedEmployee.aadhaarFilePath && <DocumentBadge label="Aadhaar" path={selectedEmployee.aadhaarFilePath} />}
                                            {selectedEmployee.panFilePath && <DocumentBadge label="PAN" path={selectedEmployee.panFilePath} />}
                                            {selectedEmployee.drivingLicenseFilePath && <DocumentBadge label="DL" path={selectedEmployee.drivingLicenseFilePath} />}
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

const DocumentBadge = ({ label, path }) => {
    const serverPath = "http://localhost:8080/uploads/employees/";
    return (
        <Box 
            onClick={() => window.open(serverPath + path, "_blank")}
            sx={{ 
                px: 1.5, py: 0.8, borderRadius: '8px', backgroundColor: '#F3F4F6', 
                color: '#374151', fontSize: '11px', fontWeight: 700, 
                cursor: 'pointer', border: '1px solid #E5E7EB',
                display: 'flex', alignItems: 'center', gap: 0.5,
                '&:hover': { backgroundColor: '#E5E7EB' }
            }}
        >
            <ViewIcon sx={{ fontSize: '14px' }} />
            {label}
        </Box>
    );
};
