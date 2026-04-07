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
    EditOutlined as EditIcon, DeleteOutline as DeleteIcon
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { palette } from "@/theme";

const mockProducts = [
    {
        id: 1,
        name: "Aggregate 10mm",
        shortName: "AGG10",
        hsnc: "2517",
        gst: "5",
        rmType: "Raw Material",
        status: "Active",
        plantPrices: []
    },
    {
        id: 2,
        name: "Aggregate 20mm",
        shortName: "AGG20",
        hsnc: "2517",
        gst: "5",
        rmType: "Raw Material",
        status: "Active",
        plantPrices: []
    },
    {
        id: 3,
        name: "Stone Dust",
        shortName: "SDUST",
        hsnc: "2517",
        gst: "5",
        rmType: "Raw Material",
        status: "Inactive",
        plantPrices: []
    },
];

export default function ProductPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [openModal, setOpenModal] = useState(false);
    const [products, setProducts] = useState(mockProducts);
    const [isInitialized, setIsInitialized] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const initialFormState = {
        name: "",
        shortName: "",
        hsnc: "",
        gst: "0",
        rmType: "",
        status: "Active",
        plantPrices: []
    };

    const [formData, setFormData] = useState(initialFormState);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Persist data in localStorage
    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedProducts = localStorage.getItem("products");
            if (savedProducts !== null) {
                try {
                    const parsed = JSON.parse(savedProducts);
                    if (Array.isArray(parsed)) {
                        setProducts(parsed);
                    }
                } catch (e) {
                    console.error("Error parsing saved products", e);
                }
            } else {
                localStorage.setItem("products", JSON.stringify(mockProducts));
            }
            setIsInitialized(true);
        }
    }, []);

    useEffect(() => {
        if (typeof window !== "undefined" && isInitialized) {
            localStorage.setItem("products", JSON.stringify(products));
        }
    }, [products, isInitialized]);

    const handleOpenModal = () => {
        // Fetch sites from companies to initialize plant prices
        let availableSites = [];
        const savedCompanies = localStorage.getItem("companies");
        if (savedCompanies) {
            const companies = JSON.parse(savedCompanies);
            availableSites = companies.flatMap(c => (c.sites || []).map(s => s.name));
        }

        // Default sites if none found in localStorage
        if (availableSites.length === 0) {
            availableSites = ["GIRIJA PURAM", "ARAPAKKAM", "MAGARAL"];
        }

        const initialPlantPrices = availableSites.map(siteName => ({
            siteName,
            rate: "0"
        }));

        setFormData({ ...initialFormState, plantPrices: initialPlantPrices });
        setIsEditing(false);
        setEditingId(null);
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handlePlantPriceChange = (index, value) => {
        const newPlantPrices = [...formData.plantPrices];
        newPlantPrices[index].rate = value;
        setFormData({ ...formData, plantPrices: newPlantPrices });
    };

    const handleSubmit = () => {
        if (!formData.name || !formData.shortName) return;

        if (isEditing) {
            setProducts(products.map(p => p.id === editingId ? { ...formData, id: editingId } : p));
        } else {
            const nextId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
            setProducts([...products, { ...formData, id: nextId }]);
        }
        handleCloseModal();
    };

    const handleEditProduct = (product) => {
        // Fetch current sites to ensure all are listed
        let currentSites = [];
        const savedCompanies = localStorage.getItem("companies");
        if (savedCompanies) {
            const companies = JSON.parse(savedCompanies);
            currentSites = companies.flatMap(c => (c.sites || []).map(s => s.name));
        }
        
        if (currentSites.length === 0) {
            currentSites = ["GIRIJA PURAM", "ARAPAKKAM", "MAGARAL"];
        }

        // Merge existing prices with current sites
        const mergedPlantPrices = currentSites.map(siteName => {
            const existing = (product.plantPrices || []).find(p => p.siteName === siteName);
            return existing ? existing : { siteName, rate: "0" };
        });

        setFormData({
            name: product.name,
            shortName: product.shortName,
            hsnc: product.hsnc,
            gst: product.gst,
            rmType: product.rmType,
            status: product.status,
            plantPrices: mergedPlantPrices
        });
        setIsEditing(true);
        setEditingId(product.id);
        setOpenModal(true);
    };

    const handleDeleteProduct = (id) => {
        setProducts(products.filter(p => p.id !== id));
    };

    const filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.hsnc.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const paginatedProducts = filteredProducts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <Box sx={{ animation: "fadeIn 0.5s ease-out" }}>
            {/* Header Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h3" sx={{ fontWeight: 900, color: palette.text.secondary }}>
                    Product List
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
                        New Product
                    </Button>
                </Box>
            </Box>

            {/* Toolbar Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <TextField
                    variant="outlined"
                    placeholder="Search products..."
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
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>S No</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>Product Name</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>Short Name</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>HSNC</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>GST %</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>RM Type</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: palette.text.primary }}>Status</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600, color: palette.text.primary }}>Edit</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedProducts.map((product, index) => (
                                <TableRow key={product.id} sx={{ '&:hover': { backgroundColor: palette.background.paper } }}>
                                    <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                                    <TableCell sx={{ fontWeight: 500, color: palette.text.primary }}>{product.name}</TableCell>
                                    <TableCell>{product.shortName}</TableCell>
                                    <TableCell>{product.hsnc}</TableCell>
                                    <TableCell>{product.gst}%</TableCell>
                                    <TableCell>{product.rmType}</TableCell>
                                    <TableCell>
                                        <Box sx={{
                                            display: 'inline-flex',
                                            px: 1.5,
                                            py: 0.5,
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            backgroundColor: product.status === 'Active' ? '#ECFDF5' : '#FEF2F2',
                                            color: product.status === 'Active' ? '#059669' : '#DC2626'
                                        }}>
                                            {product.status}
                                        </Box>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                            <Tooltip title="Edit">
                                                <IconButton 
                                                    size="small" 
                                                    sx={{ color: '#0057FF' }}
                                                    onClick={() => handleEditProduct(product)}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton 
                                                    size="small" 
                                                    sx={{ color: '#EF4444' }}
                                                    onClick={() => handleDeleteProduct(product.id)}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredProducts.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                                        <Typography color="textSecondary">No products found</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={filteredProducts.length}
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

            {/* Simplified Modal for New Product (Placeholder) */}
            <Dialog
                open={openModal}
                onClose={handleCloseModal}
                maxWidth="md"
                fullWidth
                sx={{
                    '& .MuiDialog-container': {
                        marginLeft: { md: '280px' },
                        width: { md: 'calc(100% - 280px)' }
                    }
                }}
                PaperProps={{
                    sx: { borderRadius: '16px', padding: '0px', overflow: 'hidden' }
                }}
            >
                <DialogContent sx={{ p: 4, backgroundColor: '#fff' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {/* Top row: Name and Short Name */}
                        <Box sx={{ display: 'flex', gap: 3 }}>
                            <Box sx={{ flex: 1 }}>
                                <Typography sx={{ fontSize: '13px', color: '#9CA3AF', mb: 0.5 }}>Product Name</Typography>
                                <TextField 
                                    fullWidth 
                                    size="small"
                                    placeholder="Enter Product Name"
                                    variant="outlined" 
                                    value={formData.name}
                                    onChange={(e) => handleInputChange("name", e.target.value)}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', backgroundColor: '#fff' } }}
                                />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography sx={{ fontSize: '13px', color: '#9CA3AF', mb: 0.5 }}>Short Name</Typography>
                                <TextField 
                                    fullWidth 
                                    size="small"
                                    placeholder="Enter Short Name"
                                    variant="outlined" 
                                    value={formData.shortName}
                                    onChange={(e) => handleInputChange("shortName", e.target.value)}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', backgroundColor: '#fff' } }}
                                />
                            </Box>
                        </Box>

                        {/* Middle row: HSN and GST */}
                        <Box sx={{ display: 'flex', gap: 3 }}>
                            <Box sx={{ flex: 1 }}>
                                <Typography sx={{ fontSize: '13px', color: '#9CA3AF', mb: 0.5 }}>HSN Code</Typography>
                                <TextField 
                                    fullWidth 
                                    size="small"
                                    placeholder="HSN Code"
                                    variant="outlined" 
                                    value={formData.hsnc}
                                    onChange={(e) => handleInputChange("hsnc", e.target.value)}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', backgroundColor: '#fff' } }}
                                />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography sx={{ fontSize: '13px', color: '#9CA3AF', mb: 0.5 }}>GST %</Typography>
                                <TextField 
                                    fullWidth 
                                    size="small"
                                    placeholder="0"
                                    variant="outlined" 
                                    value={formData.gst}
                                    onChange={(e) => handleInputChange("gst", e.target.value)}
                                    InputProps={{
                                        sx: { position: 'relative' },
                                        startAdornment: (
                                            <Box sx={{ 
                                                position: 'absolute', top: -10, left: 10, 
                                                backgroundColor: '#fff', px: 0.5, fontSize: '10px', 
                                                color: '#9CA3AF', zIndex: 1 
                                            }}>
                                                GST %
                                            </Box>
                                        )
                                    }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', backgroundColor: '#fff' } }}
                                />
                            </Box>
                        </Box>

                        {/* RM Type row */}
                        <Box>
                            <Typography sx={{ fontSize: '13px', color: '#9CA3AF', mb: 0.5 }}>RM Type</Typography>
                            <Select 
                                fullWidth 
                                size="small"
                                displayEmpty 
                                value={formData.rmType}
                                onChange={(e) => handleInputChange("rmType", e.target.value)}
                                sx={{ borderRadius: '8px', backgroundColor: '#fff' }}
                            >
                                <MenuItem value="" disabled>Select RM Type</MenuItem>
                                <MenuItem value="CRUSHER">CRUSHER</MenuItem>
                                <MenuItem value="Raw Material">Raw Material</MenuItem>
                                <MenuItem value="Finished Good">Finished Good</MenuItem>
                            </Select>
                        </Box>

                        {/* Plant Table Section */}
                        <TableContainer sx={{ mt: 1, borderTop: '1px solid #F3F4F6' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ color: '#3B82F6', fontWeight: 600, borderBottom: 'none', py: 2 }}>S.No</TableCell>
                                        <TableCell sx={{ color: '#3B82F6', fontWeight: 600, borderBottom: 'none' }}>Plant Name</TableCell>
                                        <TableCell sx={{ color: '#3B82F6', fontWeight: 600, borderBottom: 'none' }}>Price</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {(formData?.plantPrices || []).map((plant, index) => (
                                        <TableRow key={index}>
                                            <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 2 }}>{index + 1}</TableCell>
                                            <TableCell sx={{ borderBottom: '1px solid #F3F4F6', color: '#374151', fontWeight: 500 }}>{plant.siteName}</TableCell>
                                            <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
                                                <TextField 
                                                    size="small"
                                                    value={plant.rate}
                                                    onChange={(e) => handlePlantPriceChange(index, e.target.value)}
                                                    InputProps={{
                                                        sx: { position: 'relative', height: '36px' },
                                                        startAdornment: (
                                                            <Box sx={{ 
                                                                position: 'absolute', top: -12, left: 10, 
                                                                backgroundColor: '#fff', px: 0.5, fontSize: '10px', 
                                                                color: '#9CA3AF', zIndex: 1 
                                                            }}>
                                                                Rate
                                                            </Box>
                                                        )
                                                    }}
                                                    sx={{ width: '150px', '& .MuiOutlinedInput-root': { borderRadius: '4px' } }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* Bottom Actions */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.status === "Active"}
                                        onChange={(e) => handleInputChange("status", e.target.checked ? "Active" : "Inactive")}
                                        sx={{ 
                                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#3B82F6' }, 
                                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#3B82F6' } 
                                        }}
                                    />
                                }
                                label="Active"
                                sx={{ color: '#4B5563', fontWeight: 500 }}
                            />
                            
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button 
                                    variant="contained" 
                                    onClick={handleSubmit}
                                    sx={{ 
                                        backgroundColor: '#3B82F6', 
                                        color: '#fff', 
                                        px: 4, 
                                        py: 1,
                                        borderRadius: '4px',
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        '&:hover': { backgroundColor: '#2563EB' }
                                    }}
                                >
                                    Save
                                </Button>
                                <Button 
                                    variant="outlined" 
                                    onClick={handleCloseModal}
                                    sx={{ 
                                        borderColor: '#FDBA74', 
                                        color: '#FDBA74', 
                                        px: 4, 
                                        py: 1,
                                        borderRadius: '4px',
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        '&:hover': { borderColor: '#FB923C', backgroundColor: '#FFF7ED' }
                                    }}
                                >
                                    Cancel
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </DialogContent>
            </Dialog>
        </Box>
    );
}
