import { eq, or } from "drizzle-orm";
import { db } from "../db";
import { projects, service } from "../db/schema";
import ServiceManager from "./ServiceManager";

export default class ProjectManager {
  constructor(private projectData: typeof projects.$inferSelect) {}

  /**
   * Finds a project by name or ID.
   */
  static async findByNameOrId(nameOrId: string) {
    const data = await db.query.projects.findFirst({
      where: or(eq(projects.internalName, nameOrId), eq(projects.id, nameOrId)),
    });

    return data ? new ProjectManager(data) : null;
  }

  /**
   * Returns the project data.
   */
  public getData() {
    return this.projectData;
  }

  /**
   * Returns the project services.
   */
  public async getServices() {
    const serviceData = await db.query.service.findMany({
      where: eq(service.projectId, this.projectData.id),
    });

    return serviceData.map((data) => new ServiceManager(data));
  }
}
