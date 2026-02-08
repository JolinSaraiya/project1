import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = ({ session }) => {
    const navigate = useNavigate();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [societies, setSocieties] = useState([]);

    useEffect(() => {
        fetchLogs();
        fetchSocieties();
    }, []);

    const fetchSocieties = async () => {
        const { data } = await supabase
            .from('societies')
            .select('*')
            .order('created_at', { ascending: false });
        setSocieties(data || []);
    };

    const verifySociety = async (id) => {
        if (!confirm("Verify this society? Users will be able to upload evidence.")) return;
        try {
            const { error } = await supabase
                .from('societies')
                .update({ is_verified: true })
                .eq('id', id);

            if (error) throw error;
            alert("Society Verified!");
            fetchSocieties();
        } catch (error) {
            console.error("Error verifying:", error.message);
            alert("Verification failed");
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
        <div className="min-h-screen bg-gray-100 font-sans">
            {/* Admin Header */}
            <header className="bg-gray-800 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl">🛡️</span>
                        <h1 className="text-xl font-bold tracking-wider text-gray-100">ADMIN CONTROL PANEL</h1>
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={seedSocieties}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                            🌱 Seed Data
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors border border-gray-600"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* Society Verification Section */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                        <h2 className="text-lg font-medium text-gray-900">Society Registrations</h2>
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                            {societies.filter(s => !s.is_verified).length} Pending Verification
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {societies.map(s => (
                                    <tr key={s.id}>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{s.name}</div>
                                            <div className="text-xs text-gray-500">{s.address}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {s.is_verified ? (
                                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Verified</span>
                                            ) : (
                                                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Pending</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {!s.is_verified && (
                                                <button
                                                    onClick={() => verifySociety(s.id)}
                                                    className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs"
                                                >
                                                    Verify
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
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                        <h2 className="text-lg font-medium text-gray-900">Evidence Verification Queue</h2>
                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                            {logs.filter(l => l.status === 'pending').length} Pending
                        </span>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                            <p className="mt-2 text-gray-500">Loading records...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            No submission records found.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Society Details</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Evidence</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location Status</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-gray-900">{log.societies?.name}</span>
                                                    <span className="text-xs text-gray-500">{log.societies?.address}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(log.submitted_at).toLocaleDateString()}
                                                <br />
                                                <span className="text-xs">{new Date(log.submitted_at).toLocaleTimeString()}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <a href={log.image_url} target="_blank" rel="noopener noreferrer" className="block w-16 h-16 rounded-lg overflow-hidden border border-gray-200 hover:border-blue-500 transition-colors">
                                                    <img src={log.image_url} alt="Proof" className="w-full h-full object-cover" />
                                                </a>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                                <div>Lat: {log.verified_lat?.toFixed(4)}</div>
                                                <div>Lon: {log.verified_long?.toFixed(4)}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${log.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                    log.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {log.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {log.status === 'pending' && (
                                                    <div className="flex justify-end space-x-2">
                                                        <button
                                                            onClick={() => handleVerification(log.id, 'approved', log.society_id)}
                                                            className="text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded text-xs font-bold transition-colors"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleVerification(log.id, 'rejected')}
                                                            className="text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded text-xs font-bold transition-colors"
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
