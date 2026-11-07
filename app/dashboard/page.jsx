"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    Send,
    Download,
    Activity,
    RefreshCw,
    ArrowUpRight,
    ArrowDownLeft,
    LogOut,
    AlertCircle,
    CreditCard,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

const REQUEST_TIMEOUT = 15000;

function getApiData(result) {
    const candidates = [
        result,
        result?.data,
        result?.data?.data,
    ].filter(Boolean);

    let accounts = [];
    let transactions = [];
    let balance;

    for (const item of candidates) {
        if (!accounts.length) {
            if (Array.isArray(item.accounts)) {
                accounts = item.accounts;
            } else if (Array.isArray(item.data)) {
                accounts = item.data;
            }
        }

        if (!transactions.length && Array.isArray(item.transactions)) {
            transactions = item.transactions;
        }

        if (balance === undefined && item.balance != null) {
            balance = Number(item.balance);
        }
    }

    return { accounts, transactions, balance };
}

export default function Dashboard() {
    const router = useRouter();

    const [user, setUser] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const fetchDashboard = useCallback(async () => {
        const token = localStorage.getItem("token");

        if (!token) {
            setLoading(false);
            router.replace("/login");
            return;
        }

        if (!API_URL) {
            setError("API URL is not configured for production.");
            setLoading(false);
            setRefreshing(false);
            return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(
            () => controller.abort(),
            REQUEST_TIMEOUT
        );

        setError("");
        setRefreshing(true);

        try {
            const response = await fetch(
                `${API_URL}/account/my-account`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                    cache: "no-store",
                    signal: controller.signal,
                }
            );

            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                router.replace("/login");
                return;
            }

            const contentType = response.headers.get("content-type") || "";

            if (!contentType.includes("application/json")) {
                throw new Error(
                    `Server returned an invalid response (HTTP ${response.status}).`
                );
            }

            let result;

            try {
                result = await response.json();
            } catch {
                throw new Error("The server returned invalid JSON.");
            }

            if (!response.ok || result?.success === false) {
                throw new Error(
                    result?.message || "Unable to load dashboard information."
                );
            }

            const data = getApiData(result);

            setAccounts(data.accounts);
            setTransactions(data.transactions);

            const totalBalance =
                data.balance !== undefined && Number.isFinite(data.balance)
                    ? data.balance
                    : data.accounts.reduce(
                        (total, account) =>
                            total + (Number(account.balance) || 0),
                        0
                    );

            setBalance(totalBalance);
        } catch (err) {
            console.error("Dashboard fetch error:", err);

            if (err.name === "AbortError") {
                setError("Request timed out. Please try again.");
            } else {
                setError(
                    err.message || "Unable to connect to the banking server."
                );
            }
        } finally {
            clearTimeout(timeoutId);
            setLoading(false);
            setRefreshing(false);
        }
    }, [router]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const savedUser = localStorage.getItem("user");

        if (!token) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setLoading(false);
            router.replace("/login");
            return;
        }

        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch {
                console.error("Invalid user data in localStorage.");
                localStorage.removeItem("user");
            }
        }

        fetchDashboard();
    }, [fetchDashboard, router]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.replace("/login");
    };

    const formatCurrency = (amount) => {
        const value = Number(amount);

        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(Number.isFinite(value) ? value : 0);
    };

    const getTransactionDirection = (transaction) => {
        const type = String(
            transaction.type || transaction.transaction_type || ""
        ).toLowerCase();

        if (
            ["credit", "deposit", "received", "money received"].includes(type)
        ) {
            return "credit";
        }

        if (
            ["debit", "withdraw", "withdrawal", "sent", "money sent"].includes(type)
        ) {
            return "debit";
        }

        return type === "transfer" ? "transfer" : "other";
    };

    const income = transactions.reduce((total, transaction) => {
        return getTransactionDirection(transaction) === "credit"
            ? total + (Number(transaction.amount) || 0)
            : total;
    }, 0);

    const expenses = transactions.reduce((total, transaction) => {
        return getTransactionDirection(transaction) === "debit"
            ? total + (Number(transaction.amount) || 0)
            : total;
    }, 0);

    const getTransactionTitle = (transaction) => {
        if (transaction.description) return transaction.description;

        const direction = getTransactionDirection(transaction);

        if (direction === "credit") return "Money received";
        if (direction === "debit") return "Money sent";
        if (direction === "transfer") return "Transfer";

        return transaction.transaction_type || "Transaction";
    };

    const getTransactionDate = (date) => {
        if (!date) return "Date unavailable";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "Date unavailable";
        }

        return parsedDate.toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
                <div className="text-center">
                    <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-400" />
                    <p className="text-slate-300">
                        Loading your banking dashboard...
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-950 text-white">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

                <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="mb-2 flex items-center gap-2">
                            <div className="rounded-xl bg-blue-500/15 p-2">
                                <Wallet className="h-6 w-6 text-blue-400" />
                            </div>
                            <span className="text-xl font-bold tracking-wide">
                                FinBank
                            </span>
                        </div>

                        <h1 className="text-2xl font-bold sm:text-3xl">
                            Welcome, {user?.full_name || user?.name || "User"}
                        </h1>

                        <p className="mt-1 text-sm text-slate-400">
                            Your secure banking dashboard
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={fetchDashboard}
                            disabled={refreshing}
                            className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                            />
                            {refreshing ? "Refreshing..." : "Refresh"}
                        </button>

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-400 transition hover:bg-red-500/20"
                        >
                            <LogOut className="h-4 w-4" />
                            Logout
                        </button>
                    </div>
                </header>

                {error && (
                    <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

                        <div>
                            <p className="font-semibold">
                                Dashboard could not load
                            </p>
                            <p className="mt-1 text-sm">{error}</p>

                            <button
                                onClick={fetchDashboard}
                                disabled={refreshing}
                                className="mt-3 text-sm font-semibold underline disabled:opacity-50"
                            >
                                Try again
                            </button>
                        </div>
                    </div>
                )}

                <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-2xl border border-blue-400/20 bg-gradient-to-br from-blue-600 to-blue-800 p-6 shadow-lg shadow-blue-950/30">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-blue-100">
                                Total Balance
                            </p>
                            <Wallet className="h-6 w-6 text-blue-100" />
                        </div>

                        <p className="mt-5 text-3xl font-bold">
                            {formatCurrency(balance)}
                        </p>

                        <p className="mt-2 text-sm text-blue-100/80">
                            Across your bank accounts
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-400">
                                Income in Recent Transactions
                            </p>
                            <TrendingUp className="h-6 w-6 text-emerald-400" />
                        </div>

                        <p className="mt-5 text-3xl font-bold text-emerald-400">
                            {formatCurrency(income)}
                        </p>

                        <p className="mt-2 text-sm text-slate-500">
                            Based on transactions returned by the API
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-400">
                                Expenses in Recent Transactions
                            </p>
                            <TrendingDown className="h-6 w-6 text-red-400" />
                        </div>

                        <p className="mt-5 text-3xl font-bold text-red-400">
                            {formatCurrency(expenses)}
                        </p>

                        <p className="mt-2 text-sm text-slate-500">
                            Based on transactions returned by the API
                        </p>
                    </div>
                </section>

                <section className="mt-8">
                    <h2 className="mb-4 text-lg font-semibold">
                        Quick Actions
                    </h2>

                    <div className="grid gap-4 sm:grid-cols-3">
                        <button
                            onClick={() => router.push("/dashboard/transfer")}
                            className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 text-left transition hover:border-blue-500/50 hover:bg-slate-800"
                        >
                            <span className="rounded-xl bg-blue-500/15 p-3 text-blue-400">
                                <Send className="h-5 w-5" />
                            </span>
                            <span>
                                <span className="block font-semibold">
                                    Transfer Money
                                </span>
                                <span className="mt-1 block text-sm text-slate-400">
                                    Send money to a beneficiary
                                </span>
                            </span>
                        </button>

                        <button
                            onClick={() => router.push("/dashboard/deposit")}
                            className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 text-left transition hover:border-emerald-500/50 hover:bg-slate-800"
                        >
                            <span className="rounded-xl bg-emerald-500/15 p-3 text-emerald-400">
                                <Download className="h-5 w-5" />
                            </span>
                            <span>
                                <span className="block font-semibold">
                                    Deposit Money
                                </span>
                                <span className="mt-1 block text-sm text-slate-400">
                                    Add funds to your account
                                </span>
                            </span>
                        </button>

                        <button
                            onClick={() => router.push("/dashboard/statement")}
                            className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 text-left transition hover:border-purple-500/50 hover:bg-slate-800"
                        >
                            <span className="rounded-xl bg-purple-500/15 p-3 text-purple-400">
                                <Activity className="h-5 w-5" />
                            </span>
                            <span>
                                <span className="block font-semibold">
                                    Statement
                                </span>
                                <span className="mt-1 block text-sm text-slate-400">
                                    View your transaction history
                                </span>
                            </span>
                        </button>
                    </div>
                </section>

                <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <div className="mb-5 flex items-center justify-between">
                        <h2 className="text-lg font-semibold">My Accounts</h2>
                        <CreditCard className="h-5 w-5 text-blue-400" />
                    </div>

                    {accounts.length === 0 ? (
                        <div className="py-8 text-center">
                            <Wallet className="mx-auto mb-3 h-9 w-9 text-slate-600" />
                            <p className="text-slate-300">
                                No bank accounts found.
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                                Create an account to start using banking features.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {accounts.map((account, index) => (
                                <div
                                    key={
                                        account.id ??
                                        account.account_id ??
                                        account.account_number ??
                                        index
                                    }
                                    className="rounded-xl border border-slate-800 bg-slate-950 p-5"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="font-medium capitalize">
                                            {account.account_type || "Bank"} Account
                                        </p>

                                        <span
                                            className={`rounded-full px-3 py-1 text-xs capitalize ${String(account.status).toLowerCase() === "active"
                                                ? "bg-emerald-500/10 text-emerald-400"
                                                : "bg-amber-500/10 text-amber-400"
                                                }`}
                                        >
                                            {account.status || "Unknown"}
                                        </span>
                                    </div>

                                    <p className="mt-3 text-sm text-slate-400">
                                        Account Number
                                    </p>

                                    <p className="mt-1 font-mono tracking-wider">
                                        {account.account_number || "Not available"}
                                    </p>

                                    <p className="mt-4 text-2xl font-bold">
                                        {formatCurrency(account.balance)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">
                                Recent Transactions
                            </h2>
                            <p className="mt-1 text-sm text-slate-400">
                                Latest transactions returned by your backend
                            </p>
                        </div>

                        <Activity className="h-5 w-5 text-blue-400" />
                    </div>

                    {transactions.length === 0 ? (
                        <div className="py-10 text-center">
                            <Activity className="mx-auto mb-3 h-9 w-9 text-slate-600" />
                            <p className="text-slate-300">
                                No transactions found.
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                                Transactions will appear here when available in your account.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-800">
                            {transactions.map((transaction, index) => {
                                const direction =
                                    getTransactionDirection(transaction);

                                const isCredit = direction === "credit";
                                const isDebit = direction === "debit";

                                return (
                                    <div
                                        key={transaction.id ?? transaction.transaction_id ?? index}
                                        className="flex flex-wrap items-center justify-between gap-4 py-4"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span
                                                className={`rounded-xl p-3 ${isCredit
                                                    ? "bg-emerald-500/10 text-emerald-400"
                                                    : isDebit
                                                        ? "bg-red-500/10 text-red-400"
                                                        : "bg-slate-800 text-slate-300"
                                                    }`}
                                            >
                                                {isCredit ? (
                                                    <ArrowDownLeft className="h-5 w-5" />
                                                ) : (
                                                    <ArrowUpRight className="h-5 w-5" />
                                                )}
                                            </span>

                                            <div>
                                                <p className="font-medium">
                                                    {getTransactionTitle(transaction)}
                                                </p>

                                                <p className="mt-1 text-sm text-slate-400">
                                                    {getTransactionDate(
                                                        transaction.created_at ||
                                                        transaction.date ||
                                                        transaction.transaction_date
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        <p
                                            className={`font-semibold ${isCredit
                                                ? "text-emerald-400"
                                                : isDebit
                                                    ? "text-red-400"
                                                    : "text-white"
                                                }`}
                                        >
                                            {isCredit ? "+" : isDebit ? "-" : ""}
                                            {formatCurrency(transaction.amount)}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                <footer className="py-8 text-center text-xs text-slate-600">
                    FinBank • Secure Digital Banking
                </footer>
            </div>
        </main>
    );
}
