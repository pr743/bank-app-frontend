
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    Landmark,
    Menu,
    X,
    UserRound,
    Bell,
    LayoutDashboard,
    LogOut,
    ChevronDown,
    ShieldCheck,
    ArrowRight,
    Wallet,
    ArrowLeftRight,
    FileText,
    History,
    Users,
    Home,
} from "lucide-react";

const publicLinks = [
    { label: "Features", href: "/#features" },
    { label: "How it works", href: "/#how-it-works" },
];

const accountLinks = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Accounts", href: "/dashboard/account", icon: Wallet },
    { label: "Transfer", href: "/dashboard/transfer", icon: ArrowLeftRight },
    { label: "Statements", href: "/dashboard/statement", icon: FileText },
];

const mobileAccountLinks = [
    ...accountLinks,
    { label: "Deposit", href: "/dashboard/deposit", icon: ArrowRight },
    { label: "Withdraw", href: "/dashboard/withdraw", icon: ArrowLeftRight },
    { label: "Beneficiaries", href: "/dashboard/beneficiary", icon: Users },
    { label: "Transaction history", href: "/dashboard/history", icon: History },
    {
        label: "Notifications",
        href: "/dashboard/notifications",
        icon: Bell,
    },
];

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();

    const [user, setUser] = useState(null);
    const [mounted, setMounted] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    const isLoggedIn = mounted && Boolean(user);

    useEffect(() => {
        function loadUser() {
            const token = localStorage.getItem("token");
            const storedUser = localStorage.getItem("user");

            if (!token) {
                setUser(null);
                return;
            }

            try {
                setUser(storedUser ? JSON.parse(storedUser) : {});
            } catch {
                setUser({});
            }
        }

        loadUser();
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);


        window.addEventListener("storage", loadUser);


        window.addEventListener("finbank-auth-change", loadUser);

        return () => {
            window.removeEventListener("storage", loadUser);
            window.removeEventListener("finbank-auth-change", loadUser);
        };
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMenuOpen(false);
        setProfileOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (!menuOpen && !profileOpen) return;

        function handleKeyDown(event) {
            if (event.key === "Escape") {
                setMenuOpen(false);
                setProfileOpen(false);
            }
        }

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [menuOpen, profileOpen]);

    useEffect(() => {
        if (!menuOpen) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [menuOpen]);

    function logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setUser(null);
        setMenuOpen(false);
        setProfileOpen(false);

        window.dispatchEvent(new Event("finbank-auth-change"));
        router.replace("/login");
    }

    const displayName =
        user?.full_name || user?.name || user?.email || "My account";

    const initial = displayName.charAt(0).toUpperCase();

    function isActive(href) {
        if (href === "/dashboard") return pathname === "/dashboard";
        return pathname === href || pathname.startsWith(`${href}/`);
    }

    return (
        <>

            <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#080d18]/95 text-white shadow-lg shadow-black/10 backdrop-blur-xl">
                <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">

                    <Link
                        href={isLoggedIn ? "/dashboard" : "/"}
                        aria-label="FinBank home"
                        className="group flex shrink-0 items-center gap-3"
                    >
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-950/40 transition group-hover:scale-[1.03]">
                            <Landmark size={21} strokeWidth={2} />
                        </span>

                        <span className="leading-tight">
                            <span className="block text-lg font-bold tracking-tight">
                                FinBank
                            </span>
                            <span className="mt-1 block text-[9px] font-medium tracking-[0.2em] text-slate-400">
                                DIGITAL BANKING
                            </span>
                        </span>
                    </Link>


                    <nav
                        aria-label="Main navigation"
                        className="hidden items-center gap-1 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-1.5 lg:flex"
                    >
                        {isLoggedIn
                            ? accountLinks.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.href);

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        aria-current={active ? "page" : undefined}
                                        className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium transition ${active
                                                ? "bg-blue-600 text-white shadow-md shadow-blue-950/30"
                                                : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                                            }`}
                                    >
                                        <Icon size={16} />
                                        {item.label}
                                    </Link>
                                );
                            })
                            : publicLinks.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="rounded-xl px-4 py-2.5 text-[13px] font-medium text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
                                >
                                    {item.label}
                                </Link>
                            ))}
                    </nav>


                    <div className="hidden shrink-0 items-center gap-3 lg:flex">
                        {isLoggedIn ? (
                            <>
                                <Link
                                    href="/dashboard/notifications"
                                    aria-label="View notifications"
                                    title="Notifications"
                                    className={`relative flex h-10 w-10 items-center justify-center rounded-xl border transition ${isActive("/dashboard/notifications")
                                            ? "border-blue-400/30 bg-blue-500/10 text-blue-300"
                                            : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.08] hover:text-white"
                                        }`}
                                >
                                    <Bell size={18} />
                                </Link>

                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setProfileOpen((open) => !open)}
                                        aria-expanded={profileOpen}
                                        aria-haspopup="menu"
                                        className={`flex items-center gap-3 rounded-2xl border py-1.5 pl-1.5 pr-3 transition ${profileOpen
                                                ? "border-blue-400/30 bg-blue-500/10"
                                                : "border-white/10 bg-white/[0.03] hover:bg-white/[0.07]"
                                            }`}
                                    >
                                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold">
                                            {initial}
                                        </span>

                                        <span className="max-w-32 text-left">
                                            <span className="block truncate text-sm font-medium text-white">
                                                {displayName}
                                            </span>
                                            <span className="mt-0.5 block text-[10px] text-slate-400">
                                                Account menu
                                            </span>
                                        </span>

                                        <ChevronDown
                                            size={15}
                                            className={`text-slate-400 transition-transform ${profileOpen ? "rotate-180" : ""
                                                }`}
                                        />
                                    </button>

                                    {profileOpen && (
                                        <>
                                            <button
                                                type="button"
                                                aria-label="Close account menu"
                                                onClick={() => setProfileOpen(false)}
                                                className="fixed inset-0 z-40 cursor-default"
                                            />

                                            <div
                                                role="menu"
                                                className="absolute right-0 top-full z-50 mt-3 w-72 overflow-hidden rounded-2xl border border-white/10 bg-[#101827] shadow-2xl shadow-black/40"
                                            >
                                                <div className="border-b border-white/[0.08] bg-white/[0.02] p-4">
                                                    <p className="text-xs text-slate-400">
                                                        Signed in as
                                                    </p>
                                                    <p className="mt-1 truncate text-sm font-semibold text-white">
                                                        {displayName}
                                                    </p>
                                                </div>

                                                <div className="p-2">
                                                    <ProfileLink
                                                        href="/dashboard"
                                                        icon={LayoutDashboard}
                                                        onClick={() => setProfileOpen(false)}
                                                    >
                                                        Dashboard
                                                    </ProfileLink>

                                                    <ProfileLink
                                                        href="/dashboard/account"
                                                        icon={UserRound}
                                                        onClick={() => setProfileOpen(false)}
                                                    >
                                                        My accounts
                                                    </ProfileLink>

                                                    <ProfileLink
                                                        href="/dashboard/notifications"
                                                        icon={Bell}
                                                        onClick={() => setProfileOpen(false)}
                                                    >
                                                        Notifications
                                                    </ProfileLink>

                                                    <div className="my-2 border-t border-white/[0.08]" />

                                                    <button
                                                        type="button"
                                                        role="menuitem"
                                                        onClick={logout}
                                                        className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-red-400 transition hover:bg-red-500/10"
                                                    >
                                                        <LogOut size={17} />
                                                        Sign out
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
                                >
                                    Sign in
                                </Link>

                                <Link
                                    href="/register"
                                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold shadow-lg shadow-blue-950/30 transition hover:bg-blue-500"
                                >
                                    Open an account
                                    <ArrowRight size={16} />
                                </Link>
                            </>
                        )}
                    </div>


                    <div className="flex shrink-0 items-center gap-2 lg:hidden">
                        {isLoggedIn && (
                            <Link
                                href="/dashboard/notifications"
                                aria-label="Notifications"
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-300 transition hover:bg-white/[0.08]"
                            >
                                <Bell size={18} />
                            </Link>
                        )}

                        <button
                            type="button"
                            onClick={() => {
                                setProfileOpen(false);
                                setMenuOpen((open) => !open);
                            }}
                            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
                            aria-expanded={menuOpen}
                            aria-controls="finbank-mobile-drawer"
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] transition hover:bg-white/[0.09]"
                        >
                            {menuOpen ? <X size={21} /> : <Menu size={21} />}
                        </button>
                    </div>
                </div>
            </header>


            {menuOpen && (
                <button
                    type="button"
                    aria-label="Close navigation"
                    onClick={() => setMenuOpen(false)}
                    className="fixed inset-x-0 bottom-0 top-[72px] z-40 bg-black/65 backdrop-blur-[2px] lg:hidden"
                />
            )}


            <aside
                id="finbank-mobile-drawer"
                aria-label="Mobile navigation drawer"
                aria-hidden={!menuOpen}
                className={`fixed bottom-0 right-0 top-[72px] z-50 flex w-[min(88vw,360px)] flex-col border-l border-white/10 bg-[#0b1220] shadow-2xl shadow-black/40 transition-transform duration-300 ease-out lg:hidden ${menuOpen ? "translate-x-0" : "translate-x-full"
                    }`}
                style={{ visibility: menuOpen ? "visible" : "hidden" }}
            >
                <div className="flex-1 overflow-y-auto overscroll-contain p-4">
                    {isLoggedIn ? (
                        <>
                            <div className="mb-5 rounded-2xl border border-blue-400/15 bg-gradient-to-br from-blue-500/10 to-indigo-500/[0.04] p-4">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-base font-bold text-white">
                                        {initial}
                                    </span>

                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs text-slate-400">Welcome back</p>
                                        <p className="mt-1 truncate text-sm font-semibold text-white">
                                            {displayName}
                                        </p>
                                    </div>

                                    <ShieldCheck size={18} className="shrink-0 text-blue-300" />
                                </div>

                                <Link
                                    href="/dashboard"
                                    onClick={() => setMenuOpen(false)}
                                    className="mt-4 flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] text-sm font-medium text-slate-200 transition hover:bg-white/[0.08]"
                                >
                                    Open dashboard
                                    <ArrowRight size={15} />
                                </Link>
                            </div>

                            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                Banking
                            </p>

                            <div className="space-y-1">
                                {mobileAccountLinks.map((item) => {
                                    const Icon = item.icon;
                                    const active = isActive(item.href);

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            aria-current={active ? "page" : undefined}
                                            onClick={() => setMenuOpen(false)}
                                            className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${active
                                                    ? "bg-blue-600 text-white"
                                                    : "text-slate-300 hover:bg-white/[0.05] hover:text-white"
                                                }`}
                                        >
                                            <Icon size={18} />
                                            <span className="flex-1">{item.label}</span>
                                            {active && (
                                                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="mb-5 rounded-2xl border border-blue-400/15 bg-gradient-to-br from-blue-500/10 to-indigo-500/[0.04] p-5">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/20 text-blue-300">
                                    <Landmark size={22} />
                                </div>

                                <h2 className="mt-4 text-lg font-semibold text-white">
                                    Welcome to FinBank
                                </h2>

                                <p className="mt-2 text-sm leading-6 text-slate-400">
                                    Access your banking workspace and manage your account
                                    activity in one place.
                                </p>
                            </div>

                            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                Explore
                            </p>

                            {publicLinks.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMenuOpen(false)}
                                    className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
                                >
                                    <Home size={18} />
                                    {item.label}
                                </Link>
                            ))}
                        </>
                    )}
                </div>


                <div className="shrink-0 border-t border-white/10 bg-[#0b1220] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                    {isLoggedIn ? (
                        <button
                            type="button"
                            onClick={logout}
                            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-500/[0.07] text-sm font-semibold text-red-300 transition hover:bg-red-500/[0.13]"
                        >
                            <LogOut size={17} />
                            Sign out
                        </button>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            <Link
                                href="/login"
                                onClick={() => setMenuOpen(false)}
                                className="flex min-h-12 items-center justify-center rounded-xl border border-white/10 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.05]"
                            >
                                Sign in
                            </Link>

                            <Link
                                href="/register"
                                onClick={() => setMenuOpen(false)}
                                className="flex min-h-12 items-center justify-center gap-1 rounded-xl bg-blue-600 px-3 text-sm font-semibold text-white transition hover:bg-blue-500"
                            >
                                Register
                                <ArrowRight size={15} />
                            </Link>
                        </div>
                    )}

                    <p className="mt-3 text-center text-[10px] text-slate-500">
                        FinBank · Digital Banking System
                    </p>
                </div>
            </aside>
        </>
    );
}

function ProfileLink({ href, icon: Icon, onClick, children }) {
    return (
        <Link
            href={href}
            role="menuitem"
            onClick={onClick}
            className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
        >
            <Icon size={17} />
            {children}
        </Link>
    );
}
