import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/client';
export default function StressCategorySelection() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [selected, setSelected] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await api.getAvailableCategories();
                setCategories(response.categories || []);
            }
            catch (err) {
                setError('Failed to load categories');
            }
            finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);
    const handleCategoryToggle = (categoryName) => {
        setSelected((prev) => prev.includes(categoryName)
            ? prev.filter((c) => c !== categoryName)
            : [...prev, categoryName]);
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
        }
        catch (err) {
            setError('Failed to save categories');
        }
        finally {
            setSaving(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-amber-50 py-12 px-4", children: _jsxs(motion.div, { className: "max-w-2xl mx-auto", initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 }, children: [_jsx("h1", { className: "text-3xl font-bold text-text mb-2", children: "What's causing you stress?" }), _jsx("p", { className: "text-lightText mb-8", children: "Select the areas that affect you most. This helps us personalize your experience." }), loading ? (_jsx("div", { className: "text-center py-8", children: _jsx("p", { className: "text-lightText", children: "Loading categories..." }) })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 mb-8", children: categories.map((category) => (_jsx(motion.button, { onClick: () => handleCategoryToggle(category.name), className: `p-6 rounded-lg border-2 transition text-left ${selected.includes(category.name)
                            ? 'border-accent bg-indigo-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'}`, whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 }, children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: `w-6 h-6 rounded border-2 flex items-center justify-center mr-3 ${selected.includes(category.name)
                                        ? 'border-accent bg-accent'
                                        : 'border-gray-300'}`, children: selected.includes(category.name) && (_jsx("span", { className: "text-white text-sm font-bold", children: "\u2713" })) }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-text capitalize", children: category.name }), _jsx("p", { className: "text-sm text-lightText", children: category.description })] })] }) }, category.id))) })), error && (_jsx(motion.div, { className: "bg-red-50 text-red-800 p-4 rounded-lg text-sm mb-6", initial: { opacity: 0 }, animate: { opacity: 1 }, children: error })), _jsx(motion.button, { onClick: handleSubmit, disabled: selected.length === 0 || saving, className: `w-full py-3 rounded-lg font-medium transition ${selected.length > 0
                        ? 'bg-accent text-white hover:opacity-90'
                        : 'bg-gray-200 text-lightText cursor-not-allowed'}`, whileHover: selected.length > 0 ? { scale: 1.02 } : {}, whileTap: selected.length > 0 ? { scale: 0.98 } : {}, children: saving ? 'Saving...' : 'Continue to Dashboard' })] }) }));
}
