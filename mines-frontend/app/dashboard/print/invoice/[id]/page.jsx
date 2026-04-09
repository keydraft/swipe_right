"use client";

import React, { useEffect, useState } from "react";
import { Box, Typography, Divider, CircularProgress, Button } from "@mui/material";
import { useParams } from "next/navigation";
import { invoiceApi } from "@/services/api";

export default function InvoicePrintPage() {
    const params = useParams();
    const id = params?.id;
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            invoiceApi.getById(id).then(res => {
                if (res.success) setInvoice(res.data);
                setLoading(false);
            });
        }
    }, [id]);

    if (loading) return <Box sx={{ p: 5, textAlign: "center" }}><CircularProgress /></Box>;
    if (!invoice) return <Typography sx={{ p: 5 }}>Invoice not found</Typography>;

    return (
        <Box sx={{ backgroundColor: "#F3F4F6", minHeight: "100vh", py: 4, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Box sx={{
                width: "210mm", minHeight: "297mm", // A4
                p: "15mm", backgroundColor: "#FFF", boxShadow: "0 0 10px rgba(0,0,0,0.1)",
                fontFamily: "'Segoe UI', Roboto, sans-serif", boxSizing: "border-box"
            }}>
                {/* Header Section */}
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 6 }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 900, color: "#1C319F", mb: 1 }}>{invoice.companyName}</Typography>
                        <Typography sx={{ fontSize: "12px", color: "#666" }}>Branch: {invoice.branchName}</Typography>
                    </Box>
                    <Box sx={{ textAlign: "right" }}>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: "#111827", mb: 1 }}>TAX INVOICE</Typography>
                        <Typography sx={{ fontSize: "14px", fontWeight: 700 }}>Inv #: {invoice.invoiceNumber}</Typography>
                        <Typography sx={{ fontSize: "14px", color: "#666" }}>Date: {invoice.invoiceDate}</Typography>
                    </Box>
                </Box>

                <Divider sx={{ mb: 4 }} />

                {/* Billing Info */}
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 6 }}>
                    <Box>
                        <Typography sx={{ fontSize: "11px", fontWeight: 800, color: "#9CA3AF", mb: 1, textTransform: "uppercase" }}>BILL TO</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>{invoice.customerName}</Typography>
                        <Typography sx={{ fontSize: "13px", color: "#4B5563" }}>Corporate Client Account</Typography>
                    </Box>
                    <Box sx={{ textAlign: "right" }}>
                        <Typography sx={{ fontSize: "11px", fontWeight: 800, color: "#9CA3AF", mb: 1, textTransform: "uppercase" }}>PAYMENT TERMS</Typography>
                        <Typography sx={{ fontSize: "14px", fontWeight: 700, color: "#1C319F" }}>{invoice.paymentTerms}</Typography>
                    </Box>
                </Box>

                {/* Items Table - Simplified Summary for Invoice */}
                <Box sx={{ mb: 8 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ borderBottom: "2px solid #111827" }}>
                                <th style={thStyle}>DESCRIPTION</th>
                                <th style={thStyle}>NET WEIGHT</th>
                                <th style={thStyle}>TOTAL BASIC</th>
                                <th style={thStyle}>TAX AMOUNT</th>
                                <th style={thStyle}>GRAND TOTAL</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={tdStyle}>Aggregation of Delivery Challans for Mining Materials</td>
                                <td style={tdStyle}>Summary T</td>
                                <td style={tdStyle}>₹{Number(invoice.totalAmount).toLocaleString("en-IN")}</td>
                                <td style={tdStyle}>₹{Number(invoice.gstAmount || 0).toLocaleString("en-IN")}</td>
                                <td style={tdStyle}>₹{Number(invoice.grandTotal).toLocaleString("en-IN")}</td>
                            </tr>
                        </tbody>
                    </table>
                </Box>

                {/* Detailed Breakdown Note */}
                <Typography sx={{ fontSize: "12px", color: "#666", mb: 4 }}>
                    Note: Detailed itemized list of delivery challans (DCs) is attached separately with this invoice.
                </Typography>

                {/* Summary Table */}
                <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 12 }}>
                    <Box sx={{ width: "250px" }}>
                        <SummaryRow label="Subtotal" value={`₹ ${Number(invoice.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`} />
                        <SummaryRow label="Tax (GST)" value={`₹ ${Number(invoice.gstAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`} />
                        <Divider sx={{ my: 1 }} />
                        <SummaryRow label="Grand Total" value={`₹ ${Number(invoice.grandTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`} bold />
                    </Box>
                </Box>

                {/* Signatures */}
                <Box sx={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
                    <Box sx={{ textAlign: "center", width: "180px" }}>
                        <Box sx={{ borderBottom: "1px solid #000", mb: 1 }} />
                        <Typography sx={{ fontSize: "12px" }}>Receiver's Signature</Typography>
                    </Box>
                    <Box sx={{ textAlign: "center", width: "180px" }}>
                        <Typography sx={{ fontSize: "12px", mb: 8 }}>For {invoice.companyName}</Typography>
                        <Box sx={{ borderBottom: "1px solid #000", mb: 1 }} />
                        <Typography sx={{ fontSize: "12px", fontWeight: 700 }}>Authorized Signatory</Typography>
                    </Box>
                </Box>
            </Box>

            <Button 
                variant="contained" 
                onClick={() => window.print()}
                sx={{ position: "fixed", bottom: 40, right: 40, background: "#1C319F", px: 4, py: 1.5, borderRadius: "10px", fontWeight: 700 }}
            >
                Print Invoice
            </Button>
        </Box>
    );
}

function SummaryRow({ label, value, bold }) {
    return (
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography sx={{ fontSize: "14px", color: bold ? "#111827" : "#6B7280", fontWeight: bold ? 800 : 500 }}>{label}</Typography>
            <Typography sx={{ fontSize: "14px", color: "#111827", fontWeight: bold ? 900 : 500 }}>{value}</Typography>
        </Box>
    );
}

const thStyle = { textAlign: "left", padding: "12px 8px", fontSize: "11px", fontWeight: 800, color: "#9CA3AF", textTransform: "uppercase" };
const tdStyle = { textAlign: "left", padding: "16px 8px", fontSize: "14px", color: "#111827", fontWeight: 600, borderBottom: "1px solid #F3F4F6" };
