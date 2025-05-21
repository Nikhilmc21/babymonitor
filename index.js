import { Client, GatewayIntentBits } from 'discord.js';
import loadEvents from './handlers/eventHandler.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

loadEvents(client);

client.login(process.env.DISCORD_TOKEN);
