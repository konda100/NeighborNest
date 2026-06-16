import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import { useAuth } from "./auth";
import { Spinner } from "./components/ui";
import HomePage from "./pages/HomePage";
import DirectoryPage from "./pages/DirectoryPage";
import ProviderPage from "./pages/ProviderPage";
import DealsPage from "./pages/DealsPage";
import DealPage from "./pages/DealPage";
import AskPage from "./pages/AskPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import type { ReactNode } from "react";

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="directory" element={<DirectoryPage />} />
        <Route path="providers/:id" element={<ProviderPage />} />
        <Route path="deals" element={<DealsPage />} />
        <Route path="deals/:id" element={<DealPage />} />
        <Route path="ask" element={<AskPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route
          path="profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
