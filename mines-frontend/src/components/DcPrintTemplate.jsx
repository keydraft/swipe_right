"use client";

import React from "react";
import { Box, Typography, Table, TableBody, TableCell, TableRow, Divider, Stack } from "@mui/material";

export default function DcPrintTemplate({ dc }) {
    if (!dc) return null;

    return (
        <Box sx={{ p: 4, width: "210mm", minHeight: "148mm", backgroundColor: "#fff", color: "#000", fontFamily: "Inter, sans-serif" }}>
            {/* Header */}
            <Box sx={{ textAlign: "center", mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>{dc.companyName}</Typography>
                <Typography variant="body2">{dc.branchName}</Typography>
                <Typography variant="h6" sx={{ mt: 1, textTransform: "uppercase", letterSpacing: "2px", borderBottom: "2px solid #000", display: "inline-block", px: 4 }}>
                    Delivery Challan
                </Typography>
            </Box>

            <Stack direction="row" justifyContent="space-between" sx={{ mb: 3 }}>
                <Box>
                    <Typography variant="body2"><b>Customer:</b> {dc.customerName}</Typography>
                    <Typography variant="body2"><b>Vehicle No:</b> {dc.vehicleNo}</Typography>
                    <Typography variant="body2"><b>Driver:</b> {dc.driverName || "—"}</Typography>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                    <Typography variant="body2"><b>DC Number:</b> {dc.dcNumber}</Typography>
                    <Typography variant="body2"><b>Date:</b> {dc.dcDate}</Typography>
                    <Typography variant="body2"><b>Status:</b> {dc.status}</Typography>
                </Box>
            </Stack>

            <Table size="small" sx={{ border: "1px solid #000", mb: 3 }}>
                <TableBody>
                    <TableRow>
                        <TableCell sx={{ border: "1px solid #000", fontWeight: 700 }}>Product</TableCell>
                        <TableCell sx={{ border: "1px solid #000" }} colSpan={3}>{dc.productName}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ border: "1px solid #000", fontWeight: 700 }}>Gross Weight</TableCell>
                        <TableCell sx={{ border: "1px solid #000" }}>{dc.grossWeight?.toFixed(2)} T</TableCell>
                        <TableCell sx={{ border: "1px solid #000", fontWeight: 700 }}>Tare Weight</TableCell>
                        <TableCell sx={{ border: "1px solid #000" }}>{dc.tareWeight?.toFixed(2)} T</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ border: "1px solid #000", fontWeight: 700 }}>Net Weight</TableCell>
                        <TableCell sx={{ border: "1px solid #000", fontWeight: 900, fontSize: "1.1rem" }} colSpan={3}>
                            {dc.netWeight?.toFixed(2)} T
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>

            {dc.saleMode === "POS" && (
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, borderBottom: "1px solid #ccc", mb: 1 }}>Payment Information</Typography>
                    <Table size="small">
                        <TableBody>
                            <TableRow>
                                <TableCell sx={{ p: 0.5 }}>Rate:</TableCell>
                                <TableCell sx={{ p: 0.5, fontWeight: 700 }}>₹{dc.rate?.toLocaleString("en-IN")}</TableCell>
                                <TableCell sx={{ p: 0.5 }}>Basic Amount:</TableCell>
                                <TableCell sx={{ p: 0.5, fontWeight: 700 }}>₹{dc.amount?.toLocaleString("en-IN")}</TableCell>
                            </TableRow>
                            {dc.gstAmount > 0 && (
                                <TableRow>
                                    <TableCell sx={{ p: 0.5 }}>GST ({dc.gstPercent}%):</TableCell>
                                    <TableCell sx={{ p: 0.5, fontWeight: 700 }}>₹{dc.gstAmount?.toLocaleString("en-IN")}</TableCell>
                                    <TableCell sx={{ p: 0.5 }}>—</TableCell>
                                    <TableCell sx={{ p: 0.5 }}>—</TableCell>
                                </TableRow>
                            )}
                            <TableRow>
                                <TableCell sx={{ p: 0.5 }}>Other Charges:</TableCell>
                                <TableCell sx={{ p: 0.5, fontWeight: 700 }}>₹{((dc.teaCash || 0) + (dc.transportAmount || 0)).toLocaleString("en-IN")}</TableCell>
                                <TableCell sx={{ p: 0.5, fontWeight: 900 }}>Total Payable:</TableCell>
                                <TableCell sx={{ p: 0.5, fontWeight: 900, fontSize: "1.2rem" }}>₹{(dc.amount + (dc.gstAmount || 0) + (dc.teaCash || 0)).toLocaleString("en-IN")}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </Box>
            )}

            <Stack direction="row" justifyContent="space-between" sx={{ mt: 6 }}>
                <Box sx={{ borderTop: "1px solid #000", pt: 1, width: "150px", textAlign: "center" }}>
                    <Typography variant="caption">Customer Signature</Typography>
                </Box>
                <Box sx={{ borderTop: "1px solid #000", pt: 1, width: "150px", textAlign: "center" }}>
                    <Typography variant="caption">Authorized Signatory</Typography>
                </Box>
            </Stack>

            <Typography variant="caption" sx={{ display: "block", textAlign: "center", mt: 4, opacity: 0.5 }}>
                Generated via Mines POS Integration
            </Typography>
        </Box>
    );
}
