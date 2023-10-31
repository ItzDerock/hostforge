import { createPermissionsClass } from "ts-permissions";

enum ProjectPermissionsEnum {
  /**
   * Can do anything **including** deleting the project.
   */
  Owner,

  /**
   * Can do anything **except** delete the project.
   */
  Administrator,

  /**
   * Can add/remove members and grant permissions (lower than their own) to members, with an exception to Owners.
   */
  ManageMembers,

  /**
   * Can create and view services.
   */
  CreateService,

  /**
   * Can only view services.
   */
  ViewServices,

  /**
   * Can edit and delete services.
   */
  ManageServices,
}

export const ProjectPermissions = createPermissionsClass<
  typeof ProjectPermissionsEnum
>(ProjectPermissionsEnum, "ProjectPermissions");
