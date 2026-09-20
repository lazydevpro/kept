declare namespace Cloudflare {
  interface Env {
    BETTER_AUTH_SECRET: string;
    TEST_MIGRATIONS: import("cloudflare:test").D1Migration[];
  }
}
