"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Bot,
    Send,
    Wallet,
    History,
    ChartNoAxesCombined,
    MessageCircleQuestion,
    Sparkles,
    ArrowDownLeft,
    ArrowUpRight,
    ArrowLeftRight,
    Loader2,
    Plus,
    Building2,
    ShieldCheck,
    CreditCard,
    TrendingUp,
} from "lucide-react";


const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

const CHAT_ENDPOINT = `${API_URL}/ai/chat`;
const REQUEST_TIMEOUT = 30000;

const suggestions = [
    {
        title: "Account Overview",
        description: "View your complete account summary",
        icon: Building2,
        message: "Show my complete account overview",
    },
    {
        title: "Check my balance",
        description: "View your current account balance",
        icon: Wallet,
        message: "What is my current account balance?",
    },
    {
        title: "Recent transactions",
        description: "Review your latest payments",
        icon: History,
        message: "Show my last 10 transactions",
    },
    {
        title: "Spending insights",
        description: "Understand your spending activity",
        icon: ChartNoAxesCombined,
        message: "Give me insights about my spending",
    },
    {
        title: "Banking help",
        description: "Get help with banking services",
        icon: MessageCircleQuestion,
        message: "What banking services are available?",
    },
    {
        title: "Monthly withdrawals",
        description: "View your withdrawals for a specific month",
        icon: ArrowUpRight,
        message: "Show my withdrawals for November 2026",
    },
    {
        title: "Yearly withdrawals",
        description: "Review your total withdrawals for the year",
        icon: ArrowUpRight,
        message: "Show my total withdrawals for 2026",
    },
];

const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(amount || 0));

