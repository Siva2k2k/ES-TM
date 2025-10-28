import { Router } from 'express';

type HolidayType = 'public' | 'company' | 'optional';

interface MockHoliday {
  _id: string;
  name: string;
  date: string;
  holiday_type: HolidayType;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

const router = Router();

const MOCK_HOLIDAYS: MockHoliday[] = [
  {
    _id: 'hol-2024-01-01',
    name: 'New Year\'s Day',
    date: '2024-01-01',
    holiday_type: 'public',
    description: 'Company observed New Year holiday',
    is_active: true,
  },
  {
    _id: 'hol-2024-01-26',
    name: 'Republic Day',
    date: '2024-01-26',
    holiday_type: 'public',
    description: 'National holiday',
    is_active: true,
  },
  {
    _id: 'hol-2024-03-29',
    name: 'Good Friday',
    date: '2024-03-29',
    holiday_type: 'public',
    description: 'Company observed holiday',
    is_active: true,
  },
  {
    _id: 'hol-2024-08-15',
    name: 'Independence Day',
    date: '2024-08-15',
    holiday_type: 'public',
    description: 'National holiday',
    is_active: true,
  },
  {
    _id: 'hol-2024-10-02',
    name: 'Gandhi Jayanti',
    date: '2024-10-02',
    holiday_type: 'public',
    description: 'National holiday',
    is_active: true,
  },
  {
    _id: 'hol-2024-10-31',
    name: 'Company Offsite',
    date: '2024-10-31',
    holiday_type: 'company',
    description: 'Company sponsored offsite',
    is_active: true,
  },
  {
    _id: 'hol-2024-12-25',
    name: 'Christmas Day',
    date: '2024-12-25',
    holiday_type: 'public',
    description: 'Company observed holiday',
    is_active: true,
  },
];

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function withinRange(date: string, start?: string, end?: string): boolean {
  const target = parseDate(date);
  if (!target) return false;
  const startDate = parseDate(start);
  const endDate = parseDate(end);

  if (startDate && target < startDate) return false;
  if (endDate) {
    // include entire end date
    const inclusiveEnd = new Date(endDate);
    inclusiveEnd.setHours(23, 59, 59, 999);
    if (target > inclusiveEnd) return false;
  }

  return true;
}

router.get('/', (req, res) => {
  const { startDate, endDate, holiday_type, is_active, year } = req.query;

  let filtered = [...MOCK_HOLIDAYS];

  if (year) {
    const yearNumber = Number(year);
    if (!Number.isNaN(yearNumber)) {
      filtered = filtered.filter((holiday) => new Date(holiday.date).getFullYear() === yearNumber);
    }
  }

  if (startDate || endDate) {
    filtered = filtered.filter((holiday) =>
      withinRange(holiday.date, startDate as string | undefined, endDate as string | undefined)
    );
  }

  if (holiday_type) {
    filtered = filtered.filter((holiday) => holiday.holiday_type === holiday_type);
  }

  if (is_active !== undefined) {
    const active = is_active === 'true';
    filtered = filtered.filter((holiday) => holiday.is_active === active);
  }

  res.json({
    success: true,
    holidays: filtered,
  });
});

router.get('/upcoming', (req, res) => {
  const days = Number(req.query.days) || 30;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const future = new Date(today);
  future.setDate(future.getDate() + days);

  const upcoming = MOCK_HOLIDAYS.filter((holiday) => {
    const date = parseDate(holiday.date);
    if (!date) return false;
    return date >= today && date <= future && holiday.is_active;
  });

  res.json({
    success: true,
    holidays: upcoming,
    count: upcoming.length,
  });
});

router.get('/check/:date', (req, res) => {
  const { date } = req.params;
  const target = parseDate(date);

  if (!target) {
    return res.status(400).json({
      success: false,
      error: 'Invalid date format',
    });
  }

  const iso = target.toISOString().split('T')[0];
  const holiday = MOCK_HOLIDAYS.find((item) => item.date === iso && item.is_active);

  res.json({
    success: true,
    is_holiday: Boolean(holiday),
    holiday: holiday ?? null,
  });
});

router.get('/:id', (req, res) => {
  const holiday = MOCK_HOLIDAYS.find((item) => item._id === req.params.id);

  if (!holiday) {
    return res.status(404).json({
      success: false,
      error: 'Holiday not found',
    });
  }

  res.json({
    success: true,
    holiday,
  });
});

export default router;
