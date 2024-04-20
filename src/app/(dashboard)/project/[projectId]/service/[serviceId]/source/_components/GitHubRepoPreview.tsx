"use client";

import { useQuery } from "@tanstack/react-query";
import { Card } from "~/components/ui/card";

export default function GithubRepoPreview({
  githubUsername,
  githubRepository,
}: {
  githubUsername?: string | null;
  githubRepository?: string | null;
}) {
  // react-query
  const { data, isFetching } = useQuery({
    queryKey: ["github-repo", githubUsername, githubRepository],
    enabled: !!githubUsername && !!githubRepository,
    queryFn: async () => {
      return fetch(
        `https://api.github.com/repos/${encodeURIComponent(
          githubUsername!,
        )}/${encodeURIComponent(githubRepository!)}`,
      ).then((res) => res.json()) as Promise<
        GithubRepoSuccess | GithubRepoFailure
      >;
    },

    // github rate-limit for unauthenticated requests is pretty low
    // so we don't want to refetch too often
    refetchInterval: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: false,
  });

  if (!githubUsername || !githubRepository) {
    return (
      <Card className="flex flex-row items-center p-4">
        <p className="text-muted-foreground">
          Enter a github repository username and repository name and a preview
          will be shown here.
        </p>
      </Card>
    );
  }

  if (isFetching || !data) {
    return (
      <Card className="flex flex-row items-center p-4">
        <div className="h-14 w-14 animate-pulse rounded-full bg-muted" />
        <div className="ml-4 flex flex-grow animate-pulse flex-col gap-1">
          <div className="h-4 w-1/2 rounded bg-muted" />
          <div className="h-4 w-3/4 rounded bg-muted" />
        </div>
      </Card>
    );
  }

  if ("message" in data) {
    return (
      <Card className="flex flex-row items-center p-4">
        <p className="text-muted-foreground">
          {data.message === "Not Found"
            ? "Repository not found."
            : data.message.startsWith("API rate limit exceeded")
              ? "GitHub API rate limit exceeded. Preview will be available when the rate limit resets."
              : data.message}
        </p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-row items-center p-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={data.owner.avatar_url}
        alt="avatar"
        className="h-14 w-14 rounded-full"
      />
      <div className="ml-4 flex flex-col gap-1">
        <p className="text-lg font-bold">{data.full_name}</p>
        <p className="text-sm text-muted-foreground">{data.description}</p>
      </div>
    </Card>
  );
}

export interface GithubRepoFailure {
  message: string;
}

export interface GithubRepoSuccess {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  private: boolean;
  owner: Owner;
  html_url: string;
  description: string;
  fork: boolean;
  url: string;
  forks_url: string;
  keys_url: string;
  collaborators_url: string;
  teams_url: string;
  hooks_url: string;
  issue_events_url: string;
  events_url: string;
  assignees_url: string;
  branches_url: string;
  tags_url: string;
  blobs_url: string;
  git_tags_url: string;
  git_refs_url: string;
  trees_url: string;
  statuses_url: string;
  languages_url: string;
  stargazers_url: string;
  contributors_url: string;
  subscribers_url: string;
  subscription_url: string;
  commits_url: string;
  git_commits_url: string;
  comments_url: string;
  issue_comment_url: string;
  contents_url: string;
  compare_url: string;
  merges_url: string;
  archive_url: string;
  downloads_url: string;
  issues_url: string;
  pulls_url: string;
  milestones_url: string;
  notifications_url: string;
  labels_url: string;
  releases_url: string;
  deployments_url: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  git_url: string;
  ssh_url: string;
  clone_url: string;
  svn_url: string;
  homepage: string;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string;
  has_issues: boolean;
  has_projects: boolean;
  has_downloads: boolean;
  has_wiki: boolean;
  has_pages: boolean;
  has_discussions: boolean;
  forks_count: number;
  mirror_url: unknown;
  archived: boolean;
  disabled: boolean;
  open_issues_count: number;
  license: License;
  allow_forking: boolean;
  is_template: boolean;
  web_commit_signoff_required: boolean;
  topics: string[];
  visibility: string;
  forks: number;
  open_issues: number;
  watchers: number;
  default_branch: string;
  temp_clone_token: unknown;
  network_count: number;
  subscribers_count: number;
}

export interface Owner {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
}

export interface License {
  key: string;
  name: string;
  spdx_id: string;
  url: string;
  node_id: string;
}
