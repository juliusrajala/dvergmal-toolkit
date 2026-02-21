import { column, defineDb, defineTable } from 'astro:db';

export const Game = defineTable({
  columns: {
    id: column.number({ primaryKey: true, unique: true }),
    ownerId: column.number({ references: () => Player.columns.id }),
    name: column.text(),
    createdAt: column.date(),
    secret: column.text(),
  }
})

export const Player = defineTable({
  columns: {
    id: column.number({ primaryKey: true, unique: true }),
    email: column.text({ unique: true }),
  }
})

const PlayerInGame = defineTable({
  columns: {
    playerId: column.number({ references: () => Player.columns.id }),
    gameId: column.number({ references: () => Game.columns.id }),
    characterName: column.text({ optional: false }),
    joinedAt: column.date(),
  },
  indexes: {
    playerGame: { on: ['playerId', 'gameId'], unique: true }
  }
})

const PlayerDieRoll = defineTable({
  columns: {
    id: column.number({ primaryKey: true, unique: true }),
    gameId: column.number({ references: () => Game.columns.id }),
    playerId: column.number({ references: () => Player.columns.id }),
    rollTotal: column.number(),
    context: column.text({ optional: true }),
    promptId: column.number({ references: () => RollPrompt.columns.id, optional: true }),
    createdAt: column.date(),
    dies: column.json({
      optional: false
    }), // Array of dies, e.g. [{ die: 6, value: 4 }, { die: 20, value: 15 }]
  }
})

const RollPrompt = defineTable({
  columns: {
    id: column.number({ primaryKey: true, unique: true }),
    gameId: column.number({ references: () => Game.columns.id }),
    prompt: column.text(),
    createdAt: column.date(),
    playerIds: column.json({ optional: false, }), // Array of player IDs who were prompted
  }
})

const Password = defineTable({
  columns: {
    id: column.number({ primaryKey: true, unique: true }),
    hash: column.text(),
    playerId: column.number({ references: () => Player.columns.id }),
  }
})

export const Session = defineTable({
  columns: {
    id: column.text({ primaryKey: true }), // Random session token
    playerId: column.number({ references: () => Player.columns.id }),
    expiresAt: column.date(),
    createdAt: column.date(),
  }
})

export const Note = defineTable({
  columns: {
    id: column.number({ primaryKey: true, unique: true }),
    playerId: column.number({ references: () => Player.columns.id }),
    createdAt: column.date(),
    note: column.text(),
    title: column.text({ optional: true }),
    imgSrc: column.text({ optional: true }),
    gameId: column.number({ references: () => Game.columns.id, optional: true })
  }
})

export const ShareNoteEvent = defineTable({
  columns: {
    id: column.number({ primaryKey: true, unique: true }),
    /**
     * TODO:
     * The following columns should be configured as references. However, this ran into a problem with foreign key constraints during deletion. See how to properly handle this.
     * 
     * noteId: column.number({ references: () => Note.columns.id }),                          
     * gameId: column.number({ references: () => Game.columns.id }),
     * playerId: column.number({ references: () => Player.columns.id, optional: true }),
     */
    noteId: column.number(),
    gameId: column.number(),
    playerId: column.number({ optional: true }),
    sharedAt: column.date()
  }
})

// https://astro.build/db/config
export default defineDb({
  tables: {
    Game,
    Note,
    Password,
    Player,
    PlayerDieRoll,
    PlayerInGame,
    RollPrompt,
    Session,
    ShareNoteEvent
  }
})