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
        <div className="min-h-screen">
            {/* Glass Navigation */}
            <nav className="fixed top-0 w-full z-50 glass-dark border-b-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex items-center space-x-3">
                            <span className="text-3xl filter drop-shadow-lg">🌿</span>
                            <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-200 to-teal-400 tracking-tight">Green-Tax</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="hidden md:block text-sm text-blue-200 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                                {session?.user?.email}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="text-red-200 hover:text-red-100 hover:bg-red-500/20 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                            >
                                Disconnect
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 space-y-8 relative z-0">

                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-card bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-400/30">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-emerald-200 font-bold uppercase text-xs tracking-wider">Registered Societies</p>
                                <p className="text-4xl font-black text-white mt-1">{societies.length}</p>
                            </div>
                            <div className="h-12 w-12 bg-emerald-400/20 rounded-xl flex items-center justify-center text-2xl">🏢</div>
                        </div>
                    </div>
                    <div className="glass-card bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border-blue-400/30">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-200 font-bold uppercase text-xs tracking-wider">Verification Status</p>
                                <p className="text-4xl font-black text-white mt-1">
                                    {societies.filter(s => s.is_verified).length} / {societies.length}
                                </p>
                            </div>
                            <div className="h-12 w-12 bg-blue-400/20 rounded-xl flex items-center justify-center text-2xl">✅</div>
                        </div>
                    </div>
                </div>

                {/* Society List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Add New Society Card */}
                    <div className="glass-card border-dashed border-2 border-white/20 hover:border-emerald-400/50 hover:bg-white/5 flex flex-col justify-center items-center text-center cursor-pointer min-h-[300px] group"
                        onClick={() => {
                            const name = prompt("Enter Society Name:");
                            if (name) {
                                const addr = prompt("Enter Address:");
                                const lat = parseFloat(prompt("Latitude (e.g. 19.0760):"));
                                const long = parseFloat(prompt("Longitude (e.g. 72.8777):"));
                                const tax = parseFloat(prompt("Annual Tax Amount:"));
                                if (name && addr && !isNaN(lat) && !isNaN(long) && !isNaN(tax)) {
                                    // Manually triggering the create logic since we removed the form
                                    const create = async () => {
                                        const { error } = await supabase.from('societies').insert([{
                                            name, address: addr, latitude: lat, longitude: long,
                                            user_id: session.user.id, is_verified: false, tax_amount: tax
                                        }]);
                                        if (error) alert(error.message); else { alert("Registered!"); fetchSocieties(); }
                                    };
                                    create();
                                }
                            }
                        }}>
                        <div className="h-20 w-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <span className="text-4xl text-emerald-400">+</span>
                        </div>
                        <h3 className="text-xl font-bold text-emerald-100">Register Society</h3>
                        <p className="text-sm text-emerald-200/60 mt-2 max-w-[200px]">Add a new housing society to start tracking metrics</p>
                    </div>

                    {societies.map((society) => (
                        <div key={society.id} className="glass-card relative group overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                                <span className="text-5xl opacity-10">🏢</span>
                            </div>

                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-white leading-tight">{society.name}</h3>
                                {society.is_verified ?
                                    <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-2 py-1 rounded border border-emerald-500/30">VERIFIED</span> :
                                    <span className="bg-yellow-500/20 text-yellow-300 text-xs font-bold px-2 py-1 rounded border border-yellow-500/30">PENDING</span>
                                }
                            </div>

                            <p className="text-sm text-gray-300 mb-6 h-10">{society.address}</p>

                            <div className="space-y-4">
                                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                    <p className="text-xs text-gray-400 uppercase tracking-wider">Current Tax Bill</p>
                                    <p className="text-2xl font-mono font-bold text-emerald-300">₹{society.tax_amount.toLocaleString()}</p>
                                </div>

                                {society.is_verified && society.user_id === session.user.id && (
                                    <button
                                        onClick={() => navigate('/upload', { state: { societyId: society.id } })}
                                        className="w-full btn-glass flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500/30 hover:border-emerald-400"
                                    >
                                        <span>📸</span>
                                        <span>Upload Evidence</span>
                                    </button>
                                )}

                                {(!society.is_verified || society.user_id !== session.user.id) && (
                                    <div className="text-center text-xs text-gray-500 py-3 italic">
                                        {society.is_verified ? "Read-only access" : "Waiting for Admin Verification"}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
