ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_position_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_position_check CHECK (
  position = ANY (ARRAY[
    'PROFESSOR',
    'ASSISTANT_PROFESSOR',
    'ASSOCIATE_PROFESSOR',
    'INSTRUCTOR',
    'DEAN',
    'CHAIR',
    'EXCHANGE_FACULTY',
    'EX_COM',
    'Chief Accountant',
    'Accountant',
    'Accounting Staff',
    'Finance Officer',
    'Cashier',
    'Billing Staff',
    'Payroll Officer',
    'HR Manager',
    'HR Officer',
    'HR Staff',
    'Recruitment Officer',
    'Employee Relations Officer',
    'Training and Development Officer',
    'School Principal',
    'Assistant Principal',
    'Department Head',
    'Subject Coordinator',
    'Teacher',
    'Guidance Counselor',
    'School Nurse',
    'Associate Dean',
    'Program Chair',
    'Program Coordinator',
    'Faculty Member',
    'Laboratory Coordinator',
    'College Instructor',
    'Registrar',
    'Assistant Registrar',
    'Registration Officer',
    'Records Officer',
    'Enrollment Officer',
    'Transcript/Document Officer',
    'Chief Librarian',
    'Librarian',
    'Assistant Librarian',
    'Library Staff',
    'Circulation Assistant',
    'Library Technician',
    'Research Director',
    'Research Coordinator',
    'Research Adviser',
    'Research Staff',
    'Statistician',
    'Research Assistant',
    'Director of Student Affairs',
    'Student Affairs Officer',
    'Student Services Officer',
    'Student Activities Coordinator',
    'Scholarship Officer',
    'Publication Adviser',
    'Editor-in-Chief',
    'Managing Editor',
    'Associate Editor',
    'Staff Writer',
    'Layout Artist',
    'Graphic Designer',
    'Photojournalist',
    'MIS Director/Head',
    'MIS Officer',
    'System Administrator',
    'Network Administrator',
    'Database Administrator',
    'IT Support Specialist',
    'Computer Technician',
    'Web Developer',
    'Software Developer'
  ]::text[])
);

CREATE OR REPLACE FUNCTION public.protect_ex_com_position()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = true AND NEW.position = 'EX_COM'
    AND (TG_OP = 'INSERT' OR OLD.role IS DISTINCT FROM NEW.role OR OLD.position IS DISTINCT FROM NEW.position)
    AND COALESCE(auth.role(), '') <> 'service_role'
    AND NOT EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid()
        AND role = true
        AND position = 'EX_COM'
    ) THEN
    RAISE EXCEPTION 'Only an ex-com user can grant ex-com admin access';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_ex_com_position ON public.profiles;

CREATE TRIGGER protect_ex_com_position
BEFORE INSERT OR UPDATE OF role, position ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_ex_com_position();
