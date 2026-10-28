import 'reflect-metadata';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Database } from '@st/database';
import { CarrierGateway, createCarrierRegistry, IssuanceWorker, StudioService } from '@st/integrations';

@Module({ providers: [
  { provide: Database, useFactory: (): Database => new Database(undefined,{max:10}) },
  { provide: CarrierGateway, useFactory: (): CarrierGateway => createCarrierRegistry({ baseUrl: process.env['CARRIER_BASE_URL'] ?? process.env['SIMULATOR_URL'] ?? 'http://127.0.0.1:3100', mode: 'sandbox', signingSecret: process.env['SIM_SIGNING_SECRET'] ?? process.env['SIMULATOR_SIGNING_SECRET'] }) },
  { provide: StudioService, useFactory: (db: Database): StudioService => new StudioService(db, { signingSecret: process.env['SIM_SIGNING_SECRET'] ?? process.env['SIMULATOR_SIGNING_SECRET'] }), inject: [Database] },
  { provide: IssuanceWorker, useFactory: (db: Database, gateway: CarrierGateway, studio: StudioService): IssuanceWorker => new IssuanceWorker(db, gateway, { studio }), inject: [Database, CarrierGateway, StudioService] }
] })
class WorkerModule {}
async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(WorkerModule, { logger: false });
  const db = app.get(Database); const worker = app.get(IssuanceWorker); let running = true;
  for (const signal of ['SIGTERM', 'SIGINT'] as const) process.once(signal, () => { running = false; });
  console.info(JSON.stringify({ event: 'worker.started', mode: 'local-sandbox' }));
  try {
    while (running) {
      try { if (!(await worker.runOnce())) await new Promise(resolve => setTimeout(resolve, 250)); }
      catch { console.error(JSON.stringify({ event: 'worker.iteration.failed', code: 'database_or_worker_failure' })); await new Promise(resolve => setTimeout(resolve, 1_000)); }
    }
  } finally { await db.close(); await app.close(); }
}
void main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : 'Worker startup failed'); process.exitCode = 1; });
