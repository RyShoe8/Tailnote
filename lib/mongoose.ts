import mongoose from 'mongoose';

const DB_NAME = process.env.MONGODB_DB_NAME || 'emailsignature';
type GlobalMongoose = typeof globalThis & {
  mongooseConn?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
};

const g = globalThis as GlobalMongoose;

if (!g.mongooseConn) {
  g.mongooseConn = { conn: null, promise: null };
}

export async function connectMongoose(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }
  if (g.mongooseConn!.conn) return g.mongooseConn!.conn;
  if (!g.mongooseConn!.promise) {
    g.mongooseConn!.promise = mongoose.connect(uri, {
      dbName: DB_NAME,
    });
  }
  g.mongooseConn!.conn = await g.mongooseConn!.promise;

  const { runProductionEnvChecks } = await import('@/lib/env/productionChecks');
  runProductionEnvChecks();

  const { ensureStartupMigrations } = await import('@/lib/migrations/startup');
  await ensureStartupMigrations();

  return g.mongooseConn!.conn;
}

export function getMongoDb() {
  return mongoose.connection.getClient().db(mongoose.connection.db!.databaseName);
}

export function getMongoClient() {
  return mongoose.connection.getClient();
}
