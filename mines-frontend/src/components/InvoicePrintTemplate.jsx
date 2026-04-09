"use client";

import React from "react";
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Divider, Stack } from "@mui/material";

export default function InvoicePrintTemplate({ invoice, dcs }) {
    if (!invoice) return null;

    return (
        <Box sx={{ p: 4, width: "210mm", minHeight: "297mm", backgroundColor: "#fff", color: "#000", fontFamily: "Inter, sans-serif" }}>
            {/* Header */}
            <Box sx={{ textAlign: "center", mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 900 }}>TAX INVOICE</Typography>
                <Divider sx={{ my: 1, borderBottomWidth: 2, borderColor: "#000" }} />
                <Typography variant="h5" sx={{ fontWeight: 800 }}>{invoice.companyName}</Typography>
                <Typography variant="body2">{invoice.branchName}</Typography>
            </Box>

            <Stack direction="row" justifyContent="space-between" sx={{ mb: 4 }}>
                <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>BILL TO:</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>{invoice.customerName}</Typography>
                    <Typography variant="body2">Corporate Client</Typography>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                    <Typography variant="body2"><b>Invoice No:</b> {invoice.invoiceNumber}</Typography>
                    <Typography variant="body2"><b>Date:</b> {invoice.invoiceDate}</Typography>
                    <Typography variant="body2"><b>Payment Terms:</b> {invoice.paymentTerms}</Typography>
                </Box>
            </Stack>

            <Table size="small" sx={{ border: "1px solid #000", mb: 4 }}>
                <TableHead>
                    <TableRow sx={{ backgroundColor: "#F3F4F6" }}>
                        <TableCell sx={{ border: "1px solid #000", fontWeight: 700 }}>DC Date</TableCell>
                        <TableCell sx={{ border: "1px solid #000", fontWeight: 700 }}>DC Number</TableCell>
                        <TableCell sx={{ border: "1px solid #000", fontWeight: 700 }}>Vehicle No</TableCell>
                        <TableCell sx={{ border: "1px solid #000", fontWeight: 700 }}>Product</TableCell>
                        <TableCell sx={{ border: "1px solid #000", fontWeight: 700 }} align="right">Net Wt</TableCell>
                        <TableCell sx={{ border: "1px solid #000", fontWeight: 700 }} align="right">Rate</TableCell>
                        <TableCell sx={{ border: "1px solid #000", fontWeight: 700 }} align="right">Amount</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {dcs?.map((dc) => (
                        <TableRow key={dc.id}>
                            <TableCell sx={{ border: "1px solid #000" }}>{dc.dcDate}</TableCell>
                            <TableCell sx={{ border: "1px solid #000" }}>{dc.dcNumber}</TableCell>
                            <TableCell sx={{ border: "1px solid #000" }}>{dc.vehicleNo}</TableCell>
                            <TableCell sx={{ border: "1px solid #000" }}>{dc.productName}</TableCell>
                            <TableCell sx={{ border: "1px solid #000" }} align="right">{dc.netWeight?.toFixed(2)}</TableCell>
                            <TableCell sx={{ border: "1px solid #000" }} align="right">{dc.rate?.toLocaleString("en-IN")}</TableCell>
                            <TableCell sx={{ border: "1px solid #000" }} align="right">{dc.amount?.toLocaleString("en-IN")}</TableCell>
                        </TableRow>
                    ))}
                    {/* Totals Row */}
                    <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
                        <TableCell colSpan={4} sx={{ border: "1px solid #000", fontWeight: 800 }} align="right">SUBTOTAL</TableCell>
                        <TableCell sx={{ border: "1px solid #000", fontWeight: 800 }} align="right">
                           —
                        </TableCell>
                        <TableCell sx={{ border: "1px solid #000" }} />
                        <TableCell sx={{ border: "1px solid #000", fontWeight: 800 }} align="right">
                            ₹{invoice.totalAmount?.toLocaleString("en-IN")}
                        </TableCell>
                    </TableRow>
                    {invoice.gstAmount > 0 && (
                        <TableRow>
                            <TableCell colSpan={6} sx={{ border: "1px solid #000", fontWeight: 700 }} align="right">GST TOTAL</TableCell>
                            <TableCell sx={{ border: "1px solid #000", fontWeight: 700 }} align="right">₹{invoice.gstAmount?.toLocaleString("en-IN")}</TableCell>
                        </TableRow>
                    )}
                    <TableRow sx={{ backgroundColor: "#EEF2FF" }}>
                        <TableCell colSpan={6} sx={{ border: "1px solid #000", fontWeight: 900, fontSize: "1.1rem" }} align="right">GRAND TOTAL</TableCell>
                        <TableCell sx={{ border: "1px solid #000", fontWeight: 900, fontSize: "1.1rem" }} align="right">₹{invoice.grandTotal?.toLocaleString("en-IN")}</TableCell>
                    </TableRow>
                </TableBody>
            </Table>

            <Box sx={{ mb: 6 }}>
                <Typography variant="body2"><b>Total Amount in words:</b> Rupees {invoice.grandTotal?.toLocaleString("en-IN")} Only</Typography>
                <Typography variant="body2" sx={{ mt: 2 }}><b>Bank Details:</b> Standard Bank, Ac: 12345678, IFSC: STB000123</Typography>
            </Box>

            <Stack direction="row" justifyContent="space-between" sx={{ mt: 10 }}>
                <Box sx={{ borderTop: "1px solid #000", pt: 1, width: "200px", textAlign: "center" }}>
                    <Typography variant="caption">Receiver's Signature</Typography>
                </Box>
                <Box sx={{ borderTop: "1px solid #000", pt: 1, width: "200px", textAlign: "center" }}>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>For {invoice.companyName}</Typography>
                    <Typography variant="caption" sx={{ display: "block", mt: 4 }}>Authorized Signatory</Typography>
                </Box>
            </Stack>
        </Box>
    );
}
