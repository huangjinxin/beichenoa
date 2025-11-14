import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import StudentList from './pages/Students/List';
import StudentDetail from './pages/Students/Detail';
import GrowthRecords from './pages/Students/GrowthRecords';
import ClassList from './pages/Classes/List';
import ClassDetail from './pages/Classes/Detail';
import TeacherList from './pages/Teachers/List';
import Ingredients from './pages/Canteen/Ingredients';
import Dishes from './pages/Canteen/Dishes';
import Menus from './pages/Canteen/Menus';
import Nutrition from './pages/Canteen/Nutrition';
import FormTemplates from './pages/Forms/Templates';
import FormSubmissions from './pages/Forms/Submissions';
import FillForm from './pages/Forms/FillForm';
import Reports from './pages/Reports/Reports';
import { useAuthStore } from './store/auth';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  return token ? <Layout>{children}</Layout> : <Navigate to="/login" />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/students" element={<PrivateRoute><StudentList /></PrivateRoute>} />
      <Route path="/students/:id" element={<PrivateRoute><StudentDetail /></PrivateRoute>} />
      <Route path="/students/:id/records" element={<PrivateRoute><GrowthRecords /></PrivateRoute>} />
      <Route path="/classes" element={<PrivateRoute><ClassList /></PrivateRoute>} />
      <Route path="/classes/:id" element={<PrivateRoute><ClassDetail /></PrivateRoute>} />
      <Route path="/teachers" element={<PrivateRoute><TeacherList /></PrivateRoute>} />
      <Route path="/canteen/ingredients" element={<PrivateRoute><Ingredients /></PrivateRoute>} />
      <Route path="/canteen/dishes" element={<PrivateRoute><Dishes /></PrivateRoute>} />
      <Route path="/canteen/menus" element={<PrivateRoute><Menus /></PrivateRoute>} />
      <Route path="/canteen/nutrition" element={<PrivateRoute><Nutrition /></PrivateRoute>} />
      <Route path="/forms/templates" element={<PrivateRoute><FormTemplates /></PrivateRoute>} />
      <Route path="/forms/submissions" element={<PrivateRoute><FormSubmissions /></PrivateRoute>} />
      <Route path="/forms/fill/:templateId" element={<PrivateRoute><FillForm /></PrivateRoute>} />
      <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
    </Routes>
  );
}

export default App;
