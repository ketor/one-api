import React from 'react';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';

const StatCard = ({ title, value, description, icon: Icon, className }) => {
  return (
    <Card className={cn('', className)}>
      <CardContent className='p-6'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm font-medium text-muted-foreground'>{title}</p>
            <p className='text-2xl font-bold mt-1'>{value}</p>
            {description && (
              <p className='text-xs text-muted-foreground mt-1'>{description}</p>
            )}
          </div>
          {Icon && (
            <div className='rounded-lg bg-muted p-3'>
              <Icon className='h-5 w-5 text-muted-foreground' />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
