import { db } from 'astro:db';
import { signupAndCreateSession } from '../src/db/repository/session';
import { email } from 'zod';
import { getSecret } from 'astro:env/server';
import { createGame, joinGameByNameAndSecret } from '../src/db/repository/game';

// https://astro.build/db/seed
export default async function seed() {
	await signupAndCreateSession(
		'juliusrajala@gmail.com',
		'pokemon123',
		getSecret('INVITATION_CODE')!
	)
	await signupAndCreateSession(
		'dungeon@master.com',
		'pokemon123',
		getSecret('INVITATION_CODE')!
	)


	// Create a test game
	await createGame(1, 'Seeded Test Game', 'supersecret12345!@#');

	// Create another test game
	await createGame(2, 'Dvergmal Campaign', 'supersecret12345!@#');

	// Join the game as a player
	await joinGameByNameAndSecret(1, 'Dvergmal Campaign', 'supersecret12345!@#', 'Thorin Oakenshield');

}
