"use client";

import { useCallback, useEffect, useState } from "react";
import API from "@/app/Api/api";
import {
    Bell,
    CheckCheck,
    Check,
    RefreshCw,
    Clock,
    Inbox,
    AlertCircle,
} from "lucide-react";

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [readingId, setReadingId] = useState(null);
    const [error, setError] = useState("");

    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await API.get("/notifications");
            setNotifications(response.data.data || []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load notifications. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchNotifications();
    }, [fetchNotifications]);

    const markAsRead = async (id) => {
        try {
            setReadingId(id);
            setError("");

            await API.patch(`/notifications/${id}/read`);

            setNotifications((current) =>
                current.map((notification) =>
                    notification.id === id
                        ? { ...notification, is_read: 1 }
                        : notification
                )
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to mark notification as read."
            );
        } finally {
            setReadingId(null);
        }
    };

    const unreadCount = notifications.filter(
        (notification) => Number(notification.is_read) === 0
    ).length;

    const formatDate = (date) => {
        if (!date) return "Date unavailable";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "Date unavailable";
        }

        return new Intl.DateTimeFormat("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(parsedDate);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-5xl space-y-6">

                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-700">
                            <Bell size={17} />
                            Account activity
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                            Notifications
                        </h1>

                        <p className="mt-2 text-sm text-slate-500">
                            Stay updated on your banking activities.
                        </p>
                    </div>

                    <button
                        onClick={fetchNotifications}
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <RefreshCw
                            size={16}
                            className={loading ? "animate-spin" : ""}
                        />
                        Refresh
                    </button>
                </div>


                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-500">
                                Total notifications
                            </p>
                            <Bell className="text-blue-600" size={20} />
                        </div>
                        <p className="mt-3 text-3xl font-bold text-slate-900">
                            {notifications.length}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-500">
                                Unread notifications
                            </p>
                            <span className="rounded-lg bg-amber-50 p-2 text-amber-600">
                                <AlertCircle size={19} />
                            </span>
                        </div>
                        <p className="mt-3 text-3xl font-bold text-slate-900">
                            {unreadCount}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-500">
                                Read notifications
                            </p>
                            <span className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                                <CheckCheck size={19} />
                            </span>
                        </div>
                        <p className="mt-3 text-3xl font-bold text-slate-900">
                            {notifications.length - unreadCount}
                        </p>
                    </div>
                </div>


                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
                        <div>
                            <h2 className="font-semibold text-slate-900">
                                Recent activity
                            </h2>
                            <p className="mt-1 text-xs text-slate-500">
                                Your latest account updates
                            </p>
                        </div>

                        {unreadCount > 0 && (
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                {unreadCount} unread
                            </span>
                        )}
                    </div>

                    {error && (
                        <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                            {error}
                            <button
                                onClick={fetchNotifications}
                                className="ml-2 font-semibold underline"
                            >
                                Try again
                            </button>
                        </div>
                    )}

                    {loading ? (
                        <div className="space-y-4 p-6">
                            {[1, 2, 3].map((item) => (
                                <div
                                    key={item}
                                    className="flex animate-pulse gap-4"
                                >
                                    <div className="h-11 w-11 rounded-xl bg-slate-100" />
                                    <div className="flex-1 space-y-3 py-1">
                                        <div className="h-4 w-2/3 rounded bg-slate-100" />
                                        <div className="h-3 w-1/3 rounded bg-slate-100" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center px-6 py-16 text-center">
                            <div className="mb-4 rounded-2xl bg-slate-100 p-4">
                                <Inbox size={30} className="text-slate-500" />
                            </div>
                            <h3 className="font-semibold text-slate-900">
                                No notifications yet
                            </h3>
                            <p className="mt-2 max-w-sm text-sm text-slate-500">
                                Your account activity updates will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {notifications.map((notification) => {
                                const isUnread =
                                    Number(notification.is_read) === 0;

                                return (
                                    <div
                                        key={notification.id}
                                        className={`flex gap-3 p-5 transition sm:gap-4 sm:px-6 ${isUnread
                                                ? "bg-blue-50/50"
                                                : "bg-white"
                                            }`}
                                    >
                                        <div
                                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isUnread
                                                    ? "bg-blue-100 text-blue-700"
                                                    : "bg-slate-100 text-slate-500"
                                                }`}
                                        >
                                            <Bell size={20} />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="text-sm font-semibold text-slate-900">
                                                    Account notification
                                                </p>

                                                {isUnread && (
                                                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                                                        New
                                                    </span>
                                                )}
                                            </div>

                                            <p className="mt-1 break-words text-sm leading-6 text-slate-600">
                                                {notification.message}
                                            </p>

                                            <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                                                <Clock size={13} />
                                                {formatDate(
                                                    notification.created_at
                                                )}
                                            </p>
                                        </div>

                                        {isUnread && (
                                            <button
                                                onClick={() =>
                                                    markAsRead(notification.id)
                                                }
                                                disabled={
                                                    readingId === notification.id
                                                }
                                                title="Mark as read"
                                                aria-label="Mark notification as read"
                                                className="flex h-9 w-9 shrink-0 items-center justify-center self-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
                                            >
                                                {readingId === notification.id ? (
                                                    <RefreshCw
                                                        size={16}
                                                        className="animate-spin"
                                                    />
                                                ) : (
                                                    <Check size={17} />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                <p className="text-center text-xs text-slate-400">
                    Your notifications are private to your account.
                </p>
            </div>
        </div>
    );
}
