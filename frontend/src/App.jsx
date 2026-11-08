import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import WritingCategories from './pages/WritingCategories';
import Writing from './pages/Writing';
import WritingHistory from './pages/WritingHistory';
import Speaking from './pages/Speaking';
import Reading from './pages/Reading';
import Listening from './pages/Listening';


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />

        <Route path="/writing" element={<WritingCategories />} />
        <Route path="/writing/practice" element={<Writing />} />
        <Route path="/writing/history" element={<WritingHistory />} />

        <Route path="/speaking" element={<Speaking />} />
        <Route path="/reading" element={<Reading />} />
        <Route path="/listening" element={<Listening />} />
      </Routes>
    </BrowserRouter>
  );
}