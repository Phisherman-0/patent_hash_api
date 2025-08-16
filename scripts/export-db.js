const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const exportDir = path.join(__dirname, '../exports');
const schemaFile = path.join(exportDir, `schema-${timestamp}.sql`);
const dataFile = path.join(exportDir, `data-${timestamp}.sql`);

// Create exports directory if it doesn't exist
if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir, { recursive: true });
}

const dbConfig = {
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || '5432',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '123456',
  database: process.env.PGDATABASE || 'patent_hash'
};

console.log('🗄️  Starting database export...');

// Export schema only
const schemaCommand = `pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} --schema-only --no-owner --no-privileges -f "${schemaFile}"`;

// Export data only
const dataCommand = `pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} --data-only --no-owner --no-privileges -f "${dataFile}"`;

// Set PGPASSWORD environment variable for pg_dump
process.env.PGPASSWORD = dbConfig.password;

// Export schema
exec(schemaCommand, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error exporting schema:', error);
    return;
  }
  if (stderr) {
    console.warn('⚠️  Schema export warnings:', stderr);
  }
  console.log('✅ Schema exported to:', schemaFile);

  // Export data
  exec(dataCommand, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Error exporting data:', error);
      return;
    }
    if (stderr) {
      console.warn('⚠️  Data export warnings:', stderr);
    }
    console.log('✅ Data exported to:', dataFile);
    
    // Create combined export
    const combinedFile = path.join(exportDir, `full-backup-${timestamp}.sql`);
    const schemaContent = fs.readFileSync(schemaFile, 'utf8');
    const dataContent = fs.readFileSync(dataFile, 'utf8');
    
    const combinedContent = `-- Patent Hash Database Export
-- Generated: ${new Date().toISOString()}
-- Schema and Data Combined

-- SCHEMA
${schemaContent}

-- DATA
${dataContent}
`;
    
    fs.writeFileSync(combinedFile, combinedContent);
    console.log('✅ Combined backup created:', combinedFile);
    console.log('🎉 Database export completed successfully!');
  });
});
