import assert from "assert";
import { eq, or } from "drizzle-orm";
import { BuildManager } from "../build/BuildManager";
import { db } from "../db";
import {
  projectDeployment,
  projects,
  service,
  serviceDeployment,
  serviceGeneration,
} from "../db/schema";
import { ServiceDeploymentStatus } from "../db/types";
import { type Docker } from "../docker/docker";
import {
  buildDockerStackFile,
  type FullServiceGeneration,
} from "../docker/stack";
import logger from "../utils/logger";
import ServiceManager from "./Service";
import { isDefined } from "~/utils/utils";

export default class ProjectManager {
  private static LOGGER = logger.child({
    module: "ProjectManager",
  });

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
   * Lists all projects for a user.
   */
  static async listForUser(userId: string) {
    const data = await db.query.projects.findMany({
      where: eq(projects.ownerId, userId),
    });

    return data.map((data) => new ProjectManager(data));
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
  public async deploy(deployOptions: { docker: Docker; force?: boolean }) {
    // 1. get all services that have pending updates
    const services = await this.getServices();

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
    const allServiceData = await Promise.all(
      services.map(async (service): Promise<FullServiceGeneration> => {
        // fetch latest generation with all children
        const fullGenerationData = await db.query.serviceGeneration.findFirst({
          where: eq(serviceGeneration.id, service.getData().latestGenerationId),
          with: {
            domains: true,
            ports: true,
            service: true,
            sysctls: true,
            ulimits: true,
            volumes: true,
          },
        });

        assert(fullGenerationData, "Generation data is missing!");

        // if no deployment required, just return
        if (!(await service.hasPendingChanges()))
          return { ...fullGenerationData, service: service.getData() };

        ProjectManager.LOGGER.debug(
          `Service "${service.getData().name}" has pending changes.`,
        );

        // fetch latest generation data
        const serviceData = service.getData();

        // create a new deployment
        const [sDeployment] = await db
          .insert(serviceDeployment)
          .values({
            serviceId: serviceData.id,
            status: ServiceDeploymentStatus.BuildPending,
            projectDeploymentId: deployment.id,
          })
          .returning({
            id: serviceDeployment.id,
          });

        assert(sDeployment, "serviceDeploymentId is missing");

        // link the new deployment to the service
        if (fullGenerationData.deploymentId) {
          logger.warn(
            `Service "${serviceData.name}" already has a deployment linked.`,
            {
              serviceId: serviceData.id,
              deploymentId: fullGenerationData.deploymentId,
            },
          );
        }

        await service.deriveNewGeneration(sDeployment.id);

        // run builds if needed
        if (await service.requiresImageBuild()) {
          const image = await BuildManager.getInstance().startBuild(
            serviceData.id,
            sDeployment.id,
          );

          return {
            ...fullGenerationData,
            finalizedDockerImage: image,
            service: service.getData(),
          };
        }

        return { ...fullGenerationData, service: service.getData() };
      }),
    );

    // now build the dockerfile
    const composeStack = await buildDockerStackFile(allServiceData);

    const output = await deployOptions.docker.cli(
      [
        "stack",
        "deploy",
        "--compose-file",
        "-",
        this.projectData.internalName,
        deployOptions.force ? "--force-recreate" : undefined,
      ].filter(isDefined),
      {
        stdin: JSON.stringify(composeStack),
      },
    );

    // update all deployment statuses to success
    await db
      .update(serviceDeployment)
      .set({
        status: ServiceDeploymentStatus.Success,
      })
      .where(eq(serviceDeployment.projectDeploymentId, deployment.id));

    return output;
  }

  /**
   * Returns a list of services that have pending updates and need to be deployed.
   */
  public async getServicesWithPendingUpdates() {
    const services = await Promise.all(
      (await this.getServices())
        .map((service) => ({
          service,
          pendingUpdate: service.hasPendingChanges(),
        }))
        .filter(({ pendingUpdate }) => pendingUpdate),
    );

    return services.map(({ service }) => service);
  }
}
