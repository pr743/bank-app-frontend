"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import API from "@/app/Api/api";
import {
    ArrowDownLeft,
    ArrowUpRight,
    ArrowLeftRight,
    RefreshCw,
    Search,
    History,
    Wallet,
    Banknote,
    TrendingUp,
    TrendingDown,
    CalendarDays,
    X,
    AlertTriangle,
    ReceiptText,
} from "lucide-react";

const formatCurrency = (value) =>
    Number(value || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 2,
    });

const formatDateTime = (value) => {
    if (!value) return "Date unavailable";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Date unavailable";

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const getType = (transaction) => {
    const type = String(
        transaction?.type ?? transaction?.transaction_type ?? ""
    ).toLowerCase();

    if (type.includes("deposit")) return "deposit";
    if (type.includes("withdraw")) return "withdraw";
    if (type.includes("transfer")) return "transfer";

    return "other";
};

const getAmount = (transaction) =>
    Number(transaction?.amount ?? transaction?.transaction_amount ?? 0);

const getTransactionId = (transaction, index) =>
    transaction?.id ??
    transaction?.transaction_id ??
    `${transaction?.created_at ?? "transaction"}-${index}`;

const getAccount = (data) => {
    const accounts = data?.accounts ?? data?.data?.accounts;

    if (Array.isArray(accounts)) return accounts[0] ?? null;
    if (accounts && typeof accounts === "object") return accounts;

    const direct = data?.data ?? data;

    if (Array.isArray(direct)) return direct[0] ?? null;
    if (direct?.account_number) return direct;

    return null;
};

const getRows = (response) => {
    const data = response?.data?.data ?? response?.data;

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.transactions)) return data.transactions;
    if (Array.isArray(data?.history)) return data.history;

    return [];
};

function StatCard({ label, value, icon: Icon, accent, description }) {
    return (
        <div className="min-w-0 rounded-2xl border border-white/10 bg-[#111827] p-4 sm:rounded-3xl sm:p-5">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs leading-5 text-gray-400 sm:text-sm">{label}</p>
                    <p className={`mt-2 break-words text-2xl font-bold sm:text-3xl ${accent}`}>
                        {value}
                    </p>
                    {description && (
                        <p className="mt-2 text-xs leading-5 text-gray-500">
                            {description}
                        </p>
                    )}
                </div>

                <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent} bg-white/[0.04]`}
                >
                    <Icon size={19} />
                </div>
            </div>
        </div>
    );
}

function TypeBadge({ type }) {
    const styles = {
        deposit: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
        withdraw: "bg-red-500/10 text-red-300 border-red-500/20",
        transfer: "bg-blue-500/10 text-blue-300 border-blue-500/20",
        other: "bg-gray-500/10 text-gray-300 border-gray-500/20",
    };

    const label = {
        deposit: "Deposit",
        withdraw: "Withdrawal",
        transfer: "Transfer",
        other: "Other",
    };

    return (
        <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${styles[type]}`}
        >
            {label[type]}
        </span>
    );
}

