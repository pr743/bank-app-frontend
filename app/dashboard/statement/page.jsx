"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import API from "@/app/Api/api";
import {
    Download,
    Search,
    ArrowUpRight,
    ArrowDownLeft,
    RefreshCw,
    Wallet,
    Loader2,
    Calendar,
    FileText,
    AlertCircle,
    Filter,
    X,
    ChevronLeft,
    ChevronRight,
    ReceiptText,
} from "lucide-react";

const ITEMS_PER_PAGE = 10;

const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(Number(value) || 0);

const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const formatDateTime = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const getTransactionType = (transaction) => {
    const type = String(
        transaction?.transaction_type ??
        transaction?.type ??
        ""
    ).toLowerCase();

    if (type.includes("deposit")) return "deposit";
    if (type.includes("withdraw")) return "withdraw";
    if (type.includes("transfer")) return "transfer";

    return type || "unknown";
};

const getTransactionAmount = (transaction) =>
    Number(
        transaction?.amount ??
        transaction?.transaction_amount ??
        0
    );

const getTransactionDate = (transaction) =>
    transaction?.created_at ??
    transaction?.transaction_date ??
    transaction?.date ??
    null;

const getTransactionId = (transaction, index) =>
    transaction?.id ??
    transaction?.transaction_id ??
    `${getTransactionDate(transaction) ?? "transaction"}-${index}`;

function TypeBadge({ type }) {
    const styles = {
        deposit: "bg-emerald-50 text-emerald-700 ring-emerald-200",
        withdraw: "bg-rose-50 text-rose-700 ring-rose-200",
        transfer: "bg-blue-50 text-blue-700 ring-blue-200",
        unknown: "bg-gray-100 text-gray-600 ring-gray-200",
    };

    const labels = {
        deposit: "Deposit",
        withdraw: "Withdrawal",
        transfer: "Transfer",
        unknown: "Other",
    };

    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${styles[type] || styles.unknown
                }`}
        >
            {labels[type] || type}
        </span>
    );
}

function StatCard({ title, value, icon: Icon, description, tone }) {
    const tones = {
        blue: "bg-blue-50 text-blue-700",
        green: "bg-emerald-50 text-emerald-700",
        red: "bg-rose-50 text-rose-700",
    };

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="mt-2 break-words text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                        {value}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">{description}</p>
                </div>

                <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[tone] || tones.blue
                        }`}
                >
                    <Icon size={20} />
                </div>
            </div>
        </div>
    );
}

function EmptyState({ title, description }) {
    return (
        <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                <ReceiptText size={26} />
            </div>

            <h3 className="mt-4 text-base font-semibold text-gray-900">
                {title}
            </h3>

            <p className="mt-1 max-w-sm text-sm leading-6 text-gray-500">
                {description}
            </p>
        </div>
    );
}

