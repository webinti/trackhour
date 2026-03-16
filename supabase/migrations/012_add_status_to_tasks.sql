-- Add status column to tasks (Kanban: todo / in_progress / done)
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'todo'
  CHECK (status IN ('todo', 'in_progress', 'done'));

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(project_id, status);
