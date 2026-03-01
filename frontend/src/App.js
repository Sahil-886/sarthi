import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn, useAuth } from '@clerk/clerk-react';
import client from './api/client';
// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import PermissionConsent from './pages/PermissionConsent';
import StressCategorySelection from './pages/StressCategorySelection';
import Dashboard from './pages/Dashboard';
import Games from './pages/Games';
import AICompanion from './pages/AICompanion';
import TherapyHome from './pages/TherapyHome';
import ViewScore from './pages/ViewScore';
import GameWrapper from './games/GameWrapper';
import Contact from './pages/Contact';
const ProtectedRoute = ({ children }) => {
    return (_jsxs(_Fragment, { children: [_jsx(SignedIn, { children: children }), _jsx(SignedOut, { children: _jsx(RedirectToSignIn, {}) })] }));
};
function ApiTokenSync() {
    const { getToken } = useAuth();
    // Set synchronously during render to prevent race conditions on initial mount
    client.setGetTokenFn(getToken);
    return null;
}
export default function App() {
    return (_jsxs(BrowserRouter, { children: [_jsx(ApiTokenSync, {}), _jsxs(Routes, { children: [_jsx(Route, { path: "/login/*", element: _jsx(Login, {}) }), _jsx(Route, { path: "/signup/*", element: _jsx(Signup, {}) }), _jsx(Route, { path: "/permissions", element: _jsx(ProtectedRoute, { children: _jsx(PermissionConsent, {}) }) }), _jsx(Route, { path: "/stress-categories", element: _jsx(ProtectedRoute, { children: _jsx(StressCategorySelection, {}) }) }), _jsx(Route, { path: "/dashboard", element: _jsx(ProtectedRoute, { children: _jsx(Dashboard, {}) }) }), _jsx(Route, { path: "/games", element: _jsx(ProtectedRoute, { children: _jsx(Games, {}) }) }), _jsx(Route, { path: "/games/:gameId", element: _jsx(ProtectedRoute, { children: _jsx(GameWrapper, {}) }) }), _jsx(Route, { path: "/ai-companion", element: _jsx(ProtectedRoute, { children: _jsx(AICompanion, {}) }) }), _jsx(Route, { path: "/therapy", element: _jsx(ProtectedRoute, { children: _jsx(TherapyHome, {}) }) }), _jsx(Route, { path: "/score", element: _jsx(ProtectedRoute, { children: _jsx(ViewScore, {}) }) }), _jsx(Route, { path: "/contact", element: _jsx(ProtectedRoute, { children: _jsx(Contact, {}) }) }), _jsx(Route, { path: "/", element: _jsx(Navigate, { to: "/dashboard", replace: true }) })] })] }));
}
