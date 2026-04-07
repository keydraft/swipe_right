"use client";

import React from "react";
import { Box, Typography, Card, CardContent } from "@mui/material";
import { palette } from "@/theme";

export default function EmployeePage() {
    return (
        <Box sx={{ animation: "fadeIn 0.5s ease-out" }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: palette.text.primary }}>
                Customer
            </Typography>
            <Typography variant="body1" sx={{ color: palette.text.secondary, mb: 4 }}>
                Manage all customer records and permissions here.
            </Typography>

            <Card sx={{
                borderRadius: "16px",
                boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
                border: "1px solid rgba(0,0,0,0.04)",
                minHeight: "400px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }}>
                <CardContent>
                    <Typography variant="h6" color="text.secondary">
                        Customer page interface will go here.
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    );
}
