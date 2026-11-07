
import Sidebar from "../components/Sidebar";

export default function DashboardLayout({ children }) {
    return (
        <div className="min-h-screen">
            <Sidebar />

            <main className="min-h-screen bg-[#070b14] pt-16 text-white lg:pl-[272px] lg:pt-0">
                {children}
            </main>
        </div>
    );
}
