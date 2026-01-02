import { initAuth0 } from '@auth0/nextjs-auth0';

const auth0 = initAuth0();

export const GET = auth0.handleAuth();
