"use client";

import React, { useState, useEffect } from "react";
import {
    Box, Typography, Card, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Button,
    TextField, InputAdornment, Tooltip, Dialog, DialogContent,
    Select, MenuItem, Switch, FormControlLabel
} from "@mui/material";
import {
    SearchOutlined as SearchIcon, AddOutlined as AddIcon, FileDownloadOutlined as DownloadIcon,
    PrintOutlined as PrintIcon, SortOutlined as SortIcon, VisibilityOutlined as ViewIcon,
    MoreVertOutlined as ActionIcon, EditOutlined as EditIcon, DeleteOutline as DeleteIcon
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { palette } from "@/theme";

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

    // Persist data in localStorage
    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedCompanies = localStorage.getItem("companies");
            if (savedCompanies !== null) {
                try {
                    const parsed = JSON.parse(savedCompanies);
                    if (Array.isArray(parsed)) {
                        setCompanies(parsed);
                    }
                } catch (e) {
                    console.error("Error parsing saved companies", e);
                }
            } else {
                // If no data in localStorage, initialize it with mock data
                localStorage.setItem("companies", JSON.stringify(mockCompanies));
            }
            setIsInitialized(true);
        }
    }, []);

    useEffect(() => {
        if (typeof window !== "undefined" && isInitialized) {
            localStorage.setItem("companies", JSON.stringify(companies));
        }
    }, [companies, isInitialized]);

    const initialSiteState = {
        name: "", contactPerson: "", addressLine1: "", addressLine2: "",
        state: "", district: "", pincode: "", contactNo: "", alternateNo: "",
        siteType: "", plantType: "", active: true
    };

    const initialFormState = {
        name: "", invoiceInitial: "", gstn: "", addressLine1: "", addressLine2: "",
        district: "", state: "", pincode: "", phone: "", alternatePhone: "", emailId: "",
        accountName: "", shortName: "", accountNo: "", bankName: "", branch: "",
        ifsc: "", openingBalance: "", openingDate: ""
    };

    const [formData, setFormData] = useState(initialFormState);
    const [sites, setSites] = useState([]);
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
        setSites([]);
        setFormData(initialFormState);
        setCurrentSite(initialSiteState);
        setIsEditingSite(false);
        setShowSiteForm(true);
        setIsEditingCompany(false);
        setEditingCompanyIndex(null);
        setShowSuccess(false);
    };

    const handleSubmit = () => {
        if (isEditingCompany) {
            const updatedCompanies = [...companies];
            updatedCompanies[editingCompanyIndex] = {
                ...updatedCompanies[editingCompanyIndex],
                ...formData,
                sites: sites
            };
            setCompanies(updatedCompanies);
        } else {
            const nextId = companies.length > 0 ? Math.max(...companies.map(c => c.id)) + 1 : 1;
            const newCompany = {
                id: nextId,
                ...formData,
                sites: sites
            };
            setCompanies([...companies, newCompany]);
        }
        
        setShowSuccess(true);
        setTimeout(() => {
            handleCloseModal();
        }, 2000);
    };

    const handleEditCompany = (index) => {
        const company = companies[index];
        setFormData({
            name: company.name || "",
            invoiceInitial: company.invoiceInitial || "",
            gstn: company.gstn || "",
            addressLine1: company.addressLine1 || "",
            addressLine2: company.addressLine2 || "",
            district: company.district || "",
            state: company.state || "",
            pincode: company.pincode || "",
            phone: company.phone || "",
            alternatePhone: company.alternatePhone || "",
            emailId: company.emailId || "",
            accountName: company.accountName || "",
            shortName: company.shortName || "",
            accountNo: company.accountNo || "",
            bankName: company.bankName || "",
            branch: company.branch || "",
            ifsc: company.ifsc || "",
            openingBalance: company.openingBalance || "",
            openingDate: company.openingDate || ""
        });
        setSites(company.sites || []);
        setShowSiteForm(company.sites && company.sites.length > 0 ? false : true);
        setEditingCompanyIndex(index);
        setIsEditingCompany(true);
        setOpenModal(true);
    };

    const handleDeleteCompany = (index) => {
        setCompanies(companies.filter((_, i) => i !== index));
    };

    const handleNext = () => setActiveStep((prev) => prev + 1);
    const handleBack = () => setActiveStep((prev) => prev - 1);

    const handleAddSite = () => {
        if (!currentSite.name) return;
        if (editingSiteIndex !== null) {
            const newSites = [...sites];
            newSites[editingSiteIndex] = currentSite;
            setSites(newSites);
            setEditingSiteIndex(null);
        } else {
            setSites([...sites, currentSite]);
        }
        setCurrentSite(initialSiteState);
        setShowSiteForm(false);
    };

    const handleEditSite = (index) => {
        setCurrentSite(sites[index]);
        setEditingSiteIndex(index);
        setShowSiteForm(true);
    };

    const handleDeleteSite = (index) => {
        setSites(sites.filter((_, i) => i !== index));
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

    const renderField = (label, placeholder, isSelect = false, type = "text", value = "", onChange = () => { }) => {
        if (type === "switch") {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={value}
                                onChange={(e) => onChange(e.target.checked)}
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
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        displayEmpty
                        sx={{ borderRadius: '12px', backgroundColor: '#F9FAFB', border: '1px solid #F3F4F6', '& .MuiSelect-select': { color: value ? '#111827' : '#9CA3AF' }, '& .MuiOutlinedInput-notchedOutline': { border: 'none' } }}
                    >
                        <MenuItem value="">{placeholder}</MenuItem>
                        <MenuItem value="Option 1">Option 1</MenuItem>
                        <MenuItem value="Option 2">Option 2</MenuItem>
                    </Select>
                ) : (
                    <TextField
                        fullWidth size="small"
                        placeholder={placeholder}
                        variant="outlined"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', backgroundColor: '#F9FAFB', '& .MuiOutlinedInput-notchedOutline': { border: '1px solid #F3F4F6' } } }}
                    />
                )}
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
                        <Box sx={{ width: itemWidth }}>{renderField("Name", "Enter name", false, "text", formData.name, (v) => setFormData({ ...formData, name: v }))}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("Invoice Initial", "Enter invoice initial", false, "text", formData.invoiceInitial, (v) => setFormData({ ...formData, invoiceInitial: v }))}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("GSTN", "Enter GSTN", false, "text", formData.gstn, (v) => setFormData({ ...formData, gstn: v }))}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("Address Line 1", "Enter address line 1", false, "text", formData.addressLine1, (v) => setFormData({ ...formData, addressLine1: v }))}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("Address Line 2", "Enter address line 2", false, "text", formData.addressLine2, (v) => setFormData({ ...formData, addressLine2: v }))}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("District", "Choose district", false, "text", formData.district, (v) => setFormData({ ...formData, district: v }))}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("State", "Choose state", false, "text", formData.state, (v) => setFormData({ ...formData, state: v }))}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("Pincode", "Choose pincode", false, "text", formData.pincode, (v) => setFormData({ ...formData, pincode: v }))}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("Phone", "Enter phone number", false, "text", formData.phone, (v) => setFormData({ ...formData, phone: v }))}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("Alternate Phone", "Enter alternate phone", false, "text", formData.alternatePhone, (v) => setFormData({ ...formData, alternatePhone: v }))}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("Email Id", "Enter email id", false, "text", formData.emailId, (v) => setFormData({ ...formData, emailId: v }))}</Box>
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
                                    <Box sx={{ width: itemWidth }}>{renderField("Site Name *", "Enter site name", false, "text", currentSite.name, (v) => setCurrentSite({ ...currentSite, name: v }))}</Box>
                                    <Box sx={{ width: itemWidth }}>{renderField("Contact Person", "Select contact person", true, "text", currentSite.contactPerson, (v) => setCurrentSite({ ...currentSite, contactPerson: v }))}</Box>
                                    <Box sx={{ width: itemWidth }}>{renderField("Address Line 1", "Enter address line 1", false, "text", currentSite.addressLine1, (v) => setCurrentSite({ ...currentSite, addressLine1: v }))}</Box>
                                    <Box sx={{ width: itemWidth }}>{renderField("Address Line 2", "Enter address line 2", false, "text", currentSite.addressLine2, (v) => setCurrentSite({ ...currentSite, addressLine2: v }))}</Box>
                                    <Box sx={{ width: itemWidth }}>{renderField("State", "Enter state", false, "text", currentSite.state, (v) => setCurrentSite({ ...currentSite, state: v }))}</Box>
                                    <Box sx={{ width: itemWidth }}>{renderField("District", "Enter district", false, "text", currentSite.district, (v) => setCurrentSite({ ...currentSite, district: v }))}</Box>
                                    <Box sx={{ width: itemWidth }}>{renderField("Pincode", "Enter pincode", false, "text", currentSite.pincode, (v) => setCurrentSite({ ...currentSite, pincode: v }))}</Box>
                                    <Box sx={{ width: itemWidth }}>{renderField("Contact No", "Enter contact no", false, "text", currentSite.contactNo, (v) => setCurrentSite({ ...currentSite, contactNo: v }))}</Box>
                                    <Box sx={{ width: itemWidth }}>{renderField("Alternate No", "Enter alternate no", false, "text", currentSite.alternateNo, (v) => setCurrentSite({ ...currentSite, alternateNo: v }))}</Box>
                                    <Box sx={{ width: itemWidth }}>{renderField("Site Type", "Select site type", true, "text", currentSite.siteType, (v) => setCurrentSite({ ...currentSite, siteType: v }))}</Box>
                                    <Box sx={{ width: itemWidth }}>{renderField("Plant Type *", "Select plant type", true, "text", currentSite.plantType, (v) => setCurrentSite({ ...currentSite, plantType: v }))}</Box>
                                    <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', pb: 1 }}>
                                        {renderField("Active", "", false, "switch", currentSite.active, (v) => setCurrentSite({ ...currentSite, active: v }))}
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
                        ) : null}

                        {sites.length > 0 && (
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#111827' }}>
                                        Registered Sites ({sites.length})
                                    </Typography>
                                    {!showSiteForm && (
                                        <Button
                                            startIcon={<AddIcon />}
                                            variant="contained"
                                            onClick={() => { setShowSiteForm(true); setEditingSiteIndex(null); setCurrentSite(initialSiteState); }}
                                            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, backgroundColor: '#0057FF', fontSize: '13px' }}
                                        >
                                            Add New Site
                                        </Button>
                                    )}
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
                                            {sites.map((site, index) => (
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
                        <Box sx={{ width: itemWidth }}>{renderField("Account Name", "Enter account name", false, "text", formData.accountName, (v) => setFormData({ ...formData, accountName: v }))}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("Short Name", "Enter short name", false, "text", formData.shortName, (v) => setFormData({ ...formData, shortName: v }))}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("Account No", "Enter account no", false, "text", formData.accountNo, (v) => setFormData({ ...formData, accountNo: v }))}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("Bank Name", "Enter bank name", false, "text", formData.bankName, (v) => setFormData({ ...formData, bankName: v }))}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("Branch", "Enter branch", false, "text", formData.branch, (v) => setFormData({ ...formData, branch: v }))}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("IFSC", "Enter IFSC", false, "text", formData.ifsc, (v) => setFormData({ ...formData, ifsc: v }))}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("Opening Balance", "Enter opening balance", false, "text", formData.openingBalance, (v) => setFormData({ ...formData, openingBalance: v }))}</Box>
                        <Box sx={{ width: itemWidth }}>{renderField("Opening Date", "dd-mm-yyyy", false, "text", formData.openingDate, (v) => setFormData({ ...formData, openingDate: v }))}</Box>
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
                                <TableCell align="center" sx={{ fontWeight: 600, color: palette.text.primary }}>View</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600, color: palette.text.primary }}>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {companies.map((company) => (
                                <TableRow key={company.id} sx={{ '&:hover': { backgroundColor: palette.background.paper } }}>
                                    <TableCell>{company.id}</TableCell>
                                    <TableCell>{company.name}</TableCell>
                                    <TableCell>{company.invoiceInitial}</TableCell>
                                    <TableCell>{company.gstn}</TableCell>
                                    <TableCell>{company.addressLine1}</TableCell>
                                    <TableCell>{company.addressLine2}</TableCell>
                                    <TableCell>{company.district}</TableCell>
                                    <TableCell>{company.state}</TableCell>
                                    <TableCell>{company.pincode}</TableCell>
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
                                    onClick={activeStep < 2 ? handleNext : handleSubmit}
                                    disabled={activeStep === 1 && showSiteForm && sites.length === 0}
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
