/**
 * Minimal server for diagnostic purposes
 */
import Fastify, { FastifyInstance } from 'fastify';
import supertest from 'supertest';

export async function createMinimalServer() {
  const server = Fastify();
  
  // Add a basic health endpoint
  server.get('/health', async () => {
    return { status: 'ok' };
  });
  
  await server.ready();
  
  return {
    server,
    request: supertest(server.server)
  };
} 