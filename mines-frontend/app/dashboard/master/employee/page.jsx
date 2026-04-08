"use client";

import React, { useState, useEffect } from "react";
import {
    Box, Typography, Card, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Button,
    TextField, InputAdornment, Tooltip, Dialog, DialogContent,
    Select, MenuItem, Switch, FormControlLabel, Radio, RadioGroup
} from "@mui/material";
import {
    SearchOutlined as SearchIcon, AddOutlined as AddIcon, FileDownloadOutlined as DownloadIcon,
    PrintOutlined as PrintIcon, SortOutlined as SortIcon, VisibilityOutlined as ViewIcon,
    MoreVertOutlined as ActionIcon, CloudUploadOutlined as UploadIcon
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { palette } from "@/theme";
import { employeeApi, adminApi } from "@/services/api";
import { useFormik } from "formik";
import * as Yup from "yup";

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
    const [currentUserRank, setCurrentUserRank] = useState(0); // Default to 0 (highest privilege) so roles are visible by default
    
    // File state
    const [files, setFiles] = useState({
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
        role: Yup.string().required("Role is required"),
        contactNumber: Yup.string().matches(/^[0-9]{10,12}$/, "Phone must be 10-12 digits").required("Contact number is required"),
        pincode: Yup.string().matches(/^[0-9]{6}$/, "Pincode must be 6 digits"),
        addressLine1: Yup.string().required("Address is required"),
        district: Yup.string().required("District is required"),
        state: Yup.string().required("State is required"),
        username: Yup.string().required("User name is required"),
        password: Yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
        dateOfBirth: Yup.string().required("DOB is required"),
        dateOfJoining: Yup.string().required("DOJ is required"),
    });

    const fetchInitialData = async () => {
        try {
            const [empResp, roleResp, compResp] = await Promise.all([
                employeeApi.getAll(),
                adminApi.getRoles(),
                adminApi.getCompanies()
            ]);
            
            if (empResp.success) setEmployees(empResp.data);
            if (roleResp.success) setRoles(roleResp.data);
            if (compResp.success) setCompanies(compResp.data);

            // Get current user rank from localStorage
            const savedUser = localStorage.getItem("user");
            if (savedUser) {
                const user = JSON.parse(savedUser);
                const userRole = roleResp.data.find(r => r.name === user.roleName);
                if (userRole) setCurrentUserRank(userRole.rank);
            }
        } catch (error) {
            console.error("Error fetching employee data:", error);
        }
    };

    useEffect(() => {
        fetchInitialData();
        setIsInitialized(true);
    }, []);

    const formik = useFormik({
        initialValues,
        validationSchema: employeeValidationSchema,
        validateOnBlur: true,
        validateOnChange: false,
        onSubmit: async (values) => {
            try {
                // Ensure date format is YYYY-MM-DD for backend
                const payload = {
                    ...values,
                    basicSalary: parseFloat(values.basicSalary) || 0
                };
                
                const response = await employeeApi.upsert(payload, files);
                if (response.success) {
                    setShowSuccess(true);
                    const listResp = await employeeApi.getAll();
                    if (listResp.success) setEmployees(listResp.data);
                    
                    setTimeout(() => {
                        handleCloseModal();
                    }, 2000);
                }
            } catch (error) {
                console.error("Error saving employee:", error);
                alert("Failed to save employee: " + (error.response?.data?.message || "Unknown error"));
            }
        },
    });

    const filteredRoles = React.useMemo(() => {
        const list = roles.filter(role => role.rank > currentUserRank);
        console.log("Filtering roles (rank > current):", { rolesCount: roles.length, currentUserRank, filteredCount: list.length });
        return list;
    }, [roles, currentUserRank]);

    const handleOpenModal = () => {
        formik.resetForm();
        setFiles({ passbook: null, aadhaar: null, pan: null, drivingLicense: null });
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setActiveStep(0);
        formik.resetForm();
        setShowSuccess(false);
    };

    const handleFileUpload = (field, file) => {
        setFiles(prev => ({ ...prev, [field]: file }));
    };

    const handleNext = async () => {
        const errors = await formik.validateForm();
        if (activeStep === 0) {
            const step1Fields = ['firstName', 'lastName', 'role', 'contactNumber', 'addressLine1', 'district', 'state', 'pincode', 'dateOfBirth', 'dateOfJoining'];
            const touchedFields = step1Fields.reduce((acc, field) => ({ ...acc, [field]: true }), {});
            formik.setTouched(touchedFields);
            const step1Errors = step1Fields.filter(key => errors[key]);
            if (step1Errors.length > 0) return;
        }
        setActiveStep((prev) => prev + 1);
    };
    const handleBack = () => setActiveStep((prev) => prev - 1);

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
                        type={type}
                        placeholder={placeholder}
                        variant="outlined"
                        value={value}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={!!error}
                        helperText={error}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', backgroundColor: '#F9FAFB', '& .MuiOutlinedInput-notchedOutline': { border: '1px solid #F3F4F6' } } }}
                    />
                )}
            </Box>
        );
    };

    const renderUploadButton = (label, field) => (
        <Box>
            <input
                type="file"
                id={`file-${field}`}
                style={{ display: 'none' }}
                onChange={(e) => handleFileUpload(field, e.target.files[0])}
            />
            <label htmlFor={`file-${field}`}>
                <Button
                    component="span"
                    variant="contained"
                    disableElevation
                    fullWidth
                    startIcon={<UploadIcon />}
                    sx={{
                        background: files[field] 
                            ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' 
                            : 'linear-gradient(135deg, #0057FF 0%, #003499 100%)',
                        borderRadius: '8px',
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '13px',
                        py: 1.2,
                        mt: label === "Upload Passbook" ? 0 : 2.5,
                        '&:hover': { background: files[field] ? '#059669' : '#003499' }
                    }}
                >
                    {files[field] ? files[field].name : label}
                </Button>
            </label>
        </Box>
    );

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
                    onChange={(e) => setSearchQuery(e.target.value)}
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
                    <Table sx={{ minWidth: 1000 }}>
                        <TableHead sx={{ backgroundColor: palette.background.paper }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>ID</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>First Name</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>Last Name</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>Role</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>Phone No</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>Pincode</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600, color: palette.text.primary }}>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredEmployees.map((employee) => (
                                <TableRow key={employee.id} sx={{ '&:hover': { backgroundColor: palette.background.paper } }}>
                                    <TableCell sx={{ fontSize: '12px', color: palette.text.secondary }}>{employee.id.substring(0, 8)}...</TableCell>
                                    <TableCell>{employee.firstName}</TableCell>
                                    <TableCell>{employee.lastName}</TableCell>
                                    <TableCell>{employee.designation}</TableCell>
                                    <TableCell>{employee.phone}</TableCell>
                                    <TableCell>{employee.address?.pincode}</TableCell>
                                    <TableCell align="center">
                                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                            <Tooltip title="View">
                                                <IconButton size="small" sx={{ color: palette.primary.main }}>
                                                    <ViewIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Actions">
                                                <IconButton size="small" sx={{ color: palette.text.secondary }}>
                                                    <ActionIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredEmployees.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                                        <Typography color="textSecondary">No employees found</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
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
                                    sx={{
                                        backgroundColor: '#2D3FE2',
                                        borderRadius: '12px',
                                        px: 8,
                                        py: 1.5,
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        fontSize: '16px',
                                        '&:hover': { backgroundColor: '#1E2BB8' }
                                    }}
                                >
                                    {activeStep < 2 ? "Next" : "Submit"}
                                </Button>
                            </Box>
                        )}
                    </Box>
                </DialogContent>
            </Dialog>
        </Box>
    );
}
