"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import API from "@/app/Api/api";

export default function RegisterPage() {
    const router = useRouter();

    const [form, setForm] = useState({
        full_name: "",
        email: "",
        password: "",
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (loading) return;

        const fullName = form.full_name.trim();
        const email = form.email.trim().toLowerCase();
        const password = form.password;

        if (!fullName || !email || !password) {
            setMessageType("error");
            setMessage("Please fill in all fields.");
            return;
        }

        if (fullName.length < 2) {
            setMessageType("error");
            setMessage("Full name must contain at least 2 characters.");
            return;
        }

        if (password.length < 8) {
            setMessageType("error");
            setMessage("Password must be at least 8 characters.");
            return;
        }

        setLoading(true);
        setMessage("");
        setMessageType("");

        try {
            const response = await API.post(
                "/auth/register",
                {
                    full_name: fullName,
                    email,
                    password,
                },
                {
                    timeout: 15000,
                    headers: {
                        Accept: "application/json",
                    },
                }
            );

            const data = response.data;

            if (data?.success === false) {
                throw new Error(data.message || "Registration failed.");
            }

            setMessageType("success");
            setMessage(
                data?.message || "Account created successfully! Redirecting..."
            );

            setForm({
                full_name: "",
                email: "",
                password: "",
            });

            setTimeout(() => {
                router.replace("/login");
            }, 1200);

        } catch (error) {
            let errorMessage = "Unable to create your account.";

            if (error.code === "ECONNABORTED") {
                errorMessage = "Request timed out. Please try again.";
            } else if (error.response) {
                errorMessage =
                    error.response.data?.message ||
                    "Registration failed. Please check your details.";
            } else if (error.request) {
                errorMessage =
                    "Cannot connect to the server. Please check your connection.";
            } else if (error.message) {
                errorMessage = error.message;
            }

            setMessageType("error");
            setMessage(errorMessage);

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0b1220] px-4">

            <div className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-xl">

                <h1 className="text-2xl font-bold text-white text-center">
                    Create FinBank Account
                </h1>

                <p className="text-gray-400 text-center text-sm mt-1">
                    Secure digital banking registration
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">

                    <input
                        type="text"
                        name="full_name"
                        value={form.full_name}
                        onChange={handleChange}
                        placeholder="Full Name"
                        autoComplete="name"
                        maxLength={100}
                        required
                        disabled={loading}
                        className="w-full p-3 rounded-lg bg-white/10 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                    />

                    <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="Email Address"
                        autoComplete="email"
                        required
                        disabled={loading}
                        className="w-full p-3 rounded-lg bg-white/10 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                    />

                    <input
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="Password (minimum 8 characters)"
                        autoComplete="new-password"
                        minLength={8}
                        required
                        disabled={loading}
                        className="w-full p-3 rounded-lg bg-white/10 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 transition p-3 rounded-lg font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? "Creating Account..." : "Register"}
                    </button>

                </form>

                {message && (
                    <p
                        role="alert"
                        className={`text-center text-sm mt-4 ${messageType === "success"
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                    >
                        {message}
                    </p>
                )}

                <p className="text-center text-gray-400 text-sm mt-6">
                    Already have an account?{" "}
                    <Link
                        href="/login"
                        className="text-blue-400 hover:underline"
                    >
                        Login
                    </Link>
                </p>

            </div>
        </div>
    );
}
