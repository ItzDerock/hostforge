import { stripIndents } from "common-tags";
import type { GlobalStore } from "~/server/managers/GlobalContext";

export class NetdataManager {
  constructor(private config: GlobalStore) {}

  public createStackFile() {
    return stripIndents`
      services:
        netdata-client:
          image: netdata/netdata
          hostname: "{{.Node.Hostname}}"
          cap_add:
            - SYS_PTRACE
            - SYS_ADMIN
          security_opt:
            - apparmor:unconfined
          environment:
            - NETDATA_STREAM_DESTINATION=control:19999
            - NETDATA_STREAM_API_KEY=1x214ch15h3at1289y
            - PGID=999
          volumes:
            - /proc:/host/proc:ro
            - /sys:/host/sys:ro
            - /var/run/docker.sock:/var/run/docker.sock
          networks:
            - netdata
          deploy:
            mode: global
            placement:
              constraints: [node.role == worker]

        netdata-central:
          image: netdata/netdata
          hostname: control
          cap_add:
            - SYS_PTRACE
          security_opt:
            - apparmor:unconfined
          environment:
            - NETDATA_API_KEY_ENABLE_1x214ch15h3at1289y=1
          ports:
            - '19999:19999'
          volumes:
            - /proc:/host/proc:ro
            - /sys:/host/sys:ro
            - /var/run/docker.sock:/var/run/docker.sock
          networks:
            - netdata
          deploy:
            mode: replicated
            replicas: 1
            placement:
              constraints: [node.role == manager]

      networks:
        netdata:
          driver: overlay
          attachable: true
      `;
  }
}
