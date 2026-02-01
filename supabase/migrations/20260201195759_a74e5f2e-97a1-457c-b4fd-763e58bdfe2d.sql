-- Create shops table
CREATE TABLE public.shops (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on shops
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

-- Everyone can read shops
CREATE POLICY "Anyone can view shops" ON public.shops FOR SELECT USING (true);

-- Insert default shops
INSERT INTO public.shops (name) VALUES ('Classio'), ('Good Vibes');

-- Create employees table
CREATE TABLE public.employees (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    designation TEXT,
    base_salary DECIMAL(10, 2) NOT NULL DEFAULT 0,
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on employees
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Everyone can read and modify employees (admin functionality)
CREATE POLICY "Anyone can view employees" ON public.employees FOR SELECT USING (true);
CREATE POLICY "Anyone can insert employees" ON public.employees FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update employees" ON public.employees FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete employees" ON public.employees FOR DELETE USING (true);

-- Create salary_records table
CREATE TABLE public.salary_records (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL CHECK (year >= 2000 AND year <= 2100),
    attendance_days INTEGER NOT NULL DEFAULT 0,
    leave_unpaid INTEGER NOT NULL DEFAULT 0,
    paid_leave INTEGER NOT NULL DEFAULT 0,
    advance_taken DECIMAL(10, 2) NOT NULL DEFAULT 0,
    bonus DECIMAL(10, 2) NOT NULL DEFAULT 0,
    penalty DECIMAL(10, 2) NOT NULL DEFAULT 0,
    increment_adjustment DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_calculated DECIMAL(10, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Paid', 'Pending')),
    days_in_month INTEGER NOT NULL DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(employee_id, month, year)
);

-- Enable RLS on salary_records
ALTER TABLE public.salary_records ENABLE ROW LEVEL SECURITY;

-- Everyone can read and modify salary_records (admin functionality)
CREATE POLICY "Anyone can view salary_records" ON public.salary_records FOR SELECT USING (true);
CREATE POLICY "Anyone can insert salary_records" ON public.salary_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update salary_records" ON public.salary_records FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete salary_records" ON public.salary_records FOR DELETE USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for timestamp updates
CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON public.employees
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_salary_records_updated_at
    BEFORE UPDATE ON public.salary_records
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();