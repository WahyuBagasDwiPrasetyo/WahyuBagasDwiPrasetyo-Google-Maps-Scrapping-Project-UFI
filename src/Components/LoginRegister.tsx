import React, { useState } from "react";

interface LoginRegisterProps {
  onLogin: (role: string) => void;
}

function LoginRegister({ onLogin }: LoginRegisterProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user"); // Default role is "user"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegistering) {
      console.log("Registering:", { email, password, role });
      try {
        const response = await fetch("http://localhost:5000/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, role }), // Ensure correct data is sent
        });
        console.log("Register response status:", response.status); // Log response status
        if (response.ok) {
          alert("Registration successful! Please log in.");
          setIsRegistering(false); // Redirect to login page
        } else {
          const errorText = await response.text(); // Get error message from backend
          alert(`Registration failed: ${errorText}`);
        }
      } catch (error) {
        console.error("Error during registration:", error);
        alert("An error occurred. Please try again.");
      }
    } else {
      console.log("Logging in:", { email, password });
      try {
        const response = await fetch("http://localhost:5000/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }), // Ensure correct data is sent
        });
        console.log("Login response status:", response.status); // Log response status
        if (response.ok) {
          const data = await response.json();
          console.log("Login successful. User role:", data.role); // Log successful login
          onLogin(data.role); // Pass the role to the parent component
        } else {
          const errorText = await response.text(); // Get error message from backend
          alert(`Login failed: ${errorText}`);
        }
      } catch (error) {
        console.error("Error during login:", error);
        alert("An error occurred. Please try again.");
      }
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-4 text-center">
          {isRegistering ? "Register" : "Login"}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-gray-300 rounded px-4 py-2 w-full"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-gray-300 rounded px-4 py-2 w-full"
              required
            />
          </div>
          {isRegistering && (
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="border border-gray-300 rounded px-4 py-2 w-full"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
          >
            {isRegistering ? "Register" : "Login"}
          </button>
        </form>
        <div className="text-center mt-4">
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-blue-500 hover:underline"
          >
            {isRegistering
              ? "Already have an account? Login"
              : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginRegister;
