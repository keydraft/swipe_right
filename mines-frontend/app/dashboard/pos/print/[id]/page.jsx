"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, Button, CircularProgress } from "@mui/material";
import { ArrowBack as BackIcon, Print as PrintIcon } from "@mui/icons-material";
import { dcApi } from "@/services/api";
import DcPrintTemplate from "@/components/DcPrintTemplate";

export default function PosPrintPage() {
    const params = useParams();
    const router = useRouter();
    const dcId = params?.id;
    const [dc, setDc] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!dcId) return;
        dcApi.getById(dcId).then(res => {
            if (res.success) setDc(res.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [dcId]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) return (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
            <CircularProgress />
        </Box>
    );

    return (
        <Box sx={{ backgroundColor: "#F3F4F6", minHeight: "100vh", p: 4, display: "flex", flexDirection: "column", alignItems: "center" }}>
            {/* Control Bar (hidden during print) */}
            <Box sx={{ 
                width: "100%", maxWidth: "210mm", mb: 3, display: "flex", justifyContent: "space-between",
                "@media print": { display: "none" }
            }}>
                <Button 
                    startIcon={<BackIcon />} 
                    onClick={() => router.back()}
                    sx={{ textTransform: "none", color: "#4B5563" }}
                >
                    Back to POS
                </Button>
                <Button 
                    variant="contained" startIcon={<PrintIcon />} 
                    onClick={handlePrint}
                    sx={{ backgroundColor: "#1C319F", fontWeight: 700 }}
                >
                    Print DC
                </Button>
            </Box>

            {/* Template Container */}
            <Box sx={{ 
                backgroundColor: "#fff", boxShadow: "0 10px 40px rgba(0,0,0,0.1)", p: 0,
                "@media print": { boxShadow: "none", p: 0 }
            }}>
                <DcPrintTemplate dc={dc} />
            </Box>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    body { background: #fff !important; }
                    .MuiBox-root { box-shadow: none !important; margin: 0 !important; width: 100% !important; }
                    @page { margin: 10mm; }
                }
            `}</style>
        </Box>
    );
}
