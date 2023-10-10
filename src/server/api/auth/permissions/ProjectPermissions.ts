import { Permission, createPermissionsClass } from ".";

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

export const ProjectPermissions = createPermissionsClass(
  ProjectPermissionsEnum,
);

// export class ProjectPermissions extends Permission<
//   Record<ProjectPermissionsEnum, number>
// > {
//   public static Flags = ProjectPermissionsEnum;
// }

// const test = {
//   Administrator: 0,
//   ManageMembers: 1,
//   CreateService: 2,
//   ViewServices: 3,
//   ManageServices: 4,
// };

// type Test = { [key in keyof typeof ProjectPermissions]: number }

// class TestClass<T extends {}> {
//   constructor(public value: {
//     [key in keyof typeof T]: number | string;
//   }) {}
//   use(something: T) {
//     return new TestClass(something);
//   }
// }

// const inst = new TestClass<ProjectPermissions>(ProjectPermissions);
// inst.use(ProjectPermissions.Owner);

// export const ProjectPermissionsClass = new Permission(ProjectPermissions);
// ProjectPermissionsClass.for(0b11111).has(ProjectPermissions.Owner);
