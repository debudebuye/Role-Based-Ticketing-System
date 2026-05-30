/**
 * Jest globalSetup — runs once in the main Jest process before any test
 * workers spin up.  We use it only for things that need to happen once
 * (e.g. downloading the MongoDB binary via mongodb-memory-server).
 *
 * Per-worker env vars are set in setEnvVars.js (referenced via
 * jest.config.js → setupFiles) so every worker process inherits them.
 */
export default async function globalSetup() {
  // Trigger the mongodb-memory-server binary download here so it's cached
  // before the parallel test workers start.  Each worker creates its own
  // MongoMemoryServer instance; this just warms the binary cache.
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  const mongod = await MongoMemoryServer.create();
  await mongod.stop();
}
