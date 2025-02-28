const fs = require('fs').promises;
const path = require('path');
const config = require('./config');

async function cleanLogFiles() {
    const logsDir = config.base.logsDir;
    const archiveDir = path.join(logsDir, 'archive');
    
    try {
        // Ensure archive directory exists
        await fs.mkdir(archiveDir, { recursive: true });
        
        // Clean archive directory
        const archiveFiles = await fs.readdir(archiveDir);
        const now = new Date();
        
        for (const file of archiveFiles) {
            if (!file.endsWith('.log')) continue;
            
            const filePath = path.join(archiveDir, file);
            const stats = await fs.stat(filePath);
            const fileAge = (now - stats.mtime) / (1000 * 60 * 60 * 24); // age in days
            
            // Delete files older than 90 days
            if (fileAge > 90) {
                await fs.unlink(filePath);
                console.log(`Deleted old archived log: ${file}`);
            }
        }
        
        // Clean empty compressed log files
        const currentFiles = await fs.readdir(logsDir);
        for (const file of currentFiles) {
            if (!file.endsWith('.gz')) continue;
            
            const filePath = path.join(logsDir, file);
            const stats = await fs.stat(filePath);
            
            if (stats.size === 0) {
                await fs.unlink(filePath);
                console.log(`Deleted empty compressed log: ${file}`);
            }
        }
        
        console.log('Log cleanup completed successfully');
    } catch (error) {
        console.error('Error during log cleanup:', error);
        process.exit(1);
    }
}

cleanLogFiles();
