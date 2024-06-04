import { SQLiteColumn, SQLiteTableWithColumns } from "drizzle-orm/sqlite-core";
import ServiceManager from "../managers/Service";
import type { Database } from "../db";
import { TableConfig } from "drizzle-orm";
import { servicePort } from "../db/schema";

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
        name: "serviceId";
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
      data: (typeof table.$inferInsert)[];
    };
  }) {
    const currentGeneration = ctx.service.getData().latestGenerationId;

    return await ctx.db.transaction(async (trx) => {
      // insert or update
      const wanted = await trx
        .insert(table)
        .values(input)
        .onConflictDoUpdate({
          set: {
            id: c,
          },
          target: table.id,
          targetWhere: eq(table.serviceId, currentGeneration),
        })
        .returning();

      // delete any volumes that are not in the wanted list
      await trx.delete(table).where(
        and(
          eq(serviceVolume.serviceId, currentGeneration),
          notInArray(
            serviceVolume.id,
            wanted.map((v) => v.id),
          ),
        ),
      );

      return wanted;
    });
  };
}
