import React from 'react';
import { Card } from '../../helpers/semantic-shim';
import { useTranslation } from 'react-i18next';
import RedemptionsTable from '../../components/RedemptionsTable';

const Redemption = () => {
  const { t } = useTranslation();
  
  return (
    <div className='dashboard-container'>
      <Card fluid className='chart-card'>
        <Card.Content>
          <Card.Header className='header' style={{ marginBottom: '1em' }}>{t('redemption.title')}</Card.Header>
          <RedemptionsTable />
        </Card.Content>
      </Card>
    </div>
  );
};

export default Redemption;
