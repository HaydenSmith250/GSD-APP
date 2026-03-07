import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    try {
        const personality = fs.readFileSync('/Users/haydensmith/Documents/AntiGravity Coach App/dan-coach-personality.md', 'utf8');

        // Get the first (and only) user
        const { data: users, error: userErr } = await supabase.from('user_config').select('id').limit(1);

        if (userErr || !users || users.length === 0) {
            // If no user exists yet, insert a default one
            const { error: insertErr } = await supabase.from('user_config').insert({
                password_hash: 'not_needed_for_seed',
                coach_system_prompt: personality
            });
            console.log(insertErr ? 'Insert error: ' + insertErr.message : 'Successfully inserted config with Dan personality.');
        } else {
            // Update existing user
            const { error: updateErr } = await supabase.from('user_config')
                .update({ coach_system_prompt: personality })
                .eq('id', users[0].id);
            console.log(updateErr ? 'Update error: ' + updateErr.message : 'Successfully updated existing config with Dan personality.');
        }
    } catch (e) {
        console.error(e);
    }
}

run();
