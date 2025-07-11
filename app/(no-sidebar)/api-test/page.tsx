import { ApiTestComponent } from '@/components/api-test';
import { AppHeader } from '@/components/app-header';

export default function ApiTestPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader 
        title="API Test" 
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "API Test" }
        ]}
      />
      <main className="flex-1 p-4 sm:p-6">
        <ApiTestComponent />
      </main>
    </div>
  );
} 