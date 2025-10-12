import { db } from 'astro:db';
import { getSecret } from 'astro:env/server';
import { email } from 'zod';

import { createGame, joinGameByNameAndSecret } from '../src/db/repository/game';
import { signupAndCreateSession } from '../src/db/repository/session';

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
	await joinGameByNameAndSecret(2, 'Seeded Test Game', 'supersecret12345!@#', 'Gandalf the Grey');

}
