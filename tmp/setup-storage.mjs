import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .env.local 읽기
const envPath = join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY not found');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setup() {
    console.log('Checking for "characters" bucket...');
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
        console.error('Error listing buckets:', error);
        return;
    }

    const exists = buckets.find(b => b.name === 'characters');
    if (!exists) {
        console.log('Creating "characters" bucket...');
        const { error: createError } = await supabase.storage.createBucket('characters', {
            public: true,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
            fileSizeLimit: 10485760 // 10MB
        });

        if (createError) {
            console.error('Error creating bucket:', createError);
        } else {
            console.log('Bucket "characters" created successfully!');
        }
    } else {
        console.log('Bucket "characters" already exists.');
    }
}

setup();
