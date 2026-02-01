-- Normalize all salary records to 30-day attendance (every month = 30 days).
-- Fixes legacy records that were created with actual calendar days (e.g. February = 28).

UPDATE salary_records sr
SET
  days_in_month = 30,
  attendance_days = GREATEST(0, LEAST(30, 30 - COALESCE(sr.leave_unpaid, 0))),
  total_calculated = ROUND(GREATEST(0, (
    (SELECT e.base_salary FROM employees e WHERE e.id = sr.employee_id) / 30.0
    * (GREATEST(0, LEAST(30, 30 - COALESCE(sr.leave_unpaid, 0))) + COALESCE(sr.paid_leave, 0))
    + COALESCE(sr.bonus, 0) + COALESCE(sr.increment_adjustment, 0)
    - COALESCE(sr.advance_taken, 0) - COALESCE(sr.penalty, 0)
  ))::numeric, 2)
WHERE sr.days_in_month IS DISTINCT FROM 30;
