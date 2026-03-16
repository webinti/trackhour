-- Suppression projet → supprime les time_entries liées
ALTER TABLE public.time_entries
  DROP CONSTRAINT time_entries_project_id_fkey,
  ADD CONSTRAINT time_entries_project_id_fkey
    FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

-- Suppression tâche → supprime les time_entries liées
ALTER TABLE public.time_entries
  DROP CONSTRAINT time_entries_task_id_fkey,
  ADD CONSTRAINT time_entries_task_id_fkey
    FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;
