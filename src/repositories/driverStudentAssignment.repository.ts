import { WithId } from "mongodb";

import {
  AssignmentStatus,
  DRIVER_STUDENT_ASSIGNMENTS_COLLECTION,
} from "@constants";
import { DriverStudentAssignment } from "@models/driverStudentAssignment.type";

import { BaseRepository } from "./base.repository";

export class DriverStudentAssignmentRepository extends BaseRepository<DriverStudentAssignment> {
  constructor() {
    super(DRIVER_STUDENT_ASSIGNMENTS_COLLECTION);
  }

  async findByDriverId(
    driverId: string,
  ): Promise<WithId<DriverStudentAssignment>[]> {
    return await this.findMany({ driver_id: driverId });
  }

  async findByStudentId(
    studentId: string,
  ): Promise<WithId<DriverStudentAssignment>[]> {
    return await this.findMany({ student_id: studentId });
  }

  async findActiveAssignmentsByDriverId(
    driverId: string,
  ): Promise<WithId<DriverStudentAssignment>[]> {
    return await this.findMany({
      driver_id: driverId,
      assignment_status: AssignmentStatus.ACTIVE,
    });
  }

  async findActiveAssignmentsByStudentId(
    studentId: string,
  ): Promise<WithId<DriverStudentAssignment>[]> {
    return await this.findMany({
      student_id: studentId,
      assignment_status: AssignmentStatus.ACTIVE,
    });
  }

  async findPendingAssignmentsByDriverId(
    driverId: string,
  ): Promise<WithId<DriverStudentAssignment>[]> {
    return await this.findMany({
      driver_id: driverId,
      assignment_status: {
        $in: [AssignmentStatus.PENDING, AssignmentStatus.PARENT_REQUESTED],
      },
    });
  }

  async findByDriverUniqueId(
    driverUniqueId: string,
  ): Promise<WithId<DriverStudentAssignment>[]> {
    return await this.findMany({ driver_unique_id: driverUniqueId });
  }

  async findDuplicateAssignment(
    driverId: string,
    studentId: string,
  ): Promise<WithId<DriverStudentAssignment> | null> {
    return await this.findOne({
      driver_id: driverId,
      student_id: studentId,
      assignment_status: {
        $in: [
          AssignmentStatus.ACTIVE,
          AssignmentStatus.PENDING,
          AssignmentStatus.PARENT_REQUESTED,
        ],
      },
    });
  }

  async findAssignmentByDriverAndStudent(
    driverId: string,
    studentId: string,
  ): Promise<WithId<DriverStudentAssignment> | null> {
    return await this.findOne({
      driver_id: driverId,
      student_id: studentId,
    });
  }
}

export const driverStudentAssignmentRepository =
  new DriverStudentAssignmentRepository();
