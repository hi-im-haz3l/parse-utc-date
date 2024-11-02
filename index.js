/**
 * A utility class to handle parsing and formatting of UTC date inputs.
 * Provides methods to convert dates to ISO string format, Unix timestamps,
 * and local time, along with customizable date formatting.
 */
class ParseUTCDate {
  /**
   * List of month names.
   * @type {string[]}
   */
  static #MONTH_NAMES = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  /**
   * List of values considered as "empty" and to be treated as null.
   * @type {string[]}
   */
  static #EMPTY_VALUES = [
    "null",
    '""',
    "{}",
    "[]",
    "undefined",
    '"[object Object]"',
  ];

  /**
   * Threshold to distinguish between Unix timestamps in seconds and milliseconds.
   * @type {number}
   */
  static #MILLISECONDS_THRESHOLD = 1e12;

  /**
   * Number of milliseconds in a minute.
   * @type {number}
   */
  static #MINUTE_IN_MILLISECONDS = 60000;

  /**
   * Default date format string.
   * @type {string}
   */
  static #DEFAULT_FORMAT = "%Y/%m/%d %H:%M:%S %p";

  /**
   * Creates an instance of ParseUTCDate.
   * @param {Date|string|number|null} [utcInput=Date.now()] - UTC date input to parse.
   * @param {Object} [options] - Additional options for the date parsing.
   * @param {boolean} [options.hasConverted=false] - If true, interprets the input as local time.
   */
  constructor(utcInput = Date.now(), options = { hasConverted: false }) {
    /**
     * Parameters for initializing the date instance.
     * An array where the first element is the UTC date input and the second element is an options object.
     * @type {[Date|string|number|null, Object]}
     */
    this._params = [utcInput, options || {}];

    this.format = this.#format.bind(this);

    if (!options?.hasConverted) {
      this.toISOString = this.#toISOString.bind(this);
      this.toUnixSeconds = this.#toUnixSeconds.bind(this);
      this.toLocalTime = this.#toLocalTime.bind(this);
    }
  }

  /**
   * Parses the input into a Date object, interpreting it based on its type.
   * @returns {Date|null} The parsed Date object or null for invalid inputs.
   */
  #date() {
    const [input, options] = this._params;
    const { hasConverted = false } = options;

    const isEmptyValue = ParseUTCDate.#EMPTY_VALUES.includes(
      JSON.stringify(input)
    );
    if (isEmptyValue) return null;
    if (hasConverted && input instanceof Date)
      return this.#normalizeTime(input, hasConverted);

    if (input instanceof Date) return input;
    if (typeof input === "string") return new Date(input);
    if (typeof input === "number") {
      return input < ParseUTCDate.#MILLISECONDS_THRESHOLD
        ? new Date(input * 1000)
        : new Date(input);
    }
    return null;
  }

  /**
   * Normalizes the time based on the UTC offset.
   * @param {Date|null} [date=this.#date()] - The date to normalize.
   * @param {boolean} [hasConverted] - Indicates if the date has already been converted.
   * @returns {Date|null} The normalized Date object or null.
   */
  #normalizeTime(date = this.#date(), hasConverted) {
    if (!date) return null;

    const offset =
      date.getTimezoneOffset() *
      ParseUTCDate.#MINUTE_IN_MILLISECONDS *
      (hasConverted ? -1 : 1);

    return new Date(date.getTime() + offset);
  }

  /**
   * Converts the date to ISO 8601 string format (e.g., "YYYY-MM-DDTHH:mm:ssZ").
   * @returns {string|null} The ISO string or null for invalid dates.
   */
  #toISOString() {
    const date = this.#date();
    return date ? date.toISOString() : null;
  }

  /**
   * Converts the date to a Unix timestamp in seconds.
   * @returns {number|null} The Unix timestamp or null for invalid dates.
   */
  #toUnixSeconds() {
    const date = this.#date();
    return date ? Math.floor(date.getTime() / 1000) : null;
  }

  /**
   * Returns an instance representing the local time.
   * @returns {ParseUTCDate} A new ParseUTCDate instance with local time.
   */
  #toLocalTime() {
    return new ParseUTCDate(this.#date(), { hasConverted: true });
  }

  /**
   * Formats the date based on a custom pattern.
   * Supports patterns such as %Y (year), %m (month), %d (day), %H (hour), %M (minute), %S (second), %p (AM/PM).
   * @param {string} [pattern=ParseUTCDate.#DEFAULT_FORMAT] - Format pattern.
   * @param {Object} [options] - Additional formatting options.
   * @param {boolean} [options.hour12=false] - If true, enables 12-hour time with AM/PM.
   * @param {boolean} [options.fullMonth=false] - If true, displays full month names (e.g., January instead of 01).
   * @param {boolean} [options.shortYear=false] - If true, displays short year (e.g., 23 instead of 2023).
   * @returns {string|null} The formatted date string or null for invalid dates.
   */
  #format(
    pattern = ParseUTCDate.#DEFAULT_FORMAT,
    options = { hour12: false, fullMonth: false, shortYear: false }
  ) {
    const dateObj = this.#normalizeTime();
    if (!dateObj) return null;

    const year = options.shortYear
      ? String(dateObj.getFullYear()).slice(-2)
      : String(dateObj.getFullYear());

    const month = options.fullMonth
      ? ParseUTCDate.#MONTH_NAMES[dateObj.getMonth()]
      : String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");

    let hours = dateObj.getHours();
    const minutes = String(dateObj.getMinutes()).padStart(2, "0");
    const seconds = String(dateObj.getSeconds()).padStart(2, "0");
    let period = "";

    if (options?.hour12) {
      period = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
    }

    hours = String(hours).padStart(2, "0");

    const constructDateStr = (regex) =>
      regex
        .replace(/%Y/g, year)
        .replace(/%m/g, month)
        .replace(/%d/g, day)
        .replace(/%H/g, hours)
        .replace(/%M/g, minutes)
        .replace(/%S/g, seconds)
        .replace(/%p/g, period)
        .trim();

    try {
      return constructDateStr(pattern);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("Invalid format pattern:", pattern);
      return constructDateStr(ParseUTCDate.#DEFAULT_FORMAT);
    }
  }
}

export default ParseUTCDate;

