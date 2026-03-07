import { supabaseAdmin } from '@/lib/supabase-admin';
import { awardXp, XP_VALUES } from '@/lib/gamification';

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface VerificationResult {
    success: boolean;
    verified: boolean;
    coach_message: string;
    image_url: string;
    xp_updates: any;
    error?: string;
}

export async function processVerification(
    taskId: string,
    buffer: Buffer,
    checkinType: 'start' | 'periodic' | 'end' | 'goal_finish'
): Promise<VerificationResult> {
    try {
        // 1. Fetch task details
        const { data: task, error: taskError } = await supabaseAdmin
            .from('tasks')
            .select('*')
            .eq('id', taskId)
            .single();

        if (taskError || !task) throw new Error('Task not found');

        // 2. Upload image to Supabase Storage
        const fileName = `${taskId}/${Date.now()}-${checkinType}.jpg`;
        const { error: uploadError } = await supabaseAdmin.storage
            .from('verifications')
            .upload(fileName, buffer, {
                contentType: 'image/jpeg',
                upsert: false,
            });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabaseAdmin.storage
            .from('verifications')
            .getPublicUrl(fileName);
        const imageUrl = publicUrlData.publicUrl;

        // 3. Call Gemini 3 Flash
        let promptContext = '';
        if (checkinType === 'start') {
            promptContext = "The user is attempting to START this task. Verify they are set up and ready to begin based on the photo.";
        } else if (checkinType === 'periodic') {
            promptContext = "This is a PERIODIC CHECK-IN. Verify the user is making active progress on the task.";
        } else {
            promptContext = "The user claims they have FINISHED this task. Verify completion.";
        }

        const verificationPrompt = `
You are a strict, no-BS accountability verification AI coach.
The user is working on this task: "${task.title}" - ${task.description || 'No description'}
Verification method they agreed to: "${task.verification_prompt}"
Current phase: ${promptContext}

Analyze the provided photo. Determine:
1. Does the photo prove what is required for this phase?
2. Briefly explain your reasoning to the user (in your tough coach persona, 1-2 sentences).

Respond strictly in JSON format:
{
  "verified": true/false,
  "confidence": 0-100,
  "coach_message": "string"
}`;

        const base64Data = buffer.toString('base64');
        const openRouterRes = await fetch(OPENROUTER_BASE_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "google/gemini-3-flash-preview",
                response_format: { type: "json_object" },
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: verificationPrompt },
                            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Data}` } }
                        ]
                    }
                ],
                temperature: 0.2,
            })
        });

        const aiData = await openRouterRes.json();
        let result;
        try {
            result = JSON.parse(aiData.choices[0].message.content);
        } catch (e) {
            console.error("Failed to parse Gemini JSON:", aiData.choices[0].message.content);
            result = { verified: false, confidence: 0, coach_message: "Failed to parse image. Try again." };
        }

        // 4. Handle State Machine & Gamification
        const updateData: any = {};
        let xpAwardResponse = null;

        const checkins = Array.isArray(task.checkins) ? [...task.checkins] : [];
        checkins.push({
            type: checkinType,
            timestamp: new Date().toISOString(),
            verified: result.verified,
            image_url: imageUrl,
            coach_message: result.coach_message
        });
        updateData.checkins = checkins;
        updateData.verification_image_url = imageUrl;

        if (result.verified) {
            const now = new Date();

            if (checkinType === 'start') {
                updateData.status = 'in_progress';
                updateData.started_at = now.toISOString();
                if (task.checkin_interval_minutes) {
                    updateData.next_checkin_at = new Date(now.getTime() + task.checkin_interval_minutes * 60000).toISOString();
                } else if (task.task_type === 'timed' && task.duration_minutes) {
                    updateData.next_checkin_at = new Date(now.getTime() + task.duration_minutes * 60000).toISOString();
                }
            }
            else if (checkinType === 'periodic') {
                xpAwardResponse = await awardXp(XP_VALUES.checkin_bonus_perfect, 'checkin_bonus_perfect');
                if (task.checkin_interval_minutes) {
                    updateData.next_checkin_at = new Date(now.getTime() + task.checkin_interval_minutes * 60000).toISOString();
                }
            }
            else if (checkinType === 'end' || checkinType === 'goal_finish') {
                updateData.status = 'verified';
                updateData.completed_at = now.toISOString();
                updateData.verified_at = now.toISOString();
                updateData.next_checkin_at = null;

                await awardXp(task.xp_reward, 'task_completed');
                xpAwardResponse = await awardXp(XP_VALUES.task_verified_photo, 'task_verified_photo');
            }
        }

        await supabaseAdmin
            .from('tasks')
            .update(updateData)
            .eq('id', taskId);

        await supabaseAdmin.from('messages').insert({
            role: 'assistant',
            content: `[VERIFICATION - ${checkinType.toUpperCase()}] ${result.coach_message}`,
            source: 'system'
        });

        return {
            success: true,
            verified: result.verified,
            coach_message: result.coach_message,
            image_url: imageUrl,
            xp_updates: xpAwardResponse
        };
    } catch (err: any) {
        console.error('Process Verification error:', err);
        return { success: false, verified: false, coach_message: '', image_url: '', xp_updates: null, error: err.message };
    }
}
