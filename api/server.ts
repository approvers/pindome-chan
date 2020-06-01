import dotenv from 'dotenv';
import { Client, WebhookClient, MessageReaction } from 'discord.js';

dotenv.config();

const hook = new WebhookClient(
  process.env.DISCORD_WEBHOOK_ID || '',
  process.env.DISCORD_WEBHOOK_TOKEN || '',
);

const client = new Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });

client.on('ready', () => {
  console.log('ピン留めちゃん、準備完了ですっ！');
});

client.on('messageReactionAdd', async (reaction: MessageReaction) => {
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (error) {
      console.log('メッセージが読めなかった……: ', error);
      return;
    }
  }

  // pushpin
  if (reaction.emoji.identifier === '%F0%9F%93%8C') {
    const guild = reaction.message.guild;
    const author = guild && guild.member(reaction.message.author);
    const displayName = author && author.displayName;

    hook.send(`${reaction.message.content}\nby ${displayName || reaction.message.author.username}`);
  }
});

client.login(process.env.DISCORD_TOKEN);
