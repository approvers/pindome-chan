import dotenv from 'dotenv';
import { Client, WebhookClient, MessageReaction, ReactionEmoji } from 'discord.js';

dotenv.config();

const hook = new WebhookClient(
  process.env.DISCORD_WEBHOOK_ID || '',
  process.env.DISCORD_WEBHOOK_TOKEN || '',
);
const client = new Client();

client.on('ready', () => {
  console.log('I got ready.');
});

client.on('messageReactionAdd', (reaction: MessageReaction) => {
  if (reaction.emoji instanceof ReactionEmoji && reaction.emoji.identifier === 'pushpin') {
    hook.send(reaction.message.content);
  }
});

client.login(process.env.DISCORD_TOKEN);
