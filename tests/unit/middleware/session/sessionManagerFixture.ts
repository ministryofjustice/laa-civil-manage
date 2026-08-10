export const MS_IN_A_MINUTE = 1000 * 60;
export const MS_IN_TWELVE_HOURS = 1000 * 60 * 60 * 12;

export const getSessionConfigTestCases = [
  {
    testName:
      "should return an in-memory session store when no redis_url is present",
    envConfig: {
      secret: "test-secret-1",
      name: "session-name-1",
      resave: true,
      saveUninitialized: true,
      maxAge: MS_IN_A_MINUTE,
      secure: false,
      httpOnly: true,
    },
    expected: {
      secret: "test-secret-1",
      name: "session-name-1",
      resave: true,
      saveUninitialized: true,
      rolling: true,
      cookie: {
        secure: false,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: MS_IN_A_MINUTE,
      },
    },
  },
  {
    testName:
      "should configure the session according to the environment config passed in to an in-memory store",
    envConfig: {
      secret: "test-secret-2",
      name: "session-name-2",
      resave: false,
      saveUninitialized: false,
      maxAge: MS_IN_TWELVE_HOURS,
      redis_url: "",
      secure: false,
      httpOnly: true,
    },
    expected: {
      secret: "test-secret-2",
      name: "session-name-2",
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        secure: false,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: MS_IN_TWELVE_HOURS,
      },
    },
  },
  {
    testName:
      "should return a redis backed session store when the redis_url is present",
    envConfig: {
      secret: "test-secret-3",
      name: "session-name-3",
      resave: false,
      saveUninitialized: false,
      maxAge: MS_IN_TWELVE_HOURS,
      redis_url: "redis://redis:6379",
      secure: false,
      httpOnly: true,
    },
    expected: {
      store: {},
      secret: "test-secret-3",
      name: "session-name-3",
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        secure: false,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: MS_IN_TWELVE_HOURS,
      },
    },
  },
  {
    testName:
      "should return redis backed session store when the redis_url is present and configured according to the environment config passed in",
    envConfig: {
      secret: "test-secret-4",
      name: "session-name-4",
      resave: true,
      saveUninitialized: true,
      maxAge: MS_IN_A_MINUTE,
      redis_url: "redis://redis:6379",
      secure: false,
      httpOnly: true,
    },
    expected: {
      store: {},
      secret: "test-secret-4",
      name: "session-name-4",
      resave: true,
      saveUninitialized: true,
      rolling: true,
      cookie: {
        secure: false,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: MS_IN_A_MINUTE,
      },
    },
  },
  {
    testName:
      "should set secure: true on the cookie when the environment config marks the session as secure (production)",
    envConfig: {
      secret: "test-secret-5",
      name: "my-app-session",
      resave: false,
      saveUninitialized: false,
      maxAge: MS_IN_TWELVE_HOURS,
      secure: true,
      httpOnly: true,
    },
    expected: {
      secret: "test-secret-5",
      name: "my-app-session",
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        secure: true,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: MS_IN_TWELVE_HOURS,
      },
    },
  },
];
