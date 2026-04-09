import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Since the user didn't request authentication integration yet, 
// and the backend might have Spring Security enabled, 
// we'll need to handle tokens if they exist. 
// For now, I'll provide basic service methods.

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
  getAll: async (page = 0, size = 10, search = "") => {
    const response = await api.get("/products", {
      params: { page, size, search }
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
  getAll: async (page = 0, size = 10, search = "") => {
    const response = await api.get("/employees", {
      params: { page, size, search }
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
  }
};

export const customerApi = {
  getAll: async (page = 0, size = 10, search = "") => {
    const response = await api.get("/customers", {
      params: { page, size, search }
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
  getAll: async (page = 0, size = 10, search = "") => {
    const response = await api.get("/transporters", {
      params: { page, size, search }
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
  }
};

export const truckApi = {
  getAll: async (page = 0, size = 10, search = "") => {
    const response = await api.get("/trucks", {
      params: { page, size, search }
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
  }
};

export default api;
