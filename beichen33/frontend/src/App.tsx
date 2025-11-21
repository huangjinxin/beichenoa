import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import StudentList from './pages/Students/List';
import StudentDetail from './pages/Students/Detail';
import GrowthRecords from './pages/Students/GrowthRecords';
import CampusClasses from './pages/Classes/CampusClasses';
import ClassDetail from './pages/Classes/Detail';
import TeacherList from './pages/Teachers/List';
import PositionsList from './pages/Positions/List';
import BirthdayList from './pages/Birthday/List';
import Ingredients from './pages/Canteen/Ingredients';
import Dishes from './pages/Canteen/Dishes';
import Menus from './pages/Canteen/Menus';
import Nutrition from './pages/Canteen/Nutrition';
import NutritionStandards from './pages/Canteen/NutritionStandards';
import PurchasePlans from './pages/Canteen/PurchasePlans';
import SupplierList from './pages/Canteen/Suppliers/List';
import PurchaseGenerate from './pages/Canteen/PurchaseGenerate';
import PurchasePlanDetail from './pages/Canteen/PurchasePlanDetail';
import FormTemplates from './pages/Forms/Templates';
import FormSubmissions from './pages/Forms/Submissions';
import FillForm from './pages/Forms/FillForm';
import MyApprovals from './pages/Forms/MyApprovals';
import ShareForm from './pages/Forms/ShareForm';
import Reports from './pages/Reports/Reports';
import DailyObservationList from './pages/Records/DailyObservation/List';
import DailyObservationCreate from './pages/Records/DailyObservation/Create';
import DailyObservationEdit from './pages/Records/DailyObservation/Edit';
import DailyObservationDetail from './pages/Records/DailyObservation/Detail';
import DutyReportList from './pages/Records/DutyReport/List';
import DutyReportCreate from './pages/Records/DutyReport/Create';
import DutyReportEdit from './pages/Records/DutyReport/Edit';
import DutyReportDetail from './pages/Records/DutyReport/Detail';
import RecordsQuery from './pages/Records/Query';
import ApiDoc from './pages/System/ApiDoc';
import UserManagement from './pages/System/UserManagement';

// 移动端页面
import TeacherHome from './pages/mobile/teacher/Home';
import TeacherAttendance from './pages/mobile/teacher/Attendance';
import TeacherDaily from './pages/mobile/teacher/Daily';
import TeacherForms from './pages/mobile/teacher/Forms';
import TeacherProfile from './pages/mobile/teacher/Profile';

import { useAuthStore } from './store/auth';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  return token ? <Layout>{children}</Layout> : <Navigate to="/login" />;
}

// 移动端路由守卫
function MobileRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <Routes>
      {/* 登录页面 - 统一入口 */}
      <Route path="/login" element={<Login />} />
      <Route path="/m/login" element={<Navigate to="/login" replace />} />
      <Route path="/forms/share/:token" element={<ShareForm />} />

      {/* 移动端教师路由 */}
      <Route path="/teacher/home" element={<MobileRoute><TeacherHome /></MobileRoute>} />
      <Route path="/teacher/attendance" element={<MobileRoute><TeacherAttendance /></MobileRoute>} />
      <Route path="/teacher/daily" element={<MobileRoute><TeacherDaily /></MobileRoute>} />
      <Route path="/teacher/forms" element={<MobileRoute><TeacherForms /></MobileRoute>} />
      <Route path="/teacher/profile" element={<MobileRoute><TeacherProfile /></MobileRoute>} />

      {/* 管理员桌面端路由 */}
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/students" element={<PrivateRoute><StudentList /></PrivateRoute>} />
      <Route path="/students/:id" element={<PrivateRoute><StudentDetail /></PrivateRoute>} />
      <Route path="/students/:id/records" element={<PrivateRoute><GrowthRecords /></PrivateRoute>} />
      <Route path="/classes" element={<PrivateRoute><CampusClasses /></PrivateRoute>} />
      <Route path="/classes/:id" element={<PrivateRoute><ClassDetail /></PrivateRoute>} />
      <Route path="/teachers" element={<PrivateRoute><TeacherList /></PrivateRoute>} />
      <Route path="/campus" element={<Navigate to="/classes" />} />
      <Route path="/positions" element={<PrivateRoute><PositionsList /></PrivateRoute>} />
      <Route path="/birthday" element={<PrivateRoute><BirthdayList /></PrivateRoute>} />
      <Route path="/canteen/ingredients" element={<PrivateRoute><Ingredients /></PrivateRoute>} />
      <Route path="/canteen/dishes" element={<PrivateRoute><Dishes /></PrivateRoute>} />
      <Route path="/canteen/menus" element={<PrivateRoute><Menus /></PrivateRoute>} />
      <Route path="/canteen/nutrition" element={<PrivateRoute><Nutrition /></PrivateRoute>} />
      <Route path="/canteen/nutrition-standards" element={<PrivateRoute><NutritionStandards /></PrivateRoute>} />
      <Route path="/canteen/suppliers" element={<PrivateRoute><SupplierList /></PrivateRoute>} />
      <Route path="/canteen/purchase/plans" element={<PrivateRoute><PurchasePlans /></PrivateRoute>} />
      <Route path="/canteen/purchase/generate" element={<PrivateRoute><PurchaseGenerate /></PrivateRoute>} />
      <Route path="/canteen/purchase/plans/:id" element={<PrivateRoute><PurchasePlanDetail /></PrivateRoute>} />
      <Route path="/forms/templates" element={<PrivateRoute><FormTemplates /></PrivateRoute>} />
      <Route path="/forms/submissions" element={<PrivateRoute><FormSubmissions /></PrivateRoute>} />
      <Route path="/forms/fill/:templateId" element={<PrivateRoute><FillForm /></PrivateRoute>} />
      <Route path="/forms/approvals" element={<PrivateRoute><MyApprovals /></PrivateRoute>} />
      <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
      <Route path="/records/daily-observation" element={<PrivateRoute><DailyObservationList /></PrivateRoute>} />
      <Route path="/records/daily-observation/create" element={<PrivateRoute><DailyObservationCreate /></PrivateRoute>} />
      <Route path="/records/daily-observation/edit/:id" element={<PrivateRoute><DailyObservationEdit /></PrivateRoute>} />
      <Route path="/records/daily-observation/:id" element={<PrivateRoute><DailyObservationDetail /></PrivateRoute>} />
      <Route path="/records/duty-report" element={<PrivateRoute><DutyReportList /></PrivateRoute>} />
      <Route path="/records/duty-report/create" element={<PrivateRoute><DutyReportCreate /></PrivateRoute>} />
      <Route path="/records/duty-report/edit/:id" element={<PrivateRoute><DutyReportEdit /></PrivateRoute>} />
      <Route path="/records/duty-report/:id" element={<PrivateRoute><DutyReportDetail /></PrivateRoute>} />
      <Route path="/records/query" element={<PrivateRoute><RecordsQuery /></PrivateRoute>} />
      <Route path="/system/users" element={<PrivateRoute><UserManagement /></PrivateRoute>} />
      <Route path="/system/api" element={<PrivateRoute><ApiDoc /></PrivateRoute>} />
    </Routes>
  );
}

export default App;
