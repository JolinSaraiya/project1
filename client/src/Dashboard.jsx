import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';
import { SparklesText } from './components/SparklesText';

const Dashboard = ({ session }) => {
    const navigate = useNavigate();
    const [societies, setSocieties] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSocieties();

        // Auto-refresh when window regains focus
        const handleFocus = () => {
            console.log('Window focused, refreshing societies...');
            fetchSocieties();
        };

        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const fetchSocieties = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase.from('societies').select('*');
            if (error) throw error;
            setSocieties(data || []);
        } catch (error) {
            console.error('Error fetching societies:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterSociety = async () => {
        const name = prompt("Enter society name:");
        if (!name) return;

        const address = prompt("Enter society address:");
        if (!address) return;

        const latitude = parseFloat(prompt("Enter latitude:"));
        if (isNaN(latitude)) {
            alert("Invalid latitude");
            return;
        }

        const longitude = parseFloat(prompt("Enter longitude:"));
        if (isNaN(longitude)) {
            alert("Invalid longitude");
            return;
        }

        const taxAmount = parseFloat(prompt("Enter current tax amount (₹):"));
        if (isNaN(taxAmount)) {
            alert("Invalid tax amount");
            return;
        }

        try {
            const { error } = await supabase.from('societies').insert([
                {
                    name,
                    address,
                    latitude,
                    longitude,
                    tax_amount: taxAmount,
                    is_verified: false
                }
            ]);

            if (error) throw error;
            alert("Society registered successfully! Awaiting admin verification.");
            fetchSocieties();
        } catch (error) {
            console.error("Error registering society:", error.message);
            alert("Registration failed: " + error.message);
        }
    };

    return (
        <div className="min-h-screen">
            {/* Modern Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex items-center space-x-3">
                            <span className="text-3xl">🌿</span>
                            <SparklesText
                                text="Green-Tax"
                                className="text-2xl"
                                colors={{ first: "#9E7AFF", second: "#FE8BBB" }}
                                sparklesCount={5}
                            />
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={fetchSocieties}
                                disabled={loading}
                                className="text-purple-300 hover:text-purple-200 hover:bg-purple-500/20 px-3 py-2 rounded-xl text-sm font-bold transition-all flex items-center space-x-2"
                                title="Refresh societies"
                            >
                                <span className={loading ? 'animate-spin' : ''}>🔄</span>
                                <span className="hidden md:inline">Refresh</span>
                            </button>
                            <span className="hidden md:block text-sm text-gray-300 bg-slate-800 px-4 py-2 rounded-full border border-slate-700">
                                {session?.user?.email}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="text-red-300 hover:text-red-200 hover:bg-red-500/20 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 space-y-8">
                {/* Header Section */}
                <div className="modern-card">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                Welcome to Your Dashboard
                            </h1>
                            <p className="text-gray-400 mt-2">Manage your societies and track your green rewards</p>
                        </div>
                        <button
                            onClick={handleRegisterSociety}
                            className="btn-success whitespace-nowrap"
                        >
                            ➕ Register New Society
                        </button>
                    </div>
                </div>

                {/* Societies Section */}
                <div className="modern-card">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <span>🏘️</span>
                        <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Your Societies
                        </span>
                    </h2>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin text-4xl">⏳</div>
                            <p className="text-gray-400 mt-4">Loading societies...</p>
                        </div>
                    ) : societies.length === 0 ? (
                        <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-slate-700">
                            <p className="text-gray-400 text-lg">No societies registered yet</p>
                            <p className="text-gray-500 text-sm mt-2">Click "Register New Society" to get started</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-700">
                                        <th className="text-left py-3 px-4 text-gray-300 font-semibold">Society Name</th>
                                        <th className="text-left py-3 px-4 text-gray-300 font-semibold">Address</th>
                                        <th className="text-left py-3 px-4 text-gray-300 font-semibold">Tax Amount</th>
                                        <th className="text-left py-3 px-4 text-gray-300 font-semibold">Status</th>
                                        <th className="text-left py-3 px-4 text-gray-300 font-semibold">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {societies.map((society) => (
                                        <tr key={society.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                                            <td className="py-4 px-4 font-medium text-white">{society.name}</td>
                                            <td className="py-4 px-4 text-gray-300">{society.address}</td>
                                            <td className="py-4 px-4 text-green-400 font-semibold">₹{society.tax_amount?.toLocaleString()}</td>
                                            <td className="py-4 px-4">
                                                {society.is_verified ? (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-300 border border-green-500/30">
                                                        ✓ Verified
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                                                        ⏳ Pending
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 px-4">
                                                {society.is_verified ? (
                                                    <button
                                                        onClick={() => navigate('/upload', { state: { societyId: society.id } })}
                                                        className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 px-4 py-2 rounded-lg text-sm font-bold transition-all"
                                                    >
                                                        📤 Upload Evidence
                                                    </button>
                                                ) : (
                                                    <span className="text-gray-500 text-sm">Awaiting verification</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
