import { SecurityMonitoring } from '@/components/admin/SecurityMonitoring';
import AdminNav from '@/components/admin/AdminNav';

const AdminSecurity = () => {
  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      <div className="container mx-auto px-4 py-6">
        <SecurityMonitoring />
      </div>
    </div>
  );
};

export default AdminSecurity;