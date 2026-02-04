/**
 * Branch types for conditional flow control
 */

import { ConditionExpression } from './condition';

/**
 * Branch definition for conditional navigation between steps
 */
export interface Branch {
  /** Unique identifier for this branch */
  id: string;
  /** Condition to evaluate (if undefined and isDefault is true, this is the fallback branch) */
  condition?: ConditionExpression;
  /** Whether this is the default branch taken when no other conditions match */
  isDefault?: boolean;
  /** ID of the step to navigate to if this branch is taken */
  nextStepId: string;
  /** Display label for the branch in the UI */
  label?: string;
}
