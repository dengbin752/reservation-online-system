import axios from "axios";

const API_URL = process.env.API_URL || "http://localhost:3000";

async function createAdminUser() {
  try {
    // Register admin user
    const response = await axios.post(`${API_URL}/api/auth/register`, {
      email: "admin@hotel.com",
      password: "admin123",
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
    });

    console.log("Admin user created successfully:", response.data);
  } catch (error: any) {
    if (error.response?.data?.message === "User already exists") {
      console.log("Admin user already exists");
    } else {
      console.error("Error creating admin user:", error.response?.data || error.message);
    }
  }
}

createAdminUser();