function AccountOverviewCard({ overview }) {
    if (!overview) return null;

    if (!overview.hasAccounts) {
        return (
            <div className="rounded-2xl border border-white/10 bg-[#101827] p-5">
                <div className="flex items-center gap-3">
                    <Wallet className="text-blue-400" size={22} />
                    <h3 className="font-semibold">Account Overview</h3>
                </div>

                <p className="mt-4 text-sm text-slate-400">
                    You don&apos;t have any bank accounts yet.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Building2 size={17} className="text-blue-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Account Overview
                </h3>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-blue-400/20 bg-blue-500/[0.08] p-5">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-400">
                            Total Balance
                        </p>
                        <Wallet size={19} className="text-blue-400" />
                    </div>

                    <h2 className="mt-3 text-2xl font-bold text-white">
                        {overview.formattedTotalBalance ||
                            formatCurrency(overview.totalBalance)}
                    </h2>

                    <p className="mt-2 text-xs text-slate-500">
                        Across all your accounts
                    </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#101827] p-5">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-400">
                            Total Accounts
                        </p>
                        <CreditCard size={19} className="text-blue-400" />
                    </div>

                    <h2 className="mt-3 text-2xl font-bold text-white">
                        {overview.totalAccounts}
                    </h2>

                    <p className="mt-2 text-xs text-slate-500">
                        Your registered bank accounts
                    </p>
                </div>
            </div>

            {overview.highestBalanceAccount && (
                <div className="rounded-2xl border border-white/10 bg-[#101827] p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                        <TrendingUp size={17} className="text-emerald-400" />
                        Highest Balance Account
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                        <div>
                            <p className="font-medium">
                                {overview.highestBalanceAccount.accountType}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                                Account #{overview.highestBalanceAccount.id}
                            </p>
                        </div>

                        <p className="font-semibold text-emerald-400">
                            {formatCurrency(
                                overview.highestBalanceAccount.balance
                            )}
                        </p>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-300">
                    Your Accounts
                </h4>

                {overview.accounts?.map((account) => {
                    const isActive =
                        account.status?.toLowerCase() === "active";

                    return (
                        <div
                            key={account.id}
                            className="rounded-xl border border-white/10 bg-[#101827] p-4"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                                        <Wallet size={19} />
                                    </div>

                                    <div>
                                        <p className="font-semibold">
                                            {account.accountType}
                                        </p>

                                        <p className="mt-1 text-xs text-slate-400">
                                            Account #{account.id}
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <p className="font-semibold">
                                        {formatCurrency(account.balance)}
                                    </p>

                                    <span
                                        className={`mt-1 inline-flex items-center gap-1 text-xs ${isActive
                                            ? "text-emerald-400"
                                            : "text-amber-400"
                                            }`}
                                    >
                                        <ShieldCheck size={12} />
                                        {account.status || "Unknown"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function TransactionCard({ tx }) {
    const transactionType = tx.type?.toLowerCase();

    const TransactionIcon =
        transactionType === "deposit"
            ? ArrowDownLeft
            : transactionType === "withdrawal"
                ? ArrowUpRight
                : transactionType === "transfer"
                    ? ArrowLeftRight
                    : History;

    return (
        <div className="rounded-xl border border-white/10 bg-[#101827] p-4">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                        <TransactionIcon size={19} />
                    </div>

                    <div>
                        <p className="text-sm font-semibold">
                            {tx.type || "Transaction"}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            Transaction #{tx.id}
                        </p>
                    </div>
                </div>

                <p className="text-right text-sm font-semibold">
                    {tx.amount}
                </p>
            </div>

            <div className="mt-4 space-y-1 border-t border-white/[0.07] pt-3 text-xs text-slate-400">
                <p>{tx.date || "Date not available"}</p>

                {transactionType === "transfer" && (
                    <>
                        <p>From: {tx.from || "Not available"}</p>
                        <p>To: {tx.to || "Not available"}</p>
                    </>
                )}

                {transactionType === "deposit" && (
                    <p>
                        Received by: {tx.receivedBy || "Not available"}
                    </p>
                )}

                {transactionType === "withdrawal" && (
                    <p>
                        Withdrawn from: {tx.withdrawnFrom || "Not available"}
                    </p>
                )}
            </div>
        </div>
    );
}

export default function FinBankAIPage() {
    const router = useRouter();
    const bottomRef = useRef(null);

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");


    useEffect(() => {
        bottomRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end",
        });
    }, [messages, loading]);

    const sendMessage = async (text = input) => {
        const message = text.trim();

        if (!message || loading) return;

        if (!API_URL) {
            setError("API URL is not configured. Please contact support.");
            return;
        }

        let token;

        try {
            token = localStorage.getItem("token");
        } catch {
            setError("Unable to access your login session. Please log in again.");
            return;
        }

        if (!token) {
            router.replace("/login");
            return;
        }

        setError("");
        setInput("");
        setLoading(true);

        setMessages((previous) => [
            ...previous,
            {
                role: "user",
                content: message,
            },
        ]);

        const controller = new AbortController();
        const timeoutId = setTimeout(
            () => controller.abort(),
            REQUEST_TIMEOUT
        );

        try {
            const response = await fetch(CHAT_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ message }),
                signal: controller.signal,
            });


            let result;

            try {
                result = await response.json();
            } catch {
                throw new Error(
                    "The server returned an invalid response. Please try again."
                );
            }

            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem("token");
                router.replace("/login");
                return;
            }

            if (!response.ok || !result?.success) {
                throw new Error(
                    result?.message || "Unable to get an AI response."
                );
            }

            const answer = result?.data?.answer;

            if (typeof answer !== "string" || !answer.trim()) {
                throw new Error(
                    "The server returned an empty response. Please try again."
                );
            }

            const bankingData = result?.data?.bankingData;

            setMessages((previous) => [
                ...previous,
                {
                    role: "ai",
                    content: answer,
                    transactions: Array.isArray(result?.data?.transactions)
                        ? result.data.transactions
                        : [],
                    accountOverview:
                        bankingData?.reportType === "account_overview"
                            ? bankingData
                            : null,
                },
            ]);
        } catch (err) {
            if (err.name === "AbortError") {
                setError(
                    "The request took too long. Please check your connection and try again."
                );
            } else if (err instanceof TypeError) {
                setError(
                    "Unable to connect to the server. Please check your internet connection."
                );
            } else {
                setError(
                    err.message || "Something went wrong. Please try again."
                );
            }
        } finally {
            clearTimeout(timeoutId);
            setLoading(false);
        }
    };

    const startNewChat = () => {
        if (loading) return;

        setMessages([]);
        setInput("");
        setError("");
    };

    return (
        <div className="flex min-h-screen flex-col bg-[#070b14] text-white">
            <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-white/[0.08] bg-[#070b14]/95 px-5 py-4 backdrop-blur sm:px-8">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400">
                        <Bot size={23} />
                    </div>

                    <div>
                        <h1 className="font-semibold">FinBank AI</h1>

                        <p className="mt-1 text-xs text-slate-400">
                            Your personal banking assistant
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={startNewChat}
                    disabled={loading}
                    className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <Plus size={16} />
                    <span className="hidden sm:inline">New chat</span>
                </button>
            </header>

            <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-8 sm:px-6">
                {messages.length === 0 ? (
                    <div className="flex flex-1 flex-col justify-center py-8">
                        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10 text-blue-400">
                            <Sparkles size={30} />
                        </div>

                        <h2 className="text-center text-2xl font-bold sm:text-3xl">
                            How can I help you today?
                        </h2>

                        <p className="mx-auto mt-3 max-w-lg text-center text-sm leading-6 text-slate-400">
                            Ask questions about your accounts, transactions
                            and banking activity.
                        </p>

                        <div className="mt-10 grid gap-3 sm:grid-cols-2">
                            {suggestions.map((item) => {
                                const Icon = item.icon;

                                return (
                                    <button
                                        type="button"
                                        key={item.title}
                                        onClick={() =>
                                            sendMessage(item.message)
                                        }
                                        disabled={loading}
                                        className="group rounded-2xl border border-white/10 bg-[#101827] p-5 text-left transition hover:border-blue-400/30 hover:bg-[#121d30] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                                            <Icon size={20} />
                                        </div>

                                        <h3 className="mt-4 font-semibold">
                                            {item.title}
                                        </h3>

                                        <p className="mt-1 text-sm text-slate-400">
                                            {item.description}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 space-y-7 pb-8">
                        {messages.map((message, index) => (
                            <div
                                key={`${message.role}-${index}`}
                                className={`flex gap-3 ${message.role === "user"
                                    ? "justify-end"
                                    : "justify-start"
                                    }`}
                            >
                                {message.role === "ai" && (
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400">
                                        <Bot size={19} />
                                    </div>
                                )}

                                <div className="max-w-[90%] space-y-3 sm:max-w-[80%]">
                                    <div
                                        className={`rounded-2xl px-4 py-3 text-sm leading-7 ${message.role === "user"
                                            ? "bg-blue-600 text-white"
                                            : "border border-white/10 bg-[#101827] text-slate-200"
                                            }`}
                                    >
                                        <p className="whitespace-pre-wrap break-words">
                                            {message.content}
                                        </p>
                                    </div>

                                    {message.role === "ai" &&
                                        message.accountOverview && (
                                            <AccountOverviewCard
                                                overview={
                                                    message.accountOverview
                                                }
                                            />
                                        )}

                                    {message.transactions?.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                Transaction records
                                            </p>

                                            {message.transactions.map((tx) => (
                                                <TransactionCard
                                                    key={tx.id}
                                                    tx={tx}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex items-center gap-3 text-sm text-slate-400">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400">
                                    <Bot size={19} />
                                </div>

                                <Loader2
                                    size={17}
                                    className="animate-spin"
                                />

                                FinBank AI is thinking...
                            </div>
                        )}

                        <div ref={bottomRef} />
                    </div>
                )}

                {error && (
                    <div
                        role="alert"
                        className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                    >
                        <p>{error}</p>

                        <button
                            type="button"
                            onClick={() => setError("")}
                            className="shrink-0 text-red-300 hover:text-white"
                            aria-label="Dismiss error"
                        >
                            ×
                        </button>
                    </div>
                )}

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        sendMessage();
                    }}
                    className="sticky bottom-0 mt-6 rounded-2xl border border-white/10 bg-[#101827] p-2 shadow-2xl shadow-black/20"
                >
                    <div className="flex items-center gap-2">
                        <input
                            value={input}
                            onChange={(event) =>
                                setInput(event.target.value)
                            }
                            placeholder="Ask anything about your banking..."
                            maxLength={1000}
                            disabled={loading}
                            aria-label="Ask FinBank AI"
                            className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 disabled:opacity-60"
                        />

                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            aria-label="Send message"
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {loading ? (
                                <Loader2
                                    size={19}
                                    className="animate-spin"
                                />
                            ) : (
                                <Send size={18} />
                            )}
                        </button>
                    </div>
                </form>

                <p className="mt-3 text-center text-[11px] text-slate-500">
                    FinBank AI uses your available banking records.
                    Verify important financial information before acting.
                </p>
            </main>
        </div>
    );
}
