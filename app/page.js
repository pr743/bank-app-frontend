
import Link from "next/link";

import {
  ArrowRight,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  ShieldCheck,
  History,
  FileText,
  Users,
  Bell,
  LockKeyhole,
  CheckCircle2,
} from "lucide-react";

const features = [
  {
    icon: Wallet,
    title: "Account management",
    description:
      "View your bank accounts, current balances, and account statuses.",
  },
  {
    icon: ArrowUpRight,
    title: "Money transfers",
    description:
      "Access the transfer workflow to send money between supported accounts.",
  },
  {
    icon: History,
    title: "Transaction history",
    description:
      "Review recorded transactions and keep track of your account activity.",
  },
  {
    icon: FileText,
    title: "Statements",
    description:
      "Review available transaction records through the statement section.",
  },
  {
    icon: Users,
    title: "Beneficiaries",
    description:
      "Manage saved recipients for supported banking transactions.",
  },
  {
    icon: Bell,
    title: "Notifications",
    description:
      "Access available account updates from your notifications section.",
  },
];

const steps = [
  {
    number: "01",
    title: "Create your account",
    description: "Register using the FinBank sign-up page.",
  },
  {
    number: "02",
    title: "Sign in",
    description: "Use your registered credentials to access your dashboard.",
  },
  {
    number: "03",
    title: "Manage your banking",
    description: "Use the available tools to manage your account activity.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#070b14] text-white">

      <main>

        <section className="relative isolate">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
          >
            <div className="absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-blue-600/15 blur-[100px] sm:h-[450px] sm:w-[450px]" />
            <div className="absolute right-0 top-1/3 h-72 w-72 rounded-full bg-indigo-600/10 blur-[100px]" />
          </div>

          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 md:grid-cols-2 md:py-24 lg:gap-20 lg:px-8 lg:py-28">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/[0.07] px-4 py-2 text-xs text-blue-200 sm:text-sm">
                <ShieldCheck size={16} />
                <span>Simple, organized digital banking</span>
              </div>

              <h1 className="mt-7 text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Banking made
                <span className="mt-2 block bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
                  simpler.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-7 text-gray-400 sm:text-lg sm:leading-8">
                Manage your accounts, review transactions, transfer funds,
                and organize your banking activity from one straightforward
                dashboard.
              </p>

              <div className="mt-8 flex flex-col gap-3 min-[420px]:flex-row">
                <Link
                  href="/register"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold shadow-lg shadow-blue-900/20 transition hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  Create an account
                  <ArrowRight size={18} />
                </Link>

                <Link
                  href="/login"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/15 px-6 py-3 font-medium transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  Sign in
                  <ArrowUpRight size={17} />
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm text-gray-400">
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-blue-400" />
                  Account management
                </span>

                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-blue-400" />
                  Transaction tracking
                </span>
              </div>
            </div>


            <div className="relative mx-auto w-full max-w-lg">
              <div className="rounded-3xl border border-white/10 bg-[#101827]/95 p-5 shadow-2xl sm:p-7">
                <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
                  <div>
                    <p className="font-semibold">Your banking workspace</p>
                    <p className="mt-1 text-xs text-gray-400">
                      Application preview
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                    <Wallet size={21} className="text-blue-300" />
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-blue-400/20 bg-gradient-to-br from-blue-600/20 to-indigo-600/10 p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-gray-300">
                      Account overview
                    </span>
                    <LockKeyhole size={18} className="text-blue-300" />
                  </div>

                  <h2 className="mt-5 text-2xl font-semibold sm:text-3xl">
                    Banking at a glance.
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-gray-400">
                    Sign in to view your actual account balance and account
                    details.
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                      <ArrowDownLeft size={19} />
                    </span>

                    <p className="mt-4 font-medium">Deposits</p>
                    <p className="mt-1 text-xs leading-5 text-gray-400">
                      Track money added to your account.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-400/10 text-blue-300">
                      <ArrowUpRight size={19} />
                    </span>

                    <p className="mt-4 font-medium">Transfers</p>
                    <p className="mt-1 text-xs leading-5 text-gray-400">
                      Review supported money transfers.
                    </p>
                  </div>
                </div>

                <Link
                  href="/login"
                  className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-center text-sm font-medium transition hover:bg-white/[0.07]"
                >
                  Open your dashboard
                  <ArrowRight size={16} />
                </Link>
              </div>

              <p className="mt-3 text-center text-xs text-gray-500">
                Illustrative preview · No sample account balances
              </p>
            </div>
          </div>
        </section>


        <section
          id="features"
          className="scroll-mt-24 border-y border-white/10 bg-white/[0.02]"
        >
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-300">
                Banking tools
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Your essential banking tools.
              </h2>

              <p className="mt-4 leading-7 text-gray-400">
                Find the account and transaction features available in your
                FinBank application in one place.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;

                return (
                  <article
                    key={feature.title}
                    className="rounded-2xl border border-white/10 bg-[#101827]/70 p-5 transition hover:border-blue-400/30 hover:bg-[#121d30] sm:p-6"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-400/15 bg-blue-400/10 text-blue-300">
                      <Icon size={21} />
                    </div>

                    <h3 className="mt-5 font-semibold">{feature.title}</h3>

                    <p className="mt-2 text-sm leading-6 text-gray-400">
                      {feature.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>


        <section
          id="how-it-works"
          className="scroll-mt-24 border-b border-white/10"
        >
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-300">
                Getting started
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Three steps to get started.
              </h2>

              <p className="mt-4 leading-7 text-gray-400">
                Register, sign in, and access the banking features available
                in your account.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {steps.map((step) => (
                <article
                  key={step.number}
                  className="rounded-2xl border border-white/10 bg-[#101827]/70 p-6"
                >
                  <p className="text-sm font-semibold tracking-[0.15em] text-blue-300">
                    {step.number}
                  </p>

                  <h3 className="mt-4 text-lg font-semibold">
                    {step.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-gray-400">
                    {step.description}
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold transition hover:bg-blue-500"
              >
                Get started
                <ArrowRight size={17} />
              </Link>

              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/15 px-6 py-3 font-medium transition hover:bg-white/5"
              >
                Already registered? Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>


      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-gray-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <Link href="/" className="font-semibold text-gray-300">
            FinBank
          </Link>

          <p>Digital Banking System · Project demonstration</p>

          <div className="flex flex-wrap gap-5">
            <Link href="/login" className="transition hover:text-white">
              Login
            </Link>

            <Link href="/register" className="transition hover:text-white">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
