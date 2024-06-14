import { DockerNetworks } from "~/server/docker";
import type { GlobalStore } from "~/server/managers/GlobalContext";

export class HostforgeService {
  constructor(private readonly globalStore: GlobalStore) {}

  async updateSelfLabels() {
    const domain = this.globalStore.settings.getSettings();

    await this.globalStore.docker.cli([
      "service",
      "update",
      "hostforge",
      "--label-add",
      "traefik.constraint-label=hostforge-public",
      "--label-add",
      "traefik.enable=true",
      "--label-add",
      `traefik.http.routers.hostforge.rule=Host(\`${domain.domain}\`)`,
      "--label-add",
      "traefik.http.routers.hostforge.entrypoints=websecure",
      "--label-add",
      "traefik.http.routers.hostforge.tls=true",
      "--label-add",
      "traefik.http.routers.hostforge.tls.certresolver=letsencrypt",
      "--label-add",
      "traefik.http.services.api.loadbalancer.server.port=3000",
      "--label-add",
      `traefik.docker.network=${DockerNetworks.Public}`,
      // redirect http to https
      "--label-add",
      "traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https",
      "--label-add",
      "traefik.http.routers.hostforge.middlewares=redirect-to-https",
    ]);
  }
}
