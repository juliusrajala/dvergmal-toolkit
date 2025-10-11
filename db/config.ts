import { column, defineDb, defineTable } from 'astro:db';

export const Game = defineTable({
  columns: {
    id: column.number({ primaryKey: true, unique: true }),
    ownerId: column.number({ references: () => Player.columns.id }),
    name: column.text(),
    createdAt: column.date({ default: new Date() }),
  }
})

export const Player = defineTable({
  columns: {
    id: column.number({ primaryKey: true, unique: true }),
    email: column.text({ unique: true }),
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

// https://astro.build/db/config
export default defineDb({
  tables: { Game, Player, Password, Session }
})