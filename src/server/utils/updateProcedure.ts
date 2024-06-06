import type {
  SQLiteColumn,
  SQLiteTableWithColumns,
} from "drizzle-orm/sqlite-core";
import type ServiceManager from "../managers/Service";
import type { Database } from "../db";
import { and, eq, notInArray } from "drizzle-orm";
import { conflictUpdateAllExcept } from "./serverUtils";

export function createUpdateProcedure<
  T extends SQLiteTableWithColumns<{
    dialect: "sqlite";
    columns: {
      id: SQLiteColumn<{
        name: "id";
        tableName: string;
        dataType: "string";
        columnType: "SQLiteText";
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: true;
        enumValues: string[] | undefined;
        baseColumn: never;
      }>;

      serviceId: SQLiteColumn<{
        name: "service_id";
        tableName: string;
        dataType: "string";
        columnType: "SQLiteText";
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        enumValues: string[] | undefined;
        baseColumn: never;
      }>;
    };
    name: string;
    schema: undefined;
  }>,
>(table: T) {
  return async function ({
    ctx,
    input,
  }: {
    ctx: {
      service: ServiceManager;
      db: Database;
    };

    input: {
      serviceId: string;
      projectId: string;
      data: Omit<typeof table.$inferInsert, "serviceId">[];
    };
  }) {
    const currentGeneration = ctx.service.getData().latestGenerationId;

    return await ctx.db.transaction(async (trx) => {
      // insert or update
      const wanted = await trx
        .insert(table)
        .values(
          input.data.map((item) => ({
            ...item,
            serviceId: currentGeneration,
          })) as { [K in keyof T["$inferInsert"]]: T["$inferInsert"][K] }[],
        )
        .onConflictDoUpdate({
          set: conflictUpdateAllExcept(table, ["id"]),
          target: table.id,
        })
        .returning();

      // delete any volumes that are not in the wanted list
      await trx.delete(table).where(
        and(
          eq(table.serviceId, currentGeneration),
          notInArray(
            table.id,
            wanted.map((v) => v.id),
          ),
        ),
      );

      return wanted;
    });
  };
}
