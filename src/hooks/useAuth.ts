import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppRole, UserAuthContext, OrganizationMember, Organization, License } from '@/types/auth';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authContext, setAuthContext] = useState<UserAuthContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer fetching user context to avoid blocking auth state change
          setTimeout(() => {
            fetchUserContext(session.user.id);
          }, 0);
        } else {
          setAuthContext(null);
          setLoading(false);
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserContext(session.user.id);
      } else {
        setLoading(false);
        setInitialized(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserContext = async (userId: string) => {
    try {
      // Fetch organization member data with role
      const { data: memberData, error: memberError } = await supabase
        .from('organization_members')
        .select(`
          role,
          org_id,
          license_id,
          permissions,
          organizations (
            org_name,
            metadata
          ),
          licenses (
            license_type,
            status,
            assigned_store_id
          )
        `)
        .eq('user_id', userId)
        .single();

      if (memberError) throw memberError;

      // Fetch user email
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) throw new Error('User not found');

      const permissions = memberData.permissions as {
        storeIds?: string[];
        features?: string[];
        canInvite?: boolean;
        canExport?: boolean;
      } | null;

      const context: UserAuthContext = {
        userId,
        email: authUser.email || '',
        role: memberData.role as AppRole,
        orgId: memberData.org_id,
        orgName: (memberData.organizations as any)?.org_name || '',
        license: memberData.licenses as License | undefined,
        permissions: permissions || {
          storeIds: [],
          features: [],
          canInvite: false,
          canExport: false,
        },
      };

      setAuthContext(context);
    } catch (error) {
      console.error('Error fetching user context:', error);
      setAuthContext(null);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAuthContext(null);
  };

  const hasRole = (role: AppRole): boolean => {
    return authContext?.role === role;
  };

  const hasAnyRole = (roles: AppRole[]): boolean => {
    return authContext ? roles.includes(authContext.role) : false;
  };

  return {
    user,
    authContext,
    loading,
    initialized,
    signOut,
    hasRole,
    hasAnyRole,
    isAuthenticated: !!user,
  };
};
