import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                // Check if admin
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();

                if (profile?.role === 'admin') {
                    navigate('/admin'); // Redirect to Admin Dashboard
                } else {
                    // If logged in but not admin, sign out or redirect
                    await supabase.auth.signOut();
                    setMessage("Access Denied: You are not an admin.");
                }
            }
        };
        checkSession();
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            // Navigation handled by useEffect
        } catch (error) {
            setMessage('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-700">
                <div className="text-center mb-8">
                    <div className="mx-auto h-16 w-16 bg-red-900 rounded-full flex items-center justify-center mb-4">
                        <span className="text-3xl">🛡️</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-white">Admin Portal</h1>
                    <p className="text-gray-400 mt-2">Authorized Personnel Only</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Admin Email</label>
                        <input
                            id="email"
                            type="email"
                            required
                            className="block w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition duration-200 outline-none"
                            placeholder="admin@greentax.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                        <input
                            id="password"
                            type="password"
                            required
                            className="block w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition duration-200 outline-none"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Authenticating...' : 'Login as Admin'}
                    </button>
                </form>

                {message && (
                    <div className={`mt-6 p-4 rounded-lg text-center text-sm font-medium ${message.includes('Error') || message.includes('Denied') ? 'bg-red-900/50 text-red-200 border border-red-800' : 'bg-blue-900/50 text-blue-200 border border-blue-800'}`}>
                        {message}
                    </div>
                )}

                <div className="mt-6 text-center">
                    <button onClick={() => navigate('/login')} className="text-gray-500 hover:text-white text-sm transition-colors">
                        ← Back to User Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
