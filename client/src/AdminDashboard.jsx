import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';
import CONFIG from './config';
import { SparklesText } from './components/SparklesText';

const AdminDashboard = ({ session }) => {
    const navigate = useNavigate();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [societies, setSocieties] = useState([]);
    const [verifying, setVerifying] = useState(null);

    useEffect(() => {
        fetchLogs();
        fetchSocieties();
    }, []);

    const fetchSocieties = async () => {
        try {
            console.log('Fetching societies...');
            const { data, error } = await supabase
                .from('societies')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching societies:', error);
                throw error;
            }

            console.log('Societies fetched:', data?.length || 0);
            setSocieties(data || []);
            return data;
        } catch (error) {
            console.error('Failed to fetch societies:', error.message);
            alert('Failed to load societies: ' + error.message);
            return [];
        }
    };

    const verifySociety = async (id) => {
        if (!confirm("Verify this society? Users will be able to upload evidence.")) return;

        setVerifying(id);
        try {
            console.log('Verifying society:', id);

            const { data, error } = await supabase
                .from('societies')
                .update({ is_verified: true })
                .eq('id', id)
                .select();

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            console.log('Update successful:', data);

            await fetchSocieties();

            alert("Society Verified!");
        } catch (error) {
            console.error("Error verifying:", error);
            alert("Verification failed: " + error.message);
        } finally {
            setVerifying(null);
        }
    };

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('compost_logs')
                .select(`
                    *,
                    societies (
                        name,
                        address
                    )
                `)
                .order('submitted_at', { ascending: false });

            if (error) throw error;
            setLogs(data || []);
        } catch (error) {
            console.error('Error fetching logs:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerification = async (logId, status, societyId) => {
        try {
            const { error: logError } = await supabase
                .from('compost_logs')
                .update({ status: status })
                .eq('id', logId);

            if (error) throw logError;

            if (status === 'approved' && societyId) {
                const { data: societyData, error: fetchError } = await supabase
                    .from('societies')
                    .select('tax_amount')
                    .eq('id', societyId)
                    .single();

                if (fetchError) throw fetchError;

                const currentTax = societyData.tax_amount;
                const discount = currentTax * CONFIG.TAX_DISCOUNT_RATE;
                const newTax = currentTax - discount;

                const { error: taxError } = await supabase
                    .from('societies')
                    .update({ tax_amount: newTax })
                    .eq('id', societyId);

                if (taxError) throw taxError;
                alert(`Log Approved! Tax reduced by 5% (₹${currentTax} → ₹${newTax.toFixed(2)})`);
            } else {
                alert(`Log marked as ${status}`);
            }

            fetchLogs();
        } catch (error) {
            console.error(`Error updating status:`, error.message);
            alert('Update failed: ' + error.message);
        }
    };

    const seedSocieties = async () => {
        const societyName = prompt("Enter society name:");
        if (!societyName) return;

        const societyAddress = prompt("Enter society address:");
        if (!societyAddress) return;

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

        const taxAmount = parseFloat(prompt("Enter tax amount (₹):"));
        if (isNaN(taxAmount)) {
            alert("Invalid tax amount");
            return;
        }

        try {
            const newSociety = {
                name: societyName,
                address: societyAddress,
                latitude: latitude,
                longitude: longitude,
                tax_amount: taxAmount
            };

            const { error } = await supabase.from('societies').insert([newSociety]);
            if (error) throw error;
            alert("Society added successfully!");
            fetchSocieties();
        } catch (error) {
            console.error("Error adding society:", error.message);
            alert("Failed to add society: " + error.message);
        }
    };

    return (
        <div className="min-h-screen">
            {/* Modern Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex items-center space-x-3">
                            <span className="text-3xl">🛡️</span>
                            <SparklesText
                                text="Admin Console"
                                className="text-2xl"
                                colors={{ first: "#06b6d4", second: "#14b8a6" }}
                                sparklesCount={6}
                            />
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={seedSocieties}
                                className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 border border-yellow-500/30 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                            >
                                ➕ Add Society
                            </button>
                            <button
                                onClick={() => navigate('/login')}
                                className="text-red-300 hover:text-red-200 hover:bg-red-500/20 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 space-y-8">
                {/* Societies Management */}
                <div className="modern-card">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <span>🏘️</span>
                        <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                            Society Management
                        </span>
                    </h2>

                    {societies.length === 0 ? (
                        <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-slate-700">
                            <p className="text-gray-400">No societies registered yet</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-700">
                                        <th className="text-left py-3 px-4 text-gray-300 font-semibold">Name</th>
                                        <th className="text-left py-3 px-4 text-gray-300 font-semibold">Address</th>
                                        <th className="text-left py-3 px-4 text-gray-300 font-semibold">Tax</th>
                                        <th className="text-left py-3 px-4 text-gray-300 font-semibold">Status</th>
                                        <th className="text-left py-3 px-4 text-gray-300 font-semibold">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {societies.map((society) => (
                                        <tr key={society.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                                            <td className="py-4 px-4 font-medium text-white">{society.name}</td>
                                            <td className="py-4 px-4 text-gray-300 text-sm">{society.address}</td>
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
                                                {!society.is_verified && (
                                                    <button
                                                        onClick={() => verifySociety(society.id)}
                                                        disabled={verifying === society.id}
                                                        className="bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                                                    >
                                                        {verifying === society.id ? 'Verifying...' : '✓ Verify'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Waste Logs Management */}
                <div className="modern-card">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <span>📋</span>
                        <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                            Waste Disposal Logs
                        </span>
                    </h2>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin text-4xl">⏳</div>
                            <p className="text-gray-400 mt-4">Loading logs...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-slate-700">
                            <p className="text-gray-400">No waste logs submitted yet</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {logs.map((log) => (
                                <div key={log.id} className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 hover:border-teal-500/30 transition-colors">
                                    <div className="flex flex-col lg:flex-row gap-6">
                                        {/* Image */}
                                        <div className="lg:w-1/3">
                                            <img
                                                src={log.image_url}
                                                alt="Evidence"
                                                className="w-full h-48 object-cover rounded-lg border border-slate-700"
                                            />
                                        </div>

                                        {/* Details */}
                                        <div className="lg:w-2/3 space-y-3">
                                            <div>
                                                <h3 className="text-lg font-bold text-white">{log.societies?.name}</h3>
                                                <p className="text-sm text-gray-400">{log.societies?.address}</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-gray-400">Submitted:</span>
                                                    <p className="text-white">{new Date(log.submitted_at).toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-400">Location:</span>
                                                    <p className="text-white">{log.verified_lat?.toFixed(4)}, {log.verified_long?.toFixed(4)}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-400 text-sm">Status:</span>
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${log.status === 'approved'
                                                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                                    : log.status === 'rejected'
                                                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                                        : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                                                    }`}>
                                                    {log.status === 'approved' ? '✓ Approved' : log.status === 'rejected' ? '✗ Rejected' : '⏳ Pending'}
                                                </span>
                                            </div>

                                            {log.status === 'pending' && (
                                                <div className="flex gap-3 pt-2">
                                                    <button
                                                        onClick={() => handleVerification(log.id, 'approved', log.society_id)}
                                                        className="btn-success flex-1"
                                                    >
                                                        ✓ Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleVerification(log.id, 'rejected', log.society_id)}
                                                        className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 px-6 py-3 rounded-xl font-bold transition-all flex-1"
                                                    >
                                                        ✗ Reject
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
