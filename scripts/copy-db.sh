#!/bin/bash

# Configuration
SOURCE_DB_URL="postgresql://postgres.yjavfwugdkpghszspnrw:gadJur-tydvoj-8wymza@aws-1-us-east-1.pooler.supabase.com:5432/postgres"
TARGET_DB_URL="postgresql://postgres.mfzeljdiepffgdqioiqp:geqrom-gubgy8-zIkdog@aws-1-us-east-2.pooler.supabase.com:5432/postgres"

echo "Starting database migration..."
echo "Source: db.yjavfwugdkpghszspnrw.supabase.co"
echo "Target: db.mfzeljdiepffgdqioiqp.supabase.co"
echo "------------------------------------------------"

# Step 1: Dump the source database schema and data
echo "1/2 Dumping source database..."
# We use --clean to drop target objects before recreating them, and --if-exists to avoid errors on drop
pg_dump --clean --if-exists --quote-all-identifiers -x -O "$SOURCE_DB_URL" > dump.sql

if [ $? -ne 0 ]; then
    echo "Error: pg_dump failed. Make sure you have PostgreSQL client tools installed locally."
    exit 1
fi

echo "Dump successful. File size: $(wc -c < dump.sql) bytes."

# Step 2: Restore to the target database
echo "2/2 Restoring to target database..."
psql "$TARGET_DB_URL" -f dump.sql

if [ $? -ne 0 ]; then
    echo "Error: psql restore failed."
    exit 1
fi

# Step 3: Cleanup
echo "Cleaning up..."
rm dump.sql

echo "Database copy completed successfully!"
