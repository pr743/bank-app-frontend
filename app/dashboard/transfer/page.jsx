"use client";

import API from "@/app/Api/api";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ArrowDownLeft,
    ArrowLeft,
    ArrowRight,
    ArrowRightLeft,
    ArrowUpRight,
    Check,
    CheckCircle2,
    ChevronRight,
    CircleAlert,
    Clock,
    Copy,
    Loader2,
    Landmark,
    RefreshCw,
    Search,
    Send,
    ShieldCheck,
    UserRound,
    Wallet,
    X,
} from "lucide-react";

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(Number(value) || 0);

const getUserName = (user) =>
    user?.full_name || user?.name || user?.email || "Bank customer";

const getInitials = (name = "") =>
    name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("") || "U";

export default function TransferPage() {
    const [search, setSearch] = useState("");
    const [users, setUsers] = useState([]);
    const [receiver, setReceiver] = useState(null);
    const [amount, setAmount] = useState("");
    const [account, setAccount] = useState(null);
    const [loadingAccount, setLoadingAccount] = useState(true);
    const [searching, setSearching] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("error");
    const [receipt, setReceipt] = useState(null);
    const [showResults, setShowResults] = useState(false);

    const currentBalance = Number(account?.balance || 0);
    const transferAmount = Number(amount || 0);
    const remainingBalance = currentBalance - transferAmount;

    const isValidAmount =
        amount.trim() !== "" &&
        Number.isFinite(transferAmount) &&
        transferAmount > 0 &&
        /^\d+(\.\d{1,2})?$/.test(amount);

    const isInsufficientBalance =
        isValidAmount && transferAmount > currentBalance;

    const canTransfer =
        Boolean(receiver) &&
        isValidAmount &&
        !isInsufficientBalance &&
        !loading &&
        account?.status?.toLowerCase() !== "frozen";

    const fetchMyAccount = useCallback(async () => {
        setLoadingAccount(true);

        try {
            const response = await API.get("/account/my-account");
            const data = response?.data;
            const accountData = data?.accounts ?? data?.data;

            const myAccount = Array.isArray(accountData)
                ? accountData[0]
                : accountData;

            if (!myAccount?.account_number) {
                setAccount(null);
                return;
            }

            setAccount({
                ...myAccount,
                balance: Number(myAccount.balance ?? data?.balance ?? 0),
            });
        } catch (error) {
            setMessage(
                error?.response?.data?.message ||
                "Unable to load your account. Please try again."
            );
            setMessageType("error");
        } finally {
            setLoadingAccount(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchMyAccount();
    }, [fetchMyAccount]);

    const searchUser = async (event) => {
        event?.preventDefault();

        const query = search.trim();

        if (query.length < 2) {
            setMessage("Enter at least 2 characters to search for a receiver.");
            setMessageType("error");
            setUsers([]);
            setShowResults(false);
            return;
        }

        setSearching(true);
        setMessage("");
        setReceiver(null);
        setUsers([]);
        setShowResults(true);

        try {
            const response = await API.get(
                `/user/search?name=${encodeURIComponent(query)}`
            );

            const responseData = response?.data;
            const results = Array.isArray(responseData)
                ? responseData
                : Array.isArray(responseData?.users)
                    ? responseData.users
                    : Array.isArray(responseData?.data)
                        ? responseData.data
                        : [];

            setUsers(results);

            if (results.length === 0) {
                setMessage("No matching users found. Try another name.");
                setMessageType("error");
            }
        } catch (error) {
            setUsers([]);
            setMessage(
                error?.response?.data?.message ||
                "Unable to search users. Please try again."
            );
            setMessageType("error");
        } finally {
            setSearching(false);
        }
    };

    const selectReceiver = (user) => {
        setReceiver(user);
        setShowResults(false);
        setMessage("");
        setAmount("");
    };

    const clearReceiver = () => {
        setReceiver(null);
        setAmount("");
        setMessage("");
        setShowResults(false);
    };

    const transferMoney = async (event) => {
        event.preventDefault();

        if (!account?.account_number) {
            setMessage("You need an account before you can transfer money.");
            setMessageType("error");
            return;
        }

        if (account.status?.toLowerCase() === "frozen") {
            setMessage("Your account is frozen. Transfers are unavailable.");
            setMessageType("error");
            return;
        }

        if (!receiver) {
            setMessage("Please search for and select a receiver.");
            setMessageType("error");
            return;
        }

        if (!isValidAmount) {
            setMessage("Enter a valid amount with up to 2 decimal places.");
            setMessageType("error");
            return;
        }

        if (isInsufficientBalance) {
            setMessage("Your account does not have enough available balance.");
            setMessageType("error");
            return;
        }

        if (!receiver.upi_id) {
            setMessage("This receiver does not have a UPI ID available.");
            setMessageType("error");
            return;
        }

        setLoading(true);
        setMessage("");

        try {
            const response = await API.post("/transaction/transfer", {
                receiver_upi: receiver.upi_id,
                amount: Number(transferAmount.toFixed(2)),
            });


            const serverMessage =
                response?.data?.message || "Transfer completed successfully.";

            const transactionId =
                response?.data?.transaction_id ??
                response?.data?.data?.transaction_id ??
                response?.data?.transaction?.id ??
                response?.data?.data?.id ??
                null;

            const previousBalance = currentBalance;

            setReceipt({
                receiver_name: getUserName(receiver),
                receiver_upi: receiver.upi_id,
                amount: transferAmount,
                previous_balance: previousBalance,
                transaction_id: transactionId,
                date: new Date().toLocaleString("en-IN"),
                message: serverMessage,
            });

            setMessage("");
            await fetchMyAccount();
        } catch (error) {
            setMessage(
                error?.response?.data?.message ||
                "Transfer failed. Please check the details and try again."
            );
            setMessageType("error");
        } finally {
            setLoading(false);
        }
    };

    const handleDone = async () => {
        setReceipt(null);
        setReceiver(null);
        setUsers([]);
        setSearch("");
        setAmount("");
        setMessage("");
        setShowResults(false);

        await fetchMyAccount();
    };

    const handleCopy = async (text) => {
        if (!text) return;

        try {
            await navigator.clipboard.writeText(String(text));
            setMessage("Copied to clipboard.");
            setMessageType("success");
        } catch {
            setMessage("Unable to copy automatically on this device.");
            setMessageType("error");
        }
    };

    const filteredUsers = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query || users.length === 0) return users;

        return users.filter((user) => {
            const name = getUserName(user).toLowerCase();
            const upi = String(user?.upi_id || "").toLowerCase();

            return name.includes(query) || upi.includes(query);
        });
    }, [users, search]);

    if (receipt) {
        return (
            <div className="min-h-screen bg-[#070b14] px-4 py-6 text-white sm:px-6 sm:py-10 lg:px-8">
                <div className="mx-auto max-w-xl">
                    <button
                        type="button"
                        onClick={handleDone}
                        className="mb-6 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-white"
                    >
                        <ArrowLeft size={17} />
                        Back to transfers
                    </button>

                    <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0d1422] shadow-2xl shadow-black/20">
                        <div className="bg-gradient-to-br from-emerald-500/15 to-teal-500/5 px-5 py-8 text-center sm:px-8 sm:py-10">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10 text-emerald-300 sm:h-20 sm:w-20">
                                <CheckCircle2 size={42} />
                            </div>

                            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">
                                Transfer confirmed
                            </p>

                            <h1 className="mt-3 break-words text-3xl font-bold tracking-tight sm:text-4xl">
                                {formatCurrency(receipt.amount)}
                            </h1>

                            <p className="mt-2 text-sm text-slate-400">
                                {receipt.message}
                            </p>
                        </div>

                        <div className="space-y-5 p-5 sm:p-8">
                            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-500/15 font-bold text-blue-300">
                                    {getInitials(receipt.receiver_name)}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-slate-500">Sent to</p>
                                    <p className="mt-1 truncate font-semibold">
                                        {receipt.receiver_name}
                                    </p>
                                    <p className="mt-1 break-all text-sm text-slate-400">
                                        {receipt.receiver_upi}
                                    </p>
                                </div>

                                <Check size={19} className="shrink-0 text-emerald-400" />
                            </div>

                            <div className="space-y-4">
                                <ReceiptRow
                                    label="Date and time"
                                    value={receipt.date}
                                />

                                <ReceiptRow
                                    label="Transaction reference"
                                    value={
                                        receipt.transaction_id
                                            ? String(receipt.transaction_id)
                                            : "Not provided by server"
                                    }
                                    copyable={Boolean(receipt.transaction_id)}
                                    onCopy={() => handleCopy(receipt.transaction_id)}
                                />

                                <ReceiptRow
                                    label="Previous balance"
                                    value={formatCurrency(receipt.previous_balance)}
                                />

                                <ReceiptRow
                                    label="Transfer amount"
                                    value={`− ${formatCurrency(receipt.amount)}`}
                                    valueClass="text-rose-300"
                                />

                                <ReceiptRow
                                    label="Current balance"
                                    value={
                                        loadingAccount
                                            ? "Updating..."
                                            : account
                                                ? formatCurrency(account.balance)
                                                : "Unavailable"
                                    }
                                    valueClass="text-emerald-300"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={handleDone}
                                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold transition hover:bg-blue-500"
                            >
                                Done
                                <ChevronRight size={18} />
                            </button>

                            <p className="text-center text-xs leading-5 text-slate-500">
                                Keep your transaction reference for future enquiries.
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#070b14] px-4 py-5 text-white sm:px-6 sm:py-8 lg:px-8 lg:py-10">
            <div className="mx-auto max-w-6xl">

                <header className="mb-7 flex flex-col gap-4 sm:mb-9 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-300">
                            <ArrowRightLeft size={14} />
                            Money transfer
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                            Transfer money
                        </h1>

                        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
                            Find your receiver, choose an amount, and review your
                            transfer before sending.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={fetchMyAccount}
                        disabled={loadingAccount}
                        className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.08] disabled:opacity-50 sm:self-auto"
                    >
                        <RefreshCw
                            size={16}
                            className={loadingAccount ? "animate-spin" : ""}
                        />
                        Refresh balance
                    </button>
                </header>


                <section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="relative overflow-hidden rounded-2xl border border-blue-400/20 bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-[#0d1422] p-5 sm:p-6">
                        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />

                        <div className="relative flex items-start justify-between gap-4">
                            <div>
                                <p className="flex items-center gap-2 text-sm font-medium text-slate-400">
                                    <Wallet size={17} />
                                    Available balance
                                </p>

                                <p className="mt-4 break-words text-3xl font-bold tracking-tight sm:text-4xl">
                                    {loadingAccount
                                        ? "Loading..."
                                        : formatCurrency(currentBalance)}
                                </p>

                                <p className="mt-3 break-all text-xs text-slate-500">
                                    {account?.account_number
                                        ? `Account ending ${account.account_number.slice(-4)}`
                                        : "Account details unavailable"}
                                </p>
                            </div>

                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">
                                <Landmark size={22} />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#0d1422] p-5 sm:p-6">
                        <p className="flex items-center gap-2 text-sm font-medium text-slate-400">
                            <ShieldCheck size={17} />
                            Account status
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-3">
                            <span
                                className={`rounded-full px-3 py-1.5 text-sm font-semibold ${account?.status?.toLowerCase() === "active"
                                    ? "bg-emerald-400/10 text-emerald-300"
                                    : account?.status?.toLowerCase() === "frozen"
                                        ? "bg-rose-400/10 text-rose-300"
                                        : "bg-slate-500/10 text-slate-300"
                                    }`}
                            >
                                {loadingAccount
                                    ? "Checking..."
                                    : account?.status
                                        ? account.status.charAt(0).toUpperCase() +
                                        account.status.slice(1)
                                        : "Unavailable"}
                            </span>
                        </div>

                        <p className="mt-3 text-sm leading-6 text-slate-500">
                            {account?.status?.toLowerCase() === "frozen"
                                ? "Transfers are disabled for a frozen account."
                                : "Check the receiver and amount before submitting."}
                        </p>
                    </div>
                </section>


                {message && (
                    <div
                        role="alert"
                        className={`mb-5 flex items-start gap-3 rounded-xl border p-4 text-sm ${messageType === "success"
                            ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                            : "border-rose-400/20 bg-rose-400/10 text-rose-200"
                            }`}
                    >
                        {messageType === "success" ? (
                            <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
                        ) : (
                            <CircleAlert size={19} className="mt-0.5 shrink-0" />
                        )}

                        <p className="min-w-0 flex-1 break-words">{message}</p>

                        <button
                            type="button"
                            onClick={() => setMessage("")}
                            aria-label="Dismiss message"
                            className="shrink-0 rounded-lg p-1 hover:bg-white/10"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                {loadingAccount && !account ? (
                    <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#0d1422]">
                        <Loader2 size={30} className="animate-spin text-blue-400" />
                        <p className="mt-3 text-sm text-slate-400">
                            Loading account details...
                        </p>
                    </div>
                ) : !account ? (
                    <div className="rounded-2xl border border-white/10 bg-[#0d1422] p-6 text-center sm:p-10">
                        <Wallet size={35} className="mx-auto text-slate-500" />
                        <h2 className="mt-4 text-lg font-semibold">
                            Account unavailable
                        </h2>
                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
                            We could not load your account. Refresh the account details
                            or sign in again if your session has expired.
                        </p>
                        <button
                            type="button"
                            onClick={fetchMyAccount}
                            className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500"
                        >
                            Try again
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6 xl:grid-cols-[minmax(0,1fr)_350px]">

                        <div className="min-w-0 space-y-5">

                            <section className="rounded-2xl border border-white/10 bg-[#0d1422] p-4 sm:p-6">
                                <div className="mb-5 flex items-start gap-3">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-sm font-bold text-blue-300">
                                        1
                                    </span>

                                    <div>
                                        <h2 className="text-base font-semibold sm:text-lg">
                                            Choose receiver
                                        </h2>
                                        <p className="mt-1 text-sm leading-5 text-slate-400">
                                            Search using the receiver&apos;s registered name.
                                        </p>
                                    </div>
                                </div>

                                {receiver ? (
                                    <div className="rounded-2xl border border-blue-400/25 bg-blue-500/[0.06] p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-500/15 font-bold text-blue-200">
                                                {getInitials(getUserName(receiver))}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-semibold">
                                                    {getUserName(receiver)}
                                                </p>
                                                <p className="mt-1 break-all text-sm text-slate-400">
                                                    {receiver.upi_id || "UPI ID unavailable"}
                                                </p>
                                            </div>

                                            <CheckCircle2
                                                size={20}
                                                className="shrink-0 text-emerald-300"
                                            />
                                        </div>

                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <span className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1.5 text-xs font-medium text-emerald-300">
                                                Selected receiver
                                            </span>

                                            <button
                                                type="button"
                                                onClick={clearReceiver}
                                                className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/[0.05]"
                                            >
                                                Change receiver
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <form
                                            onSubmit={searchUser}
                                            className="flex flex-col gap-3 sm:flex-row"
                                        >
                                            <div className="relative min-w-0 flex-1">
                                                <Search
                                                    size={18}
                                                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                                                />

                                                <input
                                                    type="search"
                                                    value={search}
                                                    onChange={(event) => setSearch(event.target.value)}
                                                    placeholder="Enter receiver name"
                                                    autoComplete="off"
                                                    className="min-h-12 w-full rounded-xl border border-white/10 bg-[#080d18] py-3 pl-11 pr-4 text-base text-white outline-none placeholder:text-slate-600 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10"
                                                />
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={searching || search.trim().length < 2}
                                                className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {searching ? (
                                                    <Loader2 size={17} className="animate-spin" />
                                                ) : (
                                                    <Search size={17} />
                                                )}
                                                Search
                                            </button>
                                        </form>

                                        {showResults && (
                                            <div className="mt-4">
                                                <div className="mb-3 flex items-center justify-between gap-3">
                                                    <p className="text-sm font-medium text-slate-300">
                                                        {searching
                                                            ? "Searching..."
                                                            : `${filteredUsers.length} matching users`}
                                                    </p>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setShowResults(false);
                                                            setUsers([]);
                                                        }}
                                                        className="text-xs font-medium text-slate-400 hover:text-white"
                                                    >
                                                        Close results
                                                    </button>
                                                </div>

                                                {searching ? (
                                                    <div className="flex items-center justify-center gap-2 rounded-xl border border-white/10 py-8 text-sm text-slate-400">
                                                        <Loader2
                                                            size={18}
                                                            className="animate-spin"
                                                        />
                                                        Searching for users...
                                                    </div>
                                                ) : filteredUsers.length > 0 ? (
                                                    <div className="max-h-80 space-y-2 overflow-y-auto overscroll-contain">
                                                        {filteredUsers.map((user, index) => (
                                                            <button
                                                                key={user.id ?? user.upi_id ?? index}
                                                                type="button"
                                                                onClick={() => selectReceiver(user)}
                                                                className="flex min-h-16 w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-3 text-left transition hover:border-blue-400/40 hover:bg-blue-500/[0.06]"
                                                            >
                                                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-700/70 text-sm font-semibold text-slate-200">
                                                                    {getInitials(getUserName(user))}
                                                                </span>

                                                                <span className="min-w-0 flex-1">
                                                                    <span className="block truncate text-sm font-semibold text-white">
                                                                        {getUserName(user)}
                                                                    </span>
                                                                    <span className="mt-1 block break-all text-xs text-slate-400">
                                                                        {user.upi_id || "No UPI ID available"}
                                                                    </span>
                                                                </span>

                                                                <ChevronRight
                                                                    size={18}
                                                                    className="shrink-0 text-slate-500"
                                                                />
                                                            </button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="rounded-xl border border-white/10 px-4 py-6 text-center text-sm text-slate-400">
                                                        No matching users. Try another name.
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </section>


                            <form onSubmit={transferMoney}>
                                <section className="rounded-2xl border border-white/10 bg-[#0d1422] p-4 sm:p-6">
                                    <div className="mb-5 flex items-start gap-3">
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-sm font-bold text-blue-300">
                                            2
                                        </span>

                                        <div>
                                            <h2 className="text-base font-semibold sm:text-lg">
                                                Enter transfer amount
                                            </h2>
                                            <p className="mt-1 text-sm leading-5 text-slate-400">
                                                Choose a suggested amount or enter your own.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                                        {QUICK_AMOUNTS.map((quickAmount) => (
                                            <button
                                                key={quickAmount}
                                                type="button"
                                                onClick={() => setAmount(String(quickAmount))}
                                                className={`min-h-11 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${amount === String(quickAmount)
                                                    ? "border-blue-400/60 bg-blue-500/15 text-blue-200"
                                                    : "border-white/10 bg-white/[0.025] text-slate-300 hover:border-blue-400/30 hover:bg-blue-500/[0.05]"
                                                    }`}
                                            >
                                                {formatCurrency(quickAmount)}
                                            </button>
                                        ))}
                                    </div>

                                    <label className="mt-5 block">
                                        <span className="mb-2 block text-sm font-medium text-slate-300">
                                            Amount in INR
                                        </span>

                                        <div className="relative">
                                            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-slate-400">
                                                ₹
                                            </span>

                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                autoComplete="off"
                                                value={amount}
                                                onChange={(event) => {
                                                    const value = event.target.value;

                                                    if (/^\d*\.?\d{0,2}$/.test(value)) {
                                                        setAmount(value);
                                                    }
                                                }}
                                                placeholder="0.00"
                                                className="min-h-14 w-full rounded-xl border border-white/10 bg-[#080d18] py-3 pl-10 pr-4 text-xl font-semibold text-white outline-none placeholder:text-slate-600 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10"
                                                required
                                                aria-describedby="transfer-amount-help"
                                            />
                                        </div>

                                        <span
                                            id="transfer-amount-help"
                                            className="mt-2 block text-xs leading-5 text-slate-500"
                                        >
                                            Maximum 2 decimal places. Transfers cannot exceed
                                            your available balance.
                                        </span>
                                    </label>

                                    {isInsufficientBalance && (
                                        <p className="mt-3 flex items-start gap-2 text-sm text-rose-300">
                                            <CircleAlert
                                                size={16}
                                                className="mt-0.5 shrink-0"
                                            />
                                            Amount exceeds your available balance.
                                        </p>
                                    )}

                                    {account.status?.toLowerCase() === "frozen" && (
                                        <p className="mt-3 flex items-start gap-2 text-sm text-rose-300">
                                            <CircleAlert
                                                size={16}
                                                className="mt-0.5 shrink-0"
                                            />
                                            Your account is frozen. You cannot transfer money.
                                        </p>
                                    )}

                                    <div className="mt-5 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
                                        <div className="flex items-center justify-between gap-3 text-sm">
                                            <span className="text-slate-400">
                                                Available balance
                                            </span>
                                            <span className="font-semibold text-white">
                                                {formatCurrency(currentBalance)}
                                            </span>
                                        </div>

                                        <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                                            <span className="text-slate-400">
                                                Transfer amount
                                            </span>
                                            <span className="font-semibold text-rose-300">
                                                {formatCurrency(transferAmount)}
                                            </span>
                                        </div>

                                        <div className="my-3 border-t border-white/10" />

                                        <div className="flex items-center justify-between gap-3 text-sm">
                                            <span className="font-medium text-slate-300">
                                                Estimated remaining
                                            </span>
                                            <span
                                                className={`font-bold ${remainingBalance < 0
                                                    ? "text-rose-300"
                                                    : "text-emerald-300"
                                                    }`}
                                            >
                                                {formatCurrency(remainingBalance)}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={!canTransfer}
                                        className="mt-5 flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                Processing transfer...
                                            </>
                                        ) : (
                                            <>
                                                <Send size={18} />
                                                {receiver
                                                    ? `Transfer ${formatCurrency(transferAmount)}`
                                                    : "Select a receiver to continue"}
                                                {!loading && <ArrowRight size={17} />}
                                            </>
                                        )}
                                    </button>

                                    <p className="mt-3 text-center text-xs leading-5 text-slate-500">
                                        Verify the receiver and amount before submitting.
                                    </p>
                                </section>
                            </form>
                        </div>


                        <aside className="space-y-5 lg:sticky lg:top-6">
                            <section className="rounded-2xl border border-white/10 bg-[#0d1422] p-5 sm:p-6">
                                <div className="flex items-center justify-between gap-3">
                                    <h2 className="font-semibold">Transfer summary</h2>
                                    <ArrowRightLeft
                                        size={19}
                                        className="text-blue-300"
                                    />
                                </div>

                                <div className="my-5 border-t border-white/10" />

                                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                    Sending to
                                </p>

                                {receiver ? (
                                    <div className="mt-3 flex items-center gap-3">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-500/15 font-semibold text-blue-200">
                                            {getInitials(getUserName(receiver))}
                                        </div>

                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold">
                                                {getUserName(receiver)}
                                            </p>
                                            <p className="mt-1 break-all text-xs text-slate-400">
                                                {receiver.upi_id}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-3 flex items-center gap-3 rounded-xl border border-dashed border-white/10 p-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.04] text-slate-500">
                                            <UserRound size={19} />
                                        </div>
                                        <p className="text-sm text-slate-500">
                                            No receiver selected
                                        </p>
                                    </div>
                                )}

                                <div className="my-5 border-t border-white/10" />

                                <div className="space-y-4">
                                    <SummaryRow
                                        label="Available balance"
                                        value={formatCurrency(currentBalance)}
                                    />

                                    <SummaryRow
                                        label="Transfer amount"
                                        value={formatCurrency(transferAmount)}
                                    />

                                    <SummaryRow
                                        label="Transaction fee"
                                        value="Confirm with your bank"
                                    />

                                    <div className="border-t border-white/10 pt-4">
                                        <SummaryRow
                                            label="Estimated remaining"
                                            value={formatCurrency(remainingBalance)}
                                            strong
                                        />
                                    </div>
                                </div>

                                <div className="mt-5 flex items-start gap-2 rounded-xl border border-blue-400/15 bg-blue-500/[0.06] p-3 text-xs leading-5 text-slate-400">
                                    <ShieldCheck
                                        size={17}
                                        className="mt-0.5 shrink-0 text-blue-300"
                                    />
                                    <p>
                                        Your transfer request is submitted to the bank
                                        server. A successful message is shown only after the
                                        server confirms it.
                                    </p>
                                </div>
                            </section>

                            <section className="rounded-2xl border border-white/10 bg-[#0d1422] p-5">
                                <div className="flex items-center gap-2">
                                    <Clock size={17} className="text-blue-300" />
                                    <h3 className="text-sm font-semibold">
                                        Before you transfer
                                    </h3>
                                </div>

                                <ul className="mt-4 space-y-3 text-sm leading-5 text-slate-400">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2
                                            size={16}
                                            className="mt-0.5 shrink-0 text-emerald-400"
                                        />
                                        Confirm the receiver&apos;s name and UPI ID.
                                    </li>

                                    <li className="flex items-start gap-2">
                                        <CheckCircle2
                                            size={16}
                                            className="mt-0.5 shrink-0 text-emerald-400"
                                        />
                                        Check the amount and available balance.
                                    </li>

                                    <li className="flex items-start gap-2">
                                        <CheckCircle2
                                            size={16}
                                            className="mt-0.5 shrink-0 text-emerald-400"
                                        />
                                        Never share your password or OTP.
                                    </li>
                                </ul>
                            </section>
                        </aside>
                    </div>
                )}
            </div>
        </div>
    );
}

function SummaryRow({ label, value, strong = false }) {
    return (
        <div className="flex items-start justify-between gap-4">
            <span className="text-sm text-slate-400">{label}</span>
            <span
                className={`max-w-[60%] break-words text-right ${strong
                    ? "text-base font-bold text-white"
                    : "text-sm font-medium text-slate-200"
                    }`}
            >
                {value}
            </span>
        </div>
    );
}

function ReceiptRow({
    label,
    value,
    valueClass = "text-white",
    copyable = false,
    onCopy,
}) {
    return (
        <div className="flex items-start justify-between gap-4">
            <span className="shrink-0 text-sm text-slate-400">{label}</span>

            <div className="flex min-w-0 items-start gap-2 text-right">
                <span className={`break-words text-sm font-medium ${valueClass}`}>
                    {value}
                </span>

                {copyable && (
                    <button
                        type="button"
                        onClick={onCopy}
                        aria-label={`Copy ${label}`}
                        title={`Copy ${label}`}
                        className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                    >
                        <Copy size={14} />
                    </button>
                )}
            </div>
        </div>
    );
}
