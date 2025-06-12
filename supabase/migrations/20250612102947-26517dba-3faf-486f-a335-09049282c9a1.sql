
-- Create table for events/calendar
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for classroom reports
CREATE TABLE public.classroom_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  report_data JSONB NOT NULL,
  file_url TEXT,
  generated_by UUID NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for event announcements
CREATE TABLE public.event_announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  event_date DATE NOT NULL,
  image_url TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) policies for events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view events" 
  ON public.events 
  FOR SELECT 
  USING (true);

CREATE POLICY "Admins can insert events" 
  ON public.events 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update events" 
  ON public.events 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete events" 
  ON public.events 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add RLS policies for classroom reports
ALTER TABLE public.classroom_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view classroom reports" 
  ON public.classroom_reports 
  FOR SELECT 
  USING (true);

CREATE POLICY "Admins can insert classroom reports" 
  ON public.classroom_reports 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add RLS policies for event announcements
ALTER TABLE public.event_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view event announcements" 
  ON public.event_announcements 
  FOR SELECT 
  USING (true);

CREATE POLICY "Admins can insert event announcements" 
  ON public.event_announcements 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update event announcements" 
  ON public.event_announcements 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete event announcements" 
  ON public.event_announcements 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create function to auto-delete expired event announcements
CREATE OR REPLACE FUNCTION delete_expired_announcements()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.event_announcements 
  WHERE event_date < CURRENT_DATE;
END;
$$;

-- Create a trigger to run the cleanup function daily (requires pg_cron extension)
-- This will be handled in the application code instead for better reliability
