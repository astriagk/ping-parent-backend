import {
  assignDriverToSchool,
  getSchoolDriverDetails,
  getSchoolDrivers,
  removeDriverFromSchool,
} from "./school_driver.controller";

/**
 * Handler group for school_driver module.
 * Import in src/routes/admin.routes.ts, school-admin.routes.ts — NO auth middleware here.
 */
export const schoolDriverHandlers = {
  admin: {
    getBySchool: getSchoolDrivers,
    assign: assignDriverToSchool,
    remove: removeDriverFromSchool,
    getDetails: getSchoolDriverDetails,
  },
  schoolAdmin: {
    getAll: getSchoolDrivers,
    add: assignDriverToSchool,
  },
};
