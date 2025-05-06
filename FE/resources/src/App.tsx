import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AdminLogin from "./pages/Login/AdminLogin";
import Dashboard from "./pages/Dashboard/Dashboard";
import NotFound from "./pages/Error/NotFound";
import MainLayout from "./layout/MainLayout";
import DeviceList from "./pages/Device/DeviceList";
import ViolationDetected from "./pages//Violation/ViolationDetected";
import DataDetection from "./pages/data/DataDetection";
import DataDetail from "./pages/data/DataDetail_fetch";
import UserManagement from "./pages/Account/UserManagement";
import PrivateRoute from "./stores/privateroute";
import CitizenManagement from "./pages/Supervisor/CitizenManagement/CitizenManagement";
import Modify from "./pages/Modify/page";
import StatusManagement from "./pages/Modify/Status/StatusManagement";
import LocationCreator from "./pages/Modify/Location/LocationManagement";
import ReportPage from "./pages/Report/Report";
import CitizenManager from "./pages/Citizens/page";
import CitizenInfoForm from "./pages/Citizens/Informations/CitizenInfo";
import CitizenApplication from "./pages/Citizens/Aplications/CitizenApplication";
import ViolationLookupPage from "./pages/Citizens/View/ViolationSearch";
import ReportViolation from "./pages/Citizens/Report/ReportViolationPage";
import HomePage from "./pages/Home/HomePage";
import CitizenLogin from "./pages/Login/CitienLogin";
import Notification from "./pages/Citizens/Notifications/Notification";
import CitizenRoute from "./stores/citizenroute";
import SupervisorProfile from "./pages/Supervisor/Profile/SupervisorProfile";
import NotificationManager from "./pages/Modify/Notify/NotificationManager";
import Unauthorized from "./stores/Unauthorized";



const App = () => {
  return (
    <Router>
      <Routes>
        
        <Route path="/" element={<HomePage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/citizen/login" element={<CitizenLogin />} />

        {/*role admin,supervisor*/}
        <Route path="/dashboard" element={ <MainLayout><Dashboard /></MainLayout>} />
        
        
        {/* Routes chỉ cho Admin */}
        <Route path="/account" element={<PrivateRoute element={<MainLayout><UserManagement /></MainLayout>} requiredRole="Admin" />} />


        {/* Routes cho Supervisor */}
        <Route path="/devices" element={<PrivateRoute element={<MainLayout><DeviceList /></MainLayout>} requiredRole="Supervisor"/>} />
        {/* <Route path="/violation" element={<PrivateRoute element={<MainLayout><Violation /></MainLayout>} requiredRole="Supervisor"/>} /> */}
        <Route path="/violation-detection" element={<PrivateRoute element={<MainLayout><ViolationDetected /></MainLayout>} requiredRole="Supervisor"/>} />
        {/* <Route path="/violation" element={<PrivateRoute element={<MainLayout><Violation /></MainLayout>} />} /> */}
        <Route path="/citizen-management" element={<PrivateRoute element={<MainLayout><CitizenManagement /></MainLayout>} requiredRole="Supervisor"/>} />
        {/* <Route path="/citizen-verification" element={<PrivateRoute element={<MainLayout><CitizenVerification /></MainLayout>} requiredRole="Supervisor"/>} /> */}
        <Route path="/data-detection" element={<PrivateRoute element={<MainLayout><DataDetection /></MainLayout>} requiredRole="Supervisor"/>} />
        <Route path="/device/:deviceId" element={<PrivateRoute element={<MainLayout><DataDetail /></MainLayout>} requiredRole="Supervisor"/>} />
        <Route path="/modify" element={<PrivateRoute element={<MainLayout><Modify /></MainLayout>} requiredRole="Supervisor"/>} />
        <Route path="/manage-status" element={<PrivateRoute element={<MainLayout><StatusManagement /></MainLayout>} requiredRole="Supervisor"/>} />
        {/* <Route path="/status-hard-code" element={<MainLayout><HardCodeStatus /></MainLayout>} /> */}
        <Route path="/manage-location" element={<PrivateRoute element={<MainLayout><LocationCreator /></MainLayout>} requiredRole="Supervisor"/>} />
        <Route path="/reports" element={<PrivateRoute element={<MainLayout><ReportPage /></MainLayout>} requiredRole="Supervisor"/>} />
        <Route path="/profile" element={<PrivateRoute element={<MainLayout><SupervisorProfile /></MainLayout>} requiredRole={["Supervisor", "Admin"]} />} />
        <Route path="/manage-notifications" element={<PrivateRoute element={<MainLayout><NotificationManager /></MainLayout>} requiredRole="Supervisor"/>} />


        <Route path="/citizen" element={<CitizenRoute element={<MainLayout><CitizenManager /></MainLayout>} />} />
        <Route path="/citizen-info" element={<CitizenRoute  element={<MainLayout><CitizenInfoForm /></MainLayout>}/>} />
        {/* <Route path="/citizen-info-hard-code" element={<MainLayout><CitizenInfoFormHardCode /></MainLayout>} /> */}
        <Route path="/citizen-applications" element={<CitizenRoute  element={<MainLayout><CitizenApplication /></MainLayout>}/>} />
        {/* <Route path="/citizen-applications-hard-code" element={<MainLayout><CarApplicationsHardCode /></MainLayout>} /> */}
        <Route path="/citizen-violation" element={<MainLayout><ViolationLookupPage /></MainLayout>} />
        {/* <Route path="/citizen-violation-hard-code" element={<MainLayout><ViolationLookupPageHardCode /></MainLayout>} /> */}
        <Route path="/report-proofs" element={<MainLayout><ReportViolation /></MainLayout>} />
        <Route path="/notificattions" element={<MainLayout><Notification /></MainLayout>} />

        <Route path="*" element={<NotFound />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
      </Routes>
    </Router>
  );
};

export default App;
