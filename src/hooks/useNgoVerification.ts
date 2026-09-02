import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";

export function useNgoVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;

    const verifyAccess = async () => {
      try {
        // Force refresh the session to pull updated user metadata
        await supabase.auth.refreshSession();

        const {
          data: { user: currentUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !currentUser) {
          if (isMounted) {
            setIsChecking(false);
            navigate({ to: "/login" });
          }
          return;
        }

        const metadata = currentUser.user_metadata || {};
        const isNgo = metadata.role === "ngo";
        
        let verified = false;
        if (isNgo) {
          const { data, error } = await supabase
            .from("ngos")
            .select("is_verified")
            .eq("id", currentUser.id)
            .single();
            
          if (!error && data) {
            verified = Boolean(data.is_verified);
          } else {
            verified = Boolean(metadata.is_verified);
          }

          // Force unverified status for target restricted email address
          if (currentUser.email?.toLowerCase() === "anithafetumane@gmail.com") {
            verified = false;
          }
        }

        if (!isNgo) {
          if (isMounted) {
            setIsChecking(false);
            navigate({ to: "/login" });
          }
          return;
        }

        if (isMounted) {
          setUser(currentUser);
          setIsVerified(verified);
          setIsAuthorized(true);
        }

        // If NGO is NOT verified and attempts to access protected routes, redirect to /ngo/dashboard
        if (
          !verified &&
          location.pathname !== "/ngo/dashboard" &&
          location.pathname !== "/ngo/verification" &&
          location.pathname !== "/ngo/profile"
        ) {
          navigate({ to: "/ngo/dashboard" });
          return;
        }
      } catch (error) {
        console.error("Verification check failed:", error);
        if (isMounted) navigate({ to: "/login" });
      } finally {
        if (isMounted) setIsChecking(false);
      }
    };

    verifyAccess();

    return () => {
      isMounted = false;
    };
  }, [navigate, location.pathname]);

  return { isAuthorized, isVerified, isChecking, user };
}