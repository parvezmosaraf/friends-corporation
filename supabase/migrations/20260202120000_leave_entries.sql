-- Leave entries: date-wise leave with reason per salary record (employee per month/year)
CREATE TABLE public.leave_entries (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    salary_record_id UUID NOT NULL REFERENCES public.salary_records(id) ON DELETE CASCADE,
    leave_date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_leave_entries_salary_record_id ON public.leave_entries(salary_record_id);
CREATE INDEX idx_leave_entries_leave_date ON public.leave_entries(leave_date);

ALTER TABLE public.leave_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view leave_entries" ON public.leave_entries FOR SELECT USING (true);
CREATE POLICY "Anyone can insert leave_entries" ON public.leave_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update leave_entries" ON public.leave_entries FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete leave_entries" ON public.leave_entries FOR DELETE USING (true);
