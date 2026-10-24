import { Link } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';
import { Button } from '../components/ui';

export function NotFoundPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center space-y-5">
      <div className="w-16 h-16 bg-[#E6EDE5] text-[#365442] rounded-2xl flex items-center justify-center mx-auto border border-[#A7B8A5]/50 shadow-subtle">
        <FileQuestion className="w-8 h-8" />
      </div>
      <div className="space-y-1.5">
        <h1 className="text-2xl font-extrabold text-[#292F2B] tracking-tight">404 - Page Not Found</h1>
        <p className="text-xs text-[#68716A]">
          The resource you are attempting to access does not exist or has been relocated.
        </p>
      </div>
      <Link to="/" className="inline-block">
        <Button variant="primary" startIcon={<Home className="w-4 h-4" />}>
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
}
