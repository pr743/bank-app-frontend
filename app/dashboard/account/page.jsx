
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Landmark,
    Wallet,
    CircleDollarSign,
    ShieldCheck,
    Trash2,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    Plus,
    CreditCard,
} from "lucide-react";

import API from "@/app/Api/api";

const REQUEST_TIMEOUT = 15000;

const getErrorMessage = (error, fallback) => {
    if (error.code === "ECONNABORTED") {
        return "Request timed out. Please try again.";
    }

    if (!error.response) {
        return "Unable to connect to the banking server.";
    }

    return error.response.data?.message || fallback;
};

const extractAccounts = (result) => {
    if (Array.isArray(result)) return result;

    if (Array.isArray(result?.accounts)) {
        return result.accounts;
    }

    if (Array.isArray(result?.data)) {
        return result.data;
    }

    if (Array.isArray(result?.data?.accounts)) {
        return result.data.accounts;
    }

    if (Array.isArray(result?.data?.data)) {
        return result.data.data;
    }

    if (result?.data && typeof result.data === "object") {
        return [result.data];
    }

    if (result?.account) {
        return [result.account];
    }

    return [];
};

export default function AccountPage() {
    const router = useRouter();

    const [accountType, setAccountType] = useState("savings");
    const [accounts, setAccounts] = useState([]);

    const [pageLoading, setPageLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [creating, setCreating] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("success");
    const [pageError, setPageError] = useState("");

    const showMessage = (text, type = "success") => {
        setMessage(text);
        setMessageType(type);
    };

    const handleAuthError = (status) => {
        if (status === 401 || status === 403) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            router.replace("/login");
            return true;
        }

        return false;
    };

    const getToken = () => {
        const token = localStorage.getItem("token");

        if (!token) {
            router.replace("/login");
            throw new Error("Please log in to continue.");
        }

        return token;
    };


    const fetchAccounts = useCallback(async () => {
        setPageLoading(true);
        setRefreshing(true);
        setPageError("");

        try {
            const token = getToken();

            const response = await API.get("/account/my-account", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
                timeout: REQUEST_TIMEOUT,
            });

            const result = response.data;

            if (result?.success === false) {
                throw new Error(
                    result.message || "Unable to load your accounts."
                );
            }

            const accountList = extractAccounts(result);

            setAccounts(accountList);
        } catch (error) {
            console.error("Fetch accounts error:", error);

            if (handleAuthError(error.response?.status)) {
                return;
            }

            setPageError(
                error.response
                    ? getErrorMessage(error, "Unable to load your accounts.")
                    : error.message || "Unable to load your accounts."
            );
        } finally {
            setPageLoading(false);
            setRefreshing(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchAccounts();
    }, [fetchAccounts]);


    const createAccount = async () => {
        if (creating) return;

        setCreating(true);
        setMessage("");

        try {
            const token = getToken();

            const response = await API.post(
                "/account/create",
                {
                    account_type: accountType,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                    timeout: REQUEST_TIMEOUT,
                }
            );

            const result = response.data;

            if (result?.success === false) {
                throw new Error(
                    result.message || "Unable to create your account."
                );
            }

            showMessage(
                result?.message || "Account created successfully.",
                "success"
            );

            await fetchAccounts();
        } catch (error) {
            console.error("Create account error:", error);

            if (handleAuthError(error.response?.status)) {
                return;
            }

            showMessage(
                getErrorMessage(error, "Unable to create your account."),
                "error"
            );
        } finally {
            setCreating(false);
        }
    };

    // Close account
    const deleteAccount = async (id) => {
        if (id === undefined || id === null) {
            showMessage(
                "Account ID is missing. The account cannot be closed.",
                "error"
            );
            return;
        }

        if (deletingId !== null) return;

        const confirmed = window.confirm(
            "Are you sure you want to close this account? This action may be permanent."
        );

        if (!confirmed) return;

        setDeletingId(id);
        setMessage("");

        try {
            const token = getToken();

            const response = await API.delete(
                `/account/delete/${encodeURIComponent(id)}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                    timeout: REQUEST_TIMEOUT,
                }
            );

            const result = response.data;

            if (result?.success === false) {
                throw new Error(
                    result.message || "Unable to close this account."
                );
            }

            setAccounts((previous) =>
                previous.filter(
                    (account) =>
                        String(account.id ?? account._id) !== String(id)
                )
            );

            showMessage(
                result?.message || "Account closed successfully.",
                "success"
            );
        } catch (error) {
            console.error("Close account error:", error);

            if (handleAuthError(error.response?.status)) {
                return;
            }

            showMessage(
                getErrorMessage(error, "Unable to close this account."),
                "error"
            );
        } finally {
            setDeletingId(null);
        }
    };

    const formatBalance = (balance) => {
        const amount = Number(balance);

        if (
            balance === null ||
            balance === undefined ||
            !Number.isFinite(amount)
        ) {
            return "Unavailable";
        }

        return amount.toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const formatAccountNumber = (number) => {
        if (!number) return "Not available";
        return String(number);
    };

    return (
        <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-5 text-white sm:px-6 sm:py-8 xl:px-8">

            {/* Header */}
            <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="mb-2 flex items-center gap-2 text-sm text-blue-300">
                        <CreditCard size={16} />
                        <span>Banking / Accounts</span>
                    </div>

                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                        Bank Accounts
                    </h1>

                    <p className="mt-2 max-w-xl text-sm leading-6 text-gray-400 sm:text-base">
                        Manage your accounts and view your available balances
                        in one place.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={fetchAccounts}
                    disabled={refreshing}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                    <RefreshCw
                        size={16}
                        className={refreshing ? "animate-spin" : ""}
                    />
                    {refreshing ? "Refreshing..." : "Refresh accounts"}
                </button>
            </header>

            {/* Success and error messages */}
            {message && (
                <div
                    role="status"
                    aria-live="polite"
                    className={`mb-5 flex items-start gap-3 rounded-xl border p-4 text-sm ${messageType === "success"
                            ? "border-green-500/20 bg-green-500/10 text-green-300"
                            : "border-red-500/20 bg-red-500/10 text-red-300"
                        }`}
                >
                    {messageType === "success" ? (
                        <CheckCircle2
                            size={19}
                            className="mt-0.5 shrink-0"
                        />
                    ) : (
                        <AlertCircle
                            size={19}
                            className="mt-0.5 shrink-0"
                        />
                    )}

                    <p className="break-words">{message}</p>
                </div>
            )}

            {/* Create account section */}
            <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0e1524] shadow-xl sm:rounded-3xl">
                <div className="border-b border-white/10 p-5 sm:p-7 lg:p-8">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300 sm:h-12 sm:w-12">
                            <Landmark size={23} />
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold sm:text-xl">
                                Open a new account
                            </h2>
                            <p className="mt-1 text-sm text-gray-400">
                                Choose the account type you need.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-5 sm:p-7 lg:p-8">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">

                        {/* Savings */}
                        <button
                            type="button"
                            aria-pressed={accountType === "savings"}
                            onClick={() => setAccountType("savings")}
                            className={`rounded-2xl border p-5 text-left transition sm:p-6 ${accountType === "savings"
                                    ? "border-blue-400 bg-blue-500/10 ring-1 ring-blue-400/30"
                                    : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                                }`}
                        >
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">
                                    <Wallet size={24} />
                                </div>

                                <span
                                    className={`h-5 w-5 rounded-full border-2 ${accountType === "savings"
                                            ? "border-blue-400 bg-blue-400 ring-4 ring-blue-400/15"
                                            : "border-gray-600"
                                        }`}
                                />
                            </div>

                            <h3 className="text-base font-semibold sm:text-lg">
                                Savings Account
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-gray-400">
                                For personal banking and everyday savings.
                            </p>
                        </button>

                        {/* Current */}
                        <button
                            type="button"
                            aria-pressed={accountType === "current"}
                            onClick={() => setAccountType("current")}
                            className={`rounded-2xl border p-5 text-left transition sm:p-6 ${accountType === "current"
                                    ? "border-emerald-400 bg-emerald-500/10 ring-1 ring-emerald-400/30"
                                    : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                                }`}
                        >
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                                    <CircleDollarSign size={24} />
                                </div>

                                <span
                                    className={`h-5 w-5 rounded-full border-2 ${accountType === "current"
                                            ? "border-emerald-400 bg-emerald-400 ring-4 ring-emerald-400/15"
                                            : "border-gray-600"
                                        }`}
                                />
                            </div>

                            <h3 className="text-base font-semibold sm:text-lg">
                                Current Account
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-gray-400">
                                For eligible business and transaction needs.
                            </p>
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={createAccount}
                        disabled={creating}
                        className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3 font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-6 sm:w-auto sm:min-w-56"
                    >
                        {creating ? (
                            <>
                                <RefreshCw
                                    size={18}
                                    className="animate-spin"
                                />
                                Creating account...
                            </>
                        ) : (
                            <>
                                <Plus size={19} />
                                Create account
                            </>
                        )}
                    </button>
                </div>
            </section>

            {/* Accounts list */}
            <section className="mt-8 sm:mt-10">
                <div className="mb-5 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <ShieldCheck
                                className="text-emerald-400"
                                size={22}
                            />
                            <h2 className="text-xl font-bold sm:text-2xl">
                                My accounts
                            </h2>
                        </div>

                        <p className="mt-2 text-sm text-gray-400">
                            Your account information retrieved from the server.
                        </p>
                    </div>

                    {!pageLoading && !pageError && (
                        <span className="w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-300">
                            {accounts.length}{" "}
                            {accounts.length === 1 ? "account" : "accounts"}
                        </span>
                    )}
                </div>

                {pageLoading ? (
                    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                        {[1, 2].map((item) => (
                            <div
                                key={item}
                                className="animate-pulse rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:rounded-3xl sm:p-7"
                            >
                                <div className="h-4 w-32 rounded bg-white/10" />
                                <div className="mt-3 h-6 w-48 max-w-full rounded bg-white/10" />
                                <div className="mt-9 h-4 w-28 rounded bg-white/10" />
                                <div className="mt-3 h-9 w-40 rounded bg-white/10" />
                                <div className="mt-8 h-px bg-white/10" />
                                <div className="mt-5 h-4 w-36 rounded bg-white/10" />
                            </div>
                        ))}
                    </div>
                ) : pageError ? (
                    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 sm:p-8">
                        <AlertCircle
                            className="mb-3 text-red-300"
                            size={28}
                        />

                        <h3 className="font-semibold text-white">
                            Could not load accounts
                        </h3>

                        <p className="mt-2 break-words text-sm leading-6 text-gray-400">
                            {pageError}
                        </p>

                        <button
                            type="button"
                            onClick={fetchAccounts}
                            className="mt-5 rounded-xl bg-white/10 px-4 py-3 text-sm font-medium transition hover:bg-white/15"
                        >
                            Try again
                        </button>
                    </div>
                ) : accounts.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-5 py-10 text-center sm:rounded-3xl sm:px-8 sm:py-14">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-gray-400">
                            <CreditCard size={27} />
                        </div>

                        <h3 className="mt-4 text-lg font-semibold">
                            No accounts yet
                        </h3>

                        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-400">
                            Create an account above. Once it is saved, its
                            details will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 xl:gap-6">
                        {accounts.map((account, index) => {
                            const id = account.id ?? account._id;

                            const uniqueKey =
                                id ??
                                account.account_number ??
                                `account-${index}`;

                            const status = String(
                                account.status || "unknown"
                            ).toLowerCase();

                            const type = String(
                                account.account_type || "unknown"
                            ).toLowerCase();

                            const isDeleting =
                                id !== undefined &&
                                id !== null &&
                                String(deletingId) === String(id);

                            return (
                                <article
                                    key={uniqueKey}
                                    className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#111b2d] to-[#0d1320] shadow-lg sm:rounded-3xl"
                                >
                                    <div className="p-5 sm:p-6 lg:p-7">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                                    <CreditCard size={16} />
                                                    <span>Account number</span>
                                                </div>

                                                <p className="mt-2 break-all font-mono text-base font-semibold tracking-wide text-white sm:text-lg">
                                                    {formatAccountNumber(
                                                        account.account_number
                                                    )}
                                                </p>
                                            </div>

                                            <span
                                                className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider sm:px-3 sm:text-xs ${status === "active"
                                                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                                                        : status === "frozen"
                                                            ? "border-blue-500/20 bg-blue-500/10 text-blue-300"
                                                            : "border-white/10 bg-white/5 text-gray-300"
                                                    }`}
                                            >
                                                {status}
                                            </span>
                                        </div>

                                        <div className="mt-7 rounded-2xl border border-white/5 bg-black/10 p-4 sm:mt-8 sm:p-5">
                                            <p className="text-sm text-gray-400">
                                                Available balance
                                            </p>

                                            <p className="mt-2 break-words text-2xl font-bold tracking-tight text-emerald-300 sm:text-3xl lg:text-4xl">
                                                {formatBalance(account.balance)}
                                            </p>
                                        </div>

                                        <div className="mt-5 flex flex-col gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-xs text-gray-500">
                                                    Account type
                                                </p>

                                                <p className="mt-1 text-sm font-semibold capitalize text-white">
                                                    {type}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                                <ShieldCheck
                                                    size={17}
                                                    className="shrink-0 text-emerald-400"
                                                />
                                                <span>
                                                    Account status: {status}
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => deleteAccount(id)}
                                            disabled={
                                                isDeleting ||
                                                id === undefined ||
                                                id === null
                                            }
                                            className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm font-medium text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:min-w-40"
                                            title={
                                                id === undefined || id === null
                                                    ? "Account ID unavailable"
                                                    : "Close account"
                                            }
                                        >
                                            {isDeleting ? (
                                                <RefreshCw
                                                    size={16}
                                                    className="animate-spin"
                                                />
                                            ) : (
                                                <Trash2 size={16} />
                                            )}

                                            {isDeleting
                                                ? "Closing account..."
                                                : "Close account"}
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>
        </main>
    );
}
