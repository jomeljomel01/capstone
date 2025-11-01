import { useState } from 'react';

// Declare electron API types
declare global {
  interface Window {
    electronAPI: {
      updateUserPassword: (userId: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
      getUserByEmail: (email: string) => Promise<{ success: boolean; user?: { id: number; email: string }; error?: string }>;
      storeOtp: (userId: string, otp: string, expiresAt: string) => Promise<{ success: boolean; error?: string }>;
      verifyOtp: (userId: string, otp: string) => Promise<{ success: boolean; data?: { userId: number }; error?: string }>;
      generateResetToken: (userId: string) => Promise<{ success: boolean; token?: string; error?: string }>;
    };
  }
}

export default function UpdatePasswordForm({ email }: { email?: string }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!password || !confirmPassword) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    try {
      // Get user by email first
      if (!email) {
        setError('Email is required for password update.');
        setLoading(false);
        return;
      }

      const userResult = await window.electronAPI.getUserByEmail(email);
      if (!userResult.success || !userResult.user) {
        setError('User not found.');
        setLoading(false);
        return;
      }

      // Update password using admin API
      const updateResult = await window.electronAPI.updateUserPassword(userResult.user.id.toString(), password);
      if (!updateResult.success) {
        setError(updateResult.error || 'Failed to update password.');
      } else {
        setSuccess(true);
      }
    } catch (err) {
      console.error('Password update error:', err);
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Password Updated Successfully!</h2>
        <p className="text-gray-600">
          Your password has been changed. You can now log in with your new password.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-gray-700 font-medium mb-2">New Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter new password"
          required
        />
      </div>

      <div>
        <label className="block text-gray-700 font-medium mb-2">Confirm New Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Confirm new password"
          required
        />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Saving...' : 'Update Password'}
      </button>
    </form>
  );
}