/**
 * Unit tests for src/main.ts
 */

import { PrReviewer } from '../src/github';
import { toComment } from '../src/main';
import { expect } from '@jest/globals';

describe('main.ts', () => {
  it('toComment', () => {
    const cases: {
      in: { owner: string; pr: PrReviewer };
      want: string;
    }[] = [
      {
        in: {
          owner: 'my-org',
          pr: {
            url: 'my-url',
            no: 0,
            draft: false,
            reviewerLogins: [],
            reviewerTeamSlugs: [],
            createdAt: '2023-10-24T01:30:57Z'
          }
        },
        want: `url: my-url
Please review!!`
      },
      {
        in: {
          owner: 'my-org2',
          pr: {
            url: 'my-url2',
            no: 123,
            draft: true,
            reviewerLogins: ['login1'],
            reviewerTeamSlugs: [],
            createdAt: '2023-10-24T01:30:57Z'
          }
        },
        want: `Requested reviewers:
@login1

url: my-url2
Please review!!`
      },
      {
        in: {
          owner: 'my-org3',
          pr: {
            url: 'my-url3',
            no: 123,
            draft: false,
            reviewerLogins: [],
            reviewerTeamSlugs: ['team-slug1'],
            createdAt: '2023-10-24T01:30:57Z'
          }
        },
        want: `Requested teams:
@my-org3/team-slug1

url: my-url3
Please review!!`
      },
      {
        in: {
          owner: 'my-org4',
          pr: {
            url: 'my-url4',
            no: 123,
            draft: false,
            reviewerLogins: ['login4', 'login5'],
            reviewerTeamSlugs: ['team-slug1', 'team-slug2'],
            createdAt: '2023-10-24T01:30:57Z'
          }
        },
        want: `Requested reviewers:
@login4, @login5

Requested teams:
@my-org4/team-slug1, @my-org4/team-slug2

url: my-url4
Please review!!`
      }
    ];

    cases.forEach(x => {
      expect(toComment(x.in.owner, x.in.pr)).toBe(x.want);
    });
  });
});
