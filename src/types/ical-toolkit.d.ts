declare module "ical-toolkit" {
  interface ICalEvent {
    start: Date;
    end: Date;
    summary: string;
    description?: string;
    location?: string;
    uid: string;
    stamp: Date;
  }

  interface ICalBuilder {
    events: ICalEvent[];
    calname: string;
    timezone: string;
    method: string;
    toString(): string;
  }

  export function createIcsFileBuilder(): ICalBuilder;
}
