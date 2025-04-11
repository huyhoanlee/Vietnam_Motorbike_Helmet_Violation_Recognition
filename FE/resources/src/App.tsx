import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import NotFound from "./pages/Error/NotFound";
import MainLayout from "./layout/MainLayout";
import DeviceList from "./pages/Device/DeviceList";
import ViolationDetected from "./pages//Violation/ViolationDetected";
import StreamingImage from "./pages/Streaming/StreamingImage";
import DataDetection from "./pages/data/DataDetection";
import DataDetail from "./pages/data/DataDetail_fetch";
import UserManagement from "./pages/Account/UserManagement";
import AnalyticsPage from "./pages/Analytics/AnalyticsPage ";
import PrivateRoute from "./stores/privateroute";
import CitizenManagement from "./pages/Supervisor/CitizenManagement";
import Violation from "./pages/Violation/ViolationModify";
import Modify from "./pages/Modify/page";
import StatusManagement from "./pages/Modify/Status/StatusManagement";
import HardCodeStatus from "./pages/Modify/Status/harcode";
import LocationManager from "./pages/Modify/Location/LocationManagement";
import ReportPage from "./pages/Report/Report";
import CitizenManager from "./pages/Citizens/page";
import CitizenInfoForm from "./pages/Citizens/Informations/CitizenInfo-hard-code";
import CitizenInfoFormHardCode from "./pages/Citizens/Informations/CitizenInfo-hard-code";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={ <MainLayout><Dashboard /></MainLayout>} />
        <Route path="/devices" element={<MainLayout><DeviceList /></MainLayout>} />
        <Route path="/violation-detection" element={<MainLayout><ViolationDetected /></MainLayout>} />
        <Route path="/violation" element={<Violation />} />

        <Route path="/streaming" element={<StreamingImage />} />

        <Route path="/citizen-management" element={<CitizenManagement />} />

        <Route path="/data-detection" element={<MainLayout><DataDetection /></MainLayout>} />`

        <Route path="/device/:deviceId" element={<MainLayout><DataDetail /></MainLayout>} />

        <Route path="/account" element={<MainLayout><UserManagement /></MainLayout>} />


        <Route path="/analytics" element={<MainLayout><AnalyticsPage /></MainLayout>} />

      
        <Route path="/modify" element={<MainLayout><Modify /></MainLayout>} />
        <Route path="/manage-status" element={<MainLayout><StatusManagement /></MainLayout>} />
        <Route path="/status-hard-code" element={<MainLayout><HardCodeStatus /></MainLayout>} />

        <Route path="/manage-location" element={<MainLayout><LocationManager /></MainLayout>} />
        <Route path="/reports" element={<MainLayout><ReportPage /></MainLayout>} />

        <Route path="/citizen" element={<MainLayout><CitizenManager /></MainLayout>} />
        <Route path="/citizen-info" element={<MainLayout><CitizenInfoForm /></MainLayout>} />
        <Route path="/citizen-info-hard-code" element={<MainLayout><CitizenInfoFormHardCode /></MainLayout>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;
