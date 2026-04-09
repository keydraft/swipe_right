"use client";

import React, { useState, useEffect } from "react";
import {
    Box, Typography, Card, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Button,
    TextField, InputAdornment, Tooltip, Dialog, DialogContent,
    Select, MenuItem, Switch, FormControlLabel, TablePagination,
    CircularProgress, Grid, Divider, Snackbar, Alert
} from "@mui/material";
import {
    SearchOutlined as SearchIcon, AddOutlined as AddIcon, FileDownloadOutlined as DownloadIcon,
    PrintOutlined as PrintIcon, SortOutlined as SortIcon, VisibilityOutlined as ViewIcon,
    MoreVertOutlined as ActionIcon, EditOutlined as EditIcon, DeleteOutline as DeleteIcon
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { palette } from "@/theme";
import { adminApi } from "@/services/api";
import { useFormik, FormikProvider, FieldArray } from "formik";
import * as Yup from "yup";
import { gstinRegex, phoneRegex, pincodeRegex, ifscRegex } from "@/utils/validationSchemas";

export default function CompanyPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [openModal, setOpenModal] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const router = useRouter();
 
    const [companies, setCompanies] = useState([]);
    const [isInitialized, setIsInitialized] = useState(false);
    
    // Pagination State
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalElements, setTotalElements] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // Notification State
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
    const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

    // Delete Confirmation State
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteTargetIndex, setDeleteTargetIndex] = useState(null);

    // View Details State
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);

    const fetchCompanies = async () => {
        setIsLoading(true);
        try {
            const response = await adminApi.getCompanies(page, rowsPerPage, searchQuery);
            if (response.success) {
                setCompanies(response.data.content);
                setTotalElements(response.data.totalElements);
            }
        } catch (error) {
            console.error("Error fetching companies:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchCompanies();
        setIsInitialized(true);
    }, []);

    // Fetch on page/search change
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCompanies();
        }, 300);
        return () => clearTimeout(timer);
    }, [page, rowsPerPage, searchQuery]);

    const initialBranchState = {
        name: "", contactPerson: "", addressLine1: "", addressLine2: "",
        state: "", district: "", pincode: "", contactNo: "", alternateNo: "",
        siteType: "", plantType: "", active: true
    };

    const initialBankAccountState = {
        accountName: "", shortName: "", accountNumber: "", bankName: "",
        branchName: "", ifscCode: "", openingBalance: "", openingDate: ""
    };

    const initialValues = {
        name: "", invoiceInitial: "", gstn: "", addressLine1: "", addressLine2: "",
        district: "", state: "", pincode: "", phone: "", alternatePhone: "", emailId: "",
        bankAccounts: [],
        branches: []
    };

    const companyValidationSchema = Yup.object({
        name: Yup.string().required("Company name is required"),
        invoiceInitial: Yup.string().required("Invoice initial is required"),
        gstn: Yup.string().matches(gstinRegex, "Invalid GSTIN format").required("GSTN is required"),
        addressLine1: Yup.string().max(50, "Address cannot exceed 50 characters").required("Address is required"),
        district: Yup.string().required("District is required"),
        state: Yup.string().required("State is required"),
        pincode: Yup.string().matches(pincodeRegex, "Pincode must be 6 digits").required("Pincode is required"),
        phone: Yup.string().matches(phoneRegex, "Phone must be 10-12 digits").required("Phone is required"),
        emailId: Yup.string().email("Invalid email format"),
    });

    const formik = useFormik({
        initialValues,
        validationSchema: companyValidationSchema,
        validateOnBlur: true,
        validateOnChange: false,
        onSubmit: async (values) => {
            const payload = {
                id: isEditingCompany ? companies[editingCompanyIndex].id : null,
                name: values.name,
                invoiceInitial: values.invoiceInitial,
                gstin: values.gstn,
                phone: values.phone,
                alternatePhoneNo: values.alternatePhone,
                emailId: values.emailId,
                address: {
                    addressLine1: values.addressLine1,
                    addressLine2: values.addressLine2,
                    district: values.district,
                    state: values.state,
                    pincode: values.pincode
                },
                bankAccounts: values.bankAccounts.map(b => ({
                    accountName: b.accountName,
                    shortName: b.shortName,
                    accountNumber: b.accountNumber,
                    bankName: b.bankName,
                    ifscCode: b.ifscCode,
                    branchName: b.branchName,
                    openingBalance: b.openingBalance,
                    openingDate: b.openingDate
                })),
                branches: values.branches.map(b => ({
                    name: b.name,
                    siteType: b.siteType || "PRODUCTION",
                    branchType: b.plantType || "CRUSHER",
                    phone: b.contactNo,
                    alternatePhoneNo: b.alternateNo,
                    emailId: b.emailId || "",
                    address: {
                        addressLine1: b.addressLine1,
                        addressLine2: b.addressLine2,
                        district: b.district,
                        state: b.state,
                        pincode: b.pincode
                    }
                }))
            };

            try {
                const response = await adminApi.upsertCompany(payload);
                if (response.success) {
                    setShowSuccess(true);
                    setTimeout(() => {
                        handleCloseModal();
                        fetchCompanies();
                    }, 2000);
                }
            } catch (error) {
                console.error("Error saving company:", error);
                setSnackbar({
                    open: true,
                    message: "Failed to save company: " + (error.response?.data?.message || "Unknown error"),
                    severity: "error"
                });
            }
        },
    });

    const [currentBranch, setCurrentBranch] = useState(initialBranchState);
    const [isEditingBranch, setIsEditingBranch] = useState(false);
    const [editingBranchIndex, setEditingBranchIndex] = useState(null);
    const [showBranchForm, setShowBranchForm] = useState(true);

    const [currentBankAccount, setCurrentBankAccount] = useState(initialBankAccountState);
    const [isEditingBankAccount, setIsEditingBankAccount] = useState(false);
    const [editingBankAccountIndex, setEditingBankAccountIndex] = useState(null);
    const [showBankAccountForm, setShowBankAccountForm] = useState(true);

    const [isEditingCompany, setIsEditingCompany] = useState(false);
    const [editingCompanyIndex, setEditingCompanyIndex] = useState(null);

    const [showSuccess, setShowSuccess] = useState(false);

    const handleOpenModal = () => {
        setIsEditingCompany(false);
        setEditingCompanyIndex(null);
        setOpenModal(true);
        setShowSuccess(false);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setActiveStep(0);
        formik.resetForm();
        setCurrentBranch(initialBranchState);
        setIsEditingBranch(false);
        setShowBranchForm(true);
        setCurrentBankAccount(initialBankAccountState);
        setIsEditingBankAccount(false);
        setShowBankAccountForm(true);
        setIsEditingCompany(false);
        setEditingCompanyIndex(null);
        setShowSuccess(false);
    };


    const handleEditCompany = (index) => {
        const company = companies[index];

        const mappedBranches = (company.branches || []).map(b => ({
            name: b.name,
            contactNo: b.phone,
            alternateNo: b.alternatePhoneNo,
            district: b.address?.district || "",
            state: b.address?.state || "",
            pincode: b.address?.pincode || "",
            addressLine1: b.address?.addressLine1 || "",
            addressLine2: b.address?.addressLine2 || "",
            siteType: b.siteType,
            plantType: b.branchType,
            active: b.active !== false
        }));

        const mappedBankAccounts = (company.bankAccounts || []).map(b => ({
            accountName: b.accountName,
            shortName: b.shortName,
            accountNumber: b.accountNumber,
            bankName: b.bankName,
            ifscCode: b.ifscCode,
            branchName: b.branchName,
            openingBalance: b.openingBalance,
            openingDate: b.openingDate
        }));

        formik.setValues({
            name: company.name || "",
            invoiceInitial: company.invoiceInitial || "",
            gstn: company.gstin || "",
            addressLine1: company.address?.addressLine1 || "",
            addressLine2: company.address?.addressLine2 || "",
            district: company.address?.district || "",
            state: company.address?.state || "",
            pincode: company.address?.pincode || "",
            phone: company.phone || "",
            alternatePhone: company.alternatePhoneNo || "",
            emailId: company.emailId || "",
            bankAccounts: mappedBankAccounts,
            branches: mappedBranches
        });

        setShowBranchForm(mappedBranches.length > 0 ? false : true);
        setShowBankAccountForm(mappedBankAccounts.length > 0 ? false : true);
        setEditingCompanyIndex(index);
        setIsEditingCompany(true);
        setOpenModal(true);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const filteredCompanies = companies.filter(company =>
        (company.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (company.gstin || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (company.address?.district || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    const paginatedCompanies = filteredCompanies.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    const handleViewCompany = (index) => {
        setSelectedCompany(companies[index]);
        setViewModalOpen(true);
    };

    const handleDeleteCompany = (index) => {
        setDeleteTargetIndex(index);
        setDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (deleteTargetIndex !== null) {
            const companyId = companies[deleteTargetIndex].id;
            try {
                const response = await adminApi.deleteCompany(companyId);
                if (response.success) {
                    setCompanies(companies.filter((_, i) => i !== deleteTargetIndex));
                    setDeleteConfirmOpen(false);
                    setDeleteTargetIndex(null);
                    setSnackbar({ open: true, message: "Company deleted successfully", severity: "success" });
                } else {
                    setSnackbar({ open: true, message: response.message || "Failed to delete company", severity: "error" });
                }
            } catch (error) {
                console.error("Error deleting company:", error);
                setSnackbar({ open: true, message: "Failed to delete company: Unknown error", severity: "error" });
            }
        }
    };

    const handleNext = async () => {
        if (activeStep === 0) {
            const errors = await formik.validateForm();
            formik.setTouched({
                name: true, invoiceInitial: true, gstn: true, addressLine1: true,
                district: true, state: true, pincode: true, phone: true
            });
            // If there are errors in step 1 fields, block next
            const step1Errors = ['name', 'invoiceInitial', 'gstn', 'addressLine1', 'district', 'state', 'pincode', 'phone'].filter(key => errors[key]);
            if (step1Errors.length > 0) {
                return;
            }
        }
        setActiveStep((prev) => prev + 1);
    };
    const handleBack = () => setActiveStep((prev) => prev - 1);

    const isStepComplete = () => {
        if (activeStep === 0) {
            const required = ['name', 'invoiceInitial', 'gstn', 'addressLine1', 'district', 'state', 'pincode', 'phone'];
            const errors = formik.errors;
            return required.every(field => !!formik.values[field]) && !required.some(field => !!errors[field]);
        }
        if (activeStep === 1) {
            // Must have added at least one branch
            return formik.values.branches.length > 0;
        }
        if (activeStep === 2) {
            // Must have added at least one bank account
            return formik.values.bankAccounts.length > 0;
        }
        return true;
    };

    const handleAddBranch = () => {
        if (!currentBranch.name || !currentBranch.plantType || !currentBranch.contactNo || !currentBranch.addressLine1 || !currentBranch.district || !currentBranch.state || !currentBranch.pincode) {
            setSnackbar({ open: true, message: "Please fill in the required fields: Branch Name, Plant Type, Contact No, Address Line 1, District, State, and Pincode.", severity: "error" });
            return;
        }
        if (!phoneRegex.test(currentBranch.contactNo)) {
            setSnackbar({ open: true, message: "Contact No must be 10 to 12 digits.", severity: "error" });
            return;
        }
        if (!pincodeRegex.test(currentBranch.pincode)) {
            setSnackbar({ open: true, message: "Pincode must be exactly 6 digits.", severity: "error" });
            return;
        }

        const newBranches = [...formik.values.branches];
        if (editingBranchIndex !== null) {
            newBranches[editingBranchIndex] = currentBranch;
            setEditingBranchIndex(null);
        } else {
            newBranches.push(currentBranch);
        }
        formik.setFieldValue("branches", newBranches);
        setCurrentBranch(initialBranchState);
        setShowBranchForm(false);
    };

    const handleEditBranch = (index) => {
        setCurrentBranch(formik.values.branches[index]);
        setEditingBranchIndex(index);
        setShowBranchForm(true);
    };

    const handleDeleteBranch = (index) => {
        const newBranches = formik.values.branches.filter((_, i) => i !== index);
        formik.setFieldValue("branches", newBranches);
    };

    const handleAddBankAccount = () => {
        if (!currentBankAccount.accountName || !currentBankAccount.accountNumber || !currentBankAccount.bankName || !currentBankAccount.ifscCode) {
            setSnackbar({ open: true, message: "Please fill in the required fields: Account Name, Account No, Bank Name, and IFSC.", severity: "error" });
            return;
        }
        if (!/^[0-9]{9,18}$/.test(currentBankAccount.accountNumber)) {
            setSnackbar({ open: true, message: "Account Number must be 9-18 digits.", severity: "error" });
            return;
        }
        if (!ifscRegex.test(currentBankAccount.ifscCode)) {
            setSnackbar({ open: true, message: "Invalid IFSC Code format.", severity: "error" });
            return;
        }

        const newBankAccounts = [...formik.values.bankAccounts];
        if (editingBankAccountIndex !== null) {
            newBankAccounts[editingBankAccountIndex] = currentBankAccount;
            setEditingBankAccountIndex(null);
        } else {
            newBankAccounts.push(currentBankAccount);
        }
        formik.setFieldValue("bankAccounts", newBankAccounts);
        setCurrentBankAccount(initialBankAccountState);
        setShowBankAccountForm(false);
    };

    const handleEditBankAccount = (index) => {
        setCurrentBankAccount(formik.values.bankAccounts[index]);
        setEditingBankAccountIndex(index);
        setShowBankAccountForm(true);
    };

    const handleDeleteBankAccount = (index) => {
        const newBankAccounts = formik.values.bankAccounts.filter((_, i) => i !== index);
        formik.setFieldValue("bankAccounts", newBankAccounts);
    };

    const steps = ["Basic Company Details", "Branch Details", "Bank Details"];

    const renderStepper = () => {
        if (showSuccess) return null;
        const fillPercentage = ((activeStep + 1) / steps.length) * 100;

        return (
            <Box sx={{ width: '100%', mb: 4, pt: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: { xs: 2, sm: 8 }, mb: 2 }}>
                    {steps.map((label, index) => {
                        const isActive = activeStep === index;
                        const isCompleted = activeStep > index;
                        return (
                            <Box key={index} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '140px' }}>
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

    const renderField = (name, label, placeholder, isSelect = false, type = "text") => {
        const value = formik.values[name];
        const error = formik.touched[name] && formik.errors[name];

        if (type === "switch") {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <FormControlLabel
                        control={
                            <Switch
                                name={name}
                                checked={value}
                                onChange={formik.handleChange}
                                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#0057FF' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#0057FF' } }}
                            />
                        }
                        label={label}
                        sx={{ color: '#6B7280' }}
                    />
                </Box>
            );
        }
        return (
            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Typography sx={{ fontSize: '13px', color: '#374151', mb: 0.8, fontWeight: 600 }}>{label}</Typography>
                {isSelect ? (
                    <Select
                        fullWidth size="small"
                        name={name}
                        value={value}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={!!error}
                        displayEmpty
                        sx={{ borderRadius: '12px', backgroundColor: '#F9FAFB', border: '1px solid #F3F4F6', '& .MuiSelect-select': { color: value ? '#111827' : '#9CA3AF' }, '& .MuiOutlinedInput-notchedOutline': { border: 'none' } }}
                    >
                        <MenuItem value="">{placeholder}</MenuItem>
                        {label.includes("Branch Category") || label.includes("Site Type") ? [
                            <MenuItem key="OFFICE" value="OFFICE">OFFICE</MenuItem>,
                            <MenuItem key="PRODUCTION" value="PRODUCTION">PRODUCTION</MenuItem>
                        ] : label.includes("Plant Type") || label.includes("Branch Type") ? [
                            <MenuItem key="CRUSHER" value="CRUSHER">CRUSHER</MenuItem>,
                            <MenuItem key="YARD" value="YARD">YARD</MenuItem>,
                            <MenuItem key="QUARRY" value="QUARRY">QUARRY</MenuItem>,
                            <MenuItem key="INTEGRATED" value="INTEGRATED">INTEGRATED</MenuItem>
                        ] : [
                            <MenuItem key="Option 1" value="Option 1">Option 1</MenuItem>,
                            <MenuItem key="Option 2" value="Option 2">Option 2</MenuItem>
                        ]}
                    </Select>
                ) : (
                    <TextField
                        fullWidth size="small"
                        name={name}
                        type={type}
                        placeholder={placeholder}
                        variant="outlined"
                        value={value}
                        onChange={(e) => {
                            const letterOnlyFields = ['name', 'district', 'state', 'branch', 'bankName'];
                            const numericOnlyFields = ['phone', 'alternatePhone', 'pincode'];
                            const uppercaseFields = ['gstn'];
                            
                            if (letterOnlyFields.includes(name)) {
                                const val = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                                formik.setFieldValue(name, val);
                            } else if (numericOnlyFields.includes(name)) {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                formik.setFieldValue(name, val);
                            } else if (uppercaseFields.includes(name)) {
                                const val = e.target.value.toUpperCase();
                                formik.setFieldValue(name, val);
                            } else {
                                formik.handleChange(e);
                            }
                        }}
                        onBlur={formik.handleBlur}
                        error={!!error}
                        helperText={error}
                        inputProps={name.includes('addressLine') ? { maxLength: 50 } : {}}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', backgroundColor: '#F9FAFB', '& .MuiOutlinedInput-notchedOutline': { border: '1px solid #F3F4F6' } } }}
                    />
                )}
            </Box>
        );
    };

    // Helper for rendering entry form fields
    const renderEntryField = (label, placeholder, isSelect = false, type = "text", value = "", onChange = () => { }) => {
        if (type === "switch") {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <FormControlLabel
                        control={
                            <Switch
                                color="primary"
                                checked={value}
                                onChange={(e) => onChange(e.target.checked)}
                            />
                        }
                        label={label}
                    />
                </Box>
            );
        }
        return (
            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Typography sx={{ fontSize: '13px', color: '#374151', mb: 0.8, fontWeight: 600 }}>{label}</Typography>
                {isSelect ? (
                    <Select
                        fullWidth size="small"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        displayEmpty
                        sx={{ borderRadius: '12px', backgroundColor: '#F9FAFB', border: '1px solid #F3F4F6', '& .MuiSelect-select': { color: value ? '#111827' : '#9CA3AF' }, '& .MuiOutlinedInput-notchedOutline': { border: 'none' } }}
                    >
                        <MenuItem value="">{placeholder}</MenuItem>
                        {label.includes("Site Type") || label.includes("Branch Type") ? [
                            <MenuItem key="OFFICE" value="OFFICE">OFFICE</MenuItem>,
                            <MenuItem key="PRODUCTION" value="PRODUCTION">PRODUCTION</MenuItem>
                        ] : label.includes("Plant Type") ? [
                            <MenuItem key="CRUSHER" value="CRUSHER">CRUSHER</MenuItem>,
                            <MenuItem key="YARD" value="YARD">YARD</MenuItem>,
                            <MenuItem key="QUARRY" value="QUARRY">QUARRY</MenuItem>,
                            <MenuItem key="INTEGRATED" value="INTEGRATED">INTEGRATED</MenuItem>
                        ] : null}
                    </Select>
                ) : (
                    <TextField
                        fullWidth size="small"
                        type={type}
                        placeholder={placeholder}
                        value={value}
                        onChange={(e) => {
                            const letterLabels = ["Name", "State", "District", "Branch Name", "Bank Name", "Account Name"];
                            const numericLabels = ["Contact No", "Pincode", "Account No", "Alternate No"];
                            const uppercaseLabels = ["IFSC", "GSTN"];
                            
                            if (letterLabels.some(l => label.includes(l))) {
                                const val = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                                onChange(val);
                            } else if (numericLabels.some(l => label.includes(l))) {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                onChange(val);
                            } else if (uppercaseLabels.some(l => label.includes(l))) {
                                const val = e.target.value.toUpperCase();
                                onChange(val);
                            } else {
                                onChange(e.target.value);
                            }
                        }}
                        inputProps={label.includes('Address') ? { maxLength: 50 } : {}}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', backgroundColor: '#F9FAFB' } }}
                    />
                )}
            </Box>
        );
    }

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
                Company Added Successfully
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, fontSize: '15px' }}>
                Company record has been created and saved successfully
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
                        <Box sx={{ width: itemWidth }}>{renderField("name", "Name", "Enter name")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("invoiceInitial", "Invoice Initial", "Enter invoice initial")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("gstn", "GSTN", "Enter GSTN")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("addressLine1", "Address Line 1", "Enter address line 1")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("addressLine2", "Address Line 2", "Enter address line 2")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("district", "District", "Choose district")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("state", "State", "Choose state")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("pincode", "Pincode", "Choose pincode")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("phone", "Phone", "Enter phone number")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("alternatePhone", "Alternate Phone", "Enter alternate phone")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("emailId", "Email Id", "Enter email id")}</Box>
                    </Box>
                );
            case 1:
                return (
                    <Box>
                        {showBranchForm ? (
                            <Box sx={{
                                mb: 6, p: 3, border: '1px solid #F3F4F6',
                                borderRadius: '16px', backgroundColor: '#fff',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                            }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3, color: '#111827' }}>
                                    {editingBranchIndex !== null ? "Edit Branch Details" : "Enter Branch Details"}
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: gap }}>
                                    <Box sx={{ width: itemWidth }}>{renderEntryField("Branch Name *", "Enter branch name", false, "text", currentBranch.name, (v) => setCurrentBranch({ ...currentBranch, name: v }))}</Box>
                                    <Box sx={{ width: itemWidth }}>{renderEntryField("Address Line 1", "Enter address line 1", false, "text", currentBranch.addressLine1, (v) => setCurrentBranch({ ...currentBranch, addressLine1: v }))}</Box>
                                    <Box sx={{ width: itemWidth }}>{renderEntryField("Address Line 2", "Enter address line 2", false, "text", currentBranch.addressLine2, (v) => setCurrentBranch({ ...currentBranch, addressLine2: v }))}</Box>
                                    <Box sx={{ width: itemWidth }}>{renderEntryField("State", "Enter state", false, "text", currentBranch.state, (v) => setCurrentBranch({ ...currentBranch, state: v }))}</Box>
                                    <Box sx={{ width: itemWidth }}>{renderEntryField("District", "Enter district", false, "text", currentBranch.district, (v) => setCurrentBranch({ ...currentBranch, district: v }))}</Box>
                                    <Box sx={{ width: itemWidth }}>{renderEntryField("Pincode", "Enter pincode", false, "text", currentBranch.pincode, (v) => setCurrentBranch({ ...currentBranch, pincode: v }))}</Box>
                                    <Box sx={{ width: itemWidth }}>{renderEntryField("Contact No", "Enter contact no", false, "text", currentBranch.contactNo, (v) => setCurrentBranch({ ...currentBranch, contactNo: v }))}</Box>
                                    <Box sx={{ width: itemWidth }}>{renderEntryField("Alternate No", "Enter alternate no", false, "text", currentBranch.alternateNo, (v) => setCurrentBranch({ ...currentBranch, alternateNo: v }))}</Box>
                                    <Box sx={{ width: itemWidth }}>{renderEntryField("Branch Category", "Select category", true, "text", currentBranch.siteType, (v) => setCurrentBranch({ ...currentBranch, siteType: v }))}</Box>
                                    <Box sx={{ width: itemWidth }}>{renderEntryField("Branch Type *", "Select branch type", true, "text", currentBranch.plantType, (v) => setCurrentBranch({ ...currentBranch, plantType: v }))}</Box>
                                    <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', pb: 1 }}>
                                        {renderEntryField("Active", "", false, "switch", currentBranch.active, (v) => setCurrentBranch({ ...currentBranch, active: v }))}
                                    </Box>
                                    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 1 }}>
                                        <Button
                                            variant="outlined"
                                            onClick={() => { setShowBranchForm(false); setCurrentBranch(initialBranchState); setEditingBranchIndex(null); }}
                                            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, color: '#6B7280', border: '1px solid #E5E7EB' }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="contained"
                                            onClick={handleAddBranch}
                                            sx={{ borderRadius: '10px', px: 4, textTransform: 'none', fontWeight: 600, backgroundColor: '#0057FF' }}
                                        >
                                            {editingBranchIndex !== null ? "Update Branch" : "Add to List"}
                                        </Button>
                                    </Box>
                                </Box>
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', justifyContent: formik.values.branches.length > 0 ? 'flex-end' : 'center', mb: 3 }}>
                                <Button
                                    startIcon={<AddIcon />}
                                    variant="contained"
                                    onClick={() => { setShowBranchForm(true); setEditingBranchIndex(null); setCurrentBranch(initialBranchState); }}
                                    sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, backgroundColor: '#0057FF', fontSize: '13px', px: 4, py: 1.5 }}
                                >
                                    Add New Branch
                                </Button>
                            </Box>
                        )}

                        {formik.values.branches.length > 0 && (
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#111827' }}>
                                        Registered Branches ({formik.values.branches.length})
                                    </Typography>
                                </Box>
                                <TableContainer sx={{ border: '1px solid #F3F4F6', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
                                    <Table size="small">
                                        <TableHead sx={{ backgroundColor: '#F9FAFB' }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 600, color: '#374151', py: 1.5 }}>Branch Name</TableCell>
                                                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Contact No</TableCell>
                                                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>District</TableCell>
                                                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Status</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 600, color: '#374151' }}>Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {formik.values.branches.map((branch, index) => (
                                                <TableRow key={index} sx={{ '&:hover': { backgroundColor: '#F9FAFB' } }}>
                                                    <TableCell sx={{ color: '#111827', fontWeight: 500 }}>{branch.name}</TableCell>
                                                    <TableCell sx={{ color: '#4B5563' }}>{branch.contactNo}</TableCell>
                                                    <TableCell sx={{ color: '#4B5563' }}>{branch.district}</TableCell>
                                                    <TableCell>
                                                        <Box sx={{
                                                            display: 'inline-flex', px: 1, py: 0.5, borderRadius: '6px',
                                                            fontSize: '11px', fontWeight: 600,
                                                            backgroundColor: branch.active ? '#ECFDF5' : '#FEF2F2',
                                                            color: branch.active ? '#059669' : '#DC2626'
                                                        }}>
                                                            {branch.active ? 'Active' : 'Inactive'}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <IconButton size="small" onClick={() => handleEditBranch(index)} sx={{ color: '#0057FF', mr: 1 }}>
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                        <IconButton size="small" onClick={() => handleDeleteBranch(index)} sx={{ color: '#EF4444' }}>
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        )}
                    </Box>
                );
            case 2:
                return (
                    <Box>
                        {showBankAccountForm ? (
                            <Box sx={{
                                mb: 6, p: 3, border: '1px solid #F3F4F6',
                                borderRadius: '16px', backgroundColor: '#fff',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                            }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3, color: '#111827' }}>
                                    {editingBankAccountIndex !== null ? "Edit Bank Account" : "Enter Bank Details"}
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: gap }}>
                                    <Box sx={{ width: itemWidth }}>{renderEntryField("Account Name *", "Enter account name", false, "text", currentBankAccount.accountName, (v) => setCurrentBankAccount({ ...currentBankAccount, accountName: v }))}</Box>
                                    <Box sx={{ width: itemWidth }}>{renderEntryField("Short Name", "Enter short name", false, "text", currentBankAccount.shortName, (v) => setCurrentBankAccount({ ...currentBankAccount, shortName: v }))}</Box>
                                    <Box sx={{ width: itemWidth }}>{renderEntryField("Account No *", "Enter account no", false, "text", currentBankAccount.accountNumber, (v) => setCurrentBankAccount({ ...currentBankAccount, accountNumber: v }))}</Box>
                                    <Box sx={{ width: itemWidth }}>{renderEntryField("Bank Name *", "Enter bank name", false, "text", currentBankAccount.bankName, (v) => setCurrentBankAccount({ ...currentBankAccount, bankName: v }))}</Box>
                                    <Box sx={{ width: itemWidth }}>{renderEntryField("Branch", "Enter branch", false, "text", currentBankAccount.branchName, (v) => setCurrentBankAccount({ ...currentBankAccount, branchName: v }))}</Box>
                                    <Box sx={{ width: itemWidth }}>{renderEntryField("IFSC *", "Enter IFSC", false, "text", currentBankAccount.ifscCode, (v) => setCurrentBankAccount({ ...currentBankAccount, ifscCode: v }))}</Box>
                                    <Box sx={{ width: itemWidth }}>{renderEntryField("Opening Balance", "Enter balance", false, "text", currentBankAccount.openingBalance, (v) => setCurrentBankAccount({ ...currentBankAccount, openingBalance: v }))}</Box>
                                    <Box sx={{ width: itemWidth }}>{renderEntryField("Opening Date", "dd-mm-yyyy", false, "date", currentBankAccount.openingDate, (v) => setCurrentBankAccount({ ...currentBankAccount, openingDate: v }))}</Box>

                                    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 1 }}>
                                        <Button
                                            variant="outlined"
                                            onClick={() => { setShowBankAccountForm(false); setCurrentBankAccount(initialBankAccountState); setEditingBankAccountIndex(null); }}
                                            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, color: '#6B7280', border: '1px solid #E5E7EB' }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="contained"
                                            onClick={handleAddBankAccount}
                                            sx={{ borderRadius: '10px', px: 4, textTransform: 'none', fontWeight: 600, backgroundColor: '#0057FF' }}
                                        >
                                            {editingBankAccountIndex !== null ? "Update Bank" : "Add to List"}
                                        </Button>
                                    </Box>
                                </Box>
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', justifyContent: formik.values.bankAccounts.length > 0 ? 'flex-end' : 'center', mb: 3 }}>
                                <Button
                                    startIcon={<AddIcon />}
                                    variant="contained"
                                    onClick={() => { setShowBankAccountForm(true); setEditingBankAccountIndex(null); setCurrentBankAccount(initialBankAccountState); }}
                                    sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, backgroundColor: '#0057FF', fontSize: '13px', px: 4, py: 1.5 }}
                                >
                                    Add New Bank
                                </Button>
                            </Box>
                        )}

                        {formik.values.bankAccounts.length > 0 && (
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#111827' }}>
                                        Registered Accounts ({formik.values.bankAccounts.length})
                                    </Typography>
                                </Box>
                                <TableContainer sx={{ border: '1px solid #F3F4F6', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
                                    <Table size="small">
                                        <TableHead sx={{ backgroundColor: '#F9FAFB' }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 600, color: '#374151', py: 1.5 }}>Account No</TableCell>
                                                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Bank Name</TableCell>
                                                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>IFSC</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 600, color: '#374151' }}>Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {formik.values.bankAccounts.map((account, index) => (
                                                <TableRow key={index} sx={{ '&:hover': { backgroundColor: '#F9FAFB' } }}>
                                                    <TableCell sx={{ color: '#111827', fontWeight: 500 }}>{account.accountNumber}</TableCell>
                                                    <TableCell sx={{ color: '#4B5563' }}>{account.bankName}</TableCell>
                                                    <TableCell sx={{ color: '#4B5563' }}>{account.ifscCode}</TableCell>
                                                    <TableCell align="right">
                                                        <IconButton size="small" onClick={() => handleEditBankAccount(index)} sx={{ color: '#0057FF', mr: 1 }}>
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                        <IconButton size="small" onClick={() => handleDeleteBankAccount(index)} sx={{ color: '#EF4444' }}>
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        )}
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
                    Company List
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
                        New Company
                    </Button>
                </Box>
            </Box>

            {/* Toolbar Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, }}>
                <TextField
                    variant="outlined"
                    placeholder="Search companies..."
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

            {/* Company Table Section */}
            <Card sx={{
                borderRadius: "16px",
                boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
                border: `1px solid ${palette.divider}`,
                overflow: 'hidden'
            }}>
                <TableContainer>
                    <Table sx={{ minWidth: 1200 }}>
                        <TableHead sx={{ backgroundColor: palette.background.paper }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>ID</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>Name</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>Invoice Initial</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>GSTN</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>Address Line 1</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>Address Line 2</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>District</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>State</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>Pincode</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>Phone No</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600, color: palette.text.primary }}>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={11} align="center" sx={{ py: 3 }}>
                                        <CircularProgress size={24} />
                                    </TableCell>
                                </TableRow>
                            ) : companies.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={11} align="center" sx={{ py: 3 }}>
                                        <Typography color="textSecondary">No companies found</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : companies.map((company, index) => (
                                <TableRow key={company.id} sx={{ '&:hover': { backgroundColor: palette.background.paper } }}>
                                    <TableCell>{`SW${String(page * rowsPerPage + index + 1).padStart(3, "0")}`}</TableCell>
                                    <TableCell>{company.name}</TableCell>
                                    <TableCell>{company.invoiceInitial}</TableCell>
                                    <TableCell>{company.gstin}</TableCell>
                                    <TableCell>{company.address?.addressLine1}</TableCell>
                                    <TableCell>{company.address?.addressLine2}</TableCell>
                                    <TableCell>{company.address?.district}</TableCell>
                                    <TableCell>{company.address?.state}</TableCell>
                                    <TableCell>{company.address?.pincode}</TableCell>
                                    <TableCell>{company.phone}</TableCell>
                                    <TableCell align="center">
                                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                            <Tooltip title="View">
                                                <IconButton 
                                                    size="small" 
                                                    sx={{ color: palette.primary.main }}
                                                    onClick={() => handleViewCompany(index)}
                                                >
                                                    <ViewIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Edit">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleEditCompany(index)}
                                                    sx={{ color: '#0057FF' }}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleDeleteCompany(index)}
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
                        '.MuiTablePagination-select': {
                            fontSize: '13px',
                            fontWeight: 500
                        }
                    }}
                />
            </Card>

            {/* Modal for New Company */}
            <Dialog
                open={openModal}
                onClose={handleCloseModal}
                maxWidth="md"
                fullWidth
                sx={{
                    '& .MuiDialog-container': {
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginLeft: { md: '280px' }, // Offset by Sidebar width on desktop
                        width: { md: 'calc(100% - 280px)' }
                    },
                    '& .MuiBackdrop-root': {
                        marginLeft: { md: '280px' } // Backdrop only covers main content
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
                                        '&.Mui-disabled': { backgroundColor: '#E5E7EB', color: '#9CA3AF' }
                                    }}
                                >
                                    {activeStep < 2 ? "Next" : "Submit"}
                                </Button>
                            </Box>
                        )}
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
                        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: '#111827' }}>Delete Company</Typography>
                        <Typography variant="body2" sx={{ color: '#6B7280', mb: 4, lineHeight: 1.6 }}>Are you sure you want to delete this company? This action cannot be undone and the record will be permanently removed.</Typography>
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

            {/* View Company Details Modal */}
            <Dialog 
                open={viewModalOpen} 
                onClose={() => setViewModalOpen(false)}
                maxWidth="md"
                fullWidth
                sx={{
                    '& .MuiDialog-container': { alignItems: 'center', justifyContent: 'center', marginLeft: { md: '280px' }, width: { md: 'calc(100% - 280px)' } },
                    '& .MuiBackdrop-root': { marginLeft: { md: '280px' } }
                }}
                PaperProps={{ sx: { borderRadius: '24px', padding: '16px', backgroundColor: '#F8FAFC' } }}
            >
                <DialogContent sx={{ p: { xs: 2, sm: 4 } }}>
                    {selectedCompany && (
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Box>
                                    <Typography variant="h4" sx={{ fontWeight: 900, color: '#111827' }}>{selectedCompany.name}</Typography>
                                    <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.5 }}>GSTN: {selectedCompany.gstin || "N/A"}</Typography>
                                </Box>
                                <Box sx={{ px: 2, py: 1, borderRadius: '12px', backgroundColor: '#EBFDF5', color: '#10B981', fontWeight: 700, fontSize: '13px' }}>ACTIVE</Box>
                            </Box>

                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                                {/* General Information */}
                                <Card sx={{ flex: '1 1 100%', borderRadius: '16px', p: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
                                    <Typography sx={{ fontWeight: 800, fontSize: '16px', color: '#111827', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 4, height: 16, backgroundColor: '#2D3FE2', borderRadius: 2 }} /> General Information
                                    </Typography>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 3 }}>
                                        <DetailItem label="Invoice Initial" value={selectedCompany.invoiceInitial} />
                                        <DetailItem label="Contact Number" value={selectedCompany.phone} />
                                        <DetailItem label="Alternate Number" value={selectedCompany.alternatePhoneNo} />
                                        <DetailItem label="Email" value={selectedCompany.emailId} />
                                        <DetailItem label="State" value={selectedCompany.address?.state} />
                                        <DetailItem label="District" value={selectedCompany.address?.district} />
                                        <DetailItem label="Pincode" value={selectedCompany.address?.pincode} />
                                        <Box sx={{ gridColumn: '1 / -1' }}>
                                            <DetailItem label="Address" value={`${selectedCompany.address?.addressLine1 || ""}, ${selectedCompany.address?.addressLine2 || ""}`} />
                                        </Box>
                                    </Box>
                                </Card>
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                                <Button
                                    onClick={() => setViewModalOpen(false)}
                                    variant="contained"
                                    sx={{ borderRadius: '12px', px: 6, py: 1.2, textTransform: 'none', fontWeight: 700, backgroundColor: '#111827', '&:hover': { backgroundColor: '#000' } }}
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
        <Typography sx={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', mb: 0.5 }}>{label}</Typography>
        <Typography sx={{ fontSize: '14px', color: '#374151', fontWeight: 600 }}>{value || "—"}</Typography>
    </Box>
);
