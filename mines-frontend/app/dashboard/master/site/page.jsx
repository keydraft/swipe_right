"use client";

import React, { useState } from "react";
import {
    Box, Typography, Card, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Button,
    TextField, InputAdornment, Tooltip, Chip
} from "@mui/material";
import {
    SearchOutlined as SearchIcon, AddOutlined as AddIcon, FileDownloadOutlined as DownloadIcon,
    PrintOutlined as PrintIcon, SortOutlined as SortIcon, VisibilityOutlined as ViewIcon,
    MoreVertOutlined as ActionIcon, ArrowBackOutlined as BackIcon
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { palette } from "@/theme";

const mockSites = [
    {
        id: 1,
        siteName: "Mumbai Central",
        icode: "MC001",
        siteIncharge: "John Doe",
        addressLine1: "123 Main St",
        addressLine2: "Near Station",
        district: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        contactNo: "9876543210",
        alternateNo: "9876543211",
        siteType: "Warehouse",
        type: "Owned",
        activeStatus: "Active"
    },
    {
        id: 2,
        siteName: "Bangalore Hub",
        icode: "BH002",
        siteIncharge: "Jane Smith",
        addressLine1: "45 Business Park",
        addressLine2: "Phase 2",
        district: "Bangalore",
        state: "Karnataka",
        pincode: "560001",
        contactNo: "9876543212",
        alternateNo: "9876543213",
        siteType: "Distribution",
        type: "Leased",
        activeStatus: "Inactive"
    }
];

export default function SiteListPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const router = useRouter();

    return (
        <Box sx={{ animation: "fadeIn 0.5s ease-out" }}>
            {/* Header Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h3" sx={{ fontWeight: 900, color: palette.text.secondary }}>
                        Site List
                    </Typography>
                </Box>
                <Button
                    variant="outlined"
                    onClick={() => router.push("/dashboard/master/company")}
                    sx={{
                        border: `1px solid #0057FF`,
                        color: '#0057FF',
                        textTransform: 'none',
                        fontWeight: 600,
                        height: '36px',
                        borderRadius: '4px',
                        '&:hover': {
                            backgroundColor: 'rgba(0, 87, 255, 0.04)',
                            borderColor: '#0057FF'
                        }
                    }}
                >
                    Company List
                </Button>
            </Box>

            {/* Toolbar Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, }}>
                <TextField
                    variant="outlined"
                    placeholder="Search sites..."
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
                <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
                    <Table stickyHeader sx={{ minWidth: 1500 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, backgroundColor: palette.background.paper }}>Site Name</TableCell>
                                <TableCell sx={{ fontWeight: 600, backgroundColor: palette.background.paper }}>ICode</TableCell>
                                <TableCell sx={{ fontWeight: 600, backgroundColor: palette.background.paper }}>Site Incharge</TableCell>
                                <TableCell sx={{ fontWeight: 600, backgroundColor: palette.background.paper }}>Address Line 1</TableCell>
                                <TableCell sx={{ fontWeight: 600, backgroundColor: palette.background.paper }}>Address Line 2</TableCell>
                                <TableCell sx={{ fontWeight: 600, backgroundColor: palette.background.paper }}>District</TableCell>
                                <TableCell sx={{ fontWeight: 600, backgroundColor: palette.background.paper }}>State</TableCell>
                                <TableCell sx={{ fontWeight: 600, backgroundColor: palette.background.paper }}>Pincode</TableCell>
                                <TableCell sx={{ fontWeight: 600, backgroundColor: palette.background.paper }}>Contact No</TableCell>
                                <TableCell sx={{ fontWeight: 600, backgroundColor: palette.background.paper }}>Alternate No</TableCell>
                                <TableCell sx={{ fontWeight: 600, backgroundColor: palette.background.paper }}>Site Type</TableCell>
                                <TableCell sx={{ fontWeight: 600, backgroundColor: palette.background.paper }}>Type</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600, backgroundColor: palette.background.paper }}>Active Status</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600, backgroundColor: palette.background.paper }}>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {mockSites.map((site) => (
                                <TableRow key={site.id} sx={{ '&:hover': { backgroundColor: palette.background.paper } }}>
                                    <TableCell sx={{ fontWeight: 500 }}>{site.siteName}</TableCell>
                                    <TableCell>{site.icode}</TableCell>
                                    <TableCell>{site.siteIncharge}</TableCell>
                                    <TableCell>{site.addressLine1}</TableCell>
                                    <TableCell>{site.addressLine2}</TableCell>
                                    <TableCell>{site.district}</TableCell>
                                    <TableCell>{site.state}</TableCell>
                                    <TableCell>{site.pincode}</TableCell>
                                    <TableCell>{site.contactNo}</TableCell>
                                    <TableCell>{site.alternateNo}</TableCell>
                                    <TableCell>{site.siteType}</TableCell>
                                    <TableCell>{site.type}</TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={site.activeStatus}
                                            size="small"
                                            sx={{
                                                backgroundColor: site.activeStatus === 'Active' ? '#EBFDF5' : '#FEF2F2',
                                                color: site.activeStatus === 'Active' ? '#10B981' : '#EF4444',
                                                fontWeight: 600,
                                                borderRadius: '6px'
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
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
        </Box>
    );
}
