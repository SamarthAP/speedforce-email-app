import {
  PublisherBase,
  PublisherOptions,
} from "@electron-forge/publisher-base";
import crypto from "crypto";
import { readFile } from "fs/promises";
import { Octokit } from "@octokit/rest";
import { retry } from "@octokit/plugin-retry";
import path from "path";
import yaml from "yaml";

interface ArtifactInformation {
  url: string;
  sha512: string;
  size: number;
}

interface GitHubRelease {
  tag_name: string;
  assets: {
    name: string;
  }[];
  upload_url: string;
}

function assertStringExistsAndDefined<T>(
  value: T | null | undefined,
  valueName: string
): T {
  if (value === null || value === undefined) {
    throw new Error(`Expected ${valueName} to be defined`);
  } else if (typeof value !== "string") {
    throw new Error(`Expected ${valueName} to be a string`);
  } else if (value.length === 0) {
    throw new Error(`Expected ${valueName} to be a non-empty string`);
  }
  return value;
}

async function createArtifactInformation(artifact: string) {
  try {
    const artifactName = path.basename(artifact);
    const buffer = await readFile(artifact);
    const hash = crypto.createHash("sha512").update(buffer).digest("hex");
    const size = buffer.length;
    return {
      url: artifactName,
      sha512: hash,
      size,
    };
  } catch (e) {
    throw new Error(
      `Failed to create artifact information for ${artifact}: ${e}`
    );
  }
}

export default class GithubYmlPublisher extends PublisherBase<any> {
  name = "github-yml";

  async publish(opts: PublisherOptions) {
    let version = "";
    let releaseName = "";

    if (opts.makeResults.length === 0) {
      throw new Error("No make results to publish");
    }

    const artifactInformationPromiseList: Promise<ArtifactInformation>[] = [];
    for (const result of opts.makeResults) {
      // if you have zip and dmg, then there will be two result objects, each with one artifact
      version = assertStringExistsAndDefined(
        result.packageJSON.version,
        "packageJSON.version"
      );
      releaseName = `v${version}`;

      for (const artifact of result.artifacts) {
        console.log("artifact", { message: artifact });
        artifactInformationPromiseList.push(
          createArtifactInformation(artifact)
        );
      }
    }

    if (version === "") {
      throw new Error("Version is empty");
    }

    const artifactInformation = await Promise.all(
      artifactInformationPromiseList
    );
    const files = artifactInformation.filter(
      (artifactInfo) => artifactInfo.url !== undefined
    );

    const releaseData = {
      version,
      files: artifactInformation,
      path: files[0].url,
      sha512: files[0].sha512,
      releaseDate: `'${new Date().toISOString()}'`,
    };

    let yamlString = yaml.stringify(releaseData);

    let ymlFileName = "";
    if (process.platform === "darwin") {
      ymlFileName = "latest-mac.yml";
    } else if (process.platform === "linux") {
      ymlFileName = "latest-linux.yml";
    } else {
      ymlFileName = "latest.yml";
    }

    const OctokitInstance = Octokit.plugin(retry);
    const octokit = new OctokitInstance({
      auth: assertStringExistsAndDefined(process.env.GH_TOKEN, "GH_TOKEN"),
    });

    const release = (
      await octokit.repos.listReleases({
        owner: assertStringExistsAndDefined(process.env.GH_OWNER, "GH_OWNER"),
        repo: assertStringExistsAndDefined(process.env.GH_REPO, "GH_REPO"),
        per_page: 100,
      })
    ).data.find(
      (testRelease: GitHubRelease) => testRelease.tag_name === releaseName
    );

    if (!release) {
      throw new Error(`Release ${releaseName} not found`);
    }

    await octokit.repos.uploadReleaseAsset({
      owner: assertStringExistsAndDefined(process.env.GH_OWNER, "GH_OWNER"),
      repo: assertStringExistsAndDefined(process.env.GH_REPO, "GH_REPO"),
      release_id: release.id,
      name: ymlFileName,
      data: yamlString,
    });
  }
}
