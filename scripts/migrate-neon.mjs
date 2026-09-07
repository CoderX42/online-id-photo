import fs from 'node:fs/promises'
import { neon } from '@neondatabase/serverless'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('缺少 DATABASE_URL。请先在环境变量中设置 Neon Postgres 连接字符串。')
  process.exit(1)
}

const sql = neon(url)
const migration = await fs.readFile(new URL('../migrations/002_orders.sql', import.meta.url), 'utf8')
const statements = migration
  .split(';')
  .map((statement) => statement.replace(/^--.*$/gm, '').trim())
  .filter(Boolean)

for (const statement of statements) {
  await sql.query(statement)
}

console.log(`Neon 数据库迁移完成，共执行 ${statements.length} 条语句。`)
