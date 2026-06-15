/**
 * Sends a notification message to the configured Telegram Admin chat/channel
 * using the Telegram Bot API.
 */
export async function sendTelegramNotification(message: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!token || !chatId) {
    console.warn("[TELEGRAM] Bot token or admin chat ID is missing. Notification skipped.");
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[TELEGRAM] Failed to send message:", errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[TELEGRAM] Error sending notification:", error);
    return false;
  }
}
