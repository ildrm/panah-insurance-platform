import { createSimulatorServer } from './server.js';
async function main(): Promise<void> {
  const port = Number(process.env['SIMULATOR_PORT'] ?? '3100');
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid simulator port');
  const host = process.env['SIMULATOR_HOST'] ?? '127.0.0.1';
  if (host !== '127.0.0.1' && !(host === '0.0.0.0' && process.env['APP_MODE'] === 'sandbox' && process.env['ST_SANDBOX_CONTAINER'] === 'true')) throw new Error('Nonloopback simulator binding requires the explicit sandbox container profile');
  const simulator = await createSimulatorServer({ callbackUrl: process.env['SIMULATOR_CALLBACK_URL'] ?? 'http://127.0.0.1:3001/callbacks/sim-signed', signingSecret: process.env['SIM_SIGNING_SECRET'] ?? process.env['SIMULATOR_SIGNING_SECRET'] }, port, host);
  console.info(JSON.stringify({ event: 'simulator.started', url: simulator.url, mode: 'fictional-sandbox' }));
  for (const signal of ['SIGTERM', 'SIGINT'] as const) process.once(signal, () => { void simulator.close().then(() => process.exit(0)); });
}
void main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : 'Simulator startup failed'); process.exitCode = 1; });
