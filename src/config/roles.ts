export const ROLES: string[] = process.env.ROLES
  ? process.env.ROLES.split(",").map((r) => r.trim())
  : ["parent", "admin", "staff", "guardian"];

export const getRoles = () => ROLES;
