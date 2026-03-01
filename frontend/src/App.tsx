import React from 'react';
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

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }): JSX.Element => {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
};

function ApiTokenSync() {
  const { getToken } = useAuth();

  // Set synchronously during render to prevent race conditions on initial mount
  client.setGetTokenFn(getToken);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ApiTokenSync />
      <Routes>
        <Route path="/login/*" element={<Login />} />
        <Route path="/signup/*" element={<Signup />} />

        <Route
          path="/permissions"
          element={
            <ProtectedRoute>
              <PermissionConsent />
            </ProtectedRoute>
          }
        />

        <Route
          path="/stress-categories"
          element={
            <ProtectedRoute>
              <StressCategorySelection />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/games"
          element={
            <ProtectedRoute>
              <Games />
            </ProtectedRoute>
          }
        />

        <Route
          path="/games/:gameId"
          element={
            <ProtectedRoute>
              <GameWrapper />
            </ProtectedRoute>
          }
        />

        <Route
          path="/ai-companion"
          element={
            <ProtectedRoute>
              <AICompanion />
            </ProtectedRoute>
          }
        />

        <Route
          path="/therapy"
          element={
            <ProtectedRoute>
              <TherapyHome />
            </ProtectedRoute>
          }
        />

        <Route
          path="/score"
          element={
            <ProtectedRoute>
              <ViewScore />
            </ProtectedRoute>
          }
        />

        <Route
          path="/contact"
          element={
            <ProtectedRoute>
              <Contact />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
