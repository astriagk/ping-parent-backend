// Dynamic/shared template helpers for user-facing messages.
// Add pure functions that return strings; group by module keys.
export const MESSAGE_TEMPLATES = {
  FILE_UPLOAD: {
    invalidFileType: (mimeType: string) =>
      `Invalid file type. Received: ${mimeType}. Only image files are allowed.`,
    uploadFailed: (reason: string) => `Failed to upload file: ${reason}`,
    updateFailed: (reason: string) => `Failed to update file: ${reason}`,
  },
  ROUTE: {
    notFound: (url: string) => `Route ${url} not found`,
  },
  NOTIFICATION: {
    childPicked: (studentName: string) =>
      `Your child ${studentName} has been picked up`,
    childrenPicked: (studentNames: string) =>
      `Your children ${studentNames} have been picked up`,
    childDropped: (studentName: string) =>
      `Your child ${studentName} has been dropped off`,
    childrenDropped: (studentNames: string) =>
      `Your children ${studentNames} have been dropped off`,
    childAbsent: (studentName: string) =>
      `Your child ${studentName} was marked absent`,
    childrenAbsent: (studentNames: string) =>
      `Your children ${studentNames} were marked absent`,
    driverApproaching: (etaMinutes: number) =>
      `Driver is approaching - ETA ${etaMinutes} minutes`,
    driverApproachingForStudent: (studentName: string, etaMinutes: number) =>
      `Driver is approaching for ${studentName} - ETA ${etaMinutes} minutes`,
    driverApproachingForStudents: (studentNames: string, etaMinutes: number) =>
      `Driver is approaching for ${studentNames} - ETA ${etaMinutes} minutes`,
    updatedEta: (studentNames: string) => `Updated ETA for ${studentNames}`,
    updatedEtas: (studentNames: string) => `Updated ETAs for ${studentNames}`,
    routeRecalculated: (studentNames: string) =>
      `Route has been recalculated. Updated ETAs for ${studentNames}`,
  },
} as const;
