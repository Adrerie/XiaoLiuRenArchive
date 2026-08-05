'use strict';

/**
 * Calendar normalization boundary for the MVP.
 *
 * This module deliberately stops at normalized lunar input. It does not know
 * about questions, identities, or palace calculation.
 */

const DEFAULT_CALENDAR_POLICY_ID = 'civil-midnight-reuse-leap-month';
const MANUAL_TIME_ZONE = 'manual';

const CALENDAR_POLICIES = Object.freeze([
  Object.freeze({
    id: DEFAULT_CALENDAR_POLICY_ID,
    label: '民用午夜复用闰月',
    description: '以当地民用午夜作为换日边界；23:00 仍按当天的农历日期转换。',
    warning: '切换到子初 23:00 策略可能改变农历日期与最终落宫。',
  }),
  Object.freeze({
    id: 'zi-hour-23-reuse-leap-month',
    label: '子初 23:00 复用闰月',
    description: '23:00 起按下一民用日转换农历日期，同时保留子时地支。',
    warning: '与民用午夜策略相比，23:00 附近可能改变农历日期与最终落宫。',
  }),
  Object.freeze({
    id: 'manual-lunar-input-v1',
    label: '手动农历输入',
    description: '直接使用用户提供的农历月、日和时辰，不进行公历转换。',
    warning: '手动输入不验证完整公历边界，只验证当前输入结构。',
  }),
]);

const POLICY_IDS = Object.freeze(CALENDAR_POLICIES.map((policy) => policy.id));

const EARTHLY_BRANCHES = Object.freeze([
  '子', '丑', '寅', '卯', '辰', '巳',
  '午', '未', '申', '酉', '戌', '亥',
]);

const CALENDAR_ERROR_CODES = Object.freeze({
  INVALID_POLICY: 'CALENDAR_POLICY_INVALID',
  INVALID_TIME_ZONE: 'CALENDAR_TIMEZONE_INVALID',
  INVALID_LOCAL_DATE_TIME: 'CALENDAR_LOCAL_DATETIME_INVALID',
  NONEXISTENT_LOCAL_TIME: 'CALENDAR_LOCAL_TIME_NONEXISTENT',
  AMBIGUOUS_LOCAL_TIME: 'CALENDAR_LOCAL_TIME_AMBIGUOUS',
  INVALID_LUNAR_MONTH: 'CALENDAR_LUNAR_MONTH_INVALID',
  INVALID_LUNAR_DAY: 'CALENDAR_LUNAR_DAY_INVALID',
  INVALID_LUNAR_YEAR: 'CALENDAR_LUNAR_YEAR_INVALID',
  INVALID_EARTHLY_BRANCH: 'CALENDAR_EARTHLY_BRANCH_INVALID',
  EARTHLY_BRANCH_CONFLICT: 'CALENDAR_EARTHLY_BRANCH_CONFLICT',
  INVALID_LEAP_MONTH_FLAG: 'CALENDAR_LEAP_MONTH_FLAG_INVALID',
  INVALID_LUNAR_DATE: 'CALENDAR_LUNAR_DATE_INVALID',
  CALENDAR_UNAVAILABLE: 'CALENDAR_RUNTIME_UNAVAILABLE',
});

class CalendarNormalizationError extends Error {
  constructor(code, message, recoverable, suggestedAction) {
    super(message);
    this.name = 'CalendarNormalizationError';
    this.code = code;
    this.recoverable = recoverable;
    if (suggestedAction) this.suggestedAction = suggestedAction;
  }
}

function calendarError(code, message, recoverable = true, suggestedAction) {
  return new CalendarNormalizationError(code, message, recoverable, suggestedAction);
}

function isCalendarNormalizationError(error) {
  return error instanceof CalendarNormalizationError;
}

function assertPolicy(policyId) {
  const id = policyId || DEFAULT_CALENDAR_POLICY_ID;
  if (!POLICY_IDS.includes(id)) {
    throw calendarError(
      CALENDAR_ERROR_CODES.INVALID_POLICY,
      `Unsupported calendar policy: ${String(id)}`,
      true,
      `Use one of: ${POLICY_IDS.join(', ')}`,
    );
  }
  return id;
}

