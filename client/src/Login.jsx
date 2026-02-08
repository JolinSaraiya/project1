import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                navigate('/dashboard');
            }
        });
        return () => subscription.unsubscribe();
    }, [navigate]);

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                setMessage('Sign up successful! You can now sign in (or check email if confirmation is enabled).');
                setIsSignUp(false);
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                // Navigation happens in useEffect
            }
        } catch (error) {
            setMessage('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Background Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-32 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

            <div className="max-w-md w-full glass rounded-3xl p-8 relative z-10 border-t border-l border-white/20 shadow-2xl backdrop-blur-3xl">
                <div className="text-center mb-8">
                    <div className="mx-auto h-20 w-20 glass rounded-2xl flex items-center justify-center mb-4 shadow-lg rotate-3 hover:rotate-0 transition-all duration-500">
                        <span className="text-4xl filter drop-shadow-lg">🌱</span>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-md bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                        Green-Tax
                    </h1>
                    <p className="text-blue-100 font-medium mt-2 tracking-wide text-sm opacity-80">
                        iOS 26 Futuristic Rewards
                    </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-5">
                    <div className="space-y-1">
                        <label htmlFor="email" className="block text-xs font-bold text-blue-100 uppercase tracking-widest ml-1">Email</label>
                        <input
                            id="email"
                            type="email"
                            required
                            className="w-full input-glass"
                            placeholder="citizen@future.city"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="password" className="block text-xs font-bold text-blue-100 uppercase tracking-widest ml-1">Password</label>
                        <input
                            id="password"
                            type="password"
                            required
                            className="w-full input-glass"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full btn-glass mt-4 ${loading ? 'opacity-70 cursor-wait' : ''}`}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Authenticating...
                            </span>
                        ) : (isSignUp ? 'Initialize Identity' : 'Access Portal')}
                    </button>
                </form>

                {message && (
                    <div className={`mt-6 p-4 rounded-xl text-center text-sm font-bold backdrop-blur-md border ${message.includes('Error') ? 'bg-red-500/20 border-red-500/30 text-red-100' : 'bg-green-500/20 border-green-500/30 text-green-100'}`}>
                        {message}
                    </div>
                )}

                <div className="mt-6 text-center">
                    <button
                        type="button"
                        onClick={() => { setIsSignUp(!isSignUp); setMessage(''); }}
                        className="text-sm text-white/70 hover:text-white font-medium transition-colors hover:scale-105 transform duration-200"
                    >
                        {isSignUp ? 'Already verified? Access Portal' : 'New Citizen? Initialize Identity'}
                    </button>
                </div>

                <div className="mt-8 text-center border-t border-white/10 pt-4">
                    <button onClick={() => navigate('/admin-login')} className="text-xs text-white/40 hover:text-white/80 font-bold uppercase tracking-widest transition-all">
                        Admin Console Access
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
