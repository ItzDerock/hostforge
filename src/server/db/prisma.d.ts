declare module "@prisma/migrate/dist/Migrate" {
  export const Migrate: any;
}

declare module "@prisma/migrate/dist/utils/ensureDatabaseExists" {
  export const ensureDatabaseExists: (...args: any[]) => Promise<void>;
}
