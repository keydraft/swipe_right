"use client";

import React from "react";
import { Box, Typography, Grid, Card, CardContent, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import { palette } from "@/theme";
import { TrendingUp, TrendingDown } from "@mui/icons-material";
import { useApp } from "@/context/AppContext";
import { adminApi } from "@/services/api";

export default function DashboardPage() {
    const { user, selectedCompany, selectedBranch, updateSelectedCompany, updateSelectedBranch } = useApp();
    const [companies, setCompanies] = React.useState([]);
    const [branches, setBranches] = React.useState([]);

    const userRole = (user?.roleName || user?.role || "").toUpperCase();
    const isPowerUser = ['ADMIN', 'ROLE_ADMIN', 'PARTNER', 'ROLE_PARTNER', 'MANAGER', 'ROLE_MANAGER'].includes(userRole);

    React.useEffect(() => {
        if (user && user.companies) {
            setCompanies(user.companies);
        }
    }, [user]);

    React.useEffect(() => {
        const loadBranches = async () => {
            if (selectedCompany) {
                const coId = selectedCompany.companyId || selectedCompany.id;
                
                // For Partners/Admins, fetch ALL branches
                if (isPowerUser) {
                    try {
                        const response = await adminApi.getBranches(coId);
                        if (response.success) {
                            setBranches(response.data);
                            // Default to 0th branch if none selected or company changed
                            if (response.data.length > 0 && (!selectedBranch || !response.data.find(b => (b.id || b.branchId) === (selectedBranch.id || selectedBranch.branchId)))) {
                                updateSelectedBranch(response.data[0]);
                            }
                        }
                    } catch (error) {
                        console.error("Error fetching branches:", error);
                    }
                } else {
                    // For other roles, just use what's in the profile
                    const profileBranches = user?.companies
                        ?.filter(c => c.companyId === coId && c.branchId)
                        .map(c => ({ id: c.branchId, name: c.branchName }));
                    const branchList = profileBranches || [];
                    setBranches(branchList);

                    // Default to 0th branch for non-power users too
                    if (branchList.length > 0 && (!selectedBranch || !branchList.find(b => (b.id || b.branchId) === (selectedBranch.id || selectedBranch.branchId)))) {
                        updateSelectedBranch(branchList[0]);
                    }
                }
            } else {
                setBranches([]);
            }
        };

        loadBranches();
    }, [selectedCompany, user, isPowerUser]);

    const handleCompanyChange = (e) => {
        const coId = e.target.value;
        const companyObj = companies.find(c => c.companyId === coId);
        updateSelectedCompany(companyObj);
    };

    const handleBranchChange = (e) => {
        const brId = e.target.value;
        const branchObj = branches.find(b => (b.id || b.branchId) === brId);
        updateSelectedBranch(branchObj || null);
    };

    const stats = [
        { title: "Total Sales", value: "$24,500", diff: "+12%", isPositive: true },
        { title: "Daily Revenue", value: "$1,240", diff: "+5%", isPositive: true },
        { title: "Total Customers", value: "852", diff: "+18%", isPositive: true },
        { title: "Active Orders", value: "34", diff: "-2.4%", isPositive: false },
    ];

    return (
        <Box sx={{ animation: "fadeIn 0.5s ease-out" }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                <Box>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: palette.text.primary }}>
                        Dashboard
                    </Typography>
                    <Typography variant="body1" sx={{ color: palette.text.secondary }}>
                        Welcome back, {user?.firstName || user?.username || "User"}! Here is what's happening today.
                    </Typography>
                </Box>

                {isPowerUser && companies.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                            <InputLabel id="company-select-label">Select Company</InputLabel>
                            <Select
                                labelId="company-select-label"
                                value={selectedCompany?.companyId || ""}
                                label="Select Company"
                                onChange={handleCompanyChange}
                                sx={{ borderRadius: '12px', bgcolor: '#fff' }}
                            >
                                {[...new Map(companies.map(item => [item.companyId, item])).values()].map((c) => (
                                    <MenuItem key={c.companyId} value={c.companyId}>{c.companyName}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl size="small" sx={{ minWidth: 200 }}>
                            <InputLabel id="branch-select-label">All Branches</InputLabel>
                            <Select
                                labelId="branch-select-label"
                                value={selectedBranch?.id || selectedBranch?.branchId || ""}
                                label="Branch"
                                onChange={handleBranchChange}
                                sx={{ borderRadius: '12px', bgcolor: '#fff' }}
                            >
                                {branches.map((b) => (
                                    <MenuItem key={b.id || b.branchId} value={b.id || b.branchId}>{b.name || b.branchName}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                )}
            </Box>

            <Grid container spacing={4}>
                {stats.map((stat, i) => (
                    <Grid item xs={12} sm={6} lg={3} key={i}>
                        <Card sx={{
                            borderRadius: "16px",
                            boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
                            border: "1px solid rgba(0,0,0,0.04)"
                        }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="subtitle2" sx={{ color: palette.text.secondary, mb: 1.5, fontWeight: 600 }}>
                                    {stat.title}
                                </Typography>
                                <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                                    <Typography variant="h4" sx={{ fontWeight: 700, color: palette.primary.dark }}>
                                        {stat.value}
                                    </Typography>
                                    <Box sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 0.5,
                                        backgroundColor: stat.isPositive ? "rgba(76, 175, 80, 0.1)" : "rgba(244, 67, 54, 0.1)",
                                        px: 1,
                                        py: 0.5,
                                        borderRadius: "6px"
                                    }}>
                                        {stat.isPositive ?
                                            <TrendingUp sx={{ fontSize: 16, color: "success.main" }} /> :
                                            <TrendingDown sx={{ fontSize: 16, color: "error.main" }} />
                                        }
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                fontWeight: 700,
                                                color: stat.isPositive ? "success.main" : "error.main",
                                            }}
                                        >
                                            {stat.diff}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Chart Placeholder Area */}
            <Grid container spacing={4} sx={{ mt: 1 }}>
                <Grid item xs={12} lg={8}>
                    <Card sx={{ borderRadius: "16px", boxShadow: "0 4px 24px rgba(0,0,0,0.04)", minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', border: "1px solid rgba(0,0,0,0.04)" }}>
                        <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                            Analytics Chart Placeholder
                        </Typography>
                    </Card>
                </Grid>
                <Grid item xs={12} lg={4}>
                    <Card sx={{ borderRadius: "16px", boxShadow: "0 4px 24px rgba(0,0,0,0.04)", minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', border: "1px solid rgba(0,0,0,0.04)" }}>
                        <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                            Recent Activity Timeline
                        </Typography>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
