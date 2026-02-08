import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';

const Dashboard = ({ session }) => {
    const navigate = useNavigate();
    const [societies, setSocieties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newSocietyName, setNewSocietyName] = useState('');
    const [newSocietyAddress, setNewSocietyAddress] = useState('');

    useEffect(() => {
        fetchSocieties();
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

    const handleCreateSociety = async (e) => {
        e.preventDefault();
        try {
            const latitude = 19.0760;
            const longitude = 72.8777;

            const { error } = await supabase
                .from('societies')
                .insert([{
                    name: newSocietyName,
                    address: newSocietyAddress,
                    latitude,
                    longitude,
                    user_id: session.user.id, // Link society to this user
                    is_verified: false // Default to unverified
                }]);

            if (error) throw error;

            setNewSocietyName('');
            setNewSocietyAddress('');
            fetchSocieties();
            alert('Society registered successfully! Please wait for Admin Verification.');
        } catch (error) {
            console.error('Error creating society:', error.message);
            alert('Error creating society.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-green-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
                    <div className="flex items-center">
                        <span className="text-2xl mr-2">🌱</span>
                        <h1 className="text-xl font-bold text-green-900 tracking-tight">Green-Tax Dashboard</h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500 hidden md:block">{session.user.email}</span>
                        <button
                            onClick={handleLogout}
                            className="text-red-600 hover:text-red-800 font-medium text-sm px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Society List Section */}
                    <section className="lg:col-span-2 space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-900">Registered Societies</h2>
                            <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">
                                {societies.length} Total
                            </span>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                            </div>
                        ) : societies.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                                <p className="text-gray-500">No societies found. Register one to get started!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {societies.map((society) => (
                                    <div key={society.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-2 bg-green-50 rounded-lg">
                                                <span className="text-xl">🏢</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="block text-green-700 font-bold bg-green-50 px-2 py-1 rounded text-sm mb-1">
                                                    ₹{society.tax_amount?.toLocaleString() ?? 0}
                                                </span>
                                                {society.is_verified ? (
                                                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-bold">Verified</span>
                                                ) : (
                                                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-bold">Pending Verification</span>
                                                )}
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">{society.name}</h3>
                                        <p className="text-gray-500 text-sm mb-4 line-clamp-2">{society.address}</p>

                                        {/* Show Upload Button ONLY if Verified and owned by user (or for all verified societies?) - Prompt says "upload option only to the registered user who have registered there society... and verified" */}
                                        {society.is_verified && society.user_id === session.user.id && (
                                            <button
                                                onClick={() => navigate('/upload', { state: { societyId: society.id } })}
                                                className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center justify-center"
                                            >
                                                📸 Upload Evidence
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Registration Form */}
                    <section className="bg-white rounded-xl shadow-lg border border-green-100 p-6 h-fit sticky top-24">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-1">Register New Society</h2>
                            <p className="text-sm text-gray-500">Add a new building to the tax audit system.</p>
                        </div>

                        <form onSubmit={handleCreateSociety} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Society Name</label>
                                <input
                                    type="text"
                                    value={newSocietyName}
                                    onChange={(e) => setNewSocietyName(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                                    placeholder="e.g. Green Valley Co-op"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <textarea
                                    value={newSocietyAddress}
                                    onChange={(e) => setNewSocietyAddress(e.target.value)}
                                    required
                                    rows="3"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all resize-none"
                                    placeholder="Full street address..."
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                            >
                                Register Society
                            </button>
                        </form>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
