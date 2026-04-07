"use client";

import React, { useState, useEffect } from "react";
import {
    Box, Typography, Card, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Button,
    TextField, InputAdornment, Tooltip, Dialog, DialogContent,
    Select, MenuItem, Switch, FormControlLabel, TablePagination
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

const mockCompanies = [
    {
        id: 1,
        name: "Tech Solutions Inc.",
        invoiceInitial: "TSI",
        gstn: "27ABCDE1234F1Z5",
        addressLine1: "123 Tech Park",
        addressLine2: "Phase 1",
        district: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        phone: "9876543210"
    },
    {
        id: 2,
        name: "Global Exports",
        invoiceInitial: "GLO",
        gstn: "29WXYZ9876Q1Z2",
        addressLine1: "45 Business Center",
        addressLine2: "Block C",
        district: "Bangalore",
        state: "Karnataka",
        pincode: "560001",
        phone: "9876543211"
    },
    {
        id: 3,
        name: "Sunrise Traders",
        invoiceInitial: "SUN",
        gstn: "07PQRS5432A1Z9",
        addressLine1: "78 Market Road",
        addressLine2: "Near Plaza",
        district: "New Delhi",
        state: "Delhi",
        pincode: "110001",
        phone: "9876543212"
    },
];

export default function CompanyPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [openModal, setOpenModal] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const router = useRouter();

    const [companies, setCompanies] = useState(mockCompanies);
    const [isInitialized, setIsInitialized] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Fetch data from backend
    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const response = await adminApi.getCompanies();
                if (response.success) {
                    setCompanies(response.data);
                }
            } catch (error) {
                console.error("Error fetching companies:", error);
                // Fallback to localStorage if backend fails (optional, but good for dev)
                const savedCompanies = localStorage.getItem("companies");
                if (savedCompanies) setCompanies(JSON.parse(savedCompanies));
            }
            setIsInitialized(true);
        };
        fetchCompanies();
    }, []);

    useEffect(() => {
        if (typeof window !== "undefined" && isInitialized && companies.length > 0) {
            localStorage.setItem("companies", JSON.stringify(companies));
        }
    }, [companies, isInitialized]);

    const initialSiteState = {
        name: "", contactPerson: "", addressLine1: "", addressLine2: "",
        state: "", district: "", pincode: "", contactNo: "", alternateNo: "",
        siteType: "", plantType: "", active: true
    };

    const initialValues = {
        name: "", invoiceInitial: "", gstn: "", addressLine1: "", addressLine2: "",
        district: "", state: "", pincode: "", phone: "", alternatePhone: "", emailId: "",
        accountName: "", shortName: "", accountNo: "", bankName: "", branch: "",
        ifsc: "", openingBalance: "", openingDate: "",
        sites: []
    };

    const companyValidationSchema = Yup.object({
        name: Yup.string().required("Company name is required"),
        invoiceInitial: Yup.string().required("Invoice initial is required"),
        gstn: Yup.string().matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GSTIN format").required("GSTN is required"),
        addressLine1: Yup.string().required("Address is required"),
        district: Yup.string().required("District is required"),
        state: Yup.string().required("State is required"),
        pincode: Yup.string().matches(/^[0-9]{6}$/, "Pincode must be 6 digits").required("Pincode is required"),
        phone: Yup.string().matches(/^[0-9]{10,12}$/, "Phone must be 10-12 digits").required("Phone is required"),
        emailId: Yup.string().email("Invalid email format"),
        bankName: Yup.string().matches(/^$|^[a-zA-Z\s]*$/, "Bank name should only contain letters"),
        branch: Yup.string().matches(/^$|^[a-zA-Z\s]*$/, "Branch should only contain letters"),
        accountNo: Yup.string().matches(/^$|^[0-9]+$/, "Account number must be numeric"),
        ifsc: Yup.string().matches(/^$|^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code format"),
        openingBalance: Yup.number().typeError("Opening balance must be a number").nullable(),
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
                bankAccounts: values.accountNo ? [{
                    accountName: values.accountName,
                    shortName: values.shortName,
                    accountNumber: values.accountNo,
                    bankName: values.bankName,
                    ifscCode: values.ifsc,
                    branchName: values.branch,
                    openingBalance: values.openingBalance,
                    openingDate: values.openingDate
                }] : [],
                branches: values.sites.map(s => ({
                    name: s.name,
                    siteType: s.siteType || "PRODUCTION",
                    branchType: s.plantType || "CRUSHER",
                    phone: s.contactNo,
                    alternatePhoneNo: s.alternateNo,
                    emailId: s.emailId || "",
                    address: {
                        addressLine1: s.addressLine1,
                        addressLine2: s.addressLine2,
                        district: s.district,
                        state: s.state,
                        pincode: s.pincode
                    }
                }))
            };

            try {
                const response = await adminApi.upsertCompany(payload);
                if (response.success) {
                    const listResp = await adminApi.getCompanies();
                    setCompanies(listResp.data);
                    setShowSuccess(true);
                    setTimeout(() => handleCloseModal(), 2000);
                }
            } catch (error) {
                console.error("Error saving company:", error);
                alert("Failed to save company: " + (error.response?.data?.message || "Unknown error"));
            }
        },
    });

    const [currentSite, setCurrentSite] = useState(initialSiteState);
    const [isEditingSite, setIsEditingSite] = useState(false);
    const [editingSiteIndex, setEditingSiteIndex] = useState(null);
    const [showSiteForm, setShowSiteForm] = useState(true);

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
        setCurrentSite(initialSiteState);
        setIsEditingSite(false);
        setShowSiteForm(true);
        setIsEditingCompany(false);
        setEditingCompanyIndex(null);
        setShowSuccess(false);
    };


    const handleEditCompany = (index) => {
        const company = companies[index];
        // Map backend branches back to frontend sites
        const mappedSites = (company.branches || []).map(b => ({
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
            accountName: company.bankAccounts?.[0]?.accountName || "",
            shortName: company.bankAccounts?.[0]?.shortName || "",
            accountNo: company.bankAccounts?.[0]?.accountNo || "",
            bankName: company.bankAccounts?.[0]?.bankName || "",
            branch: company.bankAccounts?.[0]?.branch || "",
            ifsc: company.bankAccounts?.[0]?.ifsc || "",
            openingBalance: company.bankAccounts?.[0]?.openingBalance || "",
            openingDate: company.bankAccounts?.[0]?.openingDate || "",
            sites: mappedSites
        });

        setShowSiteForm(mappedSites.length > 0 ? false : true);
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

    const handleDeleteCompany = async (index) => {
        const companyId = companies[index].id;
        if (window.confirm("Are you sure you want to delete this company?")) {
            try {
                const response = await adminApi.deleteCompany(companyId);
                if (response.success) {
                    setCompanies(companies.filter((_, i) => i !== index));
                }
            } catch (error) {
                console.error("Error deleting company:", error);
                alert("Failed to delete company: " + (error.response?.data?.message || "Unknown error"));
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

    const handleAddSite = () => {
        if (!currentSite.name || !currentSite.plantType || !currentSite.contactNo || !currentSite.addressLine1 || !currentSite.district || !currentSite.state || !currentSite.pincode) {
            alert("Please fill in the required fields: Site Name, Plant Type, Contact No, Address Line 1, District, State, and Pincode.");
            return;
        }
        if (!/^[0-9]{10,12}$/.test(currentSite.contactNo)) {
            alert("Contact No must be 10 to 12 digits.");
            return;
        }
        if (!/^[0-9]{6}$/.test(currentSite.pincode)) {
            alert("Pincode must be exactly 6 digits.");
            return;
        }

        const newSites = [...formik.values.sites];
        if (editingSiteIndex !== null) {
            newSites[editingSiteIndex] = currentSite;
            setEditingSiteIndex(null);
        } else {
            newSites.push(currentSite);
        }
        formik.setFieldValue("sites", newSites);
        setCurrentSite(initialSiteState);
        setShowSiteForm(false);
    };

    const handleEditSite = (index) => {
        setCurrentSite(formik.values.sites[index]);
        setEditingSiteIndex(index);
        setShowSiteForm(true);
    };

    const handleDeleteSite = (index) => {
        const newSites = formik.values.sites.filter((_, i) => i !== index);
        formik.setFieldValue("sites", newSites);
    };

    const steps = ["Basic Company Details", "Site Details", "Bank Details"];

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
                        {label.includes("Site Type") ? [
                            <MenuItem key="OFFICE" value="OFFICE">OFFICE</MenuItem>,
                            <MenuItem key="PRODUCTION" value="PRODUCTION">PRODUCTION</MenuItem>
                        ] : label.includes("Plant Type") ? [
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
                            if (name === 'branch' || name === 'bankName') {
                                const val = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                                formik.setFieldValue(name, val);
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

    // Helper for rendering site form fields (not in formik yet)
    const renderSiteField = (label, placeholder, isSelect = false, type = "text", value = "", onChange = () => { }) => {
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
                        {label.includes("Site Type") ? [
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
                        placeholder={placeholder}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
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
                        {showSiteForm ? (
                            <Box sx={{
                                mb: 6, p: 3, border: '1px solid #F3F4F6',
                                borderRadius: '16px', backgroundColor: '#fff',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                            }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3, color: '#111827' }}>
                                    {editingSiteIndex !== null ? "Edit Site Details" : "Enter Site Details"}
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: gap }}>
                                    <Box sx={{ width: itemWidth }}>{renderSiteField("Site Name *", "Enter site name", false, "text", currentSite.name, (v) => setCurrentSite({ ...currentSite, name: v }))}</Box>
                                    <Box sx={{ width: itemWidth }}>{renderSiteField("Address Line 1", "Enter address line 1", false, "text", currentSite.addressLine1, (v) => setCurrentSite({ ...currentSite, addressLine1: v }))}</Box>
                                    <Box sx={{ width: itemWidth }}>{renderSiteField("Address Line 2", "Enter address line 2", false, "text", currentSite.addressLine2, (v) => setCurrentSite({ ...currentSite, addressLine2: v }))}</Box>
                                    <Box sx={{ width: itemWidth }}>{renderSiteField("State", "Enter state", false, "text", currentSite.state, (v) => setCurrentSite({ ...currentSite, state: v }))}</Box>
                                    <Box sx={{ width: itemWidth }}>{renderSiteField("District", "Enter district", false, "text", currentSite.district, (v) => setCurrentSite({ ...currentSite, district: v }))}</Box>
                                    <Box sx={{ width: itemWidth }}>{renderSiteField("Pincode", "Enter pincode", false, "text", currentSite.pincode, (v) => setCurrentSite({ ...currentSite, pincode: v }))}</Box>
                                    <Box sx={{ width: itemWidth }}>{renderSiteField("Contact No", "Enter contact no", false, "text", currentSite.contactNo, (v) => setCurrentSite({ ...currentSite, contactNo: v }))}</Box>
                                    <Box sx={{ width: itemWidth }}>{renderSiteField("Alternate No", "Enter alternate no", false, "text", currentSite.alternateNo, (v) => setCurrentSite({ ...currentSite, alternateNo: v }))}</Box>
                                    <Box sx={{ width: itemWidth }}>{renderSiteField("Site Type", "Select site type", true, "text", currentSite.siteType, (v) => setCurrentSite({ ...currentSite, siteType: v }))}</Box>
                                    <Box sx={{ width: itemWidth }}>{renderSiteField("Plant Type *", "Select plant type", true, "text", currentSite.plantType, (v) => setCurrentSite({ ...currentSite, plantType: v }))}</Box>
                                    <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', pb: 1 }}>
                                        {renderSiteField("Active", "", false, "switch", currentSite.active, (v) => setCurrentSite({ ...currentSite, active: v }))}
                                    </Box>
                                    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 1 }}>
                                        <Button
                                            variant="outlined"
                                            onClick={() => { setShowSiteForm(false); setCurrentSite(initialSiteState); setEditingSiteIndex(null); }}
                                            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, color: '#6B7280', border: '1px solid #E5E7EB' }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="contained"
                                            onClick={handleAddSite}
                                            sx={{ borderRadius: '10px', px: 4, textTransform: 'none', fontWeight: 600, backgroundColor: '#0057FF' }}
                                        >
                                            {editingSiteIndex !== null ? "Update Site" : "Add to List"}
                                        </Button>
                                    </Box>
                                </Box>
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', justifyContent: formik.values.sites.length > 0 ? 'flex-end' : 'center', mb: 3 }}>
                                <Button
                                    startIcon={<AddIcon />}
                                    variant="contained"
                                    onClick={() => { setShowSiteForm(true); setEditingSiteIndex(null); setCurrentSite(initialSiteState); }}
                                    sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, backgroundColor: '#0057FF', fontSize: '13px', px: 4, py: 1.5 }}
                                >
                                    Add New Site
                                </Button>
                            </Box>
                        )}

                        {formik.values.sites.length > 0 && (
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#111827' }}>
                                        Registered Sites ({formik.values.sites.length})
                                    </Typography>
                                </Box>
                                <TableContainer sx={{ border: '1px solid #F3F4F6', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
                                    <Table size="small">
                                        <TableHead sx={{ backgroundColor: '#F9FAFB' }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 600, color: '#374151', py: 1.5 }}>Site Name</TableCell>
                                                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Contact No</TableCell>
                                                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>District</TableCell>
                                                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Status</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 600, color: '#374151' }}>Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {formik.values.sites.map((site, index) => (
                                                <TableRow key={index} sx={{ '&:hover': { backgroundColor: '#F9FAFB' } }}>
                                                    <TableCell sx={{ color: '#111827', fontWeight: 500 }}>{site.name}</TableCell>
                                                    <TableCell sx={{ color: '#4B5563' }}>{site.contactNo}</TableCell>
                                                    <TableCell sx={{ color: '#4B5563' }}>{site.district}</TableCell>
                                                    <TableCell>
                                                        <Box sx={{
                                                            display: 'inline-flex', px: 1, py: 0.5, borderRadius: '6px',
                                                            fontSize: '11px', fontWeight: 600,
                                                            backgroundColor: site.active ? '#ECFDF5' : '#FEF2F2',
                                                            color: site.active ? '#059669' : '#DC2626'
                                                        }}>
                                                            {site.active ? 'Active' : 'Inactive'}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <IconButton size="small" onClick={() => handleEditSite(index)} sx={{ color: '#0057FF', mr: 1 }}>
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                        <IconButton size="small" onClick={() => handleDeleteSite(index)} sx={{ color: '#EF4444' }}>
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
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: gap }}>
                        <Box sx={{ width: itemWidth }}>{renderField("accountName", "Account Name", "Enter account name")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("shortName", "Short Name", "Enter short name")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("accountNo", "Account No", "Enter account no")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("bankName", "Bank Name", "Enter bank name")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("branch", "Branch", "Enter branch")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("ifsc", "IFSC", "Enter IFSC")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("openingBalance", "Opening Balance", "Enter opening balance")}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("openingDate", "Opening Date", "dd-mm-yyyy", false, "date")}</Box>
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
                                {/* <TableCell align="center" sx={{ fontWeight: 600, color: palette.text.primary }}>View</TableCell> */}
                                <TableCell align="center" sx={{ fontWeight: 600, color: palette.text.primary }}>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedCompanies.map((company, index) => (
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
                                                <IconButton size="small" sx={{ color: palette.primary.main }}>
                                                    <ViewIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Edit">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleEditCompany(companies.indexOf(company))}
                                                    sx={{ color: '#0057FF' }}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleDeleteCompany(companies.indexOf(company))}
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
                    count={filteredCompanies.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    sx={{
                        borderTop: `1px solid ${palette.divider}`,
                        '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                            fontSize: '13px',
                            color: palette.text.secondary
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
                                    disabled={activeStep === 1 && showSiteForm && formik.values.sites.length === 0}
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
        </Box>
    );
}
