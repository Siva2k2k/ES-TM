/**
 * Training Period Validation Module
 * Handles validation for employees in training periods
 */

import {
  EnhancedTimeEntry,
  ValidationConfig,
  TrainingValidation,
  EmployeeWorkStatus
} from '../types/validation-enhancements';

/**
 * Validate training period requirements
 */
export function validateTrainingPeriod(
  entries: EnhancedTimeEntry[],
  config: ValidationConfig
): TrainingValidation {
  const isTrainingPeriod = config.employee_status === EmployeeWorkStatus.TRAINING;
  
  if (!isTrainingPeriod) {
    return {
      is_training_period: false,
      training_hours_required: 0,
      allows_project_work: true,
      training_completion_percentage: 100
    };
  }

  const trainingEntries = entries.filter(entry => 
    entry.entry_type === 'training'
  );

  const totalTrainingHours = trainingEntries.reduce((sum, entry) => sum + entry.hours, 0);

  // Calculate required training hours based on training period
  let trainingHoursRequired = 0;
  if (config.training_start_date && config.training_end_date) {
    const trainingWeekStart = config.week_start_date;
    const trainingWeekEnd = new Date(trainingWeekStart);
    trainingWeekEnd.setDate(trainingWeekStart.getDate() + 6);

    // Check if current week overlaps with training period
    const trainingStart = config.training_start_date;
    const trainingEnd = config.training_end_date;

    if (trainingStart <= trainingWeekEnd && trainingEnd >= trainingWeekStart) {
      // Calculate overlap days
      const overlapStart = new Date(Math.max(trainingStart.getTime(), trainingWeekStart.getTime()));
      const overlapEnd = new Date(Math.min(trainingEnd.getTime(), trainingWeekEnd.getTime()));
      
      // Count weekdays in overlap
      let overlapDays = 0;
      for (let d = new Date(overlapStart); d <= overlapEnd; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();
        if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
          overlapDays++;
        }
      }
      
      trainingHoursRequired = overlapDays * config.standard_hours_per_day;
    }
  }

  // Determine if project work is allowed during training
  const allowsProjectWork = config.allow_flexible_hours || 
    (totalTrainingHours >= trainingHoursRequired * 0.8); // Allow project work if 80% training complete

  // Calculate training completion percentage
  const trainingCompletionPercentage = trainingHoursRequired > 0 
    ? Math.min(100, (totalTrainingHours / trainingHoursRequired) * 100)
    : 100;

  return {
    is_training_period: true,
    training_hours_required: trainingHoursRequired,
    allows_project_work: allowsProjectWork,
    training_completion_percentage: trainingCompletionPercentage
  };
}

/**
 * Get training validation messages
 */
export function getTrainingValidationMessages(
  trainingValidation: TrainingValidation,
  totalTrainingHours: number,
  totalProjectHours: number
): {
  errors: string[];
  warnings: string[];
  recommendations: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  if (!trainingValidation.is_training_period) {
    return { errors, warnings, recommendations };
  }

  // Check training hour requirements
  if (totalTrainingHours < trainingValidation.training_hours_required) {
    const shortfall = trainingValidation.training_hours_required - totalTrainingHours;
    
    if (trainingValidation.training_completion_percentage < 50) {
      errors.push(`Training hours critically low: ${totalTrainingHours}h of ${trainingValidation.training_hours_required}h required (${shortfall}h short)`);
    } else {
      warnings.push(`Training hours below target: ${totalTrainingHours}h of ${trainingValidation.training_hours_required}h required (${shortfall}h short)`);
    }
    
    recommendations.push(`Add ${shortfall} more training hours to meet requirements`);
  }

  // Check project work during training
  if (totalProjectHours > 0 && !trainingValidation.allows_project_work) {
    warnings.push(`Project work (${totalProjectHours}h) may interfere with training requirements`);
    recommendations.push('Focus on training hours first before taking on project tasks');
  }

  // Provide completion status
  if (trainingValidation.training_completion_percentage >= 100) {
    recommendations.push('Training requirements met! You may now take on additional project work');
  } else if (trainingValidation.training_completion_percentage >= 80) {
    recommendations.push(`Training ${trainingValidation.training_completion_percentage.toFixed(0)}% complete - limited project work allowed`);
  }

  return { errors, warnings, recommendations };
}

/**
 * Check if training category is valid
 */
export function isValidTrainingCategory(category: string): boolean {
  const validCategories = [
    'orientation',
    'technical_training',
    'safety_training',
    'compliance_training',
    'skills_development',
    'mentorship',
    'certification',
    'workshop',
    'seminar',
    'e_learning',
    'on_job_training'
  ];
  
  return validCategories.includes(category.toLowerCase().replace(/\s+/g, '_'));
}

/**
 * Get suggested training categories
 */
export function getSuggestedTrainingCategories(): string[] {
  return [
    'Orientation',
    'Technical Training',
    'Safety Training',
    'Compliance Training',
    'Skills Development',
    'Mentorship',
    'Certification',
    'Workshop',
    'Seminar',
    'E-Learning',
    'On-Job Training'
  ];
}

/**
 * Calculate training progress for a given period
 */
export function calculateTrainingProgress(
  entries: EnhancedTimeEntry[],
  requiredHours: number
): {
  completed_hours: number;
  percentage: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  next_milestone: number | null;
} {
  const completedHours = entries
    .filter(entry => entry.entry_type === 'training')
    .reduce((sum, entry) => sum + entry.hours, 0);
    
  const percentage = requiredHours > 0 ? (completedHours / requiredHours) * 100 : 0;
  
  let status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  if (completedHours === 0) {
    status = 'not_started';
  } else if (percentage >= 100) {
    status = 'completed';
  } else {
    status = 'in_progress';
  }
  
  // Calculate next milestone (25%, 50%, 75%, 100%)
  const milestones = [0.25, 0.5, 0.75, 1];
  const currentProgress = percentage / 100;
  const nextMilestone = milestones.find(m => m > currentProgress);
  const nextMilestoneHours = nextMilestone ? nextMilestone * requiredHours : null;
  
  return {
    completed_hours: completedHours,
    percentage: Math.min(100, percentage),
    status,
    next_milestone: nextMilestoneHours
  };
}