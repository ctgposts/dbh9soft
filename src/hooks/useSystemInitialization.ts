import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useState } from "react";

/**
 * Hook to initialize system default roles
 * Automatically seeds default roles on first app load
 */
export function useSystemInitialization() {
  const [initialized, setInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  
  const seedRoles = useMutation(api.roleSeed.seedDefaultRoles);
  const roles = useQuery(api.userManagement.listRoles, {});

  useEffect(() => {
    const initializeSystem = async () => {
      if (initialized || isInitializing || !roles) return;

      setIsInitializing(true);
      try {
        // Check if we have any roles
        if (roles && roles.length === 0) {
          console.log("🔄 Seeding default roles...");
          const result = await seedRoles();
          console.log("✅ Default roles seeded successfully", result);
        } else if (roles && roles.length > 0) {
          console.log("✅ System already initialized with", roles.length, "roles");
        }
        setInitialized(true);
      } catch (error) {
        console.error("❌ Failed to initialize system:", error);
        setInitialized(true); // Mark as initialized even if failed to prevent infinite loops
      } finally {
        setIsInitializing(false);
      }
    };

    initializeSystem();
  }, [roles, initialized, isInitializing, seedRoles]);

  return {
    initialized,
    isInitializing,
    rolesCount: roles?.length || 0,
  };
}