function TransactionItem({ transaction, index }) {
    const type = getType(transaction);
    const amount = getAmount(transaction);

    const isDeposit = type === "deposit";
    const isWithdraw = type === "withdraw";

    const Icon = isDeposit
        ? ArrowDownLeft
        : isWithdraw
            ? ArrowUpRight
            : ArrowLeftRight;

    const iconStyle = isDeposit
        ? "bg-emerald-500/10 text-emerald-300"
        : isWithdraw
            ? "bg-red-500/10 text-red-300"
            : type === "transfer"
                ? "bg-blue-500/10 text-blue-300"
                : "bg-gray-500/10 text-gray-300";

    const title = isDeposit
        ? "Funds added"
        : isWithdraw
            ? "Cash withdrawal"
            : type === "transfer"
                ? `Transfer${transaction?.receiver_name ? ` to ${transaction.receiver_name}` : ""}`
                : "Transaction";

    const reference =
        transaction?.receiver_account_number ||
        transaction?.sender_account_number ||
        transaction?.account_number ||
        transaction?.reference ||
        transaction?.reference_number ||
        "";

    const id =
        transaction?.id ?? transaction?.transaction_id ?? null;

    const signedAmount = isDeposit ? "+" : type === "other" ? "" : "−";

    return (
        <article
            key={getTransactionId(transaction, index)}
            className="min-w-0 rounded-2xl border border-white/10 bg-[#111827] p-4 transition-colors hover:border-white/20 sm:rounded-3xl sm:p-5"
        >
            <div className="flex min-w-0 items-start gap-3">
                <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconStyle}`}
                >
                    <Icon size={21} />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="break-words text-sm font-semibold text-white sm:text-base">
                            {title}
                        </h3>
                        <TypeBadge type={type} />
                    </div>

                    <p className="mt-1.5 flex items-start gap-1.5 text-xs leading-5 text-gray-400">
                        <CalendarDays size={13} className="mt-0.5 shrink-0" />
                        <span>{formatDateTime(transaction?.created_at)}</span>
                    </p>

                    {id != null && (
                        <p className="mt-1 break-all text-xs text-gray-500">
                            Transaction ID: {id}
                        </p>
                    )}

                    {reference && (
                        <p className="mt-1 break-all text-xs text-gray-500">
                            Reference: {reference}
                        </p>
                    )}
                </div>

                <div className="shrink-0 text-right">
                    <p
                        className={`break-words text-sm font-bold sm:text-base ${isDeposit
                            ? "text-emerald-300"
                            : isWithdraw
                                ? "text-red-300"
                                : type === "transfer"
                                    ? "text-blue-300"
                                    : "text-gray-200"
                            }`}
                    >
                        {signedAmount}₹{formatCurrency(amount)}
                    </p>
                    <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-gray-500">
                        {transaction?.status || "Recorded"}
                    </p>
                </div>
            </div>
        </article>
    );
}

export default function TransactionHistoryPage() {
    const [transactions, setTransactions] = useState([]);
    const [account, setAccount] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [page, setPage] = useState(1);
    const pageSize = 8;

    const fetchTransactions = useCallback(async (manual = false) => {
        if (manual) setIsRefreshing(true);

        setError("");

        try {
            const accountResponse = await API.get("/account/my-account");
            const accountData = getAccount(accountResponse.data);

            if (!accountData?.account_number) {
                setAccount(null);
                setTransactions([]);
                throw new Error("No bank account was found for this user.");
            }

            setAccount(accountData);

            const historyResponse = await API.get(
                `/transaction/history/${encodeURIComponent(accountData.account_number)}`
            );

            setTransactions(getRows(historyResponse));
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                "Unable to load transaction history."
            );
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchTransactions();
    }, [fetchTransactions]);

    const totals = useMemo(() => {
        const deposits = transactions
            .filter((item) => getType(item) === "deposit")
            .reduce((sum, item) => sum + getAmount(item), 0);

        const withdrawals = transactions
            .filter((item) => getType(item) === "withdraw")
            .reduce((sum, item) => sum + getAmount(item), 0);

        const transfers = transactions
            .filter((item) => getType(item) === "transfer")
            .reduce((sum, item) => sum + getAmount(item), 0);

        return {
            count: transactions.length,
            deposits,
            withdrawals,
            transfers,
        };
    }, [transactions]);

    const filteredTransactions = useMemo(() => {
        const query = search.trim().toLowerCase();
        const today = new Date().toDateString();

        return transactions
            .filter((item) => {
                const type = getType(item);
                const date = item?.created_at ? new Date(item.created_at) : null;
                const isValidDate = date && !Number.isNaN(date.getTime());

                const matchesSearch =
                    !query ||
                    [
                        item?.receiver_name,
                        item?.sender_name,
                        item?.type,
                        item?.transaction_type,
                        item?.receiver_account_number,
                        item?.sender_account_number,
                        item?.account_number,
                        item?.reference,
                        item?.reference_number,
                        item?.id,
                        item?.transaction_id,
                        isValidDate ? formatDateTime(date) : "",
                    ].some((value) =>
                        String(value ?? "").toLowerCase().includes(query)
                    );

                const matchesFilter =
                    filter === "all"
                        ? true
                        : filter === "today"
                            ? isValidDate && date.toDateString() === today
                            : type === filter;

                return matchesSearch && matchesFilter;
            })
            .sort((a, b) => {
                const dateA = new Date(a?.created_at || 0).getTime();
                const dateB = new Date(b?.created_at || 0).getTime();
                return dateB - dateA;
            });
    }, [transactions, search, filter]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPage(1);
    }, [search, filter]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredTransactions.length / pageSize)
    );

    const paginatedTransactions = filteredTransactions.slice(
        (page - 1) * pageSize,
        page * pageSize
    );

    if (loading) {
        return (
            <main className="flex min-h-[70vh] items-center justify-center bg-gray-950 px-4 text-white">
                <div className="flex flex-col items-center gap-3 text-center">
                    <RefreshCw size={30} className="animate-spin text-blue-400" />
                    <p className="text-sm text-gray-400">
                        Loading your transaction history…
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen overflow-x-hidden bg-gray-950 px-3 py-5 text-white sm:px-5 sm:py-7 lg:px-8">
            <div className="mx-auto w-full max-w-7xl space-y-6">

                <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
                            Account activity
                        </p>
                        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                            Transaction history
                        </h1>
                        <p className="mt-2 text-sm leading-6 text-gray-400">
                            Review, search, and filter your account transactions.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => fetchTransactions(true)}
                        disabled={isRefreshing}
                        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >
                        <RefreshCw
                            size={16}
                            className={isRefreshing ? "animate-spin" : ""}
                        />
                        {isRefreshing ? "Refreshing…" : "Refresh history"}
                    </button>
                </header>

                {error && (
                    <div
                        role="alert"
                        className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200"
                    >
                        <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                            <p>{error}</p>
                            <button
                                type="button"
                                onClick={() => fetchTransactions(true)}
                                className="mt-2 font-semibold text-red-100 underline underline-offset-4"
                            >
                                Try again
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={() => setError("")}
                            aria-label="Dismiss error"
                            className="rounded-lg p-1 hover:bg-white/5"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}


                {account && (
                    <section className="flex min-w-0 flex-col gap-3 rounded-2xl border border-blue-400/10 bg-gradient-to-r from-blue-950/80 to-[#111827] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-400/10 text-blue-300">
                                <Wallet size={21} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-white">
                                    Selected account
                                </p>
                                <p className="mt-1 break-all text-xs text-gray-400">
                                    Account ending in •••• {String(account.account_number).slice(-4)}
                                </p>
                            </div>
                        </div>
                        <div className="sm:text-right">
                            <p className="text-xs text-gray-400">Current balance</p>
                            <p className="mt-1 break-words text-xl font-bold text-white">
                                ₹{formatCurrency(account.balance)}
                            </p>
                        </div>
                    </section>
                )}


                <section className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
                    <StatCard
                        label="Transactions"
                        value={totals.count}
                        icon={History}
                        accent="text-white"
                        description="Records returned by the API"
                    />
                    <StatCard
                        label="Total deposits"
                        value={`₹${formatCurrency(totals.deposits)}`}
                        icon={TrendingUp}
                        accent="text-emerald-300"
                    />
                    <StatCard
                        label="Total withdrawals"
                        value={`₹${formatCurrency(totals.withdrawals)}`}
                        icon={TrendingDown}
                        accent="text-red-300"
                    />
                    <StatCard
                        label="Total transfers"
                        value={`₹${formatCurrency(totals.transfers)}`}
                        icon={ArrowLeftRight}
                        accent="text-blue-300"
                    />
                </section>


                <section className="min-w-0 rounded-2xl border border-white/10 bg-[#111827] p-3 sm:rounded-3xl sm:p-5">
                    <div className="flex flex-col gap-3 md:flex-row">
                        <div className="relative min-w-0 flex-1">
                            <Search
                                size={18}
                                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"
                            />
                            <input
                                type="text"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search name, type, date, reference or ID…"
                                className="min-h-12 w-full rounded-xl border border-white/10 bg-gray-950 py-3 pl-11 pr-10 text-sm text-white outline-none placeholder:text-gray-500 focus:border-blue-500"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                    aria-label="Clear search"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 hover:text-white"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-400 md:shrink-0">
                            <ReceiptText size={16} />
                            {filteredTransactions.length} result
                            {filteredTransactions.length === 1 ? "" : "s"}
                        </div>
                    </div>


                    <div className="mt-4 flex w-full min-w-0 flex-wrap items-center gap-2">
                        {["all", "today", "deposit", "withdraw", "transfer"].map((type) => {
                            const labels = {
                                all: "All transactions",
                                today: "Today",
                                deposit: "Deposits",
                                withdraw: "Withdrawals",
                                transfer: "Transfers",
                            };

                            return (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setFilter(type)}
                                    className={`min-h-10 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${filter === type
                                        ? "border-blue-500/30 bg-blue-600 text-white"
                                        : "border-white/10 bg-gray-950 text-gray-400 hover:bg-gray-800 hover:text-white"
                                        }`}
                                >
                                    {labels[type]}
                                </button>
                            );
                        })}
                    </div>

                </section>


                <section className="min-w-0">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-lg font-semibold sm:text-xl">
                            Your transactions
                        </h2>
                        <p className="text-xs text-gray-500">
                            {filteredTransactions.length > 0
                                ? `Showing ${(page - 1) * pageSize + 1}–${Math.min(
                                    page * pageSize,
                                    filteredTransactions.length
                                )} of ${filteredTransactions.length}`
                                : "No matching records"}
                        </p>
                    </div>

                    {paginatedTransactions.length === 0 ? (
                        <div className="rounded-3xl border border-white/10 bg-[#111827] px-5 py-12 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] text-gray-400">
                                <Banknote size={25} />
                            </div>
                            <h3 className="mt-4 font-semibold text-white">
                                No transactions found
                            </h3>
                            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-400">
                                Try another filter or search term, or refresh to retrieve the
                                latest records.
                            </p>
                            {(search || filter !== "all") && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch("");
                                        setFilter("all");
                                    }}
                                    className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {paginatedTransactions.map((transaction, index) => (
                                <TransactionItem
                                    key={getTransactionId(
                                        transaction,
                                        (page - 1) * pageSize + index
                                    )}
                                    transaction={transaction}
                                    index={(page - 1) * pageSize + index}
                                />
                            ))}
                        </div>
                    )}


                    {filteredTransactions.length > pageSize && (
                        <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#111827] p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                            <p className="text-center text-xs text-gray-400 sm:text-left">
                                Page {page} of {totalPages}
                            </p>

                            <div className="flex items-center justify-center gap-2">
                                <button
                                    type="button"
                                    disabled={page <= 1}
                                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                                    className="min-h-10 rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-200 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Previous
                                </button>
                                <button
                                    type="button"
                                    disabled={page >= totalPages}
                                    onClick={() =>
                                        setPage((current) => Math.min(totalPages, current + 1))
                                    }
                                    className="min-h-10 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
