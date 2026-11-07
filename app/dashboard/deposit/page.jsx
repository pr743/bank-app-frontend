"use client";

import { useCallback, useEffect, useState } from "react";
import {
    Wallet,
    ArrowDownToLine,
    RefreshCw,
    ShieldCheck,
    AlertCircle,
    CheckCircle2,
    CreditCard,
    Banknote,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

const QUICK_AMOUNTS = [500, 1000, 5000, 10000];

export default function DepositPage() {
    const [account, setAccount] = useState(null);
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [accountLoading, setAccountLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("success");
    const [accountError, setAccountError] = useState("");

    const showMessage = (text, type = "success") => {
        setMessage(text);
        setMessageType(type);
    };

    const formatCurrency = (value) => {
        const number = Number(value);

        if (
            value === null ||
            value === undefined ||
            value === "" ||
            !Number.isFinite(number)
        ) {
            return "Unavailable";
        }

        return number.toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const fetchAccount = useCallback(async () => {
        setAccountLoading(true);
        setAccountError("");

        try {
            const token = localStorage.getItem("token");

            if (!token) {
                throw new Error("Please log in again to view your account.");
            }

            const response = await fetch(
                `${API_URL}/account/my-account`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                    cache: "no-store",
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to load your bank account."
                );
            }

            let accountsList = [];

            if (Array.isArray(data)) {
                accountsList = data;
            } else if (Array.isArray(data.data)) {
                accountsList = data.data;
            } else if (Array.isArray(data.accounts)) {
                accountsList = data.accounts;
            } else if (Array.isArray(data.account)) {
                accountsList = data.account;
            } else if (data.data && typeof data.data === "object") {
                accountsList = [data.data];
            } else if (data.account && typeof data.account === "object") {
                accountsList = [data.account];
            } else if (data.account_number) {
                accountsList = [data];
            }

            const selectedAccount = accountsList[0] || null;

            setAccount(selectedAccount);

            if (!selectedAccount) {
                setAccountError(
                    "No bank account was found. Create an account before making a deposit."
                );
            }
        } catch (error) {
            setAccount(null);
            setAccountError(
                error.message || "Unable to load your bank account."
            );
        } finally {
            setAccountLoading(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchAccount();
    }, [fetchAccount]);

    const numericAmount = Number(amount);
    const validAmount =
        amount.trim() !== "" &&
        Number.isFinite(numericAmount) &&
        numericAmount > 0;

    const balance = Number(account?.balance);
    const hasValidBalance =
        account?.balance !== null &&
        account?.balance !== undefined &&
        account?.balance !== "" &&
        Number.isFinite(balance);

    const canDeposit =
        account?.status?.toLowerCase() === "active";

    const previewBalance =
        hasValidBalance && validAmount
            ? balance + numericAmount
            : null;

    const handleDeposit = async (event) => {
        event.preventDefault();
        setMessage("");

        if (!account) {
            showMessage("Please create a bank account first.", "error");
            return;
        }

        if (!canDeposit) {
            showMessage(
                "This account is not active. Deposits are unavailable.",
                "error"
            );
            return;
        }

        if (!validAmount) {
            showMessage(
                "Enter a deposit amount greater than zero.",
                "error"
            );
            return;
        }

        if (!hasValidBalance) {
            showMessage(
                "Your current balance is unavailable. Refresh your account before continuing.",
                "error"
            );
            return;
        }

        try {
            setLoading(true);

            const token = localStorage.getItem("token");

            if (!token) {
                throw new Error("Please log in again.");
            }

            const response = await fetch(
                `${API_URL}/transaction/deposit`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                    body: JSON.stringify({
                        account_number: account.account_number,
                        amount: numericAmount,
                    }),
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.message || "The deposit could not be completed."
                );
            }

            setAmount("");
            showMessage(
                data.message || "Deposit completed successfully.",
                "success"
            );

            await fetchAccount();
        } catch (error) {
            showMessage(
                error.message || "Something went wrong with your deposit.",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    if (accountLoading) {
        return (
            <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-8 text-white sm:px-6 sm:py-10 lg:px-8">
                <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03]">
                    <RefreshCw
                        size={30}
                        className="animate-spin text-green-400"
                    />
                    <p className="text-sm text-gray-400">
                        Loading your account...
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-5 text-white sm:px-6 sm:py-8 lg:px-8">

            <header className="mb-6 sm:mb-8">
                <div className="mb-2 flex items-center gap-2 text-sm text-green-300">
                    <ArrowDownToLine size={17} />
                    <span>Banking / Deposits</span>
                </div>

                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                    Deposit Funds
                </h1>

                <p className="mt-2 max-w-xl text-sm leading-6 text-gray-400 sm:text-base">
                    Add funds to your account and check the deposit details
                    before submitting.
                </p>
            </header>

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

            {!account ? (
                <section className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 sm:rounded-3xl sm:p-8">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-300">
                        <AlertCircle size={25} />
                    </div>

                    <h2 className="mt-4 text-xl font-bold">
                        {accountError.toLowerCase().includes("no bank account")
                            ? "No bank account found"
                            : "Account unavailable"}
                    </h2>

                    <p className="mt-2 break-words text-sm leading-6 text-gray-400">
                        {accountError ||
                            "Create a bank account before making a deposit."}
                    </p>

                    <button
                        type="button"
                        onClick={fetchAccount}
                        className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-medium transition hover:bg-white/15"
                    >
                        <RefreshCw size={16} />
                        Retry
                    </button>
                </section>
            ) : (
                <>

                    <section className="mb-6 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#111c2e] to-[#0c1320] sm:mb-8 sm:rounded-3xl">
                        <div className="p-5 sm:p-7 lg:p-8">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-green-300 sm:h-12 sm:w-12">
                                        <Wallet size={24} />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="text-sm text-gray-400">
                                            Current balance
                                        </p>
                                        <p className="mt-1 break-words text-2xl font-bold tracking-tight text-green-300 sm:text-3xl lg:text-4xl">
                                            {formatCurrency(account.balance)}
                                        </p>
                                    </div>
                                </div>

                                <span
                                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase sm:px-3 sm:text-xs ${canDeposit
                                        ? "border-green-500/20 bg-green-500/10 text-green-300"
                                        : "border-amber-500/20 bg-amber-500/10 text-amber-300"
                                        }`}
                                >
                                    {account.status || "Unknown"}
                                </span>
                            </div>

                            <div className="mt-6 grid grid-cols-1 gap-4 border-t border-white/10 pt-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                                <div className="min-w-0">
                                    <p className="text-xs text-gray-500 sm:text-sm">
                                        Account number
                                    </p>
                                    <p className="mt-1 break-all font-mono text-sm font-semibold text-white sm:text-base">
                                        {account.account_number || "Unavailable"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-500 sm:text-sm">
                                        Account type
                                    </p>
                                    <p className="mt-1 text-sm font-semibold capitalize text-white sm:text-base">
                                        {account.account_type || "Unknown"}
                                    </p>
                                </div>

                                <div className="sm:col-span-2 lg:col-span-1">
                                    <p className="text-xs text-gray-500 sm:text-sm">
                                        Deposit availability
                                    </p>
                                    <p
                                        className={`mt-1 text-sm font-semibold sm:text-base ${canDeposit
                                            ? "text-green-300"
                                            : "text-amber-300"
                                            }`}
                                    >
                                        {canDeposit
                                            ? "Account active"
                                            : "Check account status"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>


                    <section className="mb-6 sm:mb-8">
                        <h2 className="mb-3 text-base font-semibold sm:text-lg">
                            Choose a quick amount
                        </h2>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                            {QUICK_AMOUNTS.map((item) => {
                                const selected = amount === String(item);

                                return (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() => setAmount(String(item))}
                                        aria-pressed={selected}
                                        className={`min-h-12 rounded-xl border px-3 py-3 text-sm font-semibold transition sm:text-base ${selected
                                            ? "border-green-400 bg-green-500/15 text-green-300 ring-1 ring-green-400/30"
                                            : "border-white/10 bg-white/[0.03] text-gray-200 hover:border-green-500/40 hover:bg-green-500/5"
                                            }`}
                                    >
                                        ₹{item.toLocaleString("en-IN")}
                                    </button>
                                );
                            })}
                        </div>
                    </section>


                    <section className="rounded-2xl border border-white/10 bg-[#0e1524] p-4 shadow-xl sm:rounded-3xl sm:p-6 lg:p-8">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-green-300">
                                <Banknote size={23} />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold sm:text-xl">
                                    Deposit details
                                </h2>
                                <p className="mt-1 text-sm text-gray-400">
                                    Review the details before submitting.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleDeposit}>
                            <div className="mb-5">
                                <label
                                    htmlFor="deposit-account"
                                    className="mb-2 block text-sm font-medium text-gray-300"
                                >
                                    Deposit into account
                                </label>

                                <input
                                    id="deposit-account"
                                    type="text"
                                    value={account.account_number || ""}
                                    readOnly
                                    className="min-h-12 w-full min-w-0 rounded-xl border border-white/10 bg-[#080e19] px-4 py-3 font-mono text-sm text-gray-300 outline-none"
                                />
                            </div>

                            <div className="mb-6">
                                <label
                                    htmlFor="deposit-amount"
                                    className="mb-2 block text-sm font-medium text-gray-300"
                                >
                                    Deposit amount (INR)
                                </label>

                                <div className="flex min-h-14 items-center rounded-xl border border-white/10 bg-[#080e19] px-4 transition focus-within:border-green-500/50">
                                    <span className="mr-3 text-lg font-semibold text-gray-400">
                                        ₹
                                    </span>


                                    <input
                                        id="deposit-amount"
                                        type="text"
                                        inputMode="decimal"
                                        value={amount}
                                        onChange={(event) => {
                                            const value = event.target.value;


                                            if (/^\d*\.?\d{0,2}$/.test(value)) {
                                                setAmount(value);
                                            }
                                        }}
                                        className="min-w-0 flex-1 bg-transparent py-3 text-base text-white outline-none placeholder:text-gray-600"
                                        placeholder="Enter amount"
                                        required
                                        aria-describedby="deposit-amount-help"
                                    />

                                </div>

                                <p
                                    id="deposit-amount-help"
                                    className="mt-2 text-xs leading-5 text-gray-500"
                                >
                                    Enter an amount greater than zero.
                                </p>
                            </div>

                            <div className="mb-6 rounded-2xl border border-white/10 bg-[#080e19] p-4 sm:p-5">
                                <h3 className="mb-4 font-semibold text-white">
                                    Deposit summary
                                </h3>

                                <div className="space-y-3 text-sm">
                                    <div className="flex items-start justify-between gap-4">
                                        <span className="text-gray-400">
                                            Current balance
                                        </span>
                                        <span className="break-words text-right text-gray-200">
                                            {formatCurrency(account.balance)}
                                        </span>
                                    </div>

                                    <div className="flex items-start justify-between gap-4">
                                        <span className="text-gray-400">
                                            Deposit amount
                                        </span>
                                        <span className="break-words text-right font-medium text-green-300">
                                            {validAmount
                                                ? formatCurrency(numericAmount)
                                                : formatCurrency(0)}
                                        </span>
                                    </div>

                                    <div className="flex items-start justify-between gap-4 border-t border-white/10 pt-4 text-base font-semibold">
                                        <span className="text-white">
                                            Estimated new balance
                                        </span>
                                        <span className="break-words text-right text-green-300">
                                            {previewBalance !== null
                                                ? formatCurrency(previewBalance)
                                                : "—"}
                                        </span>
                                    </div>
                                </div>

                                <p className="mt-4 text-xs leading-5 text-gray-500">
                                    This is a preview. The confirmed balance
                                    will be loaded from the server after the
                                    deposit is processed.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={
                                    loading ||
                                    !validAmount ||
                                    !canDeposit ||
                                    !hasValidBalance
                                }
                                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 px-5 py-3 font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <RefreshCw
                                            size={18}
                                            className="animate-spin"
                                        />
                                        Processing deposit...
                                    </>
                                ) : (
                                    <>
                                        <ArrowDownToLine size={19} />
                                        Deposit now
                                    </>
                                )}
                            </button>

                            <div className="mt-4 flex items-start justify-center gap-2 text-center text-xs leading-5 text-gray-500">
                                <ShieldCheck
                                    size={15}
                                    className="mt-0.5 shrink-0"
                                />
                                <p>
                                    Your request is sent to the banking
                                    backend for validation and processing.
                                </p>
                            </div>
                        </form>
                    </section>
                </>
            )}
        </main>
    );
}
