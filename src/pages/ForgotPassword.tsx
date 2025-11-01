import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import { ArrowLeft } from 'lucide-react';

// Electron API types are declared in AuthContext.tsx

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // First, check if user exists
      const userResult = await window.electronAPI.getUserByEmail(email);
      if (!userResult.success || !userResult.user) {
        setError('No account found with this email address.');
        setLoading(false);
        return;
      }

      // Generate a 6-digit OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      console.log('Generated OTP:', generatedOtp);

      // Calculate expiration time (10 minutes from now)
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      // Send OTP via EmailJS first
      const templateParams = {
        to_email: email,
        otp_code: generatedOtp,
        user_email: email,
      };

      console.log('Sending email with params:', templateParams);

      // Check if all required values are present
      if (!import.meta.env.VITE_EMAILJS_SERVICE_ID ||
          !import.meta.env.VITE_EMAILJS_TEMPLATE_ID ||
          !import.meta.env.VITE_EMAILJS_PUBLIC_KEY) {
        throw new Error('EmailJS configuration is missing. Please check your .env file.');
      }

      // Send email first
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        templateParams,
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );

      console.log('Email sent successfully, now storing OTP in database');

      // Store OTP in database only after email is sent successfully
      const storeResult = await window.electronAPI.storeOtp(userResult.user.id.toString(), generatedOtp, expiresAt);
      if (!storeResult.success) {
        console.error('Failed to store OTP in database:', storeResult.error);
        setError('Failed to generate OTP. Please try again.');
        setLoading(false);
        return;
      }

      console.log('OTP stored successfully');
      setShowOtpInput(true);
      setSuccess(false); // Reset success state
    } catch (error) {
      console.error('Email send error:', error);
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Get user by email first
      const userResult = await window.electronAPI.getUserByEmail(email);
      if (!userResult.success || !userResult.user) {
        setError('User not found.');
        setLoading(false);
        return;
      }

      // Verify OTP against database
      const verifyResult = await window.electronAPI.verifyOtp(userResult.user.id.toString(), otp);
      if (!verifyResult.success) {
        setError(verifyResult.error || 'Invalid OTP. Please try again.');
        setLoading(false);
        return;
      }

      // Generate access token for password reset
      const tokenResult = await window.electronAPI.generateResetToken(userResult.user.id.toString());
      if (!tokenResult.success) {
        setError('Failed to generate reset token. Please try again.');
        setLoading(false);
        return;
      }

      // OTP is valid, navigate to update password page with token
      navigate(`/update-password?token=${encodeURIComponent(tokenResult.token!)}&userId=${encodeURIComponent(userResult.user.id.toString())}`);
    } catch (error) {
      console.error('OTP verification error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-100 to-blue-300">
        <div className="w-full max-w-md bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-2xl overflow-hidden border border-blue-300">
          <div className="p-8 md:p-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">OTP Sent!</h2>
              <p className="text-gray-600 mb-6">
                A 6-digit OTP has been sent to your email. Please enter it below.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center text-blue-600 hover:text-blue-500 font-medium"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-100 to-blue-300">
      <div className="w-full max-w-md bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-2xl overflow-hidden border border-blue-300">
        <div className="p-8 md:p-12">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-600">Forgot Password</h1>
          </div>

          <p className="text-gray-600 mb-8">
            Enter your email address, and we'll send you an OTP to reset your password.
          </p>

          {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

          {!showOtpInput ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 transition duration-200"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-4 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg text-lg font-medium hover:from-blue-600 hover:to-blue-800 transition duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">Enter OTP</label>
                <input
                  type="text"
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 transition duration-200 text-center text-2xl font-mono tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
                <p className="text-sm text-gray-500 mt-2">
                  Enter the 6-digit code sent to {email}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-4 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg text-lg font-medium hover:from-blue-600 hover:to-blue-800 transition duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowOtpInput(false);
                  setOtp('');
                  setSuccess(false);
                }}
                className="w-full py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition duration-300"
              >
                Back
              </button>
            </form>
          )}

          <div className="text-center pt-6">
            <Link
              to="/login"
              className="inline-flex items-center text-blue-600 hover:text-blue-500 font-medium"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}