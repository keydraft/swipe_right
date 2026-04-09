"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, Button, CircularProgress } from "@mui/material";
import { ArrowBack as BackIcon, Print as PrintIcon } from "@mui/icons-material";
import { invoiceApi, dcApi } from "@/services/api";
import InvoicePrintTemplate from "@/components/InvoicePrintTemplate";

export default function InvoicePrintPage() {
    const params = useParams();
    const router = useRouter();
    const invId = params?.id;
    const [invoice, setInvoice] = useState(null);
    const [dcs, setDcs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!invId) return;
        const load = async () => {
             try {
                const res = await invoiceApi.getById(invId);
                if (res.success) {
                    setInvoice(res.data);
                    // Also need the DCs for this invoice
                    // Assuming dcApi.getAll has a filter for invoiceId or we use a custom method
                    const dcRes = await dcApi.getAll(0, 500, res.data.companyId, res.data.branchId);
                    if (dcRes.success) {
                        const linked = dcRes.data.content.filter(d => d.status === "INVOICED"); 
                        setDcs(linked);
                    }
                }
             } catch (e) { console.error(e); }
             finally { setLoading(false); }
        };
        load();
    }, [invId]);

    const handlePrint = () => { window.print(); };

    if (loading) return (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}><CircularProgress /></Box>
    );

    return (
        <Box sx={{ backgroundColor: "#F3F4F6", minHeight: "100vh", p: 4, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Box sx={{ 
                width: "100%", maxWidth: "210mm", mb: 3, display: "flex", justifyContent: "space-between",
                "@media print": { display: "none" }
            }}>
                <Button startIcon={<BackIcon />} onClick={() => router.back()} sx={{ textTransform: "none", color: "#4B5563" }}>Back</Button>
                <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint} sx={{ backgroundColor: "#1C319F", fontWeight: 700 }}>Print Invoice</Button>
            </Box>

            <Box sx={{ backgroundColor: "#fff", boxShadow: "0 10px 40px rgba(0,0,0,0.1)", "@media print": { boxShadow: "none" } }}>
                <InvoicePrintTemplate invoice={invoice} dcs={dcs} />
            </Box>
        </Box>
    );
}
