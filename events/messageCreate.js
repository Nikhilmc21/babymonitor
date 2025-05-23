import { fileURLToPath } from 'url';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataFile = join(__dirname, '../data/messageCounts.json');

const TARGET_IDS = [
  "1266013123782115368",
  "1060049330733600868",
  "957890900107862036",
];

const MAX_MESSAGES = 50;

function getTodayDateStr() {
  return new Date().toISOString().slice(0, 10);
}

function messagesLeft(userData) {
  return Math.max(MAX_MESSAGES - userData.count, 0);
}

function msUntilMidnight() {
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setHours(24, 0, 0, 0);
  return tomorrow.getTime() - now.getTime();
}

export const name = 'messageCreate';

export async function execute(message) {
  if (message.author.bot || !message.guild) return;

  let data = {};
  if (existsSync(dataFile)) {
    data = JSON.parse(readFileSync(dataFile, 'utf8'));
  }

  const userId = message.author.id;

if (message.content === '.sybau') {
  const responses = [];

  for (const id of TARGET_IDS) {
    let username = `<@${id}>`;
    let userData = data[id];

    try {
      const member = await message.guild.members.fetch(id);
      username = member.user.username;
    } catch (err) {
      console.warn(`Could not fetch member for ID ${id}`);
    }

    if (!userData) {
      userData = {
        username,
        count: 0,
        date: getTodayDateStr(),
        timeoutUntil: 0
      };
      data[id] = userData;
    }

    const left = messagesLeft(userData);
    responses.push(`${username} has ${left} messages left today, what a fucking bitch`);
  }

  message.channel.send(responses.join('\n'));
  return;
}


  if (!TARGET_IDS.includes(userId)) return;

  if (!data[userId]) {
    data[userId] = {
      username: message.author.username,
      count: 0,
      date: getTodayDateStr(),
      timeoutUntil: 0
    };
  }

  const userData = data[userId];
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

  userData.count++;
  writeFileSync(dataFile, JSON.stringify(data, null, 2));

  console.log(`${message.author.tag} has now sent ${userData.count} messages today.`);

  if (userData.count % 20 === 0 && userData.count < MAX_MESSAGES) {
    message.channel.send(
      `${message.author.username} has sent ${userData.count} messages today they got ${MAX_MESSAGES - userData.count} left donkey`
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
        `the fucking whore ${message.author.username} has been timed out until tomorrow for exceeding the daily message limit.`
      );
    } catch (error) {
      console.error('Failed to timeout user:', error);
      message.channel.send(
        `I don't have permission to timeout ${message.author}.`
      );
    }
  }
}
