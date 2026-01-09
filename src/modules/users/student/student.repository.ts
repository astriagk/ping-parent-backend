import { WithId } from "mongodb";

import { Student } from "@modules/users/student/student.type";
import { STUDENTS_COLLECTION } from "@shared/constants";
import { BaseRepository } from "@shared/database";

export class StudentRepository extends BaseRepository<Student> {
  constructor() {
    super(STUDENTS_COLLECTION);
  }

  async findByParentId(parentId: string): Promise<WithId<Student>[]> {
    return await this.findMany({ parent_id: parentId });
  }

  async findBySchoolId(schoolId: string): Promise<WithId<Student>[]> {
    return await this.findMany({ school_id: schoolId });
  }

  async findActiveStudentsByParentId(
    parentId: string,
  ): Promise<WithId<Student>[]> {
    return await this.findMany({ parent_id: parentId, is_active: true });
  }

  async findByStudentId(studentId: string): Promise<WithId<Student> | null> {
    return await this.findOne({ student_id: studentId });
  }

  async studentIdExists(studentId: string): Promise<boolean> {
    return await this.exists({ student_id: studentId });
  }

  async findDuplicateStudent(
    parentId: string,
    studentName: string,
    schoolId: string,
    classValue: string,
  ): Promise<WithId<Student> | null> {
    return await this.findOne({
      parent_id: parentId,
      student_name: studentName,
      school_id: schoolId,
      class: classValue,
      is_active: true,
    });
  }
}

export const studentRepository = new StudentRepository();
