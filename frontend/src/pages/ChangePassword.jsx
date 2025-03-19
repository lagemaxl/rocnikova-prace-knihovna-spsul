import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TextInput, PasswordInput, Button, Container, Title, Text, Space, Alert } from '@mantine/core';
import pb from '../lib/pocketbase';

const ChangePassword = () => {
  const { TOKEN } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (newPassword !== newPasswordConfirm) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      await pb.collection('users').confirmPasswordReset(TOKEN, newPassword, newPasswordConfirm);
      navigate('/'); // Redirect to login or any other page after success
    } catch (err) {
      setError('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="xs" px="xs" style={{marginTop: "200px"}}>
      <Title align="center" mt="lg">
        Resetování / nastavení hesla
      </Title>
      <Text color="dimmed" align="center" size="sm" mt="xs">
        Vytvořte si nové heslo pro náš účet
      </Text>

      <Space h="md" />

      {error && (
        <Alert title="Error" color="red" withCloseButton onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <PasswordInput
          label="Nové heslo"
          placeholder="Napište nové heslo"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          mt="md"
        />
        <PasswordInput
          label="Nové heslo znovu"
          placeholder="Napište nové heslo znovu"
          value={newPasswordConfirm}
          onChange={(e) => setNewPasswordConfirm(e.target.value)}
          required
          mt="md"
        />
        <Button type="submit" fullWidth mt="lg"  color="#df3f1b"  loading={loading}>
          Nastavit heslo
        </Button>
      </form>
    </Container>
  );
};

export default ChangePassword;
