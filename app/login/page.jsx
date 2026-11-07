"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RefreshCw, AlertCircle, CheckCircle2, LockKeyhole } from "lucide-react";

import API from "@/app/Api/api";

const REQUEST_TIMEOUT = 15000;

export default function LoginPage() {
    const router = useRouter();

    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("error");

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (loading) return;

        setMessage("");

        const email = form.email.trim();
        const password = form.password;

        if (!email || !password) {
            setMessage("Please enter your email and password.");
            setMessageType("error");
            return;
        }

        setLoading(true);

        try {
            const response = await API.post(
                "/auth/login",
                {
                    email,
                    password,
                },
                {
                    timeout: REQUEST_TIMEOUT,
                    headers: {
                        Accept: "application/json",
                    },
                }
            );

            const result = response.data;

            if (result?.success === false) {
                throw new Error(
                    result.message || "Login failed. Please try again."
                );
            }


            const token =
                result?.token ||
                result?.data?.token ||
                result?.data?.data?.token;

            const user =
                result?.user ||
                result?.data?.user ||
                result?.data?.data?.user;

            if (!token || !user) {
                throw new Error(
                    "Login response is incomplete. Please contact support."
                );
            }


            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));

            setMessage("Login successful. Redirecting...");
            setMessageType("success");

            router.replace("/dashboard");
        } catch (error) {
            console.error("Login error:", error);

            let errorMessage = "Unable to login. Please try again.";

            if (error.code === "ECONNABORTED") {
                errorMessage = "Request timed out. Please try again.";
            } else if (!error.response) {
                errorMessage =
                    "Unable to connect to the server. Please try again.";
            } else {
                errorMessage =
                    error.response.data?.message ||
                    "Invalid email or password.";
            }

            setMessage(errorMessage);
            setMessageType("error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#0b1220] px-4 py-8 text-white">

            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-xl sm:p-8">

                <div className="mb-6 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-400">
                        <LockKeyhole size={28} />
                    </div>

                    <h1 className="text-2xl font-bold">
                        Login to FinBank
                    </h1>

                    <p className="mt-2 text-sm text-gray-400">
                        Secure banking access
                    </p>
                </div>


                <form
                    onSubmit={handleSubmit}
                    className="space-y-4"
                >
                    <div>
                        <label
                            htmlFor="email"
                            className="mb-2 block text-sm font-medium text-gray-300"
                        >
                            Email Address
                        </label>

                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            autoComplete="email"
                            required
                            disabled={loading}
                            className="w-full rounded-lg border border-white/10 bg-white/10 p-3 text-white outline-none transition placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="mb-2 block text-sm font-medium text-gray-300"
                        >
                            Password
                        </label>

                        <input
                            id="password"
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            required
                            disabled={loading}
                            className="w-full rounded-lg border border-white/10 bg-white/10 p-3 text-white outline-none transition placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 p-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? (
                            <>
                                <RefreshCw
                                    size={18}
                                    className="animate-spin"
                                />
                                Logging in...
                            </>
                        ) : (
                            "Login"
                        )}
                    </button>
                </form>


                {message && (
                    <div
                        role="status"
                        aria-live="polite"
                        className={`mt-5 flex items-start gap-2 rounded-lg border p-3 text-sm ${messageType === "success"
                                ? "border-green-500/20 bg-green-500/10 text-green-400"
                                : "border-red-500/20 bg-red-500/10 text-red-400"
                            }`}
                    >
                        {messageType === "success" ? (
                            <CheckCircle2
                                size={18}
                                className="mt-0.5 shrink-0"
                            />
                        ) : (
                            <AlertCircle
                                size={18}
                                className="mt-0.5 shrink-0"
                            />
                        )}

                        <p>{message}</p>
                    </div>
                )}


                <p className="mt-6 text-center text-sm text-gray-400">
                    Don’t have an account?{" "}
                    <Link
                        href="/register"
                        className="font-medium text-blue-400 hover:underline"
                    >
                        Register
                    </Link>
                </p>

                <p className="mt-6 text-center text-xs text-gray-600">
                    FinBank • Secure Digital Banking
                </p>
            </div>
        </div>
    );
}
