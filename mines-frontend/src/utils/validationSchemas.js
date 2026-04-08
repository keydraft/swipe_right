import * as Yup from "yup";

/**
 * Common regex patterns for validation
 */
export const phoneRegex = /^[0-9]{10,12}$/;
export const pincodeRegex = /^[0-9]{6}$/;
export const aadhaarRegex = /^[0-9]{12}$/;
export const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
export const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;

/**
 * Common validation fields to be used in Yup schemas
 */
export const commonValidations = {
    name: Yup.string().required("Name is required"),
    firstName: Yup.string().required("First name is required"),
    lastName: Yup.string().required("Last name is required"),
    
    email: Yup.string().email("Invalid email format"),
    
    phone: Yup.string()
        .matches(phoneRegex, "Phone must be 10-12 digits")
        .required("Phone number is required"),
        
    pincode: Yup.string()
        .matches(pincodeRegex, "Pincode must be 6 digits")
        .required("Pincode is required"),
        
    aadhaarNumber: Yup.string()
        .matches(aadhaarRegex, "Aadhar number must be 12 digits")
        .notRequired(),
        
    panNumber: Yup.string()
        .matches(panRegex, "Invalid PAN format (e.g., ABCDE1234F)")
        .notRequired(),
        
    gstin: Yup.string()
        .matches(gstinRegex, "Invalid GSTIN format")
        .required("GSTIN is required"),
        
    ifscCode: Yup.string()
        .matches(ifscRegex, "Invalid IFSC format")
        .notRequired(),
        
    bankAccountNumber: Yup.string()
        .matches(/^[0-9]{9,18}$/, "Account number must be 9-18 digits")
        .notRequired(),
        
    addressLine1: Yup.string().max(50, "Address cannot exceed 50 characters").required("Address is required"),
    district: Yup.string().required("District is required"),
    state: Yup.string().required("State is required"),
    
    username: Yup.string().required("Username is required"),
    password: Yup.string()
        .min(6, "Password must be at least 6 characters")
        .required("Password is required"),
        
    date: Yup.string().required("Date is required"),
};
