import { motion, useReducedMotion } from 'motion/react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminPage from './pages/AdminPage';
import FeedPage from './pages/FeedPage';
import LibraryPage from './pages/LibraryPage';
import LoginPage from './pages/LoginPage';
import StudyPage from './pages/StudyPage';
import NewsRail from './components/NewsRail';

function Shell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  return (
    <ProtectedRoute>
      <Layout right={<NewsRail />}>
        <motion.div
          key={location.pathname}
          className="route-content"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', bounce: 0, duration: reduceMotion ? 0.1 : 0.28 }}
        >
          {children}
        </motion.div>
      </Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <Shell>
            <FeedPage />
          </Shell>
        }
      />
      <Route
        path="/library"
        element={
          <Shell>
            <LibraryPage />
          </Shell>
        }
      />
      <Route
        path="/study"
        element={
          <Shell>
            <StudyPage />
          </Shell>
        }
      />
      <Route
        path="/admin"
        element={
          <Shell>
            <AdminPage />
          </Shell>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
