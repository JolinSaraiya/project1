import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = ({ session }) => {
    const navigate = useNavigate();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [societies, setSocieties] = useState([]);
    const [verifying, setVerifying] = useState(null); // Track which society is being verified

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

        setVerifying(id); // Set loading state
        try {
            console.log('Verifying society:', id);

            const { data, error } = await supabase
                .from('societies')
                .update({ is_verified: true })
                .eq('id', id)
                .select(); // Return updated row

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            console.log('Update successful:', data);

            // Refresh the list
            await fetchSocieties();

            alert("Society Verified!");
        } catch (error) {
            console.error("Error verifying:", error);
            alert("Verification failed: " + error.message);
        } finally {
            setVerifying(null); // Clear loading state
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

            if (logError) throw logError;

            if (status === 'approved' && societyId) {
                const { data: societyData, error: fetchError } = await supabase
                    .from('societies')
                    .select('tax_amount')
                    .eq('id', societyId)
                    .single();

                if (fetchError) throw fetchError;

                const currentTax = societyData.tax_amount;
                const discount = currentTax * 0.05;
                const newTax = currentTax - discount;

                const { error: taxError } = await supabase
                    .from('societies')
                    .update({ tax_amount: newTax })
                    .eq('id', societyId);

                if (taxError) throw taxError;
                alert(`Log Approved! Tax reduced by 5% (₹${currentTax} -> ₹${newTax.toFixed(2)})`);
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
        if (!confirm("Add default societies for testing?")) return;

        try {
            const defaults = [
                { name: "Green Heights", address: "123 Eco Street, Mumbai", latitude: 19.0760, longitude: 72.8777, tax_amount: 50000 },
                { name: "Eco Residency", address: "456 Palm Grove, Pune", latitude: 18.5204, longitude: 73.8567, tax_amount: 75000 },
                { name: "Sustainable Living", address: "789 Solar Ave, Delhi", latitude: 28.7041, longitude: 77.1025, tax_amount: 100000 }
            ];

            const { error } = await supabase.from('societies').insert(defaults);
            if (error) throw error;
            alert("Default societies added!");
        } catch (error) {
            console.error("Error seeding:", error.message);
            alert("Seeding failed: " + error.message);
        }
    };

    return (
        <div className="min-h-screen">
            {/* Admin Header */}
            <header className="glass-dark border-b border-white/10 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <span className="text-3xl">🛡️</span>
                        <h1 className="text-xl font-black tracking-widest text-white uppercase bg-white/10 px-4 py-1 rounded-lg border border-white/10">Admin Console</h1>
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={seedSocieties}
                            className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 border border-yellow-500/30 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                        >
                            🌱 Seed Data
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

                {/* Society Verification Section */}
                <div className="glass-card">
                    <div className="px-2 pb-4 border-b border-white/10 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-white uppercase tracking-wider">Society Registrations</h2>
                        <span className="bg-yellow-500/20 text-yellow-200 text-xs font-bold px-3 py-1 rounded-full border border-yellow-500/30">
                            {societies.filter(s => !s.is_verified).length} Pending Verification
                        </span>
                    </div>

                    <div className="overflow-x-auto mt-4">
                        <table className="min-w-full">
                            <thead className="bg-white/5 text-blue-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider rounded-l-xl">Details</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider rounded-r-xl">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {societies.map(s => (
                                    <tr key={s.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-white">{s.name}</div>
                                            <div className="text-xs text-white/50">{s.address}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {s.is_verified ? (
                                                <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded font-bold border border-blue-500/30">Verified</span>
                                            ) : (
                                                <span className="bg-yellow-500/20 text-yellow-300 text-xs px-2 py-1 rounded font-bold border border-yellow-500/30">Pending</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {!s.is_verified && (
                                                <button
                                                    onClick={() => verifySociety(s.id)}
                                                    disabled={verifying === s.id}
                                                    className={`text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-lg transition-all ${verifying === s.id
                                                        ? 'bg-gray-600 cursor-not-allowed opacity-50'
                                                        : 'bg-blue-600/80 hover:bg-blue-600 shadow-blue-600/20 hover:scale-105'
                                                        }`}
                                                >
                                                    {verifying === s.id ? 'Verifying...' : 'Verify'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Existing Verification Queue */}
                <div className="glass-card">
                    <div className="px-2 pb-4 border-b border-white/10 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-white uppercase tracking-wider">Evidence Verification Queue</h2>
                        <span className="bg-blue-500/20 text-blue-200 text-xs font-bold px-3 py-1 rounded-full border border-blue-500/30">
                            {logs.filter(l => l.status === 'pending').length} Pending
                        </span>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center text-white/50">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                            <p className="mt-2 text-sm">Loading records...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="p-12 text-center text-white/30 border-2 border-dashed border-white/10 rounded-xl mt-4">
                            No submission records found.
                        </div>
                    ) : (
                        <div className="overflow-x-auto mt-4">
                            <table className="min-w-full">
                                <thead className="bg-white/5 text-blue-100">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider rounded-l-xl">Society Details</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Submitted</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Evidence</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Location Status</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Status</th>
                                        <th scope="col" className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider rounded-r-xl">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-white">{log.societies?.name}</span>
                                                    <span className="text-xs text-white/50">{log.societies?.address}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                                                {new Date(log.submitted_at).toLocaleDateString()}
                                                <br />
                                                <span className="text-xs opacity-50">{new Date(log.submitted_at).toLocaleTimeString()}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <a href={log.image_url} target="_blank" rel="noopener noreferrer" className="block w-16 h-16 rounded-lg overflow-hidden border-2 border-white/20 hover:border-blue-400 hover:scale-110 transition-all shadow-md">
                                                    <img src={log.image_url} alt="Proof" className="w-full h-full object-cover" />
                                                </a>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60 font-mono bg-white/5 rounded-lg my-2">
                                                <div className="text-xs">Lat: {log.verified_lat?.toFixed(4)}</div>
                                                <div className="text-xs">Lon: {log.verified_long?.toFixed(4)}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-md border ${log.status === 'approved' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                                                    log.status === 'rejected' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                                                        'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                                                    }`}>
                                                    {log.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {log.status === 'pending' && (
                                                    <div className="flex justify-end space-x-2">
                                                        <button
                                                            onClick={() => handleVerification(log.id, 'approved', log.society_id)}
                                                            className="text-white bg-emerald-600/80 hover:bg-emerald-500 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow hover:shadow-emerald-500/20"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleVerification(log.id, 'rejected')}
                                                            className="text-white bg-red-600/80 hover:bg-red-500 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow hover:shadow-red-500/20"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
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

export default AdminDashboard;
