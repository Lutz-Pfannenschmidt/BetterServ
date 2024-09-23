import { type Lesson, WebUntis } from "webuntis";
import _ from 'lodash';
import { getUntisCredentialsForDomain } from "./storage";

export async function populateTimetable(iserv: string, date: Date = new Date(), force = false) {
    const timetableDateCurrent = document.getElementById('timetable-date-current') as HTMLSpanElement;
    const timetableBtnPrevious = document.getElementById('timetable-prev') as HTMLSpanElement;
    const timetableBtnNext = document.getElementById('timetable-next') as HTMLSpanElement;
    timetableDateCurrent.textContent = getRelativeDate(date, new Date());
    timetableBtnPrevious.onclick = () => populateTimetablePrevious(iserv, date);
    timetableBtnNext.onclick = () => populateTimetableNext(iserv, date);

    const timetableDiv = document.getElementById('timetable') as HTMLDivElement;
    let timetable: Lesson[];
    try {
        timetable = await getTimetable(iserv, date);
    } catch (e) {
        const msg = getUntisErrorMessage(e as Error);
        switch (msg) {
            case 'Untis credentials are not set up yet':
                alertNotSetup(iserv);
                break;
            default:
                alertError(e as Error, iserv);
                break;
        }
        return;
    }
    const additionalData = getAdditionalData(timetable);
    const today = new Date();
    if (
        !force &&
        date.getDay() === today.getDay() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear() &&
        date.getHours() > fixTimeFormat(additionalData.lastLessonEndTime).hours
    ) {
        populateTimetableNext(iserv, date);
    }

    timetable = mergeAdjacentLessons(timetable);
    console.log(timetable);
    timetableDiv.innerHTML = '';

    timetable = timetable.filter(lesson => lesson !== undefined);
    if (timetable.length === 0) {
        timetableDiv.appendChild(document.createTextNode('No lessons today, have a cat instead:'));
        timetableDiv.appendChild(document.createElement('hr'));
        const cat = document.createElement('img');
        cat.src = 'https://cataas.com/cat';
        cat.alt = 'cat';
        timetableDiv.appendChild(cat);
        return;
    }

    const inKeys = Object.keys(additionalData.fixedLessonFormat).map(Number);

    for (let idx = 0; idx < inKeys.length; idx++) {
        const key = inKeys[idx];
        const isLast = idx === inKeys.length - 1;
        makeLessonGroup(additionalData.fixedLessonFormat[key], timetableDiv, additionalData);
        if (isLast) continue;

        makeBreakElement(additionalData.fixedLessonFormat[key][0], additionalData.fixedLessonFormat[inKeys[idx + 1]][0], timetableDiv, additionalData);
    }
}

async function populateTimetablePrevious(iserv: string, date: Date) {
    const previousDay = new Date(date.getTime() - 1000 * 60 * 60 * 24);
    await populateTimetable(iserv, previousDay, true);
}

async function populateTimetableNext(iserv: string, date: Date) {
    const nextDay = new Date(date.getTime() + 1000 * 60 * 60 * 24);
    await populateTimetable(iserv, nextDay, true);
}

function alertError(e: Error, iserv: string) {
    const timetableDiv = document.getElementById('timetable') as HTMLDivElement;
    timetableDiv.innerHTML = '';
    timetableDiv.appendChild(document.createTextNode(getUntisErrorMessage(e)));

    timetableDiv.appendChild(document.createElement('hr'));
    timetableDiv.appendChild(document.createTextNode('This could be due to a number of reasons:'));
    const ul = document.createElement('ul');
    ul.innerHTML = `
        <li>You have not yet set up Untis</li>
        <li>Your credentials are incorrect</li>
        <li>Untis is down (unlikely)</li>
    `;

    timetableDiv.appendChild(ul);
    timetableDiv.appendChild(document.createElement('hr'));
    const settings_anchor = document.createElement('a');
    settings_anchor.href = `settings.html?iserv=${iserv}#untis_account`;
    settings_anchor.target = '_blank';
    settings_anchor.textContent = 'Set up your Untis account';
    settings_anchor.style.color = 'var(--betterserv-accent)';
    settings_anchor.style.textDecoration = 'underline';
    settings_anchor.style.fontSize = '1.5em';
    timetableDiv.appendChild(settings_anchor);

    const untis_link_anchor = document.getElementById('untis_link') as HTMLAnchorElement;
    untis_link_anchor.href = "https://webuntis.com";
}

