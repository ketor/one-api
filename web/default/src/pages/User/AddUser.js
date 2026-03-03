import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Form, Card } from '../../helpers/semantic-shim';
import { API, showError, showSuccess } from '../../helpers';

const AddUser = () => {
  const { t } = useTranslation();
  const originInputs = {
    username: '',
    display_name: '',
    password: '',
    plan_id: 0,
  };
  const [inputs, setInputs] = useState(originInputs);
  const { username, display_name, password, plan_id } = inputs;
  const [planOptions, setPlanOptions] = useState([]);

  const handleInputChange = (e, { name, value }) => {
    setInputs((inputs) => ({ ...inputs, [name]: value }));
  };

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await API.get('/api/plan/');
        const { success, data } = res.data;
        if (success && data) {
          setPlanOptions(data);
          // Default to lite plan if available
          const lite = data.find((p) => p.name === 'lite');
          if (lite) {
            setInputs((prev) => ({ ...prev, plan_id: lite.id }));
          }
        }
      } catch (error) {
        // silently fail
      }
    };
    fetchPlans();
  }, []);

  const submit = async () => {
    if (inputs.username === '' || inputs.password === '') return;
    const submitData = { ...inputs };
    if (submitData.plan_id) {
      submitData.plan_id = parseInt(submitData.plan_id);
    }
    const res = await API.post(`/api/user/`, submitData);
    const { success, message } = res.data;
    if (success) {
      showSuccess(t('user.messages.create_success'));
      setInputs(originInputs);
    } else {
      showError(message);
    }
  };

  return (
    <div className='dashboard-container'>
      <Card fluid className='chart-card'>
        <Card.Content>
          <Card.Header className='header'>{t('user.add.title')}</Card.Header>
          <Form autoComplete='off'>
            <Form.Field>
              <Form.Input
                label={t('user.edit.username')}
                name='username'
                placeholder={t('user.edit.username_placeholder')}
                onChange={handleInputChange}
                value={username}
                autoComplete='off'
                required
              />
            </Form.Field>
            <Form.Field>
              <Form.Input
                label={t('user.edit.display_name')}
                name='display_name'
                placeholder={t('user.edit.display_name_placeholder')}
                onChange={handleInputChange}
                value={display_name}
                autoComplete='off'
              />
            </Form.Field>
            <Form.Field>
              <Form.Input
                label={t('user.edit.password')}
                name='password'
                type='password'
                placeholder={t('user.edit.password_placeholder')}
                onChange={handleInputChange}
                value={password}
                autoComplete='off'
                required
              />
            </Form.Field>
            <Form.Field>
              <Form.Select
                label={t('user.create.plan')}
                name='plan_id'
                placeholder={t('user.edit.plan_placeholder')}
                options={planOptions.map((p) => ({
                  key: p.id,
                  text: p.display_name || p.name,
                  value: p.id,
                }))}
                value={plan_id}
                onChange={handleInputChange}
              />
            </Form.Field>
            <Button positive type='submit' onClick={submit}>
              {t('user.edit.buttons.submit')}
            </Button>
          </Form>
        </Card.Content>
      </Card>
    </div>
  );
};

export default AddUser;
