import assert from "assert";

enum DefaultFlags {}

export function createPermissionsClass<
  E extends Record<T, string | number>,
  T extends string | number | symbol,
>(permissionsEnum: E) {
  return class extends Permission<E, T> {
    public static Flags = permissionsEnum;
    static from(permission: number | bigint | T[]) {
      return new Permission(permission as any);
    }
  };
}

/**
 * Creates a class representing a set of permissions
 */
export class Permission<E, T extends string | number | symbol> {
  public static Flags = DefaultFlags;
  private permissions: bigint = 0n;

  /**
   * Creates a helper class for working with permissions
   * @param allPermissions The permissions enum
   * @param givenPermissions The permissions to start with
   */
  constructor(givenPermissions?: number | bigint | T[] | E[]) {
    if (
      typeof givenPermissions === "number" ||
      typeof givenPermissions === "bigint"
    ) {
      this.permissions = BigInt(givenPermissions);
    } else if (Array.isArray(givenPermissions)) {
      givenPermissions.forEach((permission) => {
        this.add(permission);
      });
    }
  }

  static from(permission: number | bigint) {
    return new Permission(permission);
  }

  /**
   * Converts a permission index to a bitmask
   * @param index The 0-based index of the permission
   * @returns the permission as a bitmask
   */
  private toPermissionBitmask(permission: T | E): bigint {
    let permissionIndex: number = -1;

    // if is a string, that means we reversed the enum
    if (typeof permission === "string") {
      // @ts-expect-error idk how to type this better
      let resolved = (this.constructor as unknown as typeof Permission).Flags[
        permission
      ];
      assert(typeof resolved === "number", "Invalid permission");
      permissionIndex = resolved;
    } else if (typeof permission === "number") {
      permissionIndex = permission;
    }

    assert(permissionIndex >= 0, "Failed to resolve permission");
    return 1n << BigInt(permissionIndex);
  }

  /**
   * Adds a permission to the set
   * @param permission The permission to add
   */
  public add(permission: E) {
    this.permissions |= this.toPermissionBitmask(permission);
  }

  /**
   * Removes a permission from the set
   * @param permission The permission to remove
   */
  public remove(permission: T) {
    this.permissions &= ~this.toPermissionBitmask(permission);
  }

  /**
   * Checks if the set has a permission
   * @param permission The permission(s) to check
   * @returns true if the set has the permission
   */
  public has(permission: T | T[]): boolean {
    if (Array.isArray(permission)) {
      return permission.every((perm) => this.has(perm));
    }

    return (this.permissions & this.toPermissionBitmask(permission)) !== 0n;
  }

  /**
   * Returns a new instance of Permission for a new set of permissions
   * @param permissions The permissions to start with
   */
  public for(permissions: number | bigint | T[]) {
    return new Permission(permissions);
  }

  /**
   * Creates a copy of the current set of permissions
   * @returns a new instance of Permission
   */
  public copy() {
    return new Permission(this.permissions);
  }

  /**
   * Returns the permissions as a bitmask
   * @returns the permissions as a bitmask
   */
  public toBits() {
    return this.permissions;
  }
}
