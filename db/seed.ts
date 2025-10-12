import { db } from 'astro:db';
import { signupAndCreateSession } from '../src/db/repository/session';
import { email } from 'zod';
import { getSecret } from 'astro:env/server';
import { createGame } from '../src/db/repository/game';

// https://astro.build/db/seed
export default async function seed() {
	await signupAndCreateSession(
		'juliusrajala@gmail.com',
		'pokemon123',
		getSecret('INVITATION_CODE')!
	),
		await createGame(1, 'Seeded Test Game', 'supersecret12345!@#');
}
