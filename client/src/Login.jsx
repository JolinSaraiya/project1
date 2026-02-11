import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';
import { SparklesText } from './components/SparklesText';

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
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;

                // Manual Profile Creation (Fallback since Trigger is removed)
                if (data?.user) {
                    try {
                        const { error: profileError } = await supabase
                            .from('profiles')
                            .insert([
                                { id: data.user.id, role: 'user' }
                            ]);

                        if (profileError) {
                            console.warn("Profile creation warning:", profileError);
                            // Verify if it's just a duplicate (ignore if so)
                            if (profileError.code !== '23505') {
                                // Don't block flow, but log it
                            }
                        }
                    } catch (profileError) {
                        console.error("Profile creation failed:", profileError);
                    }
                }

                setMessage('Sign up successful! Please check your email to verify your account.');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
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
                        text="Green-Tax"
                        className="text-5xl mb-2"
                        colors={{ first: "#9E7AFF", second: "#FE8BBB" }}
                        sparklesCount={8}
                    />
                    <p className="text-gray-400 mt-4">Sustainable Living, Rewarded</p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="modern-input w-full"
                            placeholder="Enter your email"
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
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    {message && (
                        <div className={`p-3 rounded-lg text-sm ${message.includes('successful')
                                ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                : 'bg-red-500/20 text-red-300 border border-red-500/30'
                            }`}>
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full"
                    >
                        {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Login')}
                    </button>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
                        >
                            {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
                        </button>
                    </div>

                    <div className="text-center pt-4 border-t border-slate-700">
                        <button
                            type="button"
                            onClick={() => navigate('/admin-login')}
                            className="text-pink-400 hover:text-pink-300 text-sm transition-colors"
                        >
                            Admin Login →
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
