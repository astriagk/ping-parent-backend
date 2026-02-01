export { default as schoolAdminRoutes } from "./school_admin.routes";
export * from "./school_admin.controller";
export {
  registerSchoolAdmin as registerSchoolAdminService,
  loginSchoolAdmin as loginSchoolAdminService,
  getSchoolAdminById,
  getSchoolAdmins as getSchoolAdminsService,
  updateSchoolAdmin as updateSchoolAdminService,
  changeSchoolAdminPassword as changeSchoolAdminPasswordService,
  deactivateSchoolAdmin as deactivateSchoolAdminService,
} from "./school_admin.service";
export * from "./school_admin.type";
export { schoolAdminRepository } from "./school_admin.repository";
