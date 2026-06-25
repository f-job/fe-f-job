import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import verificationService from '@services/verificationService';
import { useAuthStore } from '@stores/authStore';

/**
 * Hook to check if user has completed identity verification
 * Returns verification status and a function to check before performing actions
 */
export function useVerificationCheck() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const checkVerificationStatus = useCallback(async () => {
    if (!isAuthenticated) {
      setIsVerified(null);
      setLoading(false);
      return;
    }

    try {
      const { data } = await verificationService.getStatus();
      setIsVerified(data.isVerified);
    } catch (error) {
      // If error, assume not verified (fail-safe)
      setIsVerified(false);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    checkVerificationStatus();
  }, [checkVerificationStatus]);

  /**
   * Check if user is verified before performing an action
   * Shows toast and redirects to verification page if not verified
   * 
   * @param actionName - Name of the action being performed (for toast message)
   * @returns true if verified, false otherwise
   */
  const requireVerification = useCallback(
    (actionName: string = 'thực hiện thao tác này'): boolean => {
      if (!isAuthenticated) {
        toast.error('Bạn cần đăng nhập để ' + actionName);
        navigate('/dang-nhap');
        return false;
      }

      if (isVerified === null || loading) {
        toast.error('Đang kiểm tra xác thực, vui lòng thử lại');
        return false;
      }

      if (!isVerified) {
        toast.error(
          `Bạn cần xác thực danh tính trước khi ${actionName}. Vui lòng hoàn tất xác thực CCCD.`,
          { duration: 5000 }
        );
        navigate('/xac-thuc-sau-dang-ky');
        return false;
      }

      return true;
    },
    [isAuthenticated, isVerified, loading, navigate]
  );

  return {
    isVerified,
    loading,
    requireVerification,
    refreshStatus: checkVerificationStatus,
  };
}
