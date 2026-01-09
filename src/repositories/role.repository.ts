import { WithId } from "mongodb";

import { ROLES_COLLECTION } from "@shared/constants";
import { BaseRepository } from "@shared/database";
import { Role } from "@shared/types/role.type";

export class RoleRepository extends BaseRepository<Role> {
  constructor() {
    super(ROLES_COLLECTION);
  }

  async findByRoleId(roleId: string): Promise<WithId<Role> | null> {
    return await this.findOne({ role_id: roleId });
  }

  async findByRoleName(roleName: string): Promise<WithId<Role> | null> {
    return await this.findOne({ role_name: roleName });
  }

  async roleNameExists(roleName: string): Promise<boolean> {
    return await this.exists({ role_name: roleName });
  }

  async roleIdExists(roleId: string): Promise<boolean> {
    return await this.exists({ role_id: roleId });
  }
}

export const roleRepository = new RoleRepository();
