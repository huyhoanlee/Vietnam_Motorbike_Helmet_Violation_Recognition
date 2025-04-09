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
import CitizenManagement from "./pages/CitizenForm/CitizenManagement";
import Violation from "./pages/Violation/ViolationModify";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<PrivateRoute element={<MainLayout><Dashboard /></MainLayout>} />} />
        <Route path="/devices" element={<PrivateRoute element={<MainLayout><DeviceList /></MainLayout>} />} />
        <Route path="/violation-detection" element={<PrivateRoute element={<MainLayout><ViolationDetected /></MainLayout>} />} />
        <Route path="/streaming" element={<StreamingImage />} />
        <Route path="/citizen-management" element={<CitizenManagement />} />
        <Route path="/data-detection" element={<MainLayout><DataDetection /></MainLayout>} />`
        <Route path="/device/:deviceId" element={<MainLayout><DataDetail /></MainLayout>} />
        <Route path="/account" element={<PrivateRoute element={<MainLayout><UserManagement /></MainLayout>}  />} />
        <Route path="/analytics" element={<MainLayout><AnalyticsPage /></MainLayout>} />
        <Route path="/violation" element={<Violation />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;
