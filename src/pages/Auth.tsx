import { SecureAuth } from '@/components/auth/SecureAuth';

import { useNoIndex } from '@/hooks/useNoIndex';
const Auth = () => {
  useNoIndex();
  return <SecureAuth />;
};

export default Auth;