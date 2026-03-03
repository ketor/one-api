import React from 'react';
import { Card } from '../../helpers/semantic-shim';
import TokensTable from '../../components/TokensTable';
import { useTranslation } from 'react-i18next';

const Token = () => {
  const { t } = useTranslation();

  return (
    <div className='dashboard-container'>
      <Card fluid className='chart-card'>
        <Card.Content>
          <Card.Header className='header' style={{ marginBottom: '1em' }}>{t('token.title')}</Card.Header>
          <TokensTable />
        </Card.Content>
      </Card>
    </div>
  );
};

export default Token;
