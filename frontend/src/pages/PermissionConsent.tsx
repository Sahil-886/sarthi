import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/client';

export default function PermissionConsent() {
  const navigate = useNavigate();

  const [permissions, setPermissions] = useState({
    data_processing: false,
    ai_companion: false,
    emergency_alert: false,
    privacy_policy: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheckChange = (key: keyof typeof permissions) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const allChecked = Object.values(permissions).every((v) => v === true);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      await api.setPermissions(permissions);
      navigate('/stress-categories');
    } catch (err: any) {
      setError('Failed to save permissions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 py-12 px-4">
      <motion.div
        className="max-w-2xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-text mb-2">Permissions & Privacy</h1>
        <p className="text-lightText mb-8">Please review and accept our terms</p>

        <div className="space-y-6">
          <motion.div
            className="p-6 border border-gray-200 rounded-lg"
            whileHover={{ borderColor: '#e5e7eb' }}
          >
            <h2 className="text-lg font-semibold text-text mb-3">Data Collection & Analysis</h2>
            <p className="text-lightText text-sm mb-4">
              We collect data about your interaction with Sarthi to analyze your mental wellbeing patterns,
              provide personalized insights, and improve our services. Your data is processed securely
              and will never be shared with third parties without your explicit consent.
            </p>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={permissions.data_processing}
                onChange={() => handleCheckChange('data_processing')}
                className="w-5 h-5 rounded border-gray-300 text-accent focus:ring-accent"
              />
              <span className="ml-3 text-text font-medium">
                I agree to data processing for mental wellbeing analysis
              </span>
            </label>
          </motion.div>

          <motion.div
            className="p-6 border border-gray-200 rounded-lg"
            whileHover={{ borderColor: '#e5e7eb' }}
          >
            <h2 className="text-lg font-semibold text-text mb-3">AI Companion Interaction</h2>
            <p className="text-lightText text-sm mb-4">
              Sarthi uses AI to provide empathetic support and personalized mental health guidance.
              Our AI learns from your conversations to provide better responses over time while
              maintaining strict confidentiality.
            </p>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={permissions.ai_companion}
                onChange={() => handleCheckChange('ai_companion')}
                className="w-5 h-5 rounded border-gray-300 text-accent focus:ring-accent"
              />
              <span className="ml-3 text-text font-medium">I allow AI companion interaction</span>
            </label>
          </motion.div>

          <motion.div
            className="p-6 border border-gray-200 rounded-lg"
            whileHover={{ borderColor: '#e5e7eb' }}
          >
            <h2 className="text-lg font-semibold text-text mb-3">Emergency Contact Notification</h2>
            <p className="text-lightText text-sm mb-4">
              If our stress assessment system detects a critical mental health risk, we may send
              a discreet notification to your emergency contact (close friend) so they can check in on you.
              This feature is optional and can be disabled anytime.
            </p>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={permissions.emergency_alert}
                onChange={() => handleCheckChange('emergency_alert')}
                className="w-5 h-5 rounded border-gray-300 text-accent focus:ring-accent"
              />
              <span className="ml-3 text-text font-medium">
                I consent to emergency contact notification if risk detected
              </span>
            </label>
          </motion.div>

          <motion.div
            className="p-6 border border-gray-200 rounded-lg"
            whileHover={{ borderColor: '#e5e7eb' }}
          >
            <h2 className="text-lg font-semibold text-text mb-3">Privacy Policy</h2>
            <p className="text-lightText text-sm mb-4">
              Please read our complete privacy policy for detailed information about how we collect,
              use, and protect your personal data. We are committed to maintaining the highest standards
              of privacy and security.
            </p>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={permissions.privacy_policy}
                onChange={() => handleCheckChange('privacy_policy')}
                className="w-5 h-5 rounded border-gray-300 text-accent focus:ring-accent"
              />
              <span className="ml-3 text-text font-medium">I accept the privacy policy</span>
            </label>
          </motion.div>
        </div>

        {error && (
          <motion.div
            className="mt-6 bg-red-50 text-red-800 p-4 rounded-lg text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.div>
        )}

        <motion.button
          onClick={handleSubmit}
          disabled={!allChecked || loading}
          className={`mt-8 w-full py-3 rounded-lg font-medium transition ${allChecked
              ? 'bg-accent text-white hover:opacity-90'
              : 'bg-gray-200 text-lightText cursor-not-allowed'
            }`}
          whileHover={allChecked ? { scale: 1.02 } : {}}
          whileTap={allChecked ? { scale: 0.98 } : {}}
        >
          {loading ? 'Processing...' : 'Continue'}
        </motion.button>
      </motion.div>
    </div>
  );
}