function assertManualPolicy(policyId) {
  const id = policyId || 'manual-lunar-input-v1';
  if (id !== 'manual-lunar-input-v1') {
    throw calendarError(
      CALENDAR_ERROR_CODES.INVALID_POLICY,
      `Manual lunar input requires calendar policy manual-lunar-input-v1, received: ${String(id)}`,
      true,
      'Use manual-lunar-input-v1 for manual lunar input.',
    );
  }
  return id;
}

function isInteger(value) {
  return typeof value === 'number' && Number.isInteger(value);
}

function assertLunarMonth(month) {
  if (!isInteger(month) || month < 1 || month > 12) {
    throw calendarError(
      CALENDAR_ERROR_CODES.INVALID_LUNAR_MONTH,
      'lunarMonth must be an integer from 1 through 12.',
      true,
      'Enter a lunar month in the range 1-12.',
    );
  }
}

function assertLunarDay(day) {
  if (!isInteger(day) || day < 1 || day > 30) {
    throw calendarError(
      CALENDAR_ERROR_CODES.INVALID_LUNAR_DAY,
      'lunarDay must be an integer from 1 through 30.',
      true,
      'Enter a lunar day in the range 1-30.',
    );
  }
}

function assertLunarYear(year) {
  if (year === undefined || year === null) return;
  if (!isInteger(year) || year < 1 || year > 9999) {
    throw calendarError(
      CALENDAR_ERROR_CODES.INVALID_LUNAR_YEAR,
      'lunarYear must be an integer from 1 through 9999 when provided.',
      true,
      'Omit the year for limited validation, or enter a four-digit lunar year.',
    );
  }
}

function assertLeapFlag(value) {
  if (typeof value !== 'boolean') {
    throw calendarError(
      CALENDAR_ERROR_CODES.INVALID_LEAP_MONTH_FLAG,
      'isLeapMonth must be a boolean.',
      true,
      'Explicitly choose whether the month is a leap month.',
    );
  }
}

function branchFromInput(input) {
  const hasIndex = input.earthlyBranchIndex !== undefined && input.earthlyBranchIndex !== null;
  const hasName = input.earthlyBranch !== undefined && input.earthlyBranch !== null;

  let index;
  if (hasIndex) {
    if (!isInteger(input.earthlyBranchIndex) || input.earthlyBranchIndex < 1 || input.earthlyBranchIndex > 12) {
      throw calendarError(
        CALENDAR_ERROR_CODES.INVALID_EARTHLY_BRANCH,
        'earthlyBranchIndex must be an integer from 1 through 12.',
        true,
        'Choose one of the twelve earthly branches.',
      );
    }
    index = input.earthlyBranchIndex;
  }

  if (hasName) {
    const nameIndex = EARTHLY_BRANCHES.indexOf(input.earthlyBranch) + 1;
    if (nameIndex === 0) {
      throw calendarError(
        CALENDAR_ERROR_CODES.INVALID_EARTHLY_BRANCH,
        'earthlyBranch must be one of 子、丑、寅、卯、辰、巳、午、未、申、酉、戌、亥.',
        true,
        'Choose one of the twelve earthly branches.',
      );
    }
    if (index !== undefined && index !== nameIndex) {
      throw calendarError(
        CALENDAR_ERROR_CODES.EARTHLY_BRANCH_CONFLICT,
        'earthlyBranch and earthlyBranchIndex describe different branches.',
        true,
        'Provide matching branch name and index, or provide only one form.',
      );
    }
    index = nameIndex;
  }

  if (index === undefined) {
    throw calendarError(
      CALENDAR_ERROR_CODES.INVALID_EARTHLY_BRANCH,
      'An earthly branch or earthlyBranchIndex is required.',
      true,
      'Choose one of the twelve earthly branches.',
    );
  }

  return { earthlyBranch: EARTHLY_BRANCHES[index - 1], earthlyBranchIndex: index };
}

