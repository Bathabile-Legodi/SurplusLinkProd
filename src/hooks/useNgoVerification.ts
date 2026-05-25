import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { supabase } from '../lib/supabase';

export function useNgoVerification() {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verifyAccess = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          navigate({ to: '/login' });
          return;
        }

        const { data, error: dbError } = await supabase
          .from('organizations')
          .select('status, role')
          .eq('id', user.id)
          .single();

        if (dbError) throw dbError;

        if (data?.role === 'ngo') {
          if (data.status === 'pending') {
            navigate({ to: '/ngo/not-verified' });
          } else if (data.status === 'verified') {
            setIsAuthorized(true);
          }
        }
      } catch (error) {
        console.error("Verification check failed:", error);
      } finally {
        setIsChecking(false);
      }
    };

    verifyAccess();
  }, [navigate]);

  return { isAuthorized, isChecking };
}