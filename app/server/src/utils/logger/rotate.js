const fs = require('fs').promises;
const path = require('path');
const config = require('./config');

async function rotateLogFiles() {
    const logsDir = config.base.logsDir;
    
    try {
        const files = await fs.readdir(logsDir);
        const now = new Date();
        
        for (const file of files) {
            if (!file.endsWith('.log')) continue;
            
            const filePath = path.join(logsDir, file);
            const stats = await fs.stat(filePath);
            const fileAge = (now - stats.mtime) / (1000 * 60 * 60 * 24); // age in days
            
            // Determine retention period based on log type
            let retentionDays = parseInt(config.retention.combined.replace('d', ''));
            if (file.includes('emergency')) {
                retentionDays = parseInt(config.retention.emergency.replace('d', ''));
            } else if (file.includes('error')) {
                retentionDays = parseInt(config.retention.error.replace('d', ''));
            } else if (file.includes('performance')) {
                retentionDays = parseInt(config.retention.performance.replace('d', ''));
            }
            
            if (fileAge > retentionDays) {
                const archivePath = path.join(logsDir, 'archive', file);
                await fs.mkdir(path.join(logsDir, 'archive'), { recursive: true });
                await fs.rename(filePath, archivePath);
                console.log(`Rotated ${file} to archive`);
            }
        }
        
        console.log('Log rotation completed successfully');
    } catch (error) {
        console.error('Error during log rotation:', error);
        process.exit(1);
    }
}

rotateLogFiles();
