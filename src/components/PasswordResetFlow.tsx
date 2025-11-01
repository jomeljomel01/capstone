import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const PasswordResetFlow: React.FC = () => {
    const [step, setStep] = useState<'verify' | 'update'>('verify');
    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const navigate = useNavigate();

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const { error } = await supabase.auth.verifyOtp({ email, token, type: 'recovery' });
        if (error) {
            setLoading(false);
            setError(error.message);
        } else {
            setLoading(false);
            setStep('update');
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            setLoading(false);
            return;
        }
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) {
            setLoading(false);
            setError(updateError.message);
        } else {
            setLoading(false);
            setSuccess(true);
            await supabase.auth.signOut();
            setTimeout(() => navigate('/login'), 3000);
        }
    };

    if (success) {
        return <div>Password updated! Redirecting to login...</div>;
    }

    return (
        <div>
            {error && <div>{error}</div>}
            {step === 'verify' ? (
                <form onSubmit={handleVerifyOtp}>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
                    <input type="text" value={token} onChange={(e) => setToken(e.target.value)} placeholder="OTP Code" required />
                    <button type="submit" disabled={loading}>Verify OTP</button>
                </form>
            ) : (
                <form onSubmit={handleUpdatePassword}>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New Password" required />
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm New Password" required />
                    <button type="submit" disabled={loading}>Update Password</button>
                </form>
            )}
        </div>
    );
};

export default PasswordResetFlow;