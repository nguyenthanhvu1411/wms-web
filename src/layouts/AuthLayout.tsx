import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex w-1/2 bg-primary flex-col justify-center items-center text-white p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" />
        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-bold mb-6">WMS Enterprise</h1>
          <p className="text-lg text-primary-100 mb-8">
            Hệ thống quản lý kho thông minh, tối ưu hóa quy trình vận hành và kiểm soát tồn kho với độ chính xác cao.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                ✓
              </div>
              <span>Quản lý Master Data tập trung</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                ✓
              </div>
              <span>Quy trình Inbound / Outbound chuẩn hóa</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                ✓
              </div>
              <span>Theo dõi tồn kho Real-time</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
