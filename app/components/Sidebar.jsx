"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Send,
    History,
    Bell,
    LogOut,
    Banknote,
    FileText,
    UserRound,
    Menu,
    X,
    ChevronRight,
    Landmark,
    ArrowDownLeft,
    ArrowUpRight,
    ShieldCheck,
    Bot,
} from "lucide-react";

const navigation = [
    {
        section: "Overview",
        items: [
            {
                name: "Dashboard",
                href: "/dashboard",
                icon: LayoutDashboard,
            },
        ],
    },
    {
        section: "My Banking",
        items: [
            {
                name: "My accounts",
                href: "/dashboard/account",
                icon: Banknote,
            },
            {
                name: "Deposit",
                href: "/dashboard/deposit",
                icon: ArrowDownLeft,
            },
            {
                name: "Withdraw",
                href: "/dashboard/withdraw",
                icon: ArrowUpRight,
            },
            {
                name: "Transfer money",
                href: "/dashboard/transfer",
                icon: Send,
            },
        ],
    },
    {
        section: "Manage",
        items: [
            {
                name: "Transaction history",
                href: "/dashboard/history",
                icon: History,
            },
            {
                name: "Statements",
                href: "/dashboard/statement",
                icon: FileText,
            },
            {
                name: "Beneficiaries",
                href: "/dashboard/beneficiary",
                icon: UserRound,
            },
            {
                name: "Notifications",
                href: "/dashboard/notifications",
                icon: Bell,
            },
        ],
    },
    {
        section: "AI Banking",
        items: [
            {
                name: "FinBank AI",
                href: "/dashboard/ai",
                icon: Bot,
            },
        ],
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const [mobileOpen, setMobileOpen] = useState(false);
    const [user, setUser] = useState(null);

    const closeMobileMenu = useCallback(() => {
        setMobileOpen(false);
    }, []);

    useEffect(() => {
        const loadUser = () => {
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
        };

        loadUser();

        window.addEventListener("storage", loadUser);
        window.addEventListener("finbank-auth-change", loadUser);

        return () => {
            window.removeEventListener("storage", loadUser);
            window.removeEventListener("finbank-auth-change", loadUser);
        };
    }, []);


    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMobileOpen(false);
    }, [pathname]);


    useEffect(() => {
        if (!mobileOpen) return;

        const previousOverflow = document.body.style.overflow;
        const previousPaddingRight = document.body.style.paddingRight;

        document.body.style.overflow = "hidden";

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setMobileOpen(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.body.style.paddingRight = previousPaddingRight;

            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [mobileOpen]);


    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setMobileOpen(false);
            }
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    const isActive = (href) => {
        if (href === "/dashboard") {
            return pathname === href;
        }

        return pathname === href || pathname.startsWith(`${href}/`);
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setUser(null);
        setMobileOpen(false);

        window.dispatchEvent(new Event("finbank-auth-change"));
        router.replace("/login");
    };

    const displayName =
        user?.full_name ||
        user?.name ||
        user?.email ||
        "My account";

    const initial = displayName.charAt(0).toUpperCase();

    const renderSidebarContents = (mobile = false) => (
        <div className="flex min-h-0 flex-1 flex-col">

            <div
                className={`flex shrink-0 items-center justify-between gap-3 ${mobile ? "mb-6" : "mb-8 px-2"
                    }`}
            >
                <Link
                    href="/dashboard"
                    onClick={closeMobileMenu}
                    className="group flex min-w-0 items-center gap-3"
                >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-950/40">
                        <Landmark size={22} />
                    </span>

                    <span className="min-w-0">
                        <span className="block text-lg font-bold tracking-tight text-white">
                            FinBank
                        </span>

                        <span className="mt-1 block text-[9px] font-medium tracking-[0.2em] text-slate-400">
                            DIGITAL BANKING
                        </span>
                    </span>
                </Link>

                {mobile && (
                    <button
                        type="button"
                        onClick={closeMobileMenu}
                        aria-label="Close navigation"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 text-slate-300 hover:bg-white/[0.06] hover:text-white"
                    >
                        <X size={20} />
                    </button>
                )}
            </div>


            <div className="mb-6 shrink-0 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3">
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-sm font-bold text-blue-300 ring-1 ring-blue-400/20">
                        {initial}
                    </span>

                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">
                            {displayName}
                        </p>

                        <p className="mt-1 text-[11px] text-slate-400">
                            Banking workspace
                        </p>
                    </div>

                    <ShieldCheck
                        size={17}
                        className="shrink-0 text-blue-300"
                    />
                </div>
            </div>


            <nav
                aria-label="Banking navigation"
                className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain pr-1"
            >
                {navigation.map((group) => (
                    <div key={group.section}>
                        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                            {group.section}
                        </p>

                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.href);

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={closeMobileMenu}
                                        aria-current={active ? "page" : undefined}
                                        className={`group relative flex min-h-11 items-center gap-3 rounded-xl px-3 ${active
                                            ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30"
                                            : "text-slate-400 hover:bg-white/[0.045] hover:text-white"
                                            }`}
                                    >
                                        {active && (
                                            <span className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-blue-200" />
                                        )}

                                        <Icon
                                            size={18}
                                            strokeWidth={active ? 2.2 : 1.8}
                                            className="shrink-0"
                                            aria-hidden="true"
                                        />

                                        <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                                            {item.name}
                                        </span>

                                        {active && (
                                            <ChevronRight
                                                size={15}
                                                className="shrink-0 text-blue-100"
                                            />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>


            <div className="mt-4 shrink-0 border-t border-white/[0.08] pt-4">
                <div className="mb-3 flex items-center gap-2 px-3 text-[11px] text-slate-500">
                    <ShieldCheck size={14} />
                    <span>Protect your account credentials</span>
                </div>

                <button
                    type="button"
                    onClick={handleLogout}
                    className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-red-400/[0.12] bg-red-500/[0.045] px-3 text-red-300 hover:border-red-400/25 hover:bg-red-500/10"
                >
                    <LogOut size={18} />

                    <span className="flex-1 text-left text-[13px] font-medium">
                        Sign out
                    </span>
                </button>

                <p className="mt-4 px-3 text-[10px] tracking-wide text-slate-600">
                    FINBANK · DIGITAL BANKING SYSTEM
                </p>
            </div>
        </div>
    );

    return (
        <>

            <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-white/[0.08] bg-[#080d18] px-4 text-white shadow-lg shadow-black/10 lg:hidden">
                <Link
                    href="/dashboard"
                    className="flex min-w-0 items-center gap-3"
                >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                        <Landmark size={19} />
                    </span>

                    <span>
                        <span className="block text-base font-bold leading-tight">
                            FinBank
                        </span>

                        <span className="mt-1 block text-[9px] tracking-[0.16em] text-slate-400">
                            BANKING WORKSPACE
                        </span>
                    </span>
                </Link>

                <div className="flex shrink-0 items-center gap-2">
                    <Link
                        href="/dashboard/notifications"
                        aria-label="Notifications"
                        onClick={closeMobileMenu}
                        className={`flex h-10 w-10 items-center justify-center rounded-xl border ${isActive("/dashboard/notifications")
                            ? "border-blue-400/30 bg-blue-500/10 text-blue-300"
                            : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.08]"
                            }`}
                    >
                        <Bell size={18} />
                    </Link>

                    <button
                        type="button"
                        onClick={() => setMobileOpen(true)}
                        aria-label="Open banking menu"
                        aria-expanded={mobileOpen}
                        aria-controls="finbank-mobile-sidebar"
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.09]"
                    >
                        <Menu size={21} />
                    </button>
                </div>
            </header>


            <aside className="fixed inset-y-0 left-0 z-30 hidden h-dvh w-[272px] flex-col overflow-hidden border-r border-white/[0.07] bg-[#0b1220] p-5 text-white lg:flex">
                {renderSidebarContents()}
            </aside>


            {mobileOpen && (
                <div
                    className="fixed inset-0 z-50 lg:hidden"
                    aria-label="Mobile navigation overlay"
                >
                    <button
                        type="button"
                        aria-label="Close navigation backdrop"
                        onClick={closeMobileMenu}
                        className="absolute inset-0 h-full w-full bg-black/65"
                    />

                    <aside
                        id="finbank-mobile-sidebar"
                        aria-label="Mobile banking sidebar"
                        className="absolute inset-y-0 left-0 flex h-dvh w-[min(86vw,320px)] flex-col overflow-hidden border-r border-white/[0.08] bg-[#0b1220] p-4 text-white shadow-2xl shadow-black/50"
                    >
                        {renderSidebarContents(true)}
                    </aside>
                </div>
            )}
        </>
    );
}
