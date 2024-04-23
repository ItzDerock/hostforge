import assert from "assert";
import { eq, or } from "drizzle-orm";
import { db } from "../db";
import {
  projectDeployment,
  projects,
  service,
  serviceDeployment,
} from "../db/schema";
import { ServiceDeploymentStatus } from "../db/types";
import ServiceManager from "./Service";

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

  /**
   * Deploys the project.
   */
  public async deploy(deployOptions?: { force?: boolean }) {
    // 1. get all services that have pending updates
    const services = await this.getServicesWithPendingUpdates();
    const serviceData = await Promise.all(
      services.map((service) => service.getDataWithGenerations()),
    );

    // 2. Create a deployment entry
    const [deployment] = await db
      .insert(projectDeployment)
      .values({
        projectId: this.projectData.id,
        status: ServiceDeploymentStatus.BuildPending,
      })
      .returning({
        id: projectDeployment.id,
      });

    assert(deployment, "deploymentId is missing");

    // 2. for each service, create a new deployment and run builds if needed
    await Promise.all(
      serviceData.map(async (service) => {
        // create a new deployment
        const [sDeployment] = await db
          .insert(serviceDeployment)
          .values({
            serviceId: service.id,
            status: ServiceDeploymentStatus.BuildPending,
            projectDeploymentId: deployment.id,
          })
          .returning({
            id: serviceDeployment.id,
          });

        // link the new deployment to the service
      }),
    );

    // create a new generation for each service
    // await Promise.all(services.map((service) => service.deriveNewGeneration()));
  }

  /**
   * Returns a list of services that have pending updates and need to be deployed.
   */
  public async getServicesWithPendingUpdates() {
    const services = await Promise.all(
      (await this.getServices())
        .map((service) => ({
          service,
          pendingUpdate: service.buildDeployDiff(),
        }))
        .filter(({ pendingUpdate }) => Object.keys(pendingUpdate).length > 0),
    );

    return services.map(({ service }) => service);
  }
}
