"use client";

import React from "react";
import { Box, Typography, Grid, Card, CardContent } from "@mui/material";
import { palette } from "@/theme";
import { TrendingUp, TrendingDown } from "@mui/icons-material";

export default function DashboardPage() {
    const stats = [
        { title: "Total Sales", value: "$24,500", diff: "+12%", isPositive: true },
        { title: "Daily Revenue", value: "$1,240", diff: "+5%", isPositive: true },
        { title: "Total Customers", value: "852", diff: "+18%", isPositive: true },
        { title: "Active Orders", value: "34", diff: "-2.4%", isPositive: false },
    ];

    return (
        <Box sx={{ animation: "fadeIn 0.5s ease-out" }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: palette.text.primary }}>
                Dashboard
            </Typography>
            <Typography variant="body1" sx={{ color: palette.text.secondary, mb: 4 }}>
                Welcome back! Here is what's happening today.
            </Typography>

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
