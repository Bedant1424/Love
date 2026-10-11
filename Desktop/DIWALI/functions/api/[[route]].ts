import { handleApiRequest } from '../../src/server/api';

export async function onRequest(context: {
  request: Request;
  env: any;
  params: any;
}): Promise<Response> {
  return handleApiRequest(context.request, context.env);
}
