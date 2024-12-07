import { toMatchImageSnapshot } from 'jest-image-snapshot';

jest.setTimeout(120000);
expect.extend({ toMatchImageSnapshot });