export default function StatementPage() {
    const now = new Date();

    const [accountNumber, setAccountNumber] = useState("");
    const [balance, setBalance] = useState(0);
    const [accountStatus, setAccountStatus] = useState("");
    const [transactions, setTransactions] = useState([]);

    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);

    const [loadingAccount, setLoadingAccount] = useState(true);
    const [loadingStatement, setLoadingStatement] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState("");
    const [downloadError, setDownloadError] = useState("");

    const fetchAccount = useCallback(async () => {
        const response = await API.get("/account/my-account");
        const data = response?.data;

        const accountData = data?.accounts;
        const account = Array.isArray(accountData)
            ? accountData[0]
            : accountData;

        if (!account?.account_number) {
            setAccountNumber("");
            setBalance(Number(data?.balance) || 0);
            setAccountStatus("");
            setTransactions([]);
            return null;
        }

        setAccountNumber(String(account.account_number));
        setBalance(Number(account.balance ?? data?.balance) || 0);
        setAccountStatus(String(account.status || "").toLowerCase());

        return String(account.account_number);
    }, []);

    const fetchStatement = useCallback(
        async (number, selectedMonth = month, selectedYear = year) => {
            if (!number) {
                setTransactions([]);
                return;
            }

            setLoadingStatement(true);
            setError("");

            try {
                const response = await API.get(
                    `/transaction/statement/${encodeURIComponent(number)}/${selectedMonth}/${selectedYear}`
                );

                const data = response?.data?.data;

                if (Array.isArray(data)) {
                    setTransactions(data);
                } else if (Array.isArray(response?.data?.transactions)) {
                    setTransactions(response.data.transactions);
                } else {
                    setTransactions([]);
                }
            } catch (err) {
                setTransactions([]);

                setError(
                    err?.response?.data?.message ||
                    "Unable to load your statement. Please try again."
                );
            } finally {
                setLoadingStatement(false);
            }
        },
        [month, year]
    );

    const loadPage = useCallback(async () => {
        setLoadingAccount(true);
        setError("");

        try {
            const number = await fetchAccount();

            if (number) {
                await fetchStatement(number);
            } else {
                setError(
                    "No bank account was found. Create an account before viewing your statement."
                );
            }
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                "Unable to load your account details. Please check your connection and try again."
            );
        } finally {
            setLoadingAccount(false);
        }
    }, [fetchAccount, fetchStatement]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadPage();
    }, [loadPage]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentPage(1);
    }, [search, typeFilter, month, year]);

    const filteredTransactions = useMemo(() => {
        const query = search.trim().toLowerCase();

        return transactions.filter((transaction) => {
            const type = getTransactionType(transaction);

            const matchesType =
                typeFilter === "all" || type === typeFilter;

            const searchableText = [
                transaction?.id,
                transaction?.transaction_id,
                transaction?.reference,
                transaction?.reference_number,
                transaction?.description,
                transaction?.sender_account_number,
                transaction?.receiver_account_number,
                transaction?.account_number,
                type,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            const matchesSearch =
                !query || searchableText.includes(query);

            return matchesType && matchesSearch;
        });
    }, [transactions, search, typeFilter]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE)
    );

    const paginatedTransactions = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;

        return filteredTransactions.slice(
            start,
            start + ITEMS_PER_PAGE
        );
    }, [filteredTransactions, currentPage]);

    const firstItem =
        filteredTransactions.length === 0
            ? 0
            : (currentPage - 1) * ITEMS_PER_PAGE + 1;

    const lastItem = Math.min(
        currentPage * ITEMS_PER_PAGE,
        filteredTransactions.length
    );

    const totalCredit = filteredTransactions.reduce(
        (total, transaction) =>
            getTransactionType(transaction) === "deposit"
                ? total + getTransactionAmount(transaction)
                : total,
        0
    );

    const totalDebit = filteredTransactions.reduce(
        (total, transaction) =>
            ["withdraw", "transfer"].includes(
                getTransactionType(transaction)
            )
                ? total + getTransactionAmount(transaction)
                : total,
        0
    );

    const handleRefresh = async () => {
        setError("");
        setLoadingAccount(true);

        try {
            const number = await fetchAccount();

            if (!number) {
                setTransactions([]);
                setError("No bank account was found.");
                return;
            }

            await fetchStatement(number, month, year);
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                "Unable to refresh your statement."
            );
        } finally {
            setLoadingAccount(false);
        }
    };

    const handleDownload = async () => {
        if (!accountNumber) {
            setDownloadError("No account is available to download a statement.");
            return;
        }

        setDownloading(true);
        setDownloadError("");

        let downloadTab = null;

        try {

            downloadTab = window.open("about:blank", "_blank");

            const response = await API.get(
                `/transaction/statement/pdf/${encodeURIComponent(accountNumber)}`,
                { responseType: "blob" }
            );

            const contentType =
                response.headers?.["content-type"] || "";

            if (
                !response.data ||
                response.data.size === 0 ||
                contentType.includes("application/json")
            ) {
                const message =
                    "The server did not return a valid PDF. Check the backend PDF endpoint.";
                if (downloadTab) downloadTab.close();
                setDownloadError(message);
                return;
            }

            const pdfBlob = new Blob([response.data], {
                type: "application/pdf",
            });

            const pdfUrl = URL.createObjectURL(pdfBlob);

            if (downloadTab) {
                downloadTab.location.href = pdfUrl;
            } else {
                const link = document.createElement("a");
                link.href = pdfUrl;
                link.download = `FinBank-Statement-${accountNumber}-${month}-${year}.pdf`;
                document.body.appendChild(link);
                link.click();
                link.remove();
            }

            window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 60000);
        } catch (err) {
            if (downloadTab) downloadTab.close();

            setDownloadError(
                err?.response?.data?.message ||
                "Unable to download the statement. Please check that the backend PDF endpoint is available."
            );
        } finally {
            setDownloading(false);
        }
    };

    const resetFilters = () => {
        setSearch("");
        setTypeFilter("all");
        setMonth(now.getMonth() + 1);
        setYear(now.getFullYear());
        setCurrentPage(1);
    };

    const currentYear = now.getFullYear();
    const years = Array.from(
        { length: 6 },
        (_, index) => currentYear - index
    );

    return (
        <div className="statement-page min-h-screen bg-gray-50 px-4 py-5 text-gray-900 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
            <div className="mx-auto w-full max-w-7xl space-y-6">

                <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                            <FileText size={25} />
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                                Account statement
                            </h1>
                            <p className="mt-1 text-sm leading-6 text-gray-500">
                                Review and filter your account transactions.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 min-[420px]:flex-row">
                        <button
                            type="button"
                            onClick={handleRefresh}
                            disabled={loadingAccount || loadingStatement}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <RefreshCw
                                size={16}
                                className={
                                    loadingAccount || loadingStatement
                                        ? "animate-spin"
                                        : ""
                                }
                            />
                            Refresh
                        </button>

                        <button
                            type="button"
                            onClick={handleDownload}
                            disabled={downloading || !accountNumber}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {downloading ? (
                                <Loader2 size={17} className="animate-spin" />
                            ) : (
                                <Download size={17} />
                            )}
                            {downloading ? "Preparing..." : "Download PDF"}
                        </button>
                    </div>
                </header>


                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-800 p-5 text-white shadow-sm sm:p-6">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-sm font-medium text-blue-100">
                                <Wallet size={18} />
                                Account balance
                            </div>
                            <span
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${accountStatus === "active"
                                    ? "bg-emerald-400/20 text-emerald-100"
                                    : accountStatus === "frozen"
                                        ? "bg-rose-400/20 text-rose-100"
                                        : "bg-white/15 text-white"
                                    }`}
                            >
                                {accountStatus
                                    ? accountStatus.charAt(0).toUpperCase() +
                                    accountStatus.slice(1)
                                    : "Account"}
                            </span>
                        </div>

                        <p className="mt-5 break-words text-3xl font-bold tracking-tight sm:text-4xl">
                            {formatCurrency(balance)}
                        </p>

                        <p className="mt-3 break-all text-sm text-blue-100">
                            {accountNumber
                                ? `Account •••• ${accountNumber.slice(-4)}`
                                : "No account available"}
                        </p>
                    </div>

                    <StatCard
                        title="Total credit"
                        value={formatCurrency(totalCredit)}
                        icon={ArrowDownLeft}
                        description="Deposits in the filtered results"
                        tone="green"
                    />

                    <StatCard
                        title="Total debit"
                        value={formatCurrency(totalDebit)}
                        icon={ArrowUpRight}
                        description="Withdrawals and transfers in the filtered results"
                        tone="red"
                    />
                </section>


                <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                    <div className="mb-4 flex items-center gap-2">
                        <Filter size={18} className="text-gray-500" />
                        <h2 className="font-semibold text-gray-900">
                            Filter transactions
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <label className="relative block">
                            <span className="mb-1.5 block text-xs font-semibold text-gray-500">
                                Search
                            </span>
                            <Search
                                size={17}
                                className="pointer-events-none absolute left-3 top-[39px] text-gray-400"
                            />
                            <input
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search transactions..."
                                className="min-h-11 w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </label>

                        <label className="block">
                            <span className="mb-1.5 block text-xs font-semibold text-gray-500">
                                Transaction type
                            </span>
                            <select
                                value={typeFilter}
                                onChange={(event) => setTypeFilter(event.target.value)}
                                className="min-h-11 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            >
                                <option value="all">All types</option>
                                <option value="deposit">Deposits</option>
                                <option value="withdraw">Withdrawals</option>
                                <option value="transfer">Transfers</option>
                            </select>
                        </label>

                        <label className="block">
                            <span className="mb-1.5 block text-xs font-semibold text-gray-500">
                                Month
                            </span>
                            <select
                                value={month}
                                onChange={(event) =>
                                    setMonth(Number(event.target.value))
                                }
                                className="min-h-11 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            >
                                {MONTHS.map((monthName, index) => (
                                    <option key={monthName} value={index + 1}>
                                        {monthName}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="block">
                            <span className="mb-1.5 block text-xs font-semibold text-gray-500">
                                Year
                            </span>
                            <select
                                value={year}
                                onChange={(event) =>
                                    setYear(Number(event.target.value))
                                }
                                className="min-h-11 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            >
                                {years.map((yearOption) => (
                                    <option key={yearOption} value={yearOption}>
                                        {yearOption}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-gray-500">
                            Results for{" "}
                            <span className="font-semibold text-gray-800">
                                {MONTHS[month - 1]} {year}
                            </span>
                        </p>

                        <button
                            type="button"
                            onClick={resetFilters}
                            className="inline-flex min-h-9 items-center justify-center gap-2 self-start rounded-lg px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 sm:self-auto"
                        >
                            <X size={15} />
                            Reset filters
                        </button>
                    </div>
                </section>


                {error && (
                    <div
                        role="alert"
                        className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
                    >
                        <AlertCircle size={19} className="mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                            <p className="font-semibold">Statement unavailable</p>
                            <p className="mt-1 break-words">{error}</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleRefresh}
                            className="shrink-0 font-semibold underline underline-offset-2"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {downloadError && (
                    <div
                        role="alert"
                        className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
                    >
                        <AlertCircle size={19} className="mt-0.5 shrink-0" />
                        <p className="min-w-0 flex-1 break-words">
                            {downloadError}
                        </p>
                        <button
                            type="button"
                            aria-label="Dismiss download error"
                            onClick={() => setDownloadError("")}
                            className="rounded-lg p-1 hover:bg-amber-100"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}


                <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-2 border-b border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <div>
                            <h2 className="text-base font-bold text-gray-900">
                                Transactions
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Your statement for the selected period
                            </p>
                        </div>

                        <span className="inline-flex self-start rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 sm:self-auto">
                            {filteredTransactions.length} results
                        </span>
                    </div>

                    {loadingAccount || loadingStatement ? (
                        <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-4 text-center">
                            <Loader2
                                size={30}
                                className="animate-spin text-blue-700"
                            />
                            <p className="text-sm text-gray-500">
                                Loading your transactions...
                            </p>
                        </div>
                    ) : filteredTransactions.length === 0 ? (
                        <EmptyState
                            title={
                                transactions.length === 0
                                    ? "No transactions found"
                                    : "No matching transactions"
                            }
                            description={
                                transactions.length === 0
                                    ? "There are no transactions for this account and selected month."
                                    : "Try changing the search text or filters to see more results."
                            }
                        />
                    ) : (
                        <>

                            <div className="divide-y divide-gray-100 md:hidden">
                                {paginatedTransactions.map((transaction, index) => {
                                    const type = getTransactionType(transaction);
                                    const amount = getTransactionAmount(transaction);
                                    const isCredit = type === "deposit";

                                    const counterparty =
                                        transaction?.receiver_account_number ||
                                        transaction?.sender_account_number ||
                                        transaction?.account_number ||
                                        "";

                                    return (
                                        <article
                                            key={getTransactionId(transaction, index)}
                                            className="p-4"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div
                                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isCredit
                                                        ? "bg-emerald-50 text-emerald-700"
                                                        : type === "withdraw" ||
                                                            type === "transfer"
                                                            ? "bg-rose-50 text-rose-700"
                                                            : "bg-gray-100 text-gray-600"
                                                        }`}
                                                >
                                                    {isCredit ? (
                                                        <ArrowDownLeft size={20} />
                                                    ) : (
                                                        <ArrowUpRight size={20} />
                                                    )}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <p className="font-semibold text-gray-900">
                                                            {type === "deposit"
                                                                ? "Deposit"
                                                                : type === "withdraw"
                                                                    ? "Withdrawal"
                                                                    : type === "transfer"
                                                                        ? "Transfer"
                                                                        : "Transaction"}
                                                        </p>
                                                        <TypeBadge type={type} />
                                                    </div>

                                                    <p className="mt-1 text-xs text-gray-500">
                                                        {formatDateTime(
                                                            getTransactionDate(transaction)
                                                        )}
                                                    </p>

                                                    {counterparty && (
                                                        <p className="mt-1 break-all text-xs text-gray-500">
                                                            Account: {counterparty}
                                                        </p>
                                                    )}

                                                    {(transaction?.description ||
                                                        transaction?.reference ||
                                                        transaction?.reference_number) && (
                                                            <p className="mt-1 break-words text-xs text-gray-500">
                                                                {transaction?.description ||
                                                                    `Reference: ${transaction?.reference ||
                                                                    transaction?.reference_number
                                                                    }`}
                                                            </p>
                                                        )}

                                                    <p
                                                        className={`mt-3 text-lg font-bold ${isCredit
                                                            ? "text-emerald-700"
                                                            : "text-gray-900"
                                                            }`}
                                                    >
                                                        {isCredit ? "+" : type === "withdraw" || type === "transfer" ? "−" : ""}
                                                        {formatCurrency(amount)}
                                                    </p>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>



                            <div className="hidden w-full min-w-0 md:block">
                                <table className="w-full table-fixed border-collapse text-left">
                                    <colgroup>
                                        <col className="w-[21%]" />
                                        <col className="w-[20%]" />
                                        <col className="w-[23%]" />
                                        <col className="w-[15%]" />
                                        <col className="w-[21%]" />
                                    </colgroup>

                                    <thead className="bg-gray-50">
                                        <tr className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            <th className="px-3 py-4 lg:px-4">Transaction</th>
                                            <th className="px-3 py-4 lg:px-4">Date &amp; time</th>
                                            <th className="px-3 py-4 lg:px-4">Account / reference</th>
                                            <th className="px-3 py-4 lg:px-4">Type</th>
                                            <th className="px-3 py-4 text-right lg:px-4">Amount</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-100">
                                        {paginatedTransactions.map((transaction, index) => {
                                            const type = getTransactionType(transaction);
                                            const amount = getTransactionAmount(transaction);
                                            const isCredit = type === "deposit";

                                            const reference =
                                                transaction?.receiver_account_number ||
                                                transaction?.sender_account_number ||
                                                transaction?.account_number ||
                                                transaction?.reference ||
                                                transaction?.reference_number ||
                                                "—";

                                            return (
                                                <tr
                                                    key={getTransactionId(transaction, index)}
                                                    className="transition-colors hover:bg-gray-50"
                                                >
                                                    <td className="px-3 py-4 lg:px-4">
                                                        <div className="flex min-w-0 items-center gap-2">
                                                            <div
                                                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isCredit
                                                                    ? "bg-emerald-50 text-emerald-700"
                                                                    : "bg-blue-50 text-blue-700"
                                                                    }`}
                                                            >
                                                                {isCredit ? (
                                                                    <ArrowDownLeft size={17} />
                                                                ) : (
                                                                    <ArrowUpRight size={17} />
                                                                )}
                                                            </div>

                                                            <div className="min-w-0">
                                                                <p className="break-words text-sm font-semibold text-gray-900">
                                                                    {type === "deposit"
                                                                        ? "Deposit"
                                                                        : type === "withdraw"
                                                                            ? "Withdrawal"
                                                                            : type === "transfer"
                                                                                ? "Transfer"
                                                                                : "Transaction"}
                                                                </p>
                                                                <p className="mt-1 break-all text-xs text-gray-500">
                                                                    ID:{" "}
                                                                    {transaction?.id ??
                                                                        transaction?.transaction_id ??
                                                                        "—"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-3 py-4 text-sm text-gray-600 lg:px-4">
                                                        <span className="block break-words">
                                                            {formatDateTime(
                                                                getTransactionDate(transaction)
                                                            )}
                                                        </span>
                                                    </td>

                                                    <td className="px-3 py-4 text-sm text-gray-600 lg:px-4">
                                                        <span className="block break-all">
                                                            {reference}
                                                        </span>
                                                    </td>

                                                    <td className="px-3 py-4 lg:px-4">
                                                        <TypeBadge type={type} />
                                                    </td>

                                                    <td
                                                        className={`px-3 py-4 text-right text-sm font-bold lg:px-4 ${isCredit
                                                            ? "text-emerald-700"
                                                            : "text-gray-900"
                                                            }`}
                                                    >
                                                        <span className="break-words">
                                                            {isCredit
                                                                ? "+"
                                                                : type === "withdraw" ||
                                                                    type === "transfer"
                                                                    ? "−"
                                                                    : ""}
                                                            {formatCurrency(amount)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                        </>
                    )}


                    {!loadingAccount &&
                        !loadingStatement &&
                        filteredTransactions.length > 0 && (
                            <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                                <p className="text-sm text-gray-500">
                                    Showing{" "}
                                    <span className="font-semibold text-gray-900">
                                        {firstItem}
                                    </span>
                                    {"–"}
                                    <span className="font-semibold text-gray-900">
                                        {lastItem}
                                    </span>
                                    {" of "}
                                    <span className="font-semibold text-gray-900">
                                        {filteredTransactions.length}
                                    </span>{" "}
                                    transactions
                                </p>

                                <div className="flex items-center justify-between gap-2 sm:justify-end">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCurrentPage((page) =>
                                                Math.max(1, page - 1)
                                            )
                                        }
                                        disabled={currentPage === 1}
                                        className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4"
                                    >
                                        <ChevronLeft size={16} />
                                        Previous
                                    </button>

                                    <span className="whitespace-nowrap px-1 text-sm font-medium text-gray-600">
                                        {currentPage} / {totalPages}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCurrentPage((page) =>
                                                Math.min(totalPages, page + 1)
                                            )
                                        }
                                        disabled={currentPage >= totalPages}
                                        className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4"
                                    >
                                        Next
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                </section>


                <footer className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                    <Calendar size={18} className="mt-0.5 shrink-0" />
                    <p className="leading-6">
                        This statement displays transactions returned by the bank
                        server for the selected month. Credit and debit totals above
                        reflect the currently filtered results.
                    </p>
                </footer>
            </div>
        </div>
    );
}