function assertIanaTimeZone(timeZone) {
  if (typeof timeZone !== 'string' || timeZone.length === 0) {
    throw calendarError(
      CALENDAR_ERROR_CODES.INVALID_TIME_ZONE,
      'An IANA time zone is required for Gregorian date-time input.',
      true,
      'Provide a time zone such as Asia/Shanghai or America/Los_Angeles.',
    );
  }
  try {
    const resolved = new Intl.DateTimeFormat('en-US', { timeZone }).resolvedOptions().timeZone;
    if (!resolved) throw new RangeError('No resolved time zone');
  } catch (error) {
    throw calendarError(
      CALENDAR_ERROR_CODES.INVALID_TIME_ZONE,
      `Invalid IANA time zone: ${timeZone}`,
      true,
      'Provide a valid IANA time zone name.',
    );
  }
  return timeZone;
}

function parseLocalDateTime(value) {
  if (typeof value !== 'string') {
    throw calendarError(
      CALENDAR_ERROR_CODES.INVALID_LOCAL_DATE_TIME,
      'localDateTime must be a local ISO date-time without a UTC offset.',
      true,
      'Use YYYY-MM-DDTHH:mm or YYYY-MM-DDTHH:mm:ss.',
    );
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!match) {
    throw calendarError(
      CALENDAR_ERROR_CODES.INVALID_LOCAL_DATE_TIME,
      'localDateTime must match YYYY-MM-DDTHH:mm or YYYY-MM-DDTHH:mm:ss.',
      true,
      'Remove any UTC offset and provide a complete local date-time.',
    );
  }
  const parts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: match[6] === undefined ? 0 : Number(match[6]),
  };
  const days = new Date(Date.UTC(parts.year, parts.month, 0)).getUTCDate();
  if (parts.month < 1 || parts.month > 12 || parts.day < 1 || parts.day > days || parts.hour > 23 || parts.minute > 59 || parts.second > 59) {
    throw calendarError(
      CALENDAR_ERROR_CODES.INVALID_LOCAL_DATE_TIME,
      'localDateTime contains an invalid calendar date or clock time.',
      true,
      'Enter a real local date and a time from 00:00:00 through 23:59:59.',
    );
  }
  return parts;
}

function utcMilliseconds(parts) {
  const date = new Date(0);
  date.setUTCFullYear(parts.year, parts.month - 1, parts.day);
  date.setUTCHours(parts.hour, parts.minute, parts.second, 0);
  return date.getTime();
}

function partsFromDateTimeFormatter(instant, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    calendar: 'gregory',
    numberingSystem: 'latn',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const values = {};
  for (const part of formatter.formatToParts(instant)) {
    if (part.type !== 'literal') values[part.type] = Number(part.value);
  }
  return values;
}

function sameDateTime(a, b) {
  return a.year === b.year && a.month === b.month && a.day === b.day &&
    a.hour === b.hour && a.minute === b.minute && a.second === b.second;
}

function resolveLocalDateTime(parts, timeZone, fold) {
  const localMilliseconds = utcMilliseconds(parts);
  const offsets = new Set();

  // Gather offsets around the requested wall time. This covers ordinary
  // zones and historical/DST transitions without maintaining an offset table.
  for (let hours = -72; hours <= 72; hours += 1) {
    const instantMilliseconds = localMilliseconds + hours * 60 * 60 * 1000;
    const localParts = partsFromDateTimeFormatter(new Date(instantMilliseconds), timeZone);
    offsets.add(utcMilliseconds(localParts) - instantMilliseconds);
  }

  const candidates = [];
  for (const offset of offsets) {
    const candidateMilliseconds = localMilliseconds - offset;
    const candidate = new Date(candidateMilliseconds);
    const candidateParts = partsFromDateTimeFormatter(candidate, timeZone);
    if (sameDateTime(candidateParts, parts)) candidates.push(candidate);
  }
  candidates.sort((a, b) => a.getTime() - b.getTime());

  if (candidates.length === 0) {
    throw calendarError(
      CALENDAR_ERROR_CODES.NONEXISTENT_LOCAL_TIME,
      `The local time ${formatLocalDateTime(parts)} does not exist in ${timeZone} because of a time-zone transition.`,
      true,
      'Choose another local time, or use a time-zone-aware instant.',
    );
  }
  if (candidates.length > 1 && fold !== 0 && fold !== 1) {
    throw calendarError(
      CALENDAR_ERROR_CODES.AMBIGUOUS_LOCAL_TIME,
      `The local time ${formatLocalDateTime(parts)} occurs more than once in ${timeZone}.`,
      true,
      'Set fold to 0 for the earlier occurrence or 1 for the later occurrence.',
    );
  }
  return candidates[candidates.length > 1 && fold === 1 ? 1 : 0];
}

