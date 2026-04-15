import axios from "axios";
import Cookies from "js-cookie";

const API_BASE_URL = "http://localhost:8080/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: add auth token to headers
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      Cookies.remove("token");
      localStorage.removeItem("user");
      if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (username, password) => {
    const response = await api.post("/auth/login", { username, password });
    return response.data;
  },
  logout: async () => {
    const response = await api.post("/auth/logout");
    return response.data;
  },
  registerAdmin: async (username, password) => {
    const response = await api.post("/auth/register-admin", { username, password });
    return response.data;
  },
  changePassword: async (newPassword) => {
    const response = await api.post("/auth/change-password", { newPassword });
    return response.data;
  }
};

export const productApi = {
  getAll: async (page = 0, size = 10, search = "", companyId = null) => {
    const response = await api.get("/products", {
      params: { page, size, search, companyId }
    });
    return response.data;
  },

  upsert: async (productData, id = null) => {
    const params = id ? { id } : {};
    const response = await api.post("/products/upsert", productData, { params });
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  getByCompany: async (companyId) => {
    const response = await api.get(`/products/company/${companyId}`);
    return response.data;
  }
};

export const employeeApi = {
  getAll: async (page = 0, size = 10, search = "", companyId = null, branchId = null) => {
    const response = await api.get("/employees", {
      params: { page, size, search, companyId, branchId }
    });
    return response.data;
  },

  upsert: async (employeeData, files = {}) => {
    const formData = new FormData();

    // The JSON part
    formData.append("employee", JSON.stringify(employeeData));

    // The file parts
    if (files.passbook) formData.append("passbook", files.passbook);
    if (files.aadhaar) formData.append("aadhaar", files.aadhaar);
    if (files.pan) formData.append("pan", files.pan);
    if (files.drivingLicense) formData.append("drivingLicense", files.drivingLicense);

    const response = await api.post("/employees/upsert", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/employees/${id}`);
    return response.data;
  },

  transfer: async (id, targetBranchId, transferDate) => {
    const response = await api.post(`/employees/${id}/transfer`, null, {
      params: { targetBranchId, transferDate }
    });
    return response.data;
  },

  getHistory: async (id) => {
    const response = await api.get(`/employees/${id}/history`);
    return response.data;
  }
};

export const adminApi = {
  getCompanies: async (page = 0, size = 10, search = "") => {
    const response = await api.get("/admin/companies", {
      params: { page, size, search }
    });
    return response.data;
  },
  upsertCompany: async (companyData) => {
    const response = await api.post("/admin/upsert-company", companyData);
    return response.data;
  },
  deleteCompany: async (id) => {
    const response = await api.delete(`/admin/delete-company/${id}`);
    return response.data;
  },
  getUsers: async () => {
    const response = await api.get("/admin/users");
    return response.data;
  },
  getRoles: async () => {
    const response = await api.get("/admin/roles");
    return response.data;
  },
  getBranches: async (companyId) => {
    const response = await api.get(`/admin/companies/${companyId}/branches`);
    return response.data;
  }
};

export const customerApi = {
  getAll: async (page = 0, size = 10, search = "", companyId = null, branchId = null) => {
    const response = await api.get("/customers", {
      params: { page, size, search, companyId, branchId }
    });
    return response.data;
  },
  upsert: async (customerData, id = null) => {
    const response = await api.post("/customers/upsert", customerData, {
      params: id ? { id } : {}
    });
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  }
};

export const transporterApi = {
  getAll: async (page = 0, size = 10, search = "", companyId = null, branchId = null) => {
    const response = await api.get("/transporters", {
      params: { page, size, search, companyId, branchId }
    });
    return response.data;
  },
  upsert: async (transporterData, id = null) => {
    const response = await api.post("/transporters/upsert", transporterData, {
      params: id ? { id } : {}
    });
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/transporters/${id}`);
    return response.data;
  },
  assign: async (assignmentData) => {
    const response = await api.post("/transporters/assign", assignmentData);
    return response.data;
  },
  removeAssignment: async (assignmentId) => {
    const response = await api.delete(`/transporters/assignments/${assignmentId}`);
    return response.data;
  },
  getAssignments: async (transporterId) => {
    const response = await api.get(`/transporters/${transporterId}/assignments`);
    return response.data;
  },
  getByBranch: async (branchId) => {
    const response = await api.get(`/transporters/branch/${branchId}`);
    return response.data;
  }
};

export const truckApi = {
  getAll: async (page = 0, size = 10, search = "", companyId = null, branchId = null) => {
    const response = await api.get("/trucks", {
      params: { page, size, search, companyId, branchId }
    });
    return response.data;
  },
  upsert: async (truckData, files = {}, id = null) => {
    const formData = new FormData();
    formData.append("truck", JSON.stringify(truckData));

    if (files.rcFront) formData.append("rcFront", files.rcFront);
    if (files.rcBack) formData.append("rcBack", files.rcBack);
    if (files.insurance) formData.append("insurance", files.insurance);
    if (files.permit) formData.append("permit", files.permit);
    if (files.fc) formData.append("fc", files.fc);

    const response = await api.post("/trucks/upsert", formData, {
      params: id ? { id } : {},
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/trucks/${id}`);
    return response.data;
  },
  assign: async (assignmentData) => {
    const response = await api.post("/trucks/assign", assignmentData);
    return response.data;
  },
  removeAssignment: async (assignmentId) => {
    const response = await api.delete(`/trucks/assignments/${assignmentId}`);
    return response.data;
  },
  getByBranch: async (branchId) => {
    const response = await api.get(`/trucks/branch/${branchId}`);
    return response.data;
  }
};

export const dcApi = {
  // Create DC (tare weight entry)
  create: async (dcData) => {
    const response = await api.post("/delivery-challans", dcData);
    return response.data;
  },

  // Complete DC (gross weight + payment)
  complete: async (id, dcData) => {
    const response = await api.put(`/delivery-challans/${id}/complete`, dcData);
    return response.data;
  },

  // Get single DC
  getById: async (id) => {
    const response = await api.get(`/delivery-challans/${id}`);
    return response.data;
  },

  // List DCs (paginated, filtered)
  getAll: async (page = 0, size = 20, companyId = null, branchId = null, status = null, search = "") => {
    const response = await api.get("/delivery-challans", {
      params: { page, size, companyId, branchId, status, search }
    });
    return response.data;
  },

  // Pay Later: search unpaid DCs
  findUnpaidByVehicle: async (vehicleNo) => {
    const response = await api.get(`/delivery-challans/unpaid/vehicle/${encodeURIComponent(vehicleNo)}`);
    return response.data;
  },

  findUnpaidByCustomer: async (customerId) => {
    const response = await api.get(`/delivery-challans/unpaid/customer/${customerId}`);
    return response.data;
  },

  findUnpaidByGuestName: async (name) => {
    const response = await api.get("/delivery-challans/unpaid/guest", { params: { name } });
    return response.data;
  },

  // Settle payment
  settlePayment: async (id, paymentMethod, amount) => {
    const response = await api.put(`/delivery-challans/${id}/settle`, { paymentMethod, amount });
    return response.data;
  },

  // Outstanding check
  checkOutstanding: async (vehicleNo) => {
    const response = await api.get(`/delivery-challans/outstanding/${encodeURIComponent(vehicleNo)}`);
    return response.data;
  }
};

export const invoiceApi = {
  compile: async (invoiceData) => {
    const response = await api.post("/invoices/compile", invoiceData);
    return response.data;
  },
  getAll: async () => {
    const response = await api.get("/invoices");
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  }
};

export default api;
