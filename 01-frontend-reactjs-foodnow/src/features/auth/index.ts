export { LoginPage } from './pages/LoginPage';
export { RegisterPage } from './pages/RegisterPage';
export { ProfilePage } from './pages/ProfilePage';

export { LoginForm } from './components/LoginForm';
export { RegisterForm } from './components/RegisterForm';

export { useLogin, useRegister, useLogout } from './hooks/useAuth';
export { useBootstrapAuth } from './hooks/useBootstrapAuth';
export { useProfile, useUpdateProfile, useAddresses, useAddAddress, useRemoveAddress } from './hooks/useProfile';

export { authService } from './services/auth.service';
export { usersService } from './services/users.service';

export type { LoginPayload, LoginResponse, RegisterPayload, UpdateProfilePayload, Address, CreateAddressPayload } from './types/auth.types';
