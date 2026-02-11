import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';
import { SparklesText } from './components/SparklesText';

const AdminLogin = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();

                if (profile?.role === 'admin') {
                    navigate('/admin');
                } else {
                    setMessage('Access denied: Admin privileges required');
                    await supabase.auth.signOut();
                }
            }
        });
        return () => subscription.unsubscribe();
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', data.user.id)
                .single();

            if (profile?.role !== 'admin') {
                await supabase.auth.signOut();
                setMessage('Access denied: Admin privileges required');
            }
        } catch (error) {
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-md w-full modern-card">
                <div className="text-center mb-8">
                    <SparklesText
                        text="Admin Access"
                        className="text-5xl mb-2"
                        colors={{ first: "#FE8BBB", second: "#9E7AFF" }}
                        sparklesCount={10}
                    />
                    <p className="text-gray-400 mt-4">🔐 Authorized Personnel Only</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Admin Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="modern-input w-full"
                            placeholder="admin@greentax.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="modern-input w-full"
                            placeholder="Enter admin password"
                            required
                        />
                    </div>

                    {message && (
                        <div className="p-3 rounded-lg text-sm bg-red-500/20 text-red-300 border border-red-500/30">
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full"
                    >
                        {loading ? 'Authenticating...' : 'Admin Login'}
                    </button>

                    <div className="text-center pt-4 border-t border-slate-700">
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
                        >
                            ← Back to User Login
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
