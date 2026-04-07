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
} from "@mui/material";
import {
    Visibility,
    VisibilityOff,
    ArrowForward,
} from "@mui/icons-material";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { palette } from "@/theme";

export default function LoginForm() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const validate = () => {
        const newErrors = {};
        if (!username.trim()) newErrors.username = "Username is required";
        if (!password.trim()) newErrors.password = "Password is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setLoading(false);
        router.push("/dashboard");
    };

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
            {/* ── Background decorative elements ─────────── */}
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
            <Box
                sx={{
                    position: "absolute",
                    width: 400,
                    height: 400,
                    borderRadius: "50%",
                    background: "rgba(0, 188, 212, 0.05)",
                    filter: "blur(100px)",
                    bottom: -120,
                    left: -80,
                    pointerEvents: "none",
                }}
            />
            <Box
                sx={{
                    position: "absolute",
                    width: "120%",
                    height: 2,
                    background:
                        "linear-gradient(90deg, transparent 0%, rgba(21,101,192,0.15) 40%, rgba(0,188,212,0.1) 70%, transparent 100%)",
                    bottom: "20%",
                    left: "-10%",
                    transform: "rotate(-8deg)",
                    pointerEvents: "none",
                }}
            />

            {/* ── Main Login Card ────────────────────────── */}
            <Box
                sx={{
                    position: "relative",
                    zIndex: 1,
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    width: { xs: "92%", sm: "85%", md: "780px", lg: "860px" },
                    minHeight: { xs: "auto", md: "440px" },
                    borderRadius: "16px",
                    overflow: "hidden",
                    boxShadow: "0 12px 60px rgba(0,0,0,0.4)",
                    animation: "cardFadeIn 0.7s ease-out",
                    "@keyframes cardFadeIn": {
                        from: { opacity: 0, transform: "translateY(30px)" },
                        to: { opacity: 1, transform: "translateY(0)" },
                    },
                }}
            >
                {/* ── Left Panel: Logo (White Background) ──── */}
                <Box
                    sx={{
                        flex: { xs: "none", md: "0 0 45%" },
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#FFFFFF",
                        py: { xs: 5, md: 0 },
                        px: 4,
                    }}
                >
                    <Box
                        sx={{
                            animation: "logoFadeIn 0.9s ease-out 0.2s both",
                            "@keyframes logoFadeIn": {
                                from: { opacity: 0, transform: "scale(0.9)" },
                                to: { opacity: 1, transform: "scale(1)" },
                            },
                        }}
                    >
                        <Image
                            src="/swipe_login_logo.svg"
                            alt="Swipe Right Logo"
                            width={220}
                            height={245}
                            priority
                            style={{ objectFit: "contain" }}
                        />
                    </Box>
                </Box>

                {/* ── Right Panel: Login Form (Dark Background) ── */}
                <Box
                    component="form"
                    onSubmit={handleSubmit}
                    sx={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        background: palette.background.darkCard,
                        // border: "1px solid rgba(255,255,255,0.08)",
                        borderLeft: { md: "1px solid rgba(255,255,255,0.08)" },
                        px: { xs: 3, sm: 5 },
                        py: { xs: 4, sm: 5 },
                    }}
                >
                    <Typography
                        variant="h4"
                        sx={{
                            color: palette.text.white,
                            mb: 4,
                            fontWeight: 700,
                            letterSpacing: "-0.01em",
                        }}
                    >
                        Sign In
                    </Typography>

                    {/* Username */}
                    <TextField
                        id="login-username"
                        fullWidth
                        placeholder="Enter User Name*"
                        required
                        autoComplete="off"
                        value={username}
                        onChange={(e) => {
                            setUsername(e.target.value);
                            if (errors.username)
                                setErrors((p) => ({ ...p, username: undefined }));
                        }}
                        error={!!errors.username}
                        helperText={errors.username}
                        sx={{
                            mb: 2.5,
                            "& .MuiOutlinedInput-root": {
                                bgcolor: "transparent",
                                borderRadius: "8px",
                                color: palette.text.white,
                                height: 48,
                                "& fieldset": {
                                    borderColor: "rgba(255,255,255,0.25)",
                                    transition: "border-color 0.3s",
                                },
                                "&:hover fieldset": {
                                    borderColor: "rgba(255,255,255,0.45)",
                                },
                                "&.Mui-focused fieldset": {
                                    borderColor: palette.secondary.main,
                                    borderWidth: 2,
                                },
                            },
                            "& .MuiInputBase-input": {
                                "&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus, &:-webkit-autofill:active": {
                                    transitionDelay: "9999s",
                                    transitionProperty: "background-color, color",
                                },
                            },
                            "& .MuiInputBase-input::placeholder": {
                                color: palette.text.muted,
                                opacity: 1,
                                fontSize: "0.9rem",
                            },
                        }}
                    />

                    {/* Password */}
                    <TextField
                        id="login-password"
                        fullWidth
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter Password *"
                        required
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            if (errors.password)
                                setErrors((p) => ({ ...p, password: undefined }));
                        }}
                        error={!!errors.password}
                        helperText={errors.password}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle password visibility"
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
                            mb: 4,
                            "& .MuiOutlinedInput-root": {
                                bgcolor: "transparent",
                                borderRadius: "8px",
                                color: palette.text.white,
                                height: 48,
                                "& fieldset": {
                                    borderColor: "rgba(255,255,255,0.25)",
                                    transition: "border-color 0.3s",
                                },
                                "&:hover fieldset": {
                                    borderColor: "rgba(255,255,255,0.45)",
                                },
                                "&.Mui-focused fieldset": {
                                    borderColor: palette.secondary.main,
                                    borderWidth: 2,
                                },
                            },
                            "& .MuiInputBase-input": {
                                "&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus, &:-webkit-autofill:active": {
                                    transitionDelay: "9999s",
                                    transitionProperty: "background-color, color",
                                },
                            },
                            "& .MuiInputBase-input::placeholder": {
                                color: palette.text.muted,
                                opacity: 1,
                                fontSize: "0.9rem",
                            },
                        }}
                    />

                    {/* Submit Button */}
                    <Button
                        id="login-submit"
                        type="submit"
                        variant="contained"
                        fullWidth
                        disabled={loading}
                        endIcon={
                            loading ? (
                                <CircularProgress size={18} sx={{ color: "#fff" }} />
                            ) : (
                                <ArrowForward sx={{ fontSize: 18 }} />
                            )
                        }
                        sx={{
                            py: 1.3,
                            fontSize: "0.85rem",
                            fontWeight: 700,
                            letterSpacing: "0.1em",
                            borderRadius: "8px",
                            background: palette.gradient.primary,
                            boxShadow: "0 4px 20px rgba(21,101,192,0.35)",
                            transition: "all 0.3s ease",
                            "&:hover": {
                                background: palette.gradient.accent,
                                boxShadow: "0 6px 28px rgba(21,101,192,0.5)",
                                transform: "translateY(-1px)",
                            },
                            "&:active": {
                                transform: "translateY(0)",
                            },
                        }}
                    >
                        LOGIN
                    </Button>
                </Box>
            </Box>
        </Box>
    );
}
