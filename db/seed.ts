import { db } from 'astro:db';
import { getSecret } from 'astro:env/server';
import { email } from 'zod';

import { createGame, joinGameByNameAndSecret } from '../src/db/repository/game';
import { signupAndCreateSession } from '../src/db/repository/session';
import seed_data from './seed_data.json';
import { findPlayerByEmail, getAllPlayers } from '../src/db/repository/player';

type SeedData = typeof seed_data;
const users = (seed_data as SeedData).users;
const games = (seed_data as SeedData).games;

const characterNames = [
	'Gandalf the Grey',
	'Frodo Baggins',
	'Aragorn son of Arathorn',
	'Legolas Greenleaf',
	'Gimli son of Gloin',
	'Saruman the White',
	'Boromir of Gondor',
];

// https://astro.build/db/seed
export default async function seed() {
	const invitationCode = getSecret('INVITATION_CODE');

	if (!invitationCode) {
		throw new Error('INVITATION_CODE environment variable is not set. Set up your .env file.');
	}

	if (!seed_data || users.length === 0) {
		throw new Error('No seed data found. Please create a seed_data.json file based on seed_data.example.json');
	}

	for await (const user of users) {
		await signupAndCreateSession(user.email, user.password, invitationCode);
	}

	for await (const game of games) {
		const { id: ownerId } = await findPlayerByEmail(game.ownerEmail);

		if (!ownerId) {
			console.warn(`Owner with email ${game.ownerEmail} not found, skipping game ${game.name}`);
			continue;
		}
		await createGame(ownerId, game.name, game.secret);
		if (game.joinAll) {
			const players = await getAllPlayers();
			for await (const [index, player] of players.entries()) {
				if (player.id === ownerId) continue; // Owner already in the game

				const characterName = characterNames[index] || `Adventurer ${index + 1}`;
				await joinGameByNameAndSecret(player.id, game.name, game.secret, characterName);
			}
		}
	}
}
