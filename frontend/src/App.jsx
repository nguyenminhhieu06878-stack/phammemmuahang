import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Projects from './pages/Projects';
import Materials from './pages/Materials';
import Suppliers from './pages/Suppliers';
import Quotas from './pages/Quotas';
import Requests from './pages/Requests';
import CreateRequest from './pages/CreateRequest';
import RequestDetail from './pages/RequestDetail';
import RFQList from './pages/RFQList';
import RFQDetail from './pages/RFQDetail';
import CreateRFQ from './pages/CreateRFQ';
import QuotationList from './pages/QuotationList';
import CreateQuotation from './pages/CreateQuotation';
import POList from './pages/POList';
import PODetail from './pages/PODetail';
import CreatePO from './pages/CreatePO';
import DeliveryCheck from './pages/DeliveryCheck';
import SupplierEvaluation from './pages/SupplierEvaluation';
import StockIssues from './pages/StockIssues';

function PrivateRoute({ children }) {
  const { token } = useAuthStore();
  return token ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="projects" element={<Projects />} />
        <Route path="materials" element={<Materials />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="quotas" element={<Quotas />} />
        
        <Route path="requests" element={<Requests />} />
        <Route path="requests/new" element={<CreateRequest />} />
        <Route path="requests/:id" element={<RequestDetail />} />
        
        <Route path="rfq" element={<RFQList />} />
        <Route path="rfq/new" element={<CreateRFQ />} />
        <Route path="rfq/:id" element={<RFQDetail />} />
        
        <Route path="quotations" element={<QuotationList />} />
        <Route path="quotations/new/:rfqId" element={<CreateQuotation />} />
        
        <Route path="po" element={<POList />} />
        <Route path="po/new/:quotationId" element={<CreatePO />} />
        <Route path="po/:id" element={<PODetail />} />
        <Route path="po/:poId/delivery" element={<DeliveryCheck />} />
        <Route path="po/:poId/evaluate" element={<SupplierEvaluation />} />
        
        <Route path="stock-issues" element={<StockIssues />} />
      </Route>
    </Routes>
  );
}

export default App;
