import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

/**
 * Provides project-scoped data filtering.
 * - Admin/SuperAdmin/MD see all data regardless of project assignment
 * - Users with assignedProjects see only their projects' data + legacy data (no projectId)
 * - Users without assignedProjects see all data (legacy behavior)
 */
export function useProjectFilter() {
  const { currentUser, hasAnyRole } = useAuth();
  const { projects } = useApp();

  const isGlobalViewer = hasAnyRole(['SuperAdmin', 'Admin', 'MD']);
  const userProjects = currentUser?.assignedProjects || [];

  const availableProjects = isGlobalViewer
    ? projects
    : projects.filter(p => userProjects.includes(p.id));

  const filterByProject = useCallback((items, selectedProjectId = 'all') => {
    let result = items;

    if (!isGlobalViewer && userProjects.length > 0) {
      result = result.filter(item => !item.projectId || userProjects.includes(item.projectId));
    }

    if (selectedProjectId && selectedProjectId !== 'all') {
      result = result.filter(item => item.projectId === selectedProjectId);
    }

    return result;
  }, [isGlobalViewer, userProjects]);

  const defaultProjectId = userProjects.length === 1 ? userProjects[0] : (userProjects[0] || '');

  return {
    projects,
    availableProjects,
    userProjects,
    isGlobalViewer,
    filterByProject,
    defaultProjectId,
  };
}
