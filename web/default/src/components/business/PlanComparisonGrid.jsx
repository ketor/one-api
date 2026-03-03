import React from 'react';
import PlanCard from './PlanCard';

const PlanComparisonGrid = ({ plans, currentPlanId, currentPlanPriority, onSelect }) => {
  if (!plans || plans.length === 0) {
    return <p className='text-muted-foreground text-center py-8'>暂无可用套餐</p>;
  }

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
      {plans.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          currentPlanId={currentPlanId}
          onSelect={onSelect}
          isUpgrade={currentPlanPriority !== undefined && plan.priority > currentPlanPriority}
          isDowngrade={currentPlanPriority !== undefined && plan.priority < currentPlanPriority}
        />
      ))}
    </div>
  );
};

export default PlanComparisonGrid;
