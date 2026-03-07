const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

export async function sendTelegramMessage(chatId: number | string, text: string) {
    if (!process.env.TELEGRAM_BOT_TOKEN) return;

    // Telegram has a 4096 character limit per message
    const MAX_LENGTH = 4000;
    const truncated = text.length > MAX_LENGTH ? text.slice(0, MAX_LENGTH) + '...' : text;

    try {
        const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                text: truncated,
            })
        });
        if (!res.ok) {
            console.error('Failed to send telegram message', await res.text());
        }
    } catch (error) {
        console.error('Telegram API error:', error);
    }
}

export async function sendTypingAction(chatId: number | string) {
    if (!process.env.TELEGRAM_BOT_TOKEN) return;

    try {
        await fetch(`${TELEGRAM_API}/sendChatAction`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                action: "typing",
            })
        });
    } catch (error) {
        console.error('Telegram sendChatAction error:', error);
    }
}

export async function getTelegramFileUrl(fileId: string): Promise<string | null> {
    if (!process.env.TELEGRAM_BOT_TOKEN) return null;

    try {
        const res = await fetch(`${TELEGRAM_API}/getFile?file_id=${fileId}`);
        const data = await res.json();
        if (!data.ok) return null;

        const filePath = data.result.file_path;
        return `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${filePath}`;
    } catch (error) {
        console.error('Telegram getFile error:', error);
        return null;
    }
}

export async function setWebhook(url: string) {
    if (!process.env.TELEGRAM_BOT_TOKEN) return;
    const res = await fetch(`${TELEGRAM_API}/setWebhook?url=${url}`);
    return res.json();
}

export async function getWebhookInfo() {
    if (!process.env.TELEGRAM_BOT_TOKEN) return null;
    const res = await fetch(`${TELEGRAM_API}/getWebhookInfo`);
    return res.json();
}
