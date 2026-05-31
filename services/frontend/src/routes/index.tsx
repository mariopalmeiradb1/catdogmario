import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from '~/components/layouts/PublicLayout';
import { CatalogLayout } from '~/components/layouts/CatalogLayout';
import { AdopterLayout } from '~/components/layouts/AdopterLayout';
import { OngLayout } from '~/components/layouts/OngLayout';
import { AdminLayout } from '~/components/layouts/AdminLayout';
import { PrivateRoute } from './PrivateRoute';
import { RoleRoute } from './RoleRoute';
import { LoginPage } from '~/pages/auth/LoginPage';
import { RegisterAdopterPage } from '~/pages/auth/RegisterAdopterPage';
import { RegisterOngPage } from '~/pages/auth/RegisterOngPage';
import { ConfirmEmailPage } from '~/pages/auth/ConfirmEmailPage';
import { ForgotPasswordPage } from '~/pages/auth/ForgotPasswordPage';
import { VerifyCodePage } from '~/pages/auth/VerifyCodePage';
import { ResetPasswordPage } from '~/pages/auth/ResetPasswordPage';
import { CatalogPage } from '~/pages/public/CatalogPage';
import { DashboardPage } from '~/pages/ong/DashboardPage';
import { OngProfilePage } from '~/pages/ong/OngProfilePage';
import { OngListPage } from '~/pages/admin/OngListPage';
import { OngEditPage } from '~/pages/admin/OngEditPage';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public routes - Auth */}
      <Route element={<PublicLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterAdopterPage />} />
        <Route path="/register/ong" element={<RegisterOngPage />} />
        <Route path="/confirm-email/:token" element={<ConfirmEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-code" element={<VerifyCodePage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* Public routes - Catalog */}
      <Route element={<CatalogLayout />}>
        <Route path="/catalog" element={<CatalogPage />} />
      </Route>

      {/* Private: Adopter */}
      <Route element={<PrivateRoute />}>
        <Route element={<RoleRoute allowedRoles={['adopter']} />}>
          <Route element={<AdopterLayout />}>
            <Route path="/adopter/dashboard" element={<Navigate to="/catalog" replace />} />
          </Route>
        </Route>
      </Route>

      {/* Private: ONG */}
      <Route element={<PrivateRoute />}>
        <Route element={<RoleRoute allowedRoles={['ong_volunteer', 'ong_admin']} />}>
          <Route element={<OngLayout />}>
            <Route path="/ong/dashboard" element={<DashboardPage />} />
            <Route path="/ong/profile" element={<OngProfilePage />} />
          </Route>
        </Route>
      </Route>

      {/* Private: Admin */}
      <Route element={<PrivateRoute />}>
        <Route element={<RoleRoute allowedRoles={['system_admin']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/ongs" element={<OngListPage />} />
            <Route path="/admin/ongs/:id" element={<Navigate to="edit" replace />} />
            <Route path="/admin/ongs/:id/edit" element={<OngEditPage />} />
          </Route>
        </Route>
      </Route>

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/catalog" replace />} />
      <Route path="*" element={<Navigate to="/catalog" replace />} />
    </Routes>
  );
}