function alertNotSetup(iserv: string) {
    const timetableDiv = document.getElementById('timetable') as HTMLDivElement;
    timetableDiv.innerHTML = '';
    timetableDiv.appendChild(document.createTextNode('Your Untis account is not set up yet. Please click the link below to set it up:'));
    const settings_anchor = document.createElement('a');
    settings_anchor.href = `settings.html?iserv=${iserv}#untis_account`;
    settings_anchor.target = '_blank';
    settings_anchor.textContent = 'Set up your Untis account';
    settings_anchor.style.color = 'var(--betterserv-accent)';
    settings_anchor.style.textDecoration = 'underline';
    settings_anchor.style.fontSize = '1.5em';
    timetableDiv.appendChild(settings_anchor);

    const untis_link_anchor = document.getElementById('untis_link') as HTMLAnchorElement;
    untis_link_anchor.href = "https://webuntis.com";
}

function getUntisErrorMessage(e: Error): string {
    if (!e.message.includes('{')) return e.message;
    const jsonString = (e.message as string).match(/({.*})/)?.[0] as string;
    const jsonObject = JSON.parse(jsonString);
    return e.message.split("{")[0] + jsonObject.error.message;
}

function makeLessonGroup(lessons: Lesson[], parent: HTMLElement, additionalData: AdditionalData) {
    const lessonGroupDiv = document.createElement('div');
    lessonGroupDiv.classList.add('lesson-group');

    for (const lesson of lessons) {
        const lessonElement = makeLessonElement(lesson, lessonGroupDiv, additionalData);
        lessonElement.classList.add('grouped');
        lessonElement.style.width = `${100 / lessons.length}%`;
    }

    parent.appendChild(lessonGroupDiv);
}

function makeBreakElement(lesson: Lesson, nextLesson: Lesson, parent: HTMLElement, additionalData: AdditionalData) {
    if (getTimeDifference(lesson.endTime, nextLesson.startTime) === 0) return;
    const breakDiv = document.createElement('div');
    breakDiv.classList.add('break');
    breakDiv.style.height = `${getTimeDifference(lesson.endTime, nextLesson.startTime) / additionalData.avgLessonDuration * 3}em`;
    makeTimeElement(lesson.endTime, breakDiv);
    makeTimeElement(nextLesson.startTime, breakDiv);
    parent.appendChild(breakDiv);
}

function makeLessonElement(lesson: Lesson, parent: HTMLElement, additionalData: AdditionalData): HTMLDivElement {
    const lessonDiv = document.createElement('div');
    makeTimeElement(lesson.startTime, lessonDiv);

    lessonDiv.classList.add('lesson');
    if (lesson.code) {
        lessonDiv.classList.add(`code-${lesson.code}`);
    }
    lessonDiv.style.height = `${getTimeDifference(lesson.startTime, lesson.endTime) / additionalData.avgLessonDuration * 3}em`;
    const lessonName = document.createElement('span');
    lessonName.textContent = lesson.su[0].name;
    lessonDiv.appendChild(lessonName);

    makeTimeElement(lesson.endTime, lessonDiv);
    parent.appendChild(lessonDiv);
    return lessonDiv;
}

function makeTimeElement(time: number, parent: HTMLElement) {
    const timeSpan = document.createElement('span');
    timeSpan.classList.add('time');
    timeSpan.textContent = fixTimeFormatToString(time);
    parent.appendChild(timeSpan);
}

function fixTimeFormat(time: number): { hours: number, minutes: number } {
    const str = time.toString();
    return {
        hours: Number.parseInt(str.slice(0, -2)),
        minutes: Number.parseInt(str.slice(-2))
    };
}

