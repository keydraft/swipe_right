"use client";

import React, { useState } from "react";
import {
    Box,
    TextField,
    Button,
    Typography,
    InputAdornment,
    IconButton,
    CircularProgress,
    Card,
    Alert,
} from "@mui/material";
import {
    Visibility,
    VisibilityOff,
    CheckCircleOutline,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { palette } from "@/theme";
import { authApi } from "@/services/api";
import { useFormik } from "formik";
import * as Yup from "yup";

export default function ResetPasswordPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: "", message: "" });

    const validationSchema = Yup.object({
        newPassword: Yup.string()
            .min(6, "Password must be at least 6 characters")
            .required("New password is required"),
        confirmPassword: Yup.string()
            .oneOf([Yup.ref("newPassword"), null], "Passwords must match")
            .required("Confirm password is required"),
    });

    const formik = useFormik({
        initialValues: {
            newPassword: "",
            confirmPassword: "",
        },
        validationSchema,
        onSubmit: async (values) => {
            setLoading(true);
            setStatus({ type: "", message: "" });

            try {
                const response = await authApi.changePassword(values.newPassword);
                if (response.success) {
                    setStatus({ type: "success", message: "Password updated successfully! Redirecting..." });
                    
                    // Update stored user data to reflect that reset is no longer required
                    const storedUser = localStorage.getItem("user");
                    if (storedUser) {
                        const user = JSON.parse(storedUser);
                        user.resetRequired = false;
                        localStorage.setItem("user", JSON.stringify(user));
                    }

                    setTimeout(() => {
                        router.push("/dashboard");
                    }, 2000);
                } else {
                    setStatus({ type: "error", message: response.message || "Update failed" });
                }
            } catch (error) {
                console.error("Password reset error:", error);
                setStatus({
                    type: "error",
                    message: error.response?.data?.message || "An error occurred. Please try again."
                });
            } finally {
                setLoading(false);
            }
        },
    });

    return (
        <Box
            sx={{
                display: "flex",
                minHeight: "100vh",
                width: "100%",
                alignItems: "center",
                justifyContent: "center",
                background: palette.background.dark,
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Background elements (same as login) */}
            <Box
                sx={{
                    position: "absolute",
                    width: 500,
                    height: 500,
                    borderRadius: "50%",
                    background: "rgba(21, 101, 192, 0.06)",
                    filter: "blur(120px)",
                    top: -150,
                    right: -100,
                    pointerEvents: "none",
                }}
            />
            
            <Card
                sx={{
                    position: "relative",
                    zIndex: 1,
                    width: { xs: "90%", sm: "450px" },
                    borderRadius: "16px",
                    background: palette.background.darkCard,
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: "0 12px 60px rgba(0,0,0,0.4)",
                    p: 5,
                }}
            >
                <Typography
                    variant="h4"
                    sx={{
                        color: palette.text.white,
                        mb: 2,
                        fontWeight: 700,
                    }}
                >
                    Reset Password
                </Typography>
                
                <Typography sx={{ color: palette.text.muted, mb: 4, fontSize: '0.9rem' }}>
                    Welcome! For your security, please set a new password for your account before proceeding.
                </Typography>
                
                {status.message && (
                    <Alert 
                        severity={status.type} 
                        sx={{ 
                            mb: 3, 
                            borderRadius: '8px',
                            backgroundColor: status.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: status.type === 'success' ? '#10B981' : '#EF4444',
                        }}
                    >
                        {status.message}
                    </Alert>
                )}

                <Box component="form" onSubmit={formik.handleSubmit}>
                    {/* New Password */}
                    <TextField
                        id="newPassword"
                        name="newPassword"
                        fullWidth
                        type={showPassword ? "text" : "password"}
                        placeholder="New Password"
                        value={formik.values.newPassword}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.newPassword && !!formik.errors.newPassword}
                        helperText={formik.touched.newPassword && formik.errors.newPassword}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowPassword((s) => !s)}
                                        edge="end"
                                        sx={{ color: palette.text.muted }}
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            mb: 3,
                            "& .MuiOutlinedInput-root": {
                                bgcolor: "transparent",
                                borderRadius: "8px",
                                color: palette.text.white,
                                "& fieldset": { borderColor: "rgba(255,255,255,0.25)" },
                                "&:hover fieldset": { borderColor: "rgba(255,255,255,0.45)" },
                                "&.Mui-focused fieldset": { borderColor: palette.secondary.main },
                            },
                        }}
                    />

                    {/* Confirm Password */}
                    <TextField
                        id="confirmPassword"
                        name="confirmPassword"
                        fullWidth
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm Password"
                        value={formik.values.confirmPassword}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.confirmPassword && !!formik.errors.confirmPassword}
                        helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowConfirmPassword((s) => !s)}
                                        edge="end"
                                        sx={{ color: palette.text.muted }}
                                    >
                                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            mb: 4,
                            "& .MuiOutlinedInput-root": {
                                bgcolor: "transparent",
                                borderRadius: "8px",
                                color: palette.text.white,
                                "& fieldset": { borderColor: "rgba(255,255,255,0.25)" },
                                "&:hover fieldset": { borderColor: "rgba(255,255,255,0.45)" },
                                "&.Mui-focused fieldset": { borderColor: palette.secondary.main },
                            },
                        }}
                    />

                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <CheckCircleOutline />}
                        sx={{
                            py: 1.5,
                            borderRadius: "8px",
                            background: palette.gradient.primary,
                            fontWeight: 700,
                            letterSpacing: "0.05em",
                            "&:hover": { background: palette.gradient.accent },
                        }}
                    >
                        {loading ? "UPDATING..." : "RESET PASSWORD"}
                    </Button>
                </Box>
            </Card>
        </Box>
    );
}
