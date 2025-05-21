import { fileURLToPath } from 'url';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataFile = join(__dirname, '../data/messageCounts.json');

const TARGET_ID = "1266013123782115368";
const MAX_MESSAGES = 100;

function getTodayDateStr() {
  return new Date().toISOString().slice(0, 10);
}

function messagesLeft(data) {
  if (!data[TARGET_ID]) return MAX_MESSAGES;
  return Math.max(MAX_MESSAGES - data[TARGET_ID].count, 0);
}

function msUntilMidnight() {
  const now = new Date();
  const tomorrow = new Date();

  tomorrow.setHours(24, 0, 0, 0);
  console.log(tomorrow.getTime() - now.getTime());
  return tomorrow.getTime() - now.getTime();
}

export const name = 'messageCreate';

export async function execute(message) {
  if (message.author.bot) return;
  if (!message.guild) return;

  let data = {};
  if (existsSync(dataFile)) {
    data = JSON.parse(readFileSync(dataFile, 'utf8'));
  }

  if (message.content === '.sybau') {
    const left = messagesLeft(data);
    message.channel.send(`hav has ${left} messages left for today lmao loser`);
    return;
  }

  if (!data[TARGET_ID]) {
    data[TARGET_ID] = {
      username: message.author.tag,
      count: 0,
      date: getTodayDateStr(),
      timeoutUntil: 0
    };
  }

  const userData = data[TARGET_ID];
  const now = Date.now();
  const todayStr = getTodayDateStr();

  if (userData.date !== todayStr) {
    userData.count = 0;
    userData.date = todayStr;
    userData.timeoutUntil = 0;
  }

  if (userData.timeoutUntil && now < userData.timeoutUntil) {
    return;
  }

  if (message.author.id === TARGET_ID) {
    userData.count++;

    writeFileSync(dataFile, JSON.stringify(data, null, 2));

    console.log(`that whore has now sent ${userData.count} messages today.`);

    if (userData.count % 20 === 0 && userData.count < MAX_MESSAGES) {
      message.channel.send(
        `havrah has sent ${userData.count} messages today. You have ${MAX_MESSAGES - userData.count} messages left before timeout.`
      );
    }

    if (userData.count >= MAX_MESSAGES) {
      try {
        const member = message.member;
        const timeoutMs = msUntilMidnight();

        await member.timeout(timeoutMs, 'Daily message limit exceeded');

        userData.timeoutUntil = now + timeoutMs;

        writeFileSync(dataFile, JSON.stringify(data, null, 2));

        message.channel.send(
          `that dingus hav has been timed out until tomorrow for exceeding the daily message limit.`
        );
      } catch (error) {
        console.error('Failed to timeout user:', error);
        message.channel.send(
          `I don't have permission to timeout ${message.author}.`
        );
      }
    }
  }
}
