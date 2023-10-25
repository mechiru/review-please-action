/**
 * Unit tests for src/main.ts
 */

import { PrReviewer } from '../src/github';
import { checkPrState, parsePeriod, toComment } from '../src/main';
import { expect } from '@jest/globals';

describe('main.ts', () => {
  it('parsePeriod', () => {
    const cases: {
      in: string;
      want: number;
      error: boolean;
    }[] = [
      {
        in: '6d',
        want: 6,
        error: false
      },
      {
        in: '1d',
        want: 1,
        error: false
      },
      {
        in: '1',
        want: 0,
        error: true
      }
    ];

    for (const x of cases) {
      if (x.error) {
        expect(() => parsePeriod(x.in)).toThrow();
      } else {
        expect(parsePeriod(x.in)).toEqual(x.want);
      }
    }
  });

  it('checkPrState', () => {
    const cases: {
      name: string;
      in: {
        pr: PrReviewer;
        now: Date;
        deadline: number;
      };
      want: boolean;
    }[] = [
      {
        name: 'ok',
        in: {
          pr: {
            url: 'my-url',
            no: 0,
            draft: false,
            reviewerLogins: ['test'],
            reviewerTeamSlugs: [],
            createdAt: '2023-10-10T01:30:57Z'
          },
          now: new Date('2023-10-25T01:30:57Z'),
          deadline: 6
        },
        want: true
      },
      {
        name: 'ok',
        in: {
          pr: {
            url: 'my-url',
            no: 0,
            draft: false,
            reviewerLogins: [],
            reviewerTeamSlugs: ['test'],
            createdAt: '2023-10-10T01:30:57Z'
          },
          now: new Date('2023-10-25T01:30:57Z'),
          deadline: 6
        },
        want: true
      },
      {
        name: 'empty reviewers',
        in: {
          pr: {
            url: 'my-url',
            no: 0,
            draft: false,
            reviewerLogins: [],
            reviewerTeamSlugs: [],
            createdAt: '2023-10-10T01:30:57Z'
          },
          now: new Date('2023-10-25T01:30:57Z'),
          deadline: 6
        },
        want: false
      },
      {
        name: 'draft',
        in: {
          pr: {
            url: 'my-url',
            no: 0,
            draft: true,
            reviewerLogins: ['test'],
            reviewerTeamSlugs: [],
            createdAt: '2023-10-10T01:30:57Z'
          },
          now: new Date('2023-10-25T01:30:57Z'),
          deadline: 6
        },
        want: false
      },
      {
        name: 'deadline',
        in: {
          pr: {
            url: 'my-url',
            no: 0,
            draft: false,
            reviewerLogins: ['test'],
            reviewerTeamSlugs: [],
            createdAt: '2023-10-24T01:30:57Z'
          },
          now: new Date('2023-10-25T01:30:57Z'),
          deadline: 6
        },
        want: false
      }
    ];

    for (const x of cases) {
      expect(checkPrState(x.in.pr, { ...x.in })).toBe(x.want);
    }
  });

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

    for (const x of cases) {
      expect(toComment(x.in.owner, x.in.pr)).toBe(x.want);
    }
  });
});
