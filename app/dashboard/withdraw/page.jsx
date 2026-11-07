"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import API from "@/app/Api/api";
import {
    Loader2,
    History,
    CheckCircle2,
    Banknote,
    AlertTriangle,
    ArrowDownToLine,
    Wallet,
    RefreshCw,
    ShieldCheck,
    X,
    CalendarDays,
    Info,
} from "lucide-react";

const formatINR = (value) =>
    Number(value || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 2,
    });

const formatDate = (value) => {
    if (!value) return "Date unavailable";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Date unavailable";

    return date.toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

function getAccountFromResponse(data) {
    const accounts = data?.accounts ?? data?.data?.accounts;

    if (Array.isArray(accounts)) return accounts[0] ?? null;
    if (accounts && typeof accounts === "object") return accounts;

    const direct = data?.data ?? data;

    if (Array.isArray(direct)) return direct[0] ?? null;

    if (direct?.account_number) return direct;

    return null;
}

function getResponseData(response) {
    return response?.data?.data ?? response?.data;
}

export default function WithdrawPage() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const [account, setAccount] = useState(null);
    const [limit, setLimit] = useState(null);
    const [recent, setRecent] = useState([]);

    const [amount, setAmount] = useState("");
    const [preview, setPreview] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState("");
    const [warning, setWarning] = useState("");
    const [pageError, setPageError] = useState("");
    const [success, setSuccess] = useState(null);

    const balance = Number(account?.balance ?? 0);
    const remaining = Number(limit?.remaining ?? 0);
    const dailyLimit = Number(limit?.daily_limit ?? 0);
    const used = Number(limit?.used ?? 0);

    const accountNumber = String(account?.account_number ?? "");
    const accountStatus = String(account?.status ?? "").toLowerCase();
    const isFrozen = accountStatus === "frozen";

    const parsedAmount = Number(amount);
    const validAmount =
        amount.trim() !== "" &&
        Number.isFinite(parsedAmount) &&
        /^\d+(\.\d{1,2})?$/.test(amount) &&
        parsedAmount >= 100;

    const usedPercent =
        dailyLimit > 0
            ? Math.min(100, Math.max(0, (used / dailyLimit) * 100))
            : 0;

    const fetchMyAccount = useCallback(async () => {
        const response = await API.get("/account/my-account");
        const data = getAccountFromResponse(response.data);

        if (!data?.account_number) {
            throw new Error("No bank account was found for this user.");
        }

        setAccount(data);
        return data;
    }, []);

    const fetchLimit = useCallback(async (number) => {
        try {
            const response = await API.get(
                `/transaction/withdraw-limit/${encodeURIComponent(number)}`
            );

            const data = getResponseData(response);

            if (
                !data ||
                data.daily_limit == null ||
                data.remaining == null
            ) {
                setLimit(null);
                return;
            }

            setLimit({
                daily_limit: Number(data.daily_limit),
                used: Number(data.used ?? 0),
                remaining: Number(data.remaining),
            });
        } catch {

            setLimit(null);
        }
    }, []);

    const fetchHistory = useCallback(async (number) => {
        try {
            const response = await API.get(
                `/transaction/withdraw-history/${encodeURIComponent(number)}`
            );

            const data = getResponseData(response);
            setRecent(Array.isArray(data) ? data : []);
        } catch {
            setRecent([]);
        }
    }, []);

    const refreshData = useCallback(
        async (number = accountNumber, showLoader = false) => {
            if (showLoader) setRefreshing(true);

            setPageError("");

            try {
                const updatedAccount = await fetchMyAccount();
                const selectedNumber = updatedAccount.account_number || number;

                await Promise.all([
                    fetchLimit(selectedNumber),
                    fetchHistory(selectedNumber),
                ]);
            } catch (error) {
                setPageError(
                    error.response?.data?.message ||
                    error.message ||
                    "Unable to refresh your account."
                );
            } finally {
                setRefreshing(false);
                setLoading(false);
            }
        },
        [accountNumber, fetchHistory, fetchLimit, fetchMyAccount]
    );

    useEffect(() => {
        let active = true;

        async function init() {
            try {
                const response = await API.get("/account/my-account");
                if (!active) return;

                const data = getAccountFromResponse(response.data);

                if (!data?.account_number) {
                    throw new Error("No bank account was found for this user.");
                }

                setAccount(data);

                const number = data.account_number;

                const [limitResult, historyResult] = await Promise.allSettled([
                    API.get(
                        `/transaction/withdraw-limit/${encodeURIComponent(number)}`
                    ),
                    API.get(
                        `/transaction/withdraw-history/${encodeURIComponent(number)}`
                    ),
                ]);

                if (!active) return;

                if (limitResult.status === "fulfilled") {
                    const limitData = getResponseData(limitResult.value);

                    if (
                        limitData?.daily_limit != null &&
                        limitData?.remaining != null
                    ) {
                        setLimit({
                            daily_limit: Number(limitData.daily_limit),
                            used: Number(limitData.used ?? 0),
                            remaining: Number(limitData.remaining),
                        });
                    } else {
                        setLimit(null);
                    }
                } else {
                    setLimit(null);
                }

                if (historyResult.status === "fulfilled") {
                    const historyData = getResponseData(historyResult.value);
                    setRecent(Array.isArray(historyData) ? historyData : []);
                } else {
                    setRecent([]);
                }
            } catch (error) {
                if (active) {
                    setPageError(
                        error.response?.data?.message ||
                        error.message ||
                        "Unable to load your account."
                    );
                }
            } finally {
                if (active) setLoading(false);
            }
        }

        init();

        return () => {
            active = false;
        };
    }, []);

    const handleAmountChange = async (value) => {
        if (!/^\d*\.?\d{0,2}$/.test(value) && value !== "") return;

        setAmount(value);
        setWarning("");
        setPreview(null);
        setPreviewError("");

        if (!value) return;

        const number = Number(value);

        if (!Number.isFinite(number) || number <= 0) return;

        if (number < 100) {
            setWarning("Minimum withdrawal is ₹100.");
            return;
        }

        if (number > balance) {
            setWarning("The withdrawal amount exceeds your available balance.");
            return;
        }

        if (isFrozen) {
            setWarning("Your account is frozen. Withdrawals are unavailable.");
            return;
        }

        if (limit && number > remaining) {
            setWarning(
                `Only ₹${formatINR(remaining)} remains in your daily withdrawal limit.`
            );
            return;
        }

        setPreviewLoading(true);

        try {
            const response = await API.post("/transaction/withdraw-preview", {
                amount: number,
                account_number: accountNumber,
            });

            const data = getResponseData(response);

            if (!data || data.fee == null || data.total_impact == null) {
                throw new Error("The server returned an incomplete withdrawal preview.");
            }

            setPreview(data);

            if (Number(data.total_impact) > balance) {
                setWarning(
                    "The total deduction, including fees, exceeds your available balance."
                );
            }
        } catch (error) {
            setPreviewError(
                error.response?.data?.message ||
                error.message ||
                "Preview is unavailable. You can still submit a valid withdrawal for server-side verification."
            );
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleWithdraw = async () => {
        if (!accountNumber || !validAmount || isProcessing || warning) return;

        if (isFrozen) {
            setWarning("Your account is frozen. Withdrawals are unavailable.");
            return;
        }

        if (parsedAmount > balance) {
            setWarning("Insufficient balance.");
            return;
        }

        if (limit && parsedAmount > remaining) {
            setWarning("The amount exceeds your remaining daily limit.");
            return;
        }

        if (preview && Number(preview.total_impact) > balance) {
            setWarning("Insufficient balance for the total deduction.");
            return;
        }

        setIsProcessing(true);
        setPageError("");

        try {
            const response = await API.post("/transaction/withdraw", {
                account_number: accountNumber,
                amount: parsedAmount,
            });

            const responseData = getResponseData(response);

            setSuccess({
                amount: parsedAmount,
                message:
                    response.data?.message ||
                    "Your withdrawal request was processed successfully.",
                transactionId:
                    responseData?.transaction_id ??
                    responseData?.transactionId ??
                    responseData?.id ??
                    null,
            });

            setAmount("");
            setPreview(null);
            setPreviewError("");
            setWarning("");

            await refreshData(accountNumber);
        } catch (error) {
            setPageError(
                error.response?.data?.message ||
                "Withdrawal failed. Please check your balance and try again."
            );
        } finally {
            setIsProcessing(false);
        }
    };

    const quickAmounts = [1000, 2000, 5000, 10000];

    const sortedRecent = useMemo(() => {
        return [...recent].sort(
            (a, b) =>
                new Date(b.created_at || 0).getTime() -
                new Date(a.created_at || 0).getTime()
        );
    }, [recent]);

    if (loading) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center bg-gray-950 px-4 text-white">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="animate-spin text-blue-400" size={36} />
                    <p className="text-sm text-gray-400">Loading withdrawal details…</p>
                </div>
            </div>
        );
    }

    if (!account) {
        return (
            <main className="min-h-screen bg-gray-950 px-4 py-10 text-white">
                <div className="mx-auto max-w-lg rounded-3xl border border-white/10 bg-gray-900 p-6 text-center sm:p-8">
                    <AlertTriangle className="mx-auto mb-3 text-amber-400" size={36} />
                    <h1 className="text-xl font-bold">Account unavailable</h1>
                    <p className="mt-2 text-sm text-gray-400">
                        {pageError || "We could not load your bank account."}
                    </p>
                    <button
                        onClick={() => refreshData("", true)}
                        className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500"
                    >
                        <RefreshCw size={16} />
                        Try again
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen overflow-x-hidden bg-gray-950 px-3 py-5 pb-10 text-white sm:px-5 sm:py-7 lg:px-8">
            <div className="mx-auto w-full max-w-7xl space-y-6">

                <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
                            Banking services
                        </p>
                        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                            Withdraw money
                        </h1>
                        <p className="mt-2 max-w-xl text-sm leading-6 text-gray-400">
                            Enter your amount, review the available details, and confirm your
                            withdrawal.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => refreshData(accountNumber, true)}
                        disabled={refreshing || isProcessing}
                        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-gray-900 px-4 py-2.5 text-sm font-medium text-gray-200 transition hover:bg-gray-800 disabled:opacity-50 sm:w-auto"
                    >
                        <RefreshCw
                            size={16}
                            className={refreshing ? "animate-spin" : ""}
                        />
                        Refresh account
                    </button>
                </header>

                {pageError && (
                    <div
                        role="alert"
                        className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200"
                    >
                        <AlertTriangle className="mt-0.5 shrink-0" size={18} />
                        <div className="min-w-0 flex-1">{pageError}</div>
                        <button
                            type="button"
                            aria-label="Dismiss error"
                            onClick={() => setPageError("")}
                            className="rounded-lg p-1 hover:bg-red-500/10"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}


                <section className="relative overflow-hidden rounded-3xl border border-blue-300/10 bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 p-5 shadow-xl shadow-blue-950/20 sm:p-7 lg:p-8">
                    <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/[0.04]" />
                    <div className="pointer-events-none absolute -bottom-20 right-24 h-44 w-44 rounded-full bg-blue-300/[0.06]" />

                    <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
                        <div>
                            <div className="flex items-center gap-2 text-sm text-blue-200">
                                <Wallet size={17} />
                                Available balance
                            </div>

                            <p className="mt-3 break-words text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                                ₹{formatINR(balance)}
                            </p>

                            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-blue-100/70">
                                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                                    Account •••• {accountNumber.slice(-4)}
                                </span>
                                <span
                                    className={`rounded-full px-3 py-1.5 font-medium ${isFrozen
                                            ? "bg-red-400/10 text-red-200"
                                            : accountStatus === "active"
                                                ? "bg-emerald-400/10 text-emerald-200"
                                                : "bg-white/10 text-blue-100"
                                        }`}
                                >
                                    {accountStatus
                                        ? accountStatus.charAt(0).toUpperCase() +
                                        accountStatus.slice(1)
                                        : "Status unavailable"}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/10 p-4 md:min-w-52">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
                                <ArrowDownToLine size={21} />
                            </div>
                            <div>
                                <p className="text-xs text-blue-200">Minimum withdrawal</p>
                                <p className="mt-1 text-lg font-semibold">₹100</p>
                            </div>
                        </div>
                    </div>
                </section>


                <div className="grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">

                    <section className="min-w-0 rounded-3xl border border-white/10 bg-gray-900/80 p-4 sm:p-6">
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold sm:text-xl">
                                Enter withdrawal amount
                            </h2>
                            <p className="mt-1 text-sm text-gray-400">
                                Choose a suggested amount or enter your own.
                            </p>
                        </div>

                        {isFrozen && (
                            <div className="mb-4 flex gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
                                <AlertTriangle className="mt-0.5 shrink-0" size={17} />
                                This account is frozen. Withdrawals are disabled.
                            </div>
                        )}

                        <label
                            htmlFor="withdraw-amount"
                            className="mb-2 block text-sm font-medium text-gray-300"
                        >
                            Amount in INR
                        </label>

                        <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-gray-950 px-4 py-4 transition focus-within:border-blue-500/70 focus-within:ring-2 focus-within:ring-blue-500/10 sm:px-5">
                            <span className="text-2xl font-semibold text-blue-400">₹</span>
                            <input
                                id="withdraw-amount"
                                type="text"
                                inputMode="decimal"
                                autoComplete="off"
                                value={amount}
                                onChange={(event) => handleAmountChange(event.target.value)}
                                placeholder="0.00"
                                aria-describedby="withdraw-help"
                                className="min-w-0 flex-1 bg-transparent text-3xl font-bold tracking-tight text-white outline-none placeholder:text-gray-700 sm:text-4xl"
                                disabled={isProcessing || isFrozen}
                            />
                        </div>

                        <p id="withdraw-help" className="mt-2 text-xs text-gray-500">
                            Minimum ₹100 · Up to 2 decimal places
                        </p>

                        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {quickAmounts.map((value) => (
                                <button
                                    key={value}
                                    type="button"
                                    disabled={isProcessing || isFrozen}
                                    onClick={() => handleAmountChange(String(value))}
                                    className={`min-h-11 rounded-xl border px-2 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${parsedAmount === value
                                            ? "border-blue-500/60 bg-blue-500/15 text-blue-300"
                                            : "border-white/10 bg-white/[0.03] text-gray-300 hover:border-white/20 hover:bg-white/[0.06]"
                                        }`}
                                >
                                    ₹{formatINR(value)}
                                </button>
                            ))}
                        </div>

                        {warning && (
                            <div
                                role="alert"
                                className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-200"
                            >
                                <AlertTriangle size={17} className="mt-0.5 shrink-0" />
                                <span>{warning}</span>
                            </div>
                        )}

                        {previewLoading && (
                            <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/[0.03] p-3 text-sm text-gray-400">
                                <Loader2 size={16} className="animate-spin" />
                                Calculating withdrawal preview…
                            </div>
                        )}

                        {previewError && !warning && (
                            <div className="mt-4 flex items-start gap-2 rounded-xl border border-blue-400/15 bg-blue-400/5 p-3 text-sm text-blue-200">
                                <Info size={17} className="mt-0.5 shrink-0" />
                                <span>{previewError}</span>
                            </div>
                        )}

                        {preview && !warning && (
                            <div className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-gray-950/70 p-4 sm:p-5">
                                <div className="flex items-center justify-between gap-3 text-sm">
                                    <span className="text-gray-400">Withdrawal amount</span>
                                    <span className="font-medium text-white">
                                        ₹{formatINR(parsedAmount)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between gap-3 text-sm">
                                    <span className="text-gray-400">Service fee</span>
                                    <span className="font-medium text-white">
                                        ₹{formatINR(preview.fee)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3">
                                    <span className="text-sm font-semibold text-white">
                                        Total deduction
                                    </span>
                                    <span className="text-lg font-bold text-blue-300">
                                        ₹{formatINR(preview.total_impact)}
                                    </span>
                                </div>

                                {Array.isArray(preview.cash_breakdown) &&
                                    preview.cash_breakdown.length > 0 && (
                                        <div className="border-t border-white/10 pt-3">
                                            <p className="mb-3 flex items-center gap-2 text-xs text-gray-400">
                                                <Banknote size={15} />
                                                Cash note breakdown
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {preview.cash_breakdown.map((item, index) => (
                                                    <span
                                                        key={`${item.note}-${index}`}
                                                        className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-gray-200"
                                                    >
                                                        ₹{formatINR(item.note)} × {item.count}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                            </div>
                        )}

                        <button
                            type="button"
                            disabled={
                                isProcessing ||
                                isFrozen ||
                                !validAmount ||
                                !!warning ||
                                (limit !== null && parsedAmount > remaining) ||
                                (preview !== null &&
                                    Number(preview.total_impact) > balance)
                            }
                            onClick={handleWithdraw}
                            className="mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-4 font-semibold text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 size={19} className="animate-spin" />
                                    Processing withdrawal…
                                </>
                            ) : (
                                <>
                                    <ArrowDownToLine size={19} />
                                    Confirm withdrawal
                                </>
                            )}
                        </button>

                        <p className="mt-3 flex items-start justify-center gap-2 text-center text-xs leading-5 text-gray-500">
                            <ShieldCheck size={15} className="mt-0.5 shrink-0" />
                            Your withdrawal is subject to server-side balance and limit
                            validation.
                        </p>
                    </section>


                    <aside className="min-w-0 space-y-5">
                        <section className="rounded-3xl border border-white/10 bg-gray-900/80 p-5 sm:p-6">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h2 className="font-semibold">Daily withdrawal limit</h2>
                                    <p className="mt-1 text-xs text-gray-400">
                                        Based on the available limit data
                                    </p>
                                </div>
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300">
                                    <CalendarDays size={19} />
                                </div>
                            </div>

                            {limit ? (
                                <>
                                    <div className="mt-6 grid grid-cols-2 gap-3">
                                        <div className="rounded-2xl border border-white/5 bg-gray-950/70 p-3 sm:p-4">
                                            <p className="text-xs text-gray-500">Daily limit</p>
                                            <p className="mt-2 break-words text-lg font-bold sm:text-xl">
                                                ₹{formatINR(dailyLimit)}
                                            </p>
                                        </div>
                                        <div className="rounded-2xl border border-white/5 bg-gray-950/70 p-3 sm:p-4">
                                            <p className="text-xs text-gray-500">Remaining</p>
                                            <p className="mt-2 break-words text-lg font-bold text-blue-300 sm:text-xl">
                                                ₹{formatINR(remaining)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-5">
                                        <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                                            <span className="text-gray-400">Limit used</span>
                                            <span className="text-gray-300">
                                                {Math.round(usedPercent)}%
                                            </span>
                                        </div>
                                        <div
                                            className="h-2 overflow-hidden rounded-full bg-white/10"
                                            role="progressbar"
                                            aria-label="Daily withdrawal limit used"
                                            aria-valuemin={0}
                                            aria-valuemax={100}
                                            aria-valuenow={Math.round(usedPercent)}
                                        >
                                            <div
                                                className="h-full rounded-full bg-blue-500 transition-all"
                                                style={{ width: `${usedPercent}%` }}
                                            />
                                        </div>
                                        <p className="mt-2 text-xs text-gray-500">
                                            Used ₹{formatINR(used)}
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <div className="mt-5 rounded-2xl border border-amber-500/15 bg-amber-500/5 p-4">
                                    <p className="text-sm font-medium text-amber-200">
                                        Limit details unavailable
                                    </p>
                                    <p className="mt-1 text-xs leading-5 text-gray-400">
                                        We couldn&apos;t retrieve your current daily limit. The server
                                        must verify your limit when you submit a withdrawal.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => fetchLimit(accountNumber)}
                                        className="mt-3 text-sm font-medium text-blue-300 hover:text-blue-200"
                                    >
                                        Retry limit lookup
                                    </button>
                                </div>
                            )}
                        </section>

                        <section className="rounded-3xl border border-white/10 bg-gray-900/80 p-5 sm:p-6">
                            <h2 className="font-semibold">Withdrawal summary</h2>

                            <div className="mt-4 space-y-4">
                                <div className="flex items-center justify-between gap-3 text-sm">
                                    <span className="text-gray-400">Account</span>
                                    <span className="font-medium text-gray-200">
                                        •••• {accountNumber.slice(-4)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between gap-3 text-sm">
                                    <span className="text-gray-400">Requested amount</span>
                                    <span className="font-medium text-white">
                                        ₹{formatINR(validAmount ? parsedAmount : 0)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between gap-3 text-sm">
                                    <span className="text-gray-400">Service fee</span>
                                    <span className="font-medium text-white">
                                        {preview
                                            ? `₹${formatINR(preview.fee)}`
                                            : "Not available"}
                                    </span>
                                </div>
                                <div className="border-t border-white/10 pt-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-sm font-semibold text-gray-300">
                                            Total deduction
                                        </span>
                                        <span className="text-xl font-bold text-blue-300">
                                            {preview
                                                ? `₹${formatINR(preview.total_impact)}`
                                                : "—"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 flex items-start gap-2 rounded-xl border border-white/5 bg-white/[0.03] p-3 text-xs leading-5 text-gray-400">
                                <Info size={16} className="mt-0.5 shrink-0 text-blue-300" />
                                The final fee and deduction are determined by the withdrawal
                                service. Check the preview before confirming.
                            </div>
                        </section>
                    </aside>
                </div>


                <section className="min-w-0 rounded-3xl border border-white/10 bg-gray-900/80 p-4 sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="flex items-center gap-2 text-lg font-semibold">
                                <History size={19} className="text-blue-300" />
                                Recent withdrawals
                            </h2>
                            <p className="mt-1 text-sm text-gray-400">
                                Latest withdrawal records returned by your account service.
                            </p>
                        </div>
                        <span className="w-fit rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-gray-400">
                            {recent.length} record{recent.length === 1 ? "" : "s"}
                        </span>
                    </div>

                    {sortedRecent.length === 0 ? (
                        <div className="py-10 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] text-gray-500">
                                <History size={25} />
                            </div>
                            <p className="mt-4 font-medium text-gray-300">
                                No withdrawal records
                            </p>
                            <p className="mt-1 text-sm text-gray-500">
                                Your recent withdrawals will appear here when available.
                            </p>
                        </div>
                    ) : (
                        <>

                            <div className="mt-5 space-y-3 md:hidden">
                                {sortedRecent.map((transaction, index) => (
                                    <div
                                        key={transaction.id ?? `${transaction.created_at}-${index}`}
                                        className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/5 bg-gray-950/60 p-3"
                                    >
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-300">
                                            <ArrowDownToLine size={18} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-white">
                                                Cash withdrawal
                                            </p>
                                            <p className="mt-1 text-xs text-gray-500">
                                                {formatDate(transaction.created_at)}
                                            </p>
                                        </div>
                                        <p className="shrink-0 text-sm font-semibold text-red-300">
                                            −₹{formatINR(transaction.amount)}
                                        </p>
                                    </div>
                                ))}
                            </div>


                            <div className="mt-5 hidden overflow-x-auto rounded-2xl border border-white/10 md:block">
                                <table className="w-full min-w-[600px] text-left text-sm">
                                    <thead className="bg-gray-950/80 text-xs uppercase tracking-wider text-gray-500">
                                        <tr>
                                            <th className="px-5 py-4 font-medium">Transaction</th>
                                            <th className="px-5 py-4 font-medium">Date</th>
                                            <th className="px-5 py-4 text-right font-medium">
                                                Amount
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {sortedRecent.map((transaction, index) => (
                                            <tr
                                                key={transaction.id ?? `${transaction.created_at}-${index}`}
                                                className="transition hover:bg-white/[0.02]"
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-300">
                                                            <ArrowDownToLine size={17} />
                                                        </div>
                                                        <span className="font-medium text-gray-200">
                                                            Cash withdrawal
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-gray-400">
                                                    {formatDate(transaction.created_at)}
                                                </td>
                                                <td className="px-5 py-4 text-right font-semibold text-red-300">
                                                    −₹{formatINR(transaction.amount)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </section>
            </div>


            {success && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm"
                    role="presentation"
                    onClick={(event) => {
                        if (event.target === event.currentTarget) setSuccess(null);
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="withdraw-success-title"
                        className="my-auto w-full max-w-md rounded-3xl border border-white/10 bg-gray-900 p-5 shadow-2xl sm:p-8"
                    >
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                            <CheckCircle2 size={37} />
                        </div>

                        <h2
                            id="withdraw-success-title"
                            className="mt-4 text-center text-xl font-bold"
                        >
                            Withdrawal successful
                        </h2>
                        <p className="mt-2 text-center text-sm leading-6 text-gray-400">
                            {success.message}
                        </p>

                        <div className="mt-6 rounded-2xl border border-white/10 bg-gray-950 p-4 sm:p-5">
                            <p className="text-center text-xs text-gray-500">
                                Withdrawal amount
                            </p>
                            <p className="mt-2 text-center text-3xl font-bold text-emerald-300">
                                ₹{formatINR(success.amount)}
                            </p>

                            <div className="mt-5 space-y-3 border-t border-white/10 pt-4">
                                <div className="flex items-center justify-between gap-3 text-sm">
                                    <span className="text-gray-400">Account</span>
                                    <span className="text-gray-200">
                                        •••• {accountNumber.slice(-4)}
                                    </span>
                                </div>
                                <div className="flex items-start justify-between gap-3 text-sm">
                                    <span className="text-gray-400">Transaction ID</span>
                                    <span className="max-w-[60%] break-all text-right text-gray-200">
                                        {success.transactionId ?? "Not provided by server"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setSuccess(null)}
                            className="mt-5 min-h-12 w-full rounded-xl bg-white px-4 py-3 font-semibold text-gray-950 transition hover:bg-gray-200"
                        >
                            Done
                        </button>
                    </section>
                </div>
            )}
        </main>
    );
}
