export class BetterServLogger {
    prefix: string;

    constructor(module: string | null = null) {
        if (module === null) {
            this.prefix = "[BetterServ]";
        } else {
            this.prefix = `[BetterServ ${module}]`;
        }
    }

    log(message: string, list: string[] = []) {
        if (list.length > 0) {
            console.group(`%c${this.prefix}`, "color: green", message);
            list.forEach((item, index) => {
                console.log(`%c[${index + 1}/${list.length}]`, "color: green", item);
            });
            console.groupEnd();
        } else {
            console.log(`%c${this.prefix}`, "color: green", message);
        }
    }

    warn(message: string, list: string[] = []) {
        if (list.length > 0) {
            console.group(`%c${this.prefix}`, "color: orange", message);
            list.forEach((item, index) => {
                console.warn(`%c[${index + 1}/${list.length}]`, "color: orange", item);
            });
            console.groupEnd();
        } else {
            console.warn(`%c${this.prefix}`, "color: orange", message);
        }
    }

    error(message: string, e: unknown = null) {
        if (e !== null) {
            console.error(`%c${this.prefix}`, "color: red", message, e);
        } else {
            console.error(`%c${this.prefix}`, "color: red", message);
        }
    }
}