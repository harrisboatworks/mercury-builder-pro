import { useEffect } from 'react';
import AdminNav from '@/components/admin/AdminNav';
import UpdateMotorImages from '@/components/motors/UpdateMotorImages';
import { ScrapeMotorSpecs } from '@/components/admin/ScrapeMotorSpecs';

const AdminMotorImages = () => {
  useEffect(() => {
    document.title = 'Motor Images | Admin';
    let desc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!desc) { 
      desc = document.createElement('meta'); 
      desc.name = 'description'; 
      document.head.appendChild(desc); 
    }
    desc.content = 'Manage and update motor images database with high-quality images from manufacturer pages.';
    
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
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Motor Management</h1>
      </div>
      <div className="space-y-6">
        <ScrapeMotorSpecs />
        <UpdateMotorImages />
      </div>
    </main>
  );
};

export default AdminMotorImages;