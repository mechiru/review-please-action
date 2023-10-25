import * as core from '@actions/core';
import { Client, PrReviewer } from './github';

type Input = Readonly<{
  auth: string;
  owner: string;
  repo: string;
  deadline: number;
}>;

function parseInput(init?: Partial<Input>): Input {
  const [owner, repo] = core.getInput('repo').split('/');
  const deadline = parseInt(core.getInput('review-deadline'));
  return {
    auth: core.getInput('github-token'),
    owner,
    repo,
    deadline
  };
}

export async function run(): Promise<void> {
  try {
    const input = parseInput();

    const client = new Client(input);

    const prs = await client.getPrReviewers();

    for (const pr of prs) {
      core.info(`pr: ${JSON.stringify(pr)}`);
      if (!checkPrState(pr, { now: new Date(), deadline: input.deadline })) {
        continue;
      }
      const comment = toComment(input.owner, pr);
      await client.createIssueComment(pr.no, comment);
    }

    core.setOutput('prs', JSON.stringify(prs));
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

export function parsePeriod(s: string): number {
  const match = s.match(/^([0-9]+)d$/);
  if (match === null || match.length !== 2) {
    throw new Error(`invalid time period format: ${s}`);
  }
  return parseInt(match[0], 10);
}

// Check if the pull request is eligible for comment.
// If this function returns true, the passed pr is commentable.
export function checkPrState(
  pr: PrReviewer,
  option: {
    now: Date;
    deadline: number;
  }
): boolean {
  if (pr.draft) {
    return false;
  }

  if (pr.reviewerLogins.length === 0 && pr.reviewerTeamSlugs.length === 0) {
    return false;
  }

  const createdAt = new Date(pr.createdAt);
  createdAt.setDate(createdAt.getDate() + option.deadline);
  core.info(`checkPrState: pr#${pr.no}'s deadline is ${createdAt.toISOString()}`);

  if (option.now.getTime() < createdAt.getTime()) {
    return false;
  }

  return true;
}

export function toComment(owner: string, pr: PrReviewer): string {
  const reviewerLogins = pr.reviewerLogins.map(x => `@${x}`).join(', ');
  const reviewerTeams = pr.reviewerTeamSlugs.map(x => `@${owner}/${x}`).join(', ') ?? '';

  return `${reviewerLogins.length > 0 ? `Requested reviewers:\n${reviewerLogins}\n\n` : ''}\
${reviewerTeams.length > 0 ? `Requested teams:\n${reviewerTeams}\n\n` : ''}\
url: ${pr.url}
Please review!!`;
}
