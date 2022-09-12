import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, ContainerMenu, UserIcon } from './styles';
import Button from '../../components/Button';
import EditAccountEmail from 'pages/EditAccountEmail';

function EditAccount() {
  const navigate = useNavigate();
  const rotaEmail = async () => {
    navigate('email'), { replace: true };
  };

  return (
    <>
      <Container>
        <ContainerMenu>
          <UserIcon />
          <span>Editar Conta</span>
        </ContainerMenu>
        <ContainerMenu>
          <Button onClick={rotaEmail}>
            <span>Email</span>
          </Button>
          <Button>
            <span>Senha</span>
          </Button>
        </ContainerMenu>
      </Container>
    </>
  );
}

export default EditAccount;
