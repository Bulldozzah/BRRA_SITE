import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import About from "./pages/About";
import Departments from "./pages/about/Departments";
import Board from "./pages/about/Board";
import Management from "./pages/about/Management";
import Faq from "./pages/about/Faq";
import Services from "./pages/services/Services";
import EServices from "./pages/services/EServices";
import Ria from "./pages/services/Ria";
import Rsc from "./pages/services/Rsc";
import News from "./pages/News";
import Information from "./pages/Information";
import RiaSubmission from "./pages/RiaSubmission";
import RiaTracking from "./pages/RiaTracking";
import PortalLogin from "./pages/PortalLogin";
import PortalRegister from "./pages/PortalRegister";
import PortalDashboard from "./pages/PortalDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminDepartmentsPage from "./pages/admin/AdminDepartmentsPage";
import AdminGradesPage from "./pages/admin/AdminGradesPage";
import AdminPositionsPage from "./pages/admin/AdminPositionsPage";
import AdminStaffPage from "./pages/admin/AdminStaffPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminNewsPage from "./pages/admin/AdminNewsPage";
import AdminDocumentsPage from "./pages/admin/AdminDocumentsPage";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./context/AuthContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/departments" element={<Departments />} />
          <Route path="/board" element={<Board />} />
          <Route path="/management" element={<Management />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/services" element={<Services />} />
          <Route path="/e-services" element={<EServices />} />
          <Route path="/ria" element={<Ria />} />
          <Route path="/rsc" element={<Rsc />} />
          <Route path="/news" element={<News />} />
          <Route path="/information" element={<Information />} />
          <Route path="/ria-submission" element={<RiaSubmission />} />
          <Route path="/ria-tracking" element={<RiaTracking />} />
          <Route path="/portal/login" element={<PortalLogin />} />
          <Route path="/portal/register" element={<PortalRegister />} />
          <Route path="/portal/dashboard" element={<PortalDashboard />} />
          <Route path="/portal/admin" element={<AdminDashboard />} />
          <Route path="/portal/admin/departments" element={<AdminDepartmentsPage />} />
          <Route path="/portal/admin/grades" element={<AdminGradesPage />} />
          <Route path="/portal/admin/positions" element={<AdminPositionsPage />} />
          <Route path="/portal/admin/staff" element={<AdminStaffPage />} />
          <Route path="/portal/admin/users" element={<AdminUsersPage />} />
          <Route path="/portal/admin/news" element={<AdminNewsPage />} />
          <Route path="/portal/admin/documents" element={<AdminDocumentsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
