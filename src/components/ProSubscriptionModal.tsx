import React from "react";

export interface ProSubscriptionModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  activePlan?: string;
  onSelectPlan?: (plan?: string) => void;
}

export const ProSubscriptionModal: React.FC<ProSubscriptionModalProps> = () => null;
export default ProSubscriptionModal;
