/**
 * useProjectForm Hook
 * Manages project form state and submission
 * Cognitive Complexity: 6
 */
import { useState, useCallback, useEffect } from 'react';
import { projectService } from '../services/projectService';
import type { Project, ProjectFormData } from '../types/project.types';

interface UseProjectFormProps {
  projectId?: string;
  onSuccess?: (project: Project) => void;
}

interface UseProjectFormReturn {
  formData: ProjectFormData;
  isSubmitting: boolean;
  error: string | null;
  updateField: (field: keyof ProjectFormData, value: any) => void;
  setFormData: (data: ProjectFormData) => void;
  resetForm: () => void;
  submitForm: () => Promise<void>;
  validateForm: () => boolean;
}

const initialFormData: ProjectFormData = {
  name: '',
  client_id: '',
  primary_manager_id: '',
  status: 'active',
  start_date: '',
  end_date: '',
  budget: 0,
  description: '',
  is_billable: true,
};

export const useProjectForm = ({
  projectId,
  onSuccess,
}: UseProjectFormProps = {}): UseProjectFormReturn => {
  const [formData, setFormDataState] = useState<ProjectFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) return;

      try {
        const project = await projectService.getProjectById(projectId);
        setFormDataState({
          name: project.name,
          client_id: project.client_id,
          primary_manager_id: project.primary_manager_id,
          status: project.status,
          start_date: project.start_date,
          end_date: project.end_date,
          budget: project.budget,
          description: project.description || '',
          is_billable: project.is_billable,
        });
      } catch (err) {
        setError('Failed to load project');
      }
    };

    loadProject();
  }, [projectId]);

  const updateField = useCallback((field: keyof ProjectFormData, value: any) => {
    setFormDataState(prev => ({ ...prev, [field]: value }));
    setError(null);
  }, []);

  const setFormData = useCallback((data: ProjectFormData) => {
    setFormDataState(data);
    setError(null);
  }, []);

  const resetForm = useCallback(() => {
    setFormDataState(initialFormData);
    setError(null);
  }, []);

  const validateForm = useCallback((): boolean => {
    if (!formData.name.trim()) {
      setError('Project name is required');
      return false;
    }

    if (!formData.client_id) {
      setError('Please select a client');
      return false;
    }

    if (!formData.primary_manager_id) {
      setError('Please select a primary manager');
      return false;
    }

    if (!formData.start_date) {
      setError('Start date is required');
      return false;
    }

    if (!formData.end_date) {
      setError('End date is required');
      return false;
    }

    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      setError('End date must be after start date');
      return false;
    }

    if (formData.budget < 0) {
      setError('Budget must be a positive number');
      return false;
    }

    return true;
  }, [formData]);

  const submitForm = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const result = projectId
        ? await projectService.updateProject(projectId, formData)
        : await projectService.createProject(formData);

      onSuccess?.(result);
      resetForm();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save project';
      setError(message);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [projectId, formData, validateForm, onSuccess, resetForm]);

  return {
    formData,
    isSubmitting,
    error,
    updateField,
    setFormData,
    resetForm,
    submitForm,
    validateForm,
  };
};
