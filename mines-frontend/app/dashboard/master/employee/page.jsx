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
import { useFormik } from "formik";
import * as Yup from "yup";

const mockEmployees = [
    {
        id: "00001",
        firstName: "Sivanesa",
        lastName: "M",
        role: "Site Manager",
        phone: "9876543210",
        pincode: "600001",
    }
];

export default function EmployeePage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [openModal, setOpenModal] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const router = useRouter();

    const [employees, setEmployees] = useState(mockEmployees);
    const [isInitialized, setIsInitialized] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Initial values for Formik
    const initialValues = {
        firstName: "", lastName: "", gender: "male", role: "", consignor: "", plant: "",
        dob: "", doj: "", addressLine1: "", addressLine2: "", district: "", state: "",
        pincode: "", phone: "", userName: "", password: "",
        salaryType: "", basicSalary: "", accountHolderName: "", bankName: "",
        accountNumber: "", ifscCode: "", aadhaarNumber: "", panNumber: "", drivingLicense: ""
    };

    // Yup validation schema
    const employeeValidationSchema = Yup.object({
        firstName: Yup.string().required("First name is required"),
        lastName: Yup.string().required("Last name is required"),
        role: Yup.string().required("Role is required"),
        phone: Yup.string().matches(/^[0-9]{10,12}$/, "Phone must be 10-12 digits").required("Contact number is required"),
        pincode: Yup.string().matches(/^[0-9]{6}$/, "Pincode must be 6 digits"),
        addressLine1: Yup.string().required("Address is required"),
        district: Yup.string().required("District is required"),
        state: Yup.string().required("State is required"),
        userName: Yup.string().required("User name is required"),
        password: Yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
    });

    const formik = useFormik({
        initialValues,
        validationSchema: employeeValidationSchema,
        validateOnBlur: true,
        validateOnChange: false,
        onSubmit: (values) => {
            const nextId = employees.length > 0 ? (Math.max(...employees.map(e => parseInt(e.id))) + 1).toString().padStart(5, '0') : "00001";
            const newEmployee = {
                id: nextId,
                ...values
            };
            setEmployees([...employees, newEmployee]);
            setShowSuccess(true);

            // Auto close after 2 seconds
            setTimeout(() => {
                handleCloseModal();
            }, 2000);
        },
    });

    // Persist data in localStorage
    useEffect(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("employees");
            if (saved !== null) {
                try {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed)) setEmployees(parsed);
                } catch (e) {
                    console.error("Error parsing employees", e);
                }
            } else {
                localStorage.setItem("employees", JSON.stringify(mockEmployees));
            }
            setIsInitialized(true);
        }
    }, []);

    useEffect(() => {
        if (typeof window !== "undefined" && isInitialized) {
            localStorage.setItem("employees", JSON.stringify(employees));
        }
    }, [employees, isInitialized]);

    const handleOpenModal = () => {
        formik.resetForm();
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setActiveStep(0);
        formik.resetForm();
        setShowSuccess(false);
    };

    const handleNext = async () => {
        const errors = await formik.validateForm();
        if (activeStep === 0) {
            const step1Fields = ['firstName', 'lastName', 'role', 'phone', 'addressLine1', 'district', 'state', 'pincode'];
            const touchedFields = step1Fields.reduce((acc, field) => ({ ...acc, [field]: true }), {});
            formik.setTouched(touchedFields);
            const step1Errors = step1Fields.filter(key => errors[key]);
            if (step1Errors.length > 0) return;
        } else if (activeStep === 1) {
            // Add any step 2 validation here if needed
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
        return (
            <Box sx={{ width: '100%' }}>
                <Typography sx={{ fontSize: '13px', color: '#374151', mb: 0.8, fontWeight: 600 }}>{label}</Typography>
                {isSelect ? (
                    <Select
                        fullWidth size="small"
                        name={field}
                        value={value}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={!!error}
                        displayEmpty
                        sx={{ borderRadius: '12px', backgroundColor: '#F9FAFB', border: '1px solid #F3F4F6', '& .MuiSelect-select': { color: value ? '#111827' : '#9CA3AF' }, '& .MuiOutlinedInput-notchedOutline': { border: 'none' } }}
                    >
                        <MenuItem value="">{placeholder}</MenuItem>
                        <MenuItem value="Admin">Admin</MenuItem>
                        <MenuItem value="Manager">Manager</MenuItem>
                        <MenuItem value="Staff">Staff</MenuItem>
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
                            if (field === 'bankName' || field === 'accountHolderName') {
                                const val = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                                formik.setFieldValue(field, val);
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

    const renderUploadButton = (label) => (
        <Button
            variant="contained"
            disableElevation
            fullWidth
            startIcon={<UploadIcon />}
            sx={{
                background: 'linear-gradient(135deg, #0057FF 0%, #003499 100%)',
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '13px',
                py: 1.2,
                mt: label === "Upload Passbook" ? 0 : 2.5,
                '&:hover': { background: 'linear-gradient(135deg, #003499 0%, #001A4D 100%)' }
            }}
        >
            {label}
        </Button>
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
                        <Box sx={{ width: itemWidth }}>{renderField("Consignor", "Select consignor", true, "text", "consignor")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("Plant", "Select plant", true, "text", "plant")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("Date of Birth", "dd-mm-yyyy", false, "text", "dob")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("Date of Joining", "dd-mm-yyyy", false, "text", "doj")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("Address Line 1", "Enter address", false, "text", "addressLine1")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("Address Line 2", "Enter address", false, "text", "addressLine2")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("District", "Choose district", false, "text", "district")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("State", "Choose State", false, "text", "state")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("Pincode", "Choose Pincode", false, "text", "pincode")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("Contact Number", "Enter contact number", false, "text", "phone")}</Box>
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
                        <Box sx={{ width: itemWidth }}>{renderField("Account Holder Name", "Enter name", false, "text", "accountHolderName")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("Bank Name", "Enter bank name", false, "text", "bankName")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("Account Number", "Enter account number", false, "text", "accountNumber")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("IFSC Code", "Enter IFSC code", false, "text", "ifscCode")}</Box>

                        {/* Upload Passbook */}
                        <Box sx={{ width: itemWidth, mt: 1 }}>
                            <Typography sx={{ fontSize: '13px', color: '#374151', mb: 0.8, fontWeight: 600 }}>Upload Passbook</Typography>
                            {renderUploadButton("Upload Passbook")}
                        </Box>
                        <Box sx={{ width: itemWidth }}></Box>

                        {/* Upload Documents */}
                        <Box sx={{ width: '100%', mt: 1 }}><Typography sx={{ fontWeight: 800, fontSize: '16px', color: '#111827' }}>Upload Documents</Typography></Box>
                        <Box sx={{ width: itemWidth }}>{renderField("Aadhaar Number", "Enter aadhaar number", false, "text", "aadhaarNumber")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderUploadButton("Upload Aadhaar")}</Box>

                        <Box sx={{ width: itemWidth }}>{renderField("PAN Number", "Enter PAN number", false, "text", "panNumber")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderUploadButton("Upload PAN")}</Box>

                        <Box sx={{ width: itemWidth }}>{renderField("Driving License Number", "Enter driving license number", false, "text", "drivingLicense")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderUploadButton("Upload Driving License")}</Box>
                    </Box>
                );
            case 2:
                return (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: gap }}>
                        <Box sx={{ width: itemWidth }}>{renderField("User Name", "Enter user name", false, "text", "userName")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("Password", "Enter password", false, "password", "password")}</Box>
                    </Box>
                );
            default: return null;
        }
    };

    return (
        <Box sx={{ animation: "fadeIn 0.5s ease-out" }}>
            {/* Header Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h3" sx={{ fontWeight: 900, color: palette.text.secondary }}>
                    Employee List
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
                    placeholder="Type here..."
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
                            {employees.map((employee) => (
                                <TableRow key={employee.id} sx={{ '&:hover': { backgroundColor: palette.background.paper } }}>
                                    <TableCell>{employee.id}</TableCell>
                                    <TableCell>{employee.firstName}</TableCell>
                                    <TableCell>{employee.lastName}</TableCell>
                                    <TableCell>{employee.role}</TableCell>
                                    <TableCell>{employee.phone}</TableCell>
                                    <TableCell>{employee.pincode}</TableCell>
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