function formatLocalDateTime(parts) {
  return [
    `${String(parts.year).padStart(4, '0')}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`,
    `${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}:${String(parts.second).padStart(2, '0')}`,
  ].join('T');
}

function addDays(parts, days) {
  const date = new Date(utcMilliseconds(parts));
  date.setUTCDate(date.getUTCDate() + days);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
  };
}

function chineseCalendarParts(instant, timeZone) {
  let formatter;
  try {
    formatter = new Intl.DateTimeFormat('en-u-ca-chinese', {
      timeZone,
      numberingSystem: 'latn',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
  } catch (error) {
    throw calendarError(
      CALENDAR_ERROR_CODES.CALENDAR_UNAVAILABLE,
      'The runtime does not provide the Chinese calendar required for Gregorian conversion.',
      false,
      'Install a runtime with ECMA-402 Chinese calendar support or inject a calendar adapter.',
    );
  }
  const values = {};
  for (const part of formatter.formatToParts(instant)) {
    if (part.type !== 'literal') values[part.type] = part.value;
  }
  const monthValue = String(values.month || '');
  const leap = monthValue.endsWith('bis');
  const numericMonth = Number(leap ? monthValue.slice(0, -3) : monthValue);
  const lunarDay = Number(values.day);
  const lunarYear = Number(values.relatedYear);
  if (!Number.isInteger(numericMonth) || !Number.isInteger(lunarDay) || !Number.isInteger(lunarYear)) {
    throw calendarError(
      CALENDAR_ERROR_CODES.CALENDAR_UNAVAILABLE,
      'The runtime returned an unreadable Chinese calendar value.',
      false,
      'Use a runtime with a complete Intl Chinese calendar implementation.',
    );
  }
  return { lunarYear, lunarMonth: numericMonth, lunarDay, isLeapMonth: leap };
}

function validateLunarDateWithRuntime(year, month, day, isLeapMonth) {
  // A Chinese lunar year begins between late January and late February and
  // ends in the following January/February. Scanning noon avoids local-day
  // boundary effects while letting Intl validate the exact month/day/leap flag.
  const start = new Date(Date.UTC(year, 0, 1, 12));
  const end = new Date(Date.UTC(year + 1, 2, 1, 12));
  const formatter = new Intl.DateTimeFormat('en-u-ca-chinese', {
    timeZone: 'UTC',
    numberingSystem: 'latn',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
  for (let current = start.getTime(); current < end.getTime(); current += 24 * 60 * 60 * 1000) {
    const values = {};
    for (const part of formatter.formatToParts(new Date(current))) {
      if (part.type !== 'literal') values[part.type] = part.value;
    }
    const monthValue = String(values.month || '');
    const leap = monthValue.endsWith('bis');
    const numericMonth = Number(leap ? monthValue.slice(0, -3) : monthValue);
    if (Number(values.relatedYear) === year && numericMonth === month && Number(values.day) === day && leap === isLeapMonth) {
      return true;
    }
  }
  return false;
}

function validateManualLunar(input) {
  const value = input || {};
  assertManualPolicy(value.calendarPolicyId);
  assertLunarMonth(value.lunarMonth);
  assertLunarDay(value.lunarDay);
  assertLunarYear(value.lunarYear);
  assertLeapFlag(value.isLeapMonth);
  const branch = branchFromInput(value);
  if (value.timezone !== undefined && value.timezone !== null) assertIanaTimeZone(value.timezone);

  if (value.lunarYear !== undefined && value.lunarYear !== null &&
      !validateLunarDateWithRuntime(value.lunarYear, value.lunarMonth, value.lunarDay, value.isLeapMonth)) {
    throw calendarError(
      CALENDAR_ERROR_CODES.INVALID_LUNAR_DATE,
      'The lunar month/day/leap-month combination does not exist in the supplied lunar year.',
      true,
      'Check the lunar year, month, day, and leap-month flag.',
    );
  }

  const warnings = [];
  if (value.lunarYear === undefined || value.lunarYear === null) warnings.push('calendar-validation-limited');
  return { valid: true, branch, warnings };
}

function fromManualLunar(input) {
  const value = input || {};
  const policyId = assertManualPolicy(value.calendarPolicyId);
  const validation = validateManualLunar(value);
  return {
    source: 'manual_lunar',
    timeZone: value.timezone || MANUAL_TIME_ZONE,
    ...(value.lunarYear === undefined || value.lunarYear === null ? {} : { lunarYear: value.lunarYear }),
    lunarMonth: value.lunarMonth,
    lunarDay: value.lunarDay,
    isLeapMonth: value.isLeapMonth,
    earthlyBranch: validation.branch.earthlyBranch,
    earthlyBranchIndex: validation.branch.earthlyBranchIndex,
    calendarPolicyId: policyId,
    appliedDayOffset: 0,
    warnings: validation.warnings,
  };
}

function fromGregorian(input) {
  const value = input || {};
  const policyId = assertPolicy(value.calendarPolicyId);
  if (policyId === 'manual-lunar-input-v1') {
    throw calendarError(
      CALENDAR_ERROR_CODES.INVALID_POLICY,
      'Gregorian date-time input cannot use calendar policy manual-lunar-input-v1.',
      true,
      'Use civil-midnight-reuse-leap-month or zi-hour-23-reuse-leap-month for Gregorian input.',
    );
  }
  const localParts = parseLocalDateTime(value.localDateTime);
  const timeZone = assertIanaTimeZone(value.timezone);
  if (value.fold !== undefined && value.fold !== null && value.fold !== 0 && value.fold !== 1) {
    throw calendarError(
      CALENDAR_ERROR_CODES.AMBIGUOUS_LOCAL_TIME,
      'fold must be 0, 1, or null.',
      true,
      'Use fold 0 or 1 when a DST fallback makes the local time ambiguous.',
    );
  }
  const instant = resolveLocalDateTime(localParts, timeZone, value.fold);
  const hour = localParts.hour;
  const earthlyBranchIndex = hour === 23 || hour === 0 ? 1 : Math.floor((hour - 1) / 2) + 2;
  const earthlyBranch = EARTHLY_BRANCHES[earthlyBranchIndex - 1];

  // The default policy uses civil midnight. The alternative policy is kept as
  // an explicit adapter option, never silently substituted.
  const appliedDayOffset = policyId === 'zi-hour-23-reuse-leap-month' && hour === 23 ? 1 : 0;
  const lunarDateParts = appliedDayOffset === 1 ? addDays(localParts, appliedDayOffset) : localParts;
  const lunarInstant = resolveLocalDateTime(lunarDateParts, timeZone, value.fold);
  const lunar = chineseCalendarParts(lunarInstant, timeZone);

  return {
    source: 'gregorian_datetime',
    timeZone,
    localDateTime: formatLocalDateTime(localParts),
    ...lunar,
    earthlyBranch,
    earthlyBranchIndex,
    calendarPolicyId: policyId,
    appliedDayOffset,
    lunarConversionLocalDateTime: formatLocalDateTime(lunarDateParts),
    libraryId: 'ecma-402-intl-chinese-calendar',
    libraryVersion: 'runtime-provided',
    warnings: [],
  };
}

const calendarAdapter = Object.freeze({
  id: 'ecma-402-intl-chinese-calendar',
  version: 'runtime-provided',
  fromGregorian,
  validateManualLunar,
  fromManualLunar,
});

export {
  CALENDAR_ERROR_CODES,
  CALENDAR_POLICIES,
  DEFAULT_CALENDAR_POLICY_ID,
  EARTHLY_BRANCHES,
  MANUAL_TIME_ZONE,
  POLICY_IDS,
  CalendarNormalizationError,
  calendarAdapter,
  fromGregorian,
  fromManualLunar,
  isCalendarNormalizationError,
  validateManualLunar,
};
