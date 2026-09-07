import AdminNav from '@/components/admin/AdminNav';
import { DropboxIntegration } from '@/components/admin/media/DropboxIntegration';

export default function AdminDropbox() {
  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      <main className="container mx-auto px-4 py-8">
        <DropboxIntegration />
      </main>
    </div>
  );
}
