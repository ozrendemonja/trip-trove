// Copyright (C) Microsoft Corporation. All rights reserved.

import { toMatchImageSnapshot } from "jest-image-snapshot";

// Adding image snapshot functionaility to expect
expect.extend({ toMatchImageSnapshot });

// Increase the timeout for tests
jest.setTimeout(60000);
