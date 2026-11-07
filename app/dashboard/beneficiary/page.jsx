"use client";

import { useEffect, useState } from "react";
import API from "@/app/Api/api";
import {
    Users,
    Search,
    Plus,
    Trash2,
    Send,
    Loader2,
    X,
    ShieldCheck,
    AlertCircle,
    CheckCircle2,
} from "lucide-react";

export default function BeneficiaryPage() {
    const [beneficiaries, setBeneficiaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);

    const [account, setAccount] = useState("");
    const [nickname, setNickname] = useState("");
    const [verifiedData, setVerifiedData] = useState(null);

    const [verifying, setVerifying] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");


    const fetchBeneficiaries = async () => {
        try {
            const res = await API.get("/beneficiaries");
            setBeneficiaries(res.data.data || []);
        } catch (error) {
            console.error("Fetch beneficiaries error:", error);
            setErrorMessage(
                error.response?.data?.message ||
                "Unable to load beneficiaries. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchBeneficiaries();
    }, []);

    const resetModal = () => {
        setAccount("");
        setNickname("");
        setVerifiedData(null);
        setErrorMessage("");
        setSuccessMessage("");
        setVerifying(false);
        setSaving(false);
    };

    const closeModal = () => {
        if (saving || verifying) return;
        setShowModal(false);
        resetModal();
    };


    const verifyAccount = async () => {
        const accountNumber = account.trim();

        if (!accountNumber) {
            setErrorMessage("Please enter an account number.");
            return;
        }

        setVerifying(true);
        setErrorMessage("");
        setSuccessMessage("");
        setVerifiedData(null);

        try {
            const res = await API.get(
                `/beneficiaries/verify/${encodeURIComponent(accountNumber)}`
            );


            const data = res.data.data || res.data.account || res.data;

            const verifiedAccount = {
                account_number:
                    data.account_number ||
                    data.beneficiary_account_number ||
                    accountNumber,
                full_name:
                    data.full_name ||
                    data.account_holder_name ||
                    data.beneficiary_name ||
                    data.name ||
                    "",
                bank_name: data.bank_name || "",
                ifsc_code: data.ifsc_code || data.ifsc_prefix || "",
            };

            if (!verifiedAccount.full_name) {
                throw new Error(
                    "The verification response did not contain the account owner's name. Check the backend response."
                );
            }

            setVerifiedData(verifiedAccount);
            setSuccessMessage("Account verified successfully.");
        } catch (error) {
            console.error("Account verification error:", error);
            setErrorMessage(
                error.response?.data?.message ||
                error.message ||
                "Account verification failed. Check the account number."
            );
        } finally {
            setVerifying(false);
        }
    };


    const addBeneficiary = async () => {
        if (!verifiedData) {
            setErrorMessage("Please verify the account before saving.");
            return;
        }

        setSaving(true);
        setErrorMessage("");
        setSuccessMessage("");

        try {
            await API.post("/beneficiaries/add", {
                beneficiary_name: verifiedData.full_name,
                beneficiary_account_number: verifiedData.account_number,
                bank_name: verifiedData.bank_name,
                ifsc_code: verifiedData.ifsc_code,
                nickname: nickname.trim(),
            });

            setSuccessMessage("Beneficiary saved successfully.");
            setShowModal(false);
            resetModal();
            await fetchBeneficiaries();
        } catch (error) {
            console.error("Add beneficiary error:", error);
            setErrorMessage(
                error.response?.data?.message ||
                "Could not save beneficiary. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    const deleteBeneficiary = async (id) => {
        if (!id) {
            setErrorMessage("Beneficiary ID is missing.");
            return;
        }

        if (!window.confirm("Are you sure you want to delete this beneficiary?")) {
            return;
        }

        setDeletingId(id);
        setErrorMessage("");

        try {
            await API.delete(`/beneficiaries/${id}`);
            await fetchBeneficiaries();
        } catch (error) {
            console.error("Delete beneficiary error:", error);
            setErrorMessage(
                error.response?.data?.message ||
                "Unable to delete beneficiary. Please try again."
            );
        } finally {
            setDeletingId(null);
        }
    };

    const filteredBeneficiaries = beneficiaries.filter((b) => {
        const value = search.toLowerCase();

        return (
            (b.beneficiary_name || "").toLowerCase().includes(value) ||
            String(b.account_number || b.beneficiary_account_number || "").includes(
                search
            ) ||
            (b.nickname || "").toLowerCase().includes(value)
        );
    });

    const avatarColor = (name) => {
        const colors = [
            ["#EDE9FE", "#7C3AED"],
            ["#FEF3C7", "#D97706"],
            ["#DBEAFE", "#2563EB"],
            ["#FCE7F3", "#DB2777"],
            ["#D1FAE5", "#059669"],
            ["#FEE2E2", "#DC2626"],
        ];

        const idx = (name?.charCodeAt(0) || 0) % colors.length;
        return colors[idx];
    };

    return (
        <div
            style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}
            className="min-h-screen bg-[#F7F8FA] p-4 md:p-10 max-w-6xl mx-auto"
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
                <div>
                    <p className="text-[11px] font-bold tracking-widest text-[#9CA3AF] uppercase mb-1">
                        Manage Accounts
                    </p>
                    <h1 className="text-4xl font-black text-[#0F172A] leading-none tracking-tight">
                        Beneficiaries
                    </h1>
                </div>

                <button
                    onClick={() => {
                        resetModal();
                        setShowModal(true);
                    }}
                    className="group flex items-center gap-2 bg-[#0F172A] hover:bg-[#1E293B] text-white px-5 py-3 rounded-xl font-semibold text-sm transition-all shadow-md"
                >
                    <Plus size={15} />
                    Add Beneficiary
                </button>
            </div>

            {errorMessage && !showModal && (
                <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {[
                    {
                        label: "Total Saved",
                        value: beneficiaries.length,
                        accent: "#6366F1",
                    },
                    {
                        label: "Ready to Transfer",
                        value: beneficiaries.length,
                        accent: "#10B981",
                    },
                    {
                        label: "Saved Accounts",
                        value: beneficiaries.length,
                        accent: "#3B82F6",
                    },
                ].map((item) => (
                    <div
                        key={item.label}
                        className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5"
                    >
                        <p className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-widest">
                            {item.label}
                        </p>
                        <p
                            style={{ color: item.accent }}
                            className="text-3xl font-black mt-1 tabular-nums"
                        >
                            {item.value}
                        </p>
                    </div>
                ))}
            </div>

            <div className="relative mb-6">
                <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
                    size={16}
                />
                <input
                    type="text"
                    placeholder="Search by name, account, or nickname..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white border border-[#E5E7EB] rounded-xl pl-11 pr-4 py-3 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F172A]/10 shadow-sm"
                />
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-28 gap-3 text-[#9CA3AF]">
                    <Loader2 className="animate-spin text-[#6366F1]" size={28} />
                    <span className="text-sm font-medium">
                        Loading beneficiaries...
                    </span>
                </div>
            ) : filteredBeneficiaries.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredBeneficiaries.map((b) => {
                        const name = b.beneficiary_name || "Beneficiary";
                        const [avatarBg, avatarText] = avatarColor(name);
                        const id = b.id ?? b.beneficiary_id;
                        const accountNumber =
                            b.account_number || b.beneficiary_account_number || "";

                        return (
                            <div
                                key={id ?? accountNumber}
                                className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm hover:shadow-md p-6 flex flex-col gap-5"
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        style={{ background: avatarBg, color: avatarText }}
                                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black shrink-0"
                                    >
                                        {name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-[#0F172A] text-base truncate">
                                            {name}
                                        </h3>
                                        <p className="text-xs text-[#9CA3AF] truncate">
                                            {b.nickname || "No nickname"}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-[#F7F8FA] rounded-xl p-4 space-y-3">
                                    <div className="flex justify-between items-center gap-3">
                                        <span className="text-[11px] font-bold text-[#9CA3AF] uppercase">
                                            Account
                                        </span>
                                        <span className="text-sm font-semibold text-[#374151] tracking-widest">
                                            •••• {accountNumber.slice(-4)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center gap-3">
                                        <span className="text-[11px] font-bold text-[#9CA3AF] uppercase">
                                            IFSC
                                        </span>
                                        <span className="text-sm font-semibold text-[#374151]">
                                            {b.ifsc_code || "—"}
                                        </span>
                                    </div>
                                    {b.bank_name && (
                                        <div className="flex justify-between items-center gap-3">
                                            <span className="text-[11px] font-bold text-[#9CA3AF] uppercase">
                                                Bank
                                            </span>
                                            <span className="text-sm text-[#374151] truncate">
                                                {b.bank_name}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2 mt-auto">
                                    <button
                                        disabled
                                        title="Transfer flow not connected yet"
                                        className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-400 font-bold py-2.5 rounded-xl text-sm cursor-not-allowed"
                                    >
                                        <Send size={14} />
                                        Transfer
                                    </button>
                                    <button
                                        onClick={() => deleteBeneficiary(id)}
                                        disabled={deletingId === id}
                                        aria-label={`Delete ${name}`}
                                        className="flex items-center justify-center bg-[#FEF2F2] hover:bg-[#FEE2E2] disabled:opacity-50 text-[#DC2626] px-4 rounded-xl"
                                    >
                                        {deletingId === id ? (
                                            <Loader2 size={15} className="animate-spin" />
                                        ) : (
                                            <Trash2 size={15} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-12 md:p-20 text-center">
                    <div className="w-16 h-16 bg-[#F3F4F6] rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <Users size={28} className="text-[#D1D5DB]" />
                    </div>
                    <h2 className="text-xl font-black text-[#0F172A]">
                        {search ? "No matching beneficiaries" : "No beneficiaries yet"}
                    </h2>
                    <p className="text-sm text-[#9CA3AF] mt-2 mb-6">
                        {search
                            ? "Try a different name, account number, or nickname."
                            : "Verify and save an account to make it available for future transfers."}
                    </p>
                    {!search && (
                        <button
                            onClick={() => {
                                resetModal();
                                setShowModal(true);
                            }}
                            className="inline-flex items-center gap-2 bg-[#0F172A] text-white px-5 py-2.5 rounded-xl font-semibold text-sm"
                        >
                            <Plus size={14} />
                            Add your first beneficiary
                        </button>
                    )}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F3F4F6]">
                            <div>
                                <h2 className="text-xl font-black text-[#0F172A]">
                                    Add Beneficiary
                                </h2>
                                <p className="text-xs text-[#9CA3AF] mt-1">
                                    Verify the account before saving it.
                                </p>
                            </div>
                            <button
                                onClick={closeModal}
                                disabled={saving || verifying}
                                aria-label="Close"
                                className="w-8 h-8 rounded-xl bg-[#F3F4F6] flex items-center justify-center text-[#6B7280] disabled:opacity-50"
                            >
                                <X size={15} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {errorMessage && (
                                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                    <AlertCircle size={17} className="shrink-0 mt-0.5" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}

                            {successMessage && (
                                <div className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                                    <CheckCircle2 size={17} className="shrink-0 mt-0.5" />
                                    <span>{successMessage}</span>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">
                                    Account Number
                                </label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="off"
                                    placeholder="Enter account number"
                                    value={account}
                                    disabled={verifying || saving || Boolean(verifiedData)}
                                    onChange={(e) => {
                                        setAccount(e.target.value);
                                        setVerifiedData(null);
                                        setSuccessMessage("");
                                        setErrorMessage("");
                                    }}
                                    className="w-full bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F172A]/15 disabled:opacity-70"
                                />
                            </div>

                            {!verifiedData ? (
                                <button
                                    onClick={verifyAccount}
                                    disabled={verifying || saving || !account.trim()}
                                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm"
                                >
                                    {verifying ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Verifying Account...
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheck size={16} />
                                            Verify Account
                                        </>
                                    )}
                                </button>
                            ) : (
                                <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-3">
                                    <div className="flex items-center gap-2 text-green-700 font-bold text-sm">
                                        <CheckCircle2 size={18} />
                                        Verified Account
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest text-green-700/70 font-bold">
                                            Account Holder
                                        </p>
                                        <p className="font-bold text-[#0F172A]">
                                            {verifiedData.full_name}
                                        </p>
                                    </div>
                                    {verifiedData.bank_name && (
                                        <div>
                                            <p className="text-[10px] uppercase tracking-widest text-green-700/70 font-bold">
                                                Bank
                                            </p>
                                            <p className="text-sm text-[#0F172A]">
                                                {verifiedData.bank_name}
                                            </p>
                                        </div>
                                    )}
                                    {verifiedData.ifsc_code && (
                                        <div>
                                            <p className="text-[10px] uppercase tracking-widest text-green-700/70 font-bold">
                                                IFSC
                                            </p>
                                            <p className="text-sm text-[#0F172A]">
                                                {verifiedData.ifsc_code}
                                            </p>
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setVerifiedData(null);
                                            setAccount("");
                                            setNickname("");
                                            setSuccessMessage("");
                                            setErrorMessage("");
                                        }}
                                        className="text-xs font-semibold underline text-green-800"
                                    >
                                        Verify a different account
                                    </button>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">
                                    Nickname (optional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Brother, Landlord"
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    disabled={!verifiedData || saving}
                                    maxLength={50}
                                    className="w-full bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F172A]/15 disabled:opacity-50"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 px-6 pb-6">
                            <button
                                onClick={closeModal}
                                disabled={saving || verifying}
                                className="flex-1 border border-[#E5E7EB] text-[#374151] font-semibold py-3 rounded-xl text-sm disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={addBeneficiary}
                                disabled={!verifiedData || saving || verifying}
                                className="flex-1 flex items-center justify-center gap-2 bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold py-3 rounded-xl text-sm disabled:opacity-40"
                            >
                                {saving && <Loader2 size={15} className="animate-spin" />}
                                {saving ? "Saving..." : "Save Beneficiary"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
