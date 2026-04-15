"use client";

import React, { useState, useEffect } from "react";
import { Box, Typography, Select, MenuItem, Stack } from "@mui/material";
import { adminApi } from "@/services/api";
import Cookies from "js-cookie";

export default function OrganizationPicker({ org, setOrg, adminOnly = false }) {
    const userRole = typeof window !== "undefined" ? Cookies.get("role") || "" : "";
    const isAdmin = userRole === "ADMIN" || userRole === "ROLE_ADMIN";
    
    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);

    useEffect(() => {
        if (isAdmin || !adminOnly) {
            adminApi.getCompanies(0, 500).then(res => {
                if (res.success) setCompanies(res.data.content || []);
            });
        }
    }, [isAdmin, adminOnly]);

    useEffect(() => {
        if (org.companyId) {
            adminApi.getBranches(org.companyId).then(res => {
                if (res.success) setBranches(res.data || []);
            });
        } else {
            setBranches([]);
        }
    }, [org.companyId]);

    const selectStyle = {
        borderRadius: "10px",
        backgroundColor: "#F9FAFB",
        height: "40px",
        fontSize: "13px",
        "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E5E7EB" },
        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#D1D5DB" },
    };

    const labelStyle = { fontSize: "11px", fontWeight: 700, color: "#9CA3AF", mb: 0.5, px: 0.5 };

    if (adminOnly && !isAdmin) return null;

    return (
        <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ minWidth: 200 }}>
                <Typography sx={labelStyle}>COMPANY</Typography>
                <Select
                    fullWidth size="small"
                    value={org.companyId}
                    displayEmpty
                    onChange={(e) => setOrg({ ...org, companyId: e.target.value, branchId: "" })}
                    sx={selectStyle}
                >
                    <MenuItem value="" disabled>Select Company</MenuItem>
                    {companies.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                </Select>
            </Box>
            <Box sx={{ minWidth: 200 }}>
                <Typography sx={labelStyle}>BRANCH</Typography>
                <Select
                    fullWidth size="small"
                    value={org.branchId}
                    displayEmpty
                    disabled={!org.companyId}
                    onChange={(e) => setOrg({ ...org, branchId: e.target.value })}
                    sx={selectStyle}
                >
                    <MenuItem value="" disabled>Select Branch</MenuItem>
                    {branches.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
                </Select>
            </Box>
        </Stack>
    );
}
