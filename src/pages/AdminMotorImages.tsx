import { useEffect } from 'react';
import AdminNav from '@/components/admin/AdminNav';
import { AutomationDashboard } from '@/components/admin/AutomationDashboard';

const AdminMotorImages = () => {
  useEffect(() => {
    document.title = 'Motor Image Automation | Admin';
    let desc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!desc) { 
      desc = document.createElement('meta'); 
      desc.name = 'description'; 
      document.head.appendChild(desc); 
    }
    desc.content = 'Fully automated motor image management with real-time monitoring and self-healing capabilities.';
    
    let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
    if (!canonical) { 
      canonical = document.createElement('link'); 
      canonical.rel = 'canonical'; 
      document.head.appendChild(canonical); 
    }
    canonical.href = window.location.origin + '/admin/motor-images';
  }, []);

  return (
    <main className="container mx-auto px-4 py-8">
      <AdminNav />
      <AutomationDashboard />
    </main>
  );
};

export default AdminMotorImages;