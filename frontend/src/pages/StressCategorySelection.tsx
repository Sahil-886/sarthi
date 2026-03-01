import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/client';

interface Category {
  id: number;
  name: string;
  description: string;
}

export default function StressCategorySelection() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.getAvailableCategories();
        setCategories(response.categories || []);
      } catch (err) {
        setError('Failed to load categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleCategoryToggle = (categoryName: string) => {
    setSelected((prev) =>
      prev.includes(categoryName)
        ? prev.filter((c) => c !== categoryName)
        : [...prev, categoryName]
    );
  };

  const handleSubmit = async () => {
    if (selected.length === 0) {
      setError('Please select at least one category');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await api.selectStressCategories(selected);
      navigate('/dashboard');
    } catch (err: any) {
      setError('Failed to save categories');
    } finally {
      setSaving(false);
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
        <h1 className="text-3xl font-bold text-text mb-2">What's causing you stress?</h1>
        <p className="text-lightText mb-8">Select the areas that affect you most. This helps us personalize your experience.</p>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-lightText">Loading categories...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {categories.map((category) => (
              <motion.button
                key={category.id}
                onClick={() => handleCategoryToggle(category.name)}
                className={`p-6 rounded-lg border-2 transition text-left ${selected.includes(category.name)
                    ? 'border-accent bg-indigo-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center">
                  <div
                    className={`w-6 h-6 rounded border-2 flex items-center justify-center mr-3 ${selected.includes(category.name)
                        ? 'border-accent bg-accent'
                        : 'border-gray-300'
                      }`}
                  >
                    {selected.includes(category.name) && (
                      <span className="text-white text-sm font-bold">✓</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-text capitalize">{category.name}</h3>
                    <p className="text-sm text-lightText">{category.description}</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}

        {error && (
          <motion.div
            className="bg-red-50 text-red-800 p-4 rounded-lg text-sm mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.div>
        )}

        <motion.button
          onClick={handleSubmit}
          disabled={selected.length === 0 || saving}
          className={`w-full py-3 rounded-lg font-medium transition ${selected.length > 0
              ? 'bg-accent text-white hover:opacity-90'
              : 'bg-gray-200 text-lightText cursor-not-allowed'
            }`}
          whileHover={selected.length > 0 ? { scale: 1.02 } : {}}
          whileTap={selected.length > 0 ? { scale: 0.98 } : {}}
        >
          {saving ? 'Saving...' : 'Continue to Dashboard'}
        </motion.button>
      </motion.div>
    </div>
  );
}
