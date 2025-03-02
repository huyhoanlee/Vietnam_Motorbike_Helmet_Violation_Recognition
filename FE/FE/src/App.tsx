import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import NotFound from "./pages/Error/NotFound";
import MainLayout from "./layout/MainLayout";
import DeviceList from "./pages/Device/DeviceList";
import ViolationDetected from "./pages//Violation/ViolationDetected";
import StreamingImage from "./pages/Streaming/StreamingImage";
import DataDetection from "./pages/data/DataDetection";
import DataDetail from "./pages/data/DataDetail_fetch";
const PrivateRoute = ({ element }: { element: JSX.Element }) => {
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  return isAuthenticated ? element : <Navigate to="/" />;
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<PrivateRoute element={<MainLayout><Dashboard /></MainLayout>} />} />
        <Route path="/devices" element={<PrivateRoute element={<MainLayout><DeviceList /></MainLayout>} />} />
        <Route path="/violation-detection" element={<PrivateRoute element={<MainLayout><ViolationDetected /></MainLayout>} />} />
        <Route path="/streaming" element={<StreamingImage/>}/>
        <Route path="/data-detection" element={<MainLayout><DataDetection /></MainLayout>}/>
        <Route path="/device/:deviceId" element={<MainLayout><DataDetail /></MainLayout>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;
