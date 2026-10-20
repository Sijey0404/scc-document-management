DROP TRIGGER IF EXISTS protect_ex_com_position ON public.profiles;
DROP FUNCTION IF EXISTS public.protect_ex_com_position();
DROP TRIGGER IF EXISTS protect_executive_committee_admin ON public.profiles;

CREATE OR REPLACE FUNCTION public.protect_executive_committee_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = true
    AND EXISTS (
      SELECT 1
      FROM public.departments
      WHERE id = NEW.department_id
        AND LOWER(TRIM(name)) = 'executive committee'
    )
    AND (
      TG_OP = 'INSERT'
      OR (
        TG_OP = 'UPDATE'
        AND (
          OLD.role IS DISTINCT FROM NEW.role
          OR OLD.department_id IS DISTINCT FROM NEW.department_id
        )
      )
    )
    AND COALESCE(auth.role(), '') <> 'service_role'
    AND NOT EXISTS (
      SELECT 1
      FROM public.profiles AS caller
      JOIN public.departments AS caller_department
        ON caller_department.id = caller.department_id
      WHERE caller.id = auth.uid()
        AND caller.role = true
        AND LOWER(TRIM(caller_department.name)) = 'executive committee'
    ) THEN
    RAISE EXCEPTION 'Only an Executive Committee admin can grant system-wide admin access';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_executive_committee_admin
BEFORE INSERT OR UPDATE OF role, department_id ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_executive_committee_admin();