function getTimeDifference(start: number, end: number): number {
    const startObj = fixTimeFormat(start);
    const endObj = fixTimeFormat(end);
    return (endObj.hours - startObj.hours) * 60 + (endObj.minutes - startObj.minutes);
}

function fixTimeFormatToString(time: number): string {
    const str = time.toString();
    return `${str.slice(0, -2)}:${str.slice(-2)}`;
}

async function getTimetable(iserv: string, date: Date): Promise<Lesson[]> {
    const credentials = await getUntisCredentialsForDomain(iserv);
    if (!credentials || !credentials.school || !credentials.username || !credentials.password || !credentials.url) {
        throw new Error('Untis credentials are not set up yet');
    }
    const untis_link_anchor = document.getElementById('untis_link') as HTMLAnchorElement;
    untis_link_anchor.href = `https://${credentials.url}`;

    const untis = new WebUntis(credentials.school, credentials.username, credentials.password, credentials.url);
    await untis.login();
    const timetable = await untis.getOwnTimetableFor(date);
    untis.logout();
    return timetable;
}

function getAdditionalData(lessons: Lesson[]): AdditionalData {
    const sorted = lessons.sort((a, b) => a.startTime - b.startTime);
    const totalLessonDuration = lessons.reduce((acc, lesson) => acc + getTimeDifference(lesson.startTime, lesson.endTime), 0);
    const lastLessonEndTime = sorted[sorted.length - 1].endTime;
    return {
        avgLessonDuration: totalLessonDuration / lessons.length,
        totalLessonDuration,
        fixedLessonFormat: fixLessonFormatAndMerge(lessons),
        lastLessonEndTime: lastLessonEndTime
    };
}

function fixLessonFormatAndMerge(lessons: Lesson[]): FixedLessonFormat {
    const splitLessons: SplitLessonFormat = {};
    for (const lesson of lessons) {
        const key = lesson.sg;
        if (!key) continue;

        if (!splitLessons[key]) {
            splitLessons[key] = [];
        }
        splitLessons[key].push(lesson);
    }

    for (const key in splitLessons) {
        splitLessons[key] = mergeAdjacentLessons(splitLessons[key]);
    }

    const fixedLessonFormat: FixedLessonFormat = {};
    for (const key in splitLessons) {
        for (const lesson of splitLessons[key]) {
            if (!fixedLessonFormat[lesson.startTime]) {
                fixedLessonFormat[lesson.startTime] = [];
            }
            fixedLessonFormat[lesson.startTime].push(lesson);
        }
    }

    return fixedLessonFormat;
}

function areAdjacentLessons(current: Lesson, next: Lesson): boolean {
    return current.endTime === next.startTime &&
        current.sg === next.sg &&
        _.isEqual(current.kl, next.kl) &&
        _.isEqual(current.te, next.te) &&
        _.isEqual(current.su, next.su) &&
        _.isEqual(current.ro, next.ro)
}

function mergeAdjacentLessons(lessons: Lesson[]): Lesson[] {
    const sorted = lessons.sort((a, b) => a.startTime - b.startTime);
    const merged = [];
    let current = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
        const next = sorted[i];
        if (areAdjacentLessons(current, next)) {
            current.endTime = next.endTime;
        } else {
            merged.push(current);
            current = next;
        }
    }
    merged.push(current);
    return merged;
}

// Returns the relative date between two dates, e.g. "today", "tomorrow", "in n days"
function getRelativeDate(dateA: Date, dateB: Date): string {
    const diff = dateA.getTime() - dateB.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return 'today';
    if (days === 1) return 'tomorrow';
    if (days === -1) return 'yesterday';
    if (days < 0) return `${-days} days ago`;
    return `in ${days} days`;
}

interface AdditionalData {
    avgLessonDuration: number; // should be 45 or 60, depending on the school. This is the average duration of a lesson in minutes
    totalLessonDuration: number;  // total duration of all lessons for the day in minutes
    fixedLessonFormat: FixedLessonFormat;
    lastLessonEndTime: number;
}

interface FixedLessonFormat {
    [key: number]: Lesson[];
}

interface SplitLessonFormat {
    [key: string]: Lesson[];
}