import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import httpClient from '@/api/httpClient';
import type { LoginResponse } from '@/types/auth';
import type { ApiResponse } from '@/types/common';
import { Package, Lock, User, Loader2 } from 'lucide-react';

const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, 'Vui lòng nhập Username hoặc Email'),
  password: z.string().min(6, 'Mật khẩu phải từ 6 ký tự'),
  rememberMe: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      usernameOrEmail: '',
      password: '',
      rememberMe: false,
    },
  });

  const { register, handleSubmit, formState: { errors } } = form;

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      // Dùng endpoint thực tế từ backend WMS.API
      const res = await httpClient.post<any, ApiResponse<LoginResponse>>('/api/auth/login', {
        usernameOrEmail: data.usernameOrEmail,
        password: data.password
      });

      if (res.success && res.data) {
        setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
        toast.success('Đăng nhập thành công!');
        navigate('/dashboard');
      } else {
        toast.error(res.message || 'Tài khoản hoặc mật khẩu không chính xác');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-card rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-border">
      <div className="flex flex-col items-center mb-8 lg:hidden">
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 mb-4">
          <Package size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-text-primary">WMS Enterprise</h1>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-primary mb-2">Đăng nhập</h2>
        <p className="text-text-secondary">Vui lòng đăng nhập để truy cập hệ thống</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Tài khoản hoặc Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
              <User size={18} />
            </div>
            <input
              type="text"
              {...register('usernameOrEmail')}
              className={`w-full pl-10 pr-4 py-2.5 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                errors.usernameOrEmail ? 'border-danger focus:ring-danger/20 focus:border-danger' : 'border-border'
              }`}
              placeholder="Nhập email hoặc username"
            />
          </div>
          {errors.usernameOrEmail && (
            <p className="mt-1.5 text-sm text-danger flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-danger inline-block"></span>
              {errors.usernameOrEmail.message}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-text-primary">
              Mật khẩu
            </label>
            <a href="#" className="text-sm text-primary hover:text-primary-hover hover:underline transition-colors">
              Quên mật khẩu?
            </a>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
              <Lock size={18} />
            </div>
            <input
              type="password"
              {...register('password')}
              className={`w-full pl-10 pr-4 py-2.5 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                errors.password ? 'border-danger focus:ring-danger/20 focus:border-danger' : 'border-border'
              }`}
              placeholder="••••••••"
            />
          </div>
          {errors.password && (
            <p className="mt-1.5 text-sm text-danger flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-danger inline-block"></span>
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="rememberMe"
            {...register('rememberMe')}
            className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary/20"
          />
          <label htmlFor="rememberMe" className="ml-2 text-sm text-text-secondary cursor-pointer select-none">
            Ghi nhớ đăng nhập
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center items-center gap-2 bg-primary hover:bg-primary-hover text-white font-medium py-2.5 px-4 rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed mt-2"
        >
          {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Đăng nhập'}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
