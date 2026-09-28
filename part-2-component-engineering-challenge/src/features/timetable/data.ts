import { createRandom, FIRST_NAMES, LAST_NAMES } from '../../lib/random';

export type ClassStatus = 'Scheduled' | 'Full' | 'Cancelled';
export type PaymentType = 'One-time' | 'Package' | 'Membership';
export type BookingStatus = 'Booked' | 'Checked-in' | 'Cancelled' | 'No-show';

export interface Attendee {
  id: string;
  name: string;
  paymentType: PaymentType;
  bookingStatus: BookingStatus;
}

/** A class as the list shows it. `booked` counts attendees who have not cancelled. */
export interface ClassSession {
  id: string;
  name: string;
  instructor: string;
  /** 0 = Monday … 6 = Sunday */
  day: number;
  /** Minutes after midnight */
  startMinutes: number;
  durationMinutes: number;
  capacity: number;
  booked: number;
  status: ClassStatus;
}

/** A class together with its attendees (the "included" API response). */
export interface ClassWithAttendees extends ClassSession {
  attendees: Attendee[];
}

const CLASS_TYPES = [
  { name: 'Yoga Flow', minutes: 60, capacity: 15 },
  { name: 'HIIT Blast', minutes: 45, capacity: 20 },
  { name: 'Pilates Core', minutes: 50, capacity: 12 },
  { name: 'Spin Class', minutes: 45, capacity: 18 },
  { name: 'Boxing Basics', minutes: 60, capacity: 14 },
  { name: 'Barre', minutes: 50, capacity: 16 },
  { name: 'Strength Lab', minutes: 60, capacity: 10 },
  { name: 'Mobility', minutes: 30, capacity: 12 }
] as const;

const INSTRUCTORS = [
  'John Doe',
  'Mia Chen',
  'Aung Min',
  'Sara Lopez',
  'Tom Baker',
  'Nina Patel'
] as const;

const START_TIMES = [
  6 * 60,
  7 * 60 + 30,
  9 * 60,
  12 * 60,
  17 * 60 + 30,
  18 * 60 + 30,
  19 * 60 + 30
];

const PAYMENT_TYPES: PaymentType[] = ['One-time', 'Package', 'Membership'];

const ATTENDING: BookingStatus[] = ['Booked', 'Booked', 'Checked-in', 'Checked-in', 'No-show'];

function buildClasses(): ClassWithAttendees[] {
  const random = createRandom(42);

  return Array.from({ length: 40 }, (_, i) => {
    const type = CLASS_TYPES[i % CLASS_TYPES.length];

    const id = `class-${String(i + 1).padStart(2, '0')}`;

    const isCancelled = i % 13 === 5;

    // Some classes are full, a few are empty, the rest are in between.
    const booked =
      isCancelled || i % 9 === 3
        ? 0
        : i % 4 === 0
          ? type.capacity
          : random.int(2, type.capacity - 1);

    const cancelledBookings = booked > 0 ? random.int(0, 2) : 0;

    const attendees: Attendee[] = Array.from({ length: booked + cancelledBookings }, (_, a) => ({
      id: `${id}-${a + 1}`,
      name: `${random.pick(FIRST_NAMES)} ${random.pick(LAST_NAMES)}`,
      paymentType: random.pick(PAYMENT_TYPES),
      bookingStatus: a < booked ? random.pick(ATTENDING) : 'Cancelled'
    }));

    const status: ClassStatus = isCancelled
      ? 'Cancelled'
      : booked >= type.capacity
        ? 'Full'
        : 'Scheduled';

    return {
      id,
      name: type.name,
      instructor: INSTRUCTORS[(i * 5) % INSTRUCTORS.length],
      day: i % 7,
      // Classes on the same day get different start times.
      startMinutes: START_TIMES[(Math.floor(i / 7) + i) % START_TIMES.length],
      durationMinutes: type.minutes,
      capacity: type.capacity,
      booked,
      status,
      attendees
    };
  });
}

export const classes: ClassWithAttendees[] = buildClasses();
