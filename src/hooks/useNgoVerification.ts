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

        // 1. Point to 'ngos' and select 'is_verified' 
        const { data, error: dbError } = await supabase
          .from('ngos')
          .select('is_verified')
          .eq('id', user.id)
          .single();

        if (dbError) throw dbError;

        // 2. Check the verification status
        if (data) {
          if (data.is_verified === false) {
            // User is an NGO but not yet approved by an admin
            navigate({ to: '/ngo/not-verified' });
          } else if (data.is_verified === true) {
            // User is approved, let them into the dashboard
            setIsAuthorized(true);
          }
        } else {
          // No NGO record found for this user ID (maybe they are a donor?)
          navigate({ to: '/login' });
        }
      } catch (error) {
        console.error("Verification check failed:", error);
        navigate({ to: '/login' });
      } finally {
        setIsChecking(false);
      }
    };

    verifyAccess();
  }, [navigate]);

  return { isAuthorized, isChecking };
}