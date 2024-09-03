import { WebUntis } from 'webuntis';

const untis = new WebUntis('school', 'username', 'password', 'xyz.webuntis.com');

await untis.login();
const timetable = await untis.getOwnTimetableForToday();
