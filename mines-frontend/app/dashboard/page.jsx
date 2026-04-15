"use client";

import React from "react";
import { Box, Typography, Grid, Card, CardContent, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import { palette } from "@/theme";
import { TrendingUp, TrendingDown } from "@mui/icons-material";
import { useApp } from "@/context/AppContext";
import { adminApi } from "@/services/api";

export default function DashboardPage() {
    const { user: globalUser, selectedCompany, selectedBranch, updateSelectedCompany, updateSelectedBranch } = useApp();
    const [companies, setCompanies] = React.useState([]);

    React.useEffect(() => {
        if (globalUser) {
            if (globalUser.role === 'ADMIN' || globalUser.roleName === 'ADMIN') {
                adminApi.getCompanies(0, 500).then(res => setCompanies(res.data?.content || res.content || res));
            } else if (globalUser.companies) {
                const uniqueCompanies = [];
                const seen = new Set();
                globalUser.companies.forEach(c => {
                    if (!seen.has(c.companyId)) {
                        seen.add(c.companyId);
                        uniqueCompanies.push({ id: c.companyId, name: c.companyName });
                    }
                });
                setCompanies(uniqueCompanies);
            }
        }
    }, [globalUser]);

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
                        Welcome back, {globalUser?.firstName || globalUser?.username || "User"}! Here is what's happening today.
                    </Typography>
                </Box>

                {/* Site Switcher Moved Here */}
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'flex-end', 
                    gap: 1.5,
                    p: 2,
                    backgroundColor: '#fff',
                    borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                    border: '1px solid #F3F4F6'
                }}>
                    <Typography sx={{ fontSize: '11px', fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Site Authorization</Typography>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                            <InputLabel id="company-select-label">Company</InputLabel>
                            <Select
                                labelId="company-select-label"
                                label="Company"
                                value={selectedCompany?.id || selectedCompany?.companyId || ""}
                                onChange={(e) => {
                                    const co = companies.find(c => (c.id || c.companyId) === e.target.value);
                                    updateSelectedCompany(co || null);
                                }}
                                sx={{ borderRadius: '10px', backgroundColor: '#F9FAFB' }}
                            >
                                <MenuItem value=""><em>None</em></MenuItem>
                                {companies.map(c => (
                                    <MenuItem key={c.id || c.companyId} value={c.id || c.companyId}>
                                        {c.name || c.companyName}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl size="small" sx={{ minWidth: 200 }} disabled={!selectedCompany}>
                            <InputLabel id="branch-select-label">Branch</InputLabel>
                            <Select
                                labelId="branch-select-label"
                                label="Branch"
                                value={selectedBranch?.id || selectedBranch?.branchId || ""}
                                onChange={(e) => {
                                    const availableBranches = (globalUser?.role === 'ADMIN' || globalUser?.roleName === 'ADMIN')
                                        ? selectedCompany?.branches || []
                                        : globalUser?.companies?.filter(c => (c.companyId === (selectedCompany?.id || selectedCompany?.companyId))) || [];
                                    
                                    const entry = availableBranches.find(b => (b.id || b.branchId) === e.target.value);
                                    if (entry) {
                                        updateSelectedBranch({
                                            id: entry.id || entry.branchId,
                                            name: entry.name || entry.branchName
                                        });
                                    } else {
                                        updateSelectedBranch(null);
                                    }
                                }}
                                sx={{ borderRadius: '10px', backgroundColor: '#F9FAFB' }}
                            >
                                <MenuItem value=""><em>None</em></MenuItem>
                                {( (globalUser?.role === 'ADMIN' || globalUser?.roleName === 'ADMIN') 
                                    ? selectedCompany?.branches || [] 
                                    : globalUser?.companies?.filter(c => (c.companyId === (selectedCompany?.id || selectedCompany?.companyId))) || []
                                ).map(b => (
                                    <MenuItem key={b.id || b.branchId} value={b.id || b.branchId}>
                                        {b.name || b.branchName}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </Box>
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
