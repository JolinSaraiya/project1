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
                    } catch (err) {
                        console.error("Manual profile check failed", err);
                    }
                }

                setMessage('Sign up successful! Please check your email to confirm your account.');
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
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', position: 'relative', overflow: 'hidden' }}>
            {/* Animated Background Blobs */}
            <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '24rem', height: '24rem', background: '#4f46e5', borderRadius: '9999px', mixBlendMode: 'multiply', filter: 'blur(64px)', opacity: 0.4 }} className="animate-blob"></div>
            <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '24rem', height: '24rem', background: '#c026d3', borderRadius: '9999px', mixBlendMode: 'multiply', filter: 'blur(64px)', opacity: 0.4 }} className="animate-blob animation-delay-2000"></div>
            <div style={{ position: 'absolute', bottom: '-8rem', left: '5rem', width: '24rem', height: '24rem', background: '#0284c7', borderRadius: '9999px', mixBlendMode: 'multiply', filter: 'blur(64px)', opacity: 0.4 }} className="animate-blob animation-delay-4000"></div>

            <div style={{ maxWidth: '28rem', width: '100%', background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(48px)', borderRadius: '1.5rem', padding: '2rem', position: 'relative', zIndex: 10, border: '1px solid rgba(255, 255, 255, 0.2)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ margin: '0 auto', height: '5rem', width: '5rem', background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(48px)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', transform: 'rotate(3deg)', transition: 'all 0.5s', border: '1px solid rgba(192, 38, 211, 0.3)' }}>
                        <span style={{ fontSize: '2.25rem', filter: 'drop-shadow(0 10px 8px rgba(0, 0, 0, 0.04))' }}>🌱</span>
                    </div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 900, letterSpacing: '-0.025em', color: 'white', filter: 'drop-shadow(0 4px 3px rgba(0, 0, 0, 0.07))', background: 'linear-gradient(to right, #c7d2fe, #f5d0fe, #bae6fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Green-Tax
                    </h1>
                    <p style={{ color: '#c7d2fe', fontWeight: 500, marginTop: '0.5rem', letterSpacing: '0.025em', fontSize: '0.875rem', opacity: 0.8 }}>
                        Cosmic Rewards Portal
                    </p>
                </div>

                <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label htmlFor="email" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#c7d2fe', textTransform: 'uppercase', letterSpacing: '0.1em', marginLeft: '0.25rem' }}>Email</label>
                        <input
                            id="email"
                            type="email"
                            required
                            style={{ width: '100%', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '0.75rem', padding: '0.75rem 1rem', color: 'white', outline: 'none' }}
                            placeholder="citizen@future.city"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label htmlFor="password" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#c7d2fe', textTransform: 'uppercase', letterSpacing: '0.1em', marginLeft: '0.25rem' }}>Password</label>
                        <input
                            id="password"
                            type="password"
                            required
                            style={{ width: '100%', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '0.75rem', padding: '0.75rem 1rem', color: 'white', outline: 'none' }}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{ width: '100%', marginTop: '1rem', background: 'linear-gradient(to right, rgba(79, 70, 229, 0.3), rgba(192, 38, 211, 0.3))', color: 'white', fontWeight: 700, padding: '0.75rem 1.5rem', borderRadius: '0.75rem', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.2)', transition: 'all 0.3s', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}
                    >
                        {loading ? 'Authenticating...' : (isSignUp ? 'Initialize Identity' : 'Access Portal')}
                    </button>
                </form>

                {message && (
                    <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: 700, backdropFilter: 'blur(12px)', border: '1px solid', background: message.includes('Error') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(79, 70, 229, 0.2)', borderColor: message.includes('Error') ? 'rgba(239, 68, 68, 0.3)' : 'rgba(79, 70, 229, 0.3)', color: message.includes('Error') ? '#fecaca' : '#c7d2fe' }}>
                        {message}
                    </div>
                )}

                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    <button
                        type="button"
                        onClick={() => { setIsSignUp(!isSignUp); setMessage(''); }}
                        style={{ fontSize: '0.875rem', color: 'rgba(245, 208, 254, 0.7)', fontWeight: 500, transition: 'all 0.2s', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                        {isSignUp ? 'Already verified? Access Portal' : 'New Citizen? Initialize Identity'}
                    </button>
                </div>

                <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1rem' }}>
                    <button onClick={() => navigate('/admin-login')} style={{ fontSize: '0.75rem', color: 'rgba(199, 210, 254, 0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', transition: 'all 0.3s', background: 'none', border: 'none', cursor: 'pointer' }}>
                        Admin Console Access
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
