import { telegramChannel } from 'eve/channels/telegram';

export default telegramChannel({
  credentials: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
  },
  route: '/eve/v1/channels/telegram',
});
