import assert from "assert";
import { spawn } from "child_process";
import { LogLevel } from "../utils/BuilderLogger";
import { waitForExit } from "../utils/utils";
import BaseSource from "./BaseSource";

export default class GitHubSource extends BaseSource {
  public async downloadCode(): Promise<void> {
    // resolve Git URL
    const githubUsername =
      this.configuration.serviceConfiguration.githubUsername;
    const githubRepository =
      this.configuration.serviceConfiguration.githubRepository;
    const githubBranch = this.configuration.serviceConfiguration.githubBranch;

    assert(githubUsername, "GitHub username is required");
    assert(githubRepository, "GitHub repository is required");

    const gitUrl = `https://github.com/${encodeURIComponent(
      githubUsername,
    )}/${encodeURIComponent(githubRepository)}`;

    // build git clone command
    const args = [
      // repo url
      "clone",
      gitUrl,

      // get submodules
      "--recurse-submodules",

      // do not clone the entire history
      "--depth",
      "1",
    ];

    // if branch specified, add it to the command
    if (githubBranch) {
      args.push("--branch", githubBranch);
    }

    // add the work directory
    args.push(this.configuration.workDirectory);

    // run the git command
    this.configuration.fileLogger.write(
      LogLevel.Notice,
      `> Cloning the repository.\n$ git ${args.join(" ")}`,
    );

    const git = spawn("git", args, {
      cwd: this.configuration.workDirectory,
    });

    // set up logging
    this.configuration.fileLogger.withChildprocess(git);

    // wait for exit
    await waitForExit(git);
    console.log("Downloaded code from GitHub");
  }
}
