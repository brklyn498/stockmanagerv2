import { existsSync, unlinkSync } from 'fs'
import { join } from 'path'

/**
 * Get the database path from environment variable
 */
const getDatabasePath = (): string | null => {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
        return null
    }

    // Extract file path from DATABASE_URL (format: file:./path/to/db.sqlite)
    const match = databaseUrl.match(/file:(.+)/)
    if (!match) {
        return null
    }

    return match[1]
}

/**
 * Removes SQLite journal file if it exists
 * This prevents database locks from persisted journal files
 */
export const cleanupJournalFile = (dbPath: string): boolean => {
    const journalPath = `${dbPath}-journal`

    try {
        if (existsSync(journalPath)) {
            console.log(`⚠️  Found SQLite journal file: ${journalPath}`)
            console.log('🧹 Cleaning up journal file to prevent database locks...')
            unlinkSync(journalPath)
            console.log('✅ Journal file removed successfully')
            return true
        }
        return false
    } catch (error) {
        console.error('❌ Failed to remove journal file:', error)
        return false
    }
}

/**
 * Prepare database for connection by cleaning up any lock files
 */
export const prepareDatabase = (): void => {
    console.log('🔧 Preparing database...')

    const dbPath = getDatabasePath()
    if (!dbPath) {
        console.warn('⚠️  Could not determine database path, skipping cleanup')
        return
    }

    console.log(`📁 Database path: ${dbPath}`)

    // Clean up journal file if it exists
    const journalCleaned = cleanupJournalFile(dbPath)

    if (journalCleaned) {
        console.log('💡 Journal file was present - this may have been causing connection issues')
    }

    console.log('✅ Database preparation complete')
}
