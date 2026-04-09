"use client";

import React, { useEffect, useState } from "react";
import { Box, Typography, Divider, Stack, CircularProgress } from "@mui/material";
import { useParams } from "next/navigation";
import { dcApi } from "@/services/api";

export default function DcPrintPage() {
    const params = useParams();
    const id = params?.id;
    const [dc, setDc] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            dcApi.getById(id).then(res => {
                if (res.success) setDc(res.data);
                setLoading(false);
            });
        }
    }, [id]);

    if (loading) return <Box sx={{ p: 5, textAlign: "center" }}><CircularProgress /></Box>;
    if (!dc) return <Typography sx={{ p: 5 }}>DC not found</Typography>;

    const renderTemplate = (copyType) => (
        <Box sx={{
            width: "210mm", height: "148mm", // A5 Landscape or mixed
            p: 4, mb: 4, border: "1px solid #EEE", position: "relative",
            backgroundColor: "#FFF", color: "#000", fontFamily: "serif",
            pageBreakAfter: "always"
        }}>
            {/* Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: "#1C319F" }}>{dc.companyName}</Typography>
                    <Typography sx={{ fontSize: "12px", maxWidth: "300px" }}>{dc.branchName} Branch Office / Mining Site</Typography>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                    <Typography sx={{ fontSize: "14px", fontWeight: 700 }}>DELIVERY CHALLAN</Typography>
                    <Typography sx={{ fontSize: "12px", border: "1px solid #000", px: 1, display: "inline-block", mt: 0.5 }}>
                        {copyType}
                    </Typography>
                </Box>
            </Box>

            <Divider sx={{ mb: 2, borderColor: "#000" }} />

            {/* Info Grid */}
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, mb: 3 }}>
                <Box>
                    <Row label="DC Number" value={dc.dcNumber} bold />
                    <Row label="Date" value={dc.dcDate} />
                    <Row label="Customer" value={dc.customerName} />
                    <Row label="Vehicle No" value={dc.vehicleNo} bold />
                </Box>
                <Box>
                    <Row label="Product" value={dc.productName} />
                    <Row label="Sale Mode" value={dc.saleMode} />
                    <Row label="Driver" value={dc.driverName || "—"} />
                    <Row label="Rate" value={`₹${dc.rate}`} />
                </Box>
            </Box>

            {/* Weights Table */}
            <Box sx={{ mb: 4 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000" }}>
                    <thead>
                        <tr>
                            <th style={thStyle}>TARE WEIGHT</th>
                            <th style={thStyle}>GROSS WEIGHT</th>
                            <th style={thStyle}>NET WEIGHT</th>
                            <th style={thStyle}>AMOUNT</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={tdStyle}>{dc.tareWeight} T</td>
                            <td style={tdStyle}>{dc.grossWeight || "—"} T</td>
                            <td style={tdStyle}>{dc.netWeight || "—"} T</td>
                            <td style={tdStyle}>₹{Number(dc.amount || 0).toLocaleString("en-IN")}</td>
                        </tr>
                    </tbody>
                </table>
            </Box>

            {/* Footer / Signatures */}
            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 6 }}>
                <Box sx={{ textAlign: "center" }}>
                    <Box sx={{ width: "120px", borderBottom: "1px solid #000", mb: 1 }} />
                    <Typography sx={{ fontSize: "11px" }}>Driver Signature</Typography>
                </Box>
                <Box sx={{ textAlign: "center" }}>
                    <Box sx={{ width: "120px", borderBottom: "1px solid #000", mb: 1 }} />
                    <Typography sx={{ fontSize: "11px" }}>Security/In-charge Sign</Typography>
                </Box>
                <Box sx={{ textAlign: "center" }}>
                    <Box sx={{ width: "120px", borderBottom: "1px solid #000", mb: 1, fontWeight: 700 }} />
                    <Typography sx={{ fontSize: "11px" }}>For {dc.companyName}</Typography>
                </Box>
            </Box>

            {/* Static Bottom Text */}
            <Typography sx={{ fontSize: "10px", position: "absolute", bottom: 20, left: 30, fontStyle: "italic" }}>
                * This is a computer generated challan. Computerized weighment is final.
            </Typography>
        </Box>
    );

    return (
        <Box sx={{ backgroundColor: "#555", minHeight: "100vh", py: 4, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <style>
                {`@media print { 
                    body * { visibility: hidden; } 
                    #print-section, #print-section * { visibility: visible; }
                    #print-section { position: absolute; left: 0; top: 0; width: 100%; }
                }`}
            </style>
            <Box id="print-section">
                {renderTemplate("GATE COPY")}
                {renderTemplate("CUSTOMER COPY")}
            </Box>
            <Button 
                variant="contained" 
                onClick={() => window.print()}
                sx={{ position: "fixed", bottom: 40, right: 40, background: "#1C319F" }}
            >
                Start Print
            </Button>
        </Box>
    );
}

function Row({ label, value, bold }) {
    return (
        <Box sx={{ display: "flex", mb: 0.5 }}>
            <Typography sx={{ fontSize: "12px", width: "100px", color: "#666" }}>{label}:</Typography>
            <Typography sx={{ fontSize: "12px", fontWeight: bold ? 800 : 500 }}>{value}</Typography>
        </Box>
    );
}

const thStyle = { border: "1px solid #000", padding: "8px", fontSize: "12px", backgroundColor: "#F9FAFB" };
const tdStyle = { border: "1px solid #000", padding: "10px", fontSize: "14px", fontWeight: 700, textAlign: "center" };
