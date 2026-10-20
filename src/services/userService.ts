import { supabase } from "@/integrations/supabase/client";

export type UserCreateData = {
  email: string;
  name: string;
  role: boolean;
  position: string;
  department_id?: string;
  password?: string;
};

export type UserUpdateData = {
  email?: string;
  name?: string;
  role?: boolean;
  position?: string;
  department_id?: string;
  password?: string;
};

type ManageUsersRequest =
  | { action: "CREATE"; userData: UserCreateData }
  | { action: "UPDATE"; userId: string; userData: UserUpdateData }
  | { action: "ARCHIVE" | "UNARCHIVE"; userId: string };

async function invokeManageUsers(body: ManageUsersRequest) {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;

  let session = sessionData.session;
  if (!session?.access_token) {
    throw new Error("Your session has expired. Please sign in again and retry.");
  }

  if (session.expires_at && session.expires_at * 1000 <= Date.now() + 30_000) {
    const { data: refreshedData, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) throw refreshError;
    session = refreshedData.session;
    if (!session?.access_token) {
      throw new Error("Your session has expired. Please sign in again and retry.");
    }
  }

  const { data, error } = await supabase.functions.invoke("manage-users", {
    body,
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (error) {
    const response = error.context;
    const errorData = response instanceof Response
      ? await response.json().catch(() => ({}))
      : {};
    throw new Error(errorData.error || error.message || "User management request failed");
  }

  return data;
}

export const UserService = {
  async createUser(userData: UserCreateData) {
    try {
      return await invokeManageUsers({ action: "CREATE", userData });
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },

  async updateUser(userId: string, userData: UserUpdateData) {
    try {
      return await invokeManageUsers({ action: "UPDATE", userId, userData });
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  },

  async archiveUser(userId: string) {
    try {
      return await invokeManageUsers({ action: "ARCHIVE", userId });
    } catch (error) {
      console.error("Error archiving user:", error);
      throw error;
    }
  },

  async unarchiveUser(userId: string) {
    try {
      return await invokeManageUsers({ action: "UNARCHIVE", userId });
    } catch (error) {
      console.error("Error unarchiving user:", error);
      throw error;
    }
  },
};
