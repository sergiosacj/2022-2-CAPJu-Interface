import toast from 'react-hot-toast';
import Dropdown from 'react-dropdown';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import api from 'services/api';
import userApi from 'services/user';
import {
  Container,
  Menu,
  MenuElement,
  Modal,
  ForgotPassword,
  Criterios,
  EditDrop
} from './styles';
import { Content } from 'pages/Stages/styles';
import Button from 'components/Button/Button';
import TextInput from 'components/TextInput/TextInput';
import { Input } from 'components/TextInput/styles';
import { validateCPF, validateName } from 'validators/registryValidator';

function Login() {
  const [isModalOpen, setModalOpen] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newName, setNewName] = useState('');
  const [nameValidate, setNameValidate] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [units, setUnits] = useState([]);
  const [newUnity, setNewUnity] = useState('');
  const [newCpf, setNewCpf] = useState('');
  const [loginCpf, setLoginCpf] = useState('');
  const [validateCpf, setValidateCpf] = useState(false);

  const [selectedTab, setSelectedTab] = useState('login');

  const navigate = useNavigate();
  useEffect(() => {
    updateUnitys();
  }, []);
  async function register() {
    const re = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
    const pass = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z$*&@#]{6,}$/;
    if (!nameValidate) {
      toast.error('Nome invalido');
      return;
    }
    if (!re.test(newEmail)) {
      toast.error('E-mail Inválido');
      return;
    }
    if (!pass.test(newPassword)) {
      toast.error('Senha não cumpre os criterios');
      return;
    }
    if (newPassword != newPassword2) {
      toast.error('Senha invalida');
      return;
    }
    if (!validateCpf) {
      toast.error('CPF inválido');
      return;
    }

    try {
      const response = await userApi.post('/newUser', {
        fullName: newName,
        email: newEmail,
        password: newPassword,
        idRole: newRole.value,
        idUnit: newUnity.value,
        cpf: newCpf
      });
      response.status = 200;
      toast.success('Usuário cadastrado com  sucesso');
      setNewName('');
      setNewPassword('');
      setNewEmail('');
      setNewPassword2('');
      setSelectedTab('login');
      setNewRole('');
      setNewUnity('');
      setNewCpf('');
    } catch (error) {
      toast.error('Erro ao cadastrar \n' + error.response.data.message);
    }
  }

  async function login() {
    try {
      const response = await userApi.post('/login', {
        cpf: loginCpf,
        password: password
      });

      if (response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      toast.success('Usuário logado com  sucesso');
      navigate('/Stages');
      window.location.reload();
    } catch (error) {
      toast.error('Erro no login: ' + error.response.data.message);
    }
  }

  function onHandleName(event) {
    setNewName(event.target.value);
    setNameValidate(validateName(event.target.value));
  }
  function cpfMask(strCpf) {
    return strCpf
      .replace(/\D/g, '') // substitui qualquer caracter que nao seja numero por nada
      .replace(/(\d{3})(\d)/, '$1.$2') // captura 2 grupos de numero o primeiro de 3 e o segundo de 1, apos capturar o primeiro grupo ele adiciona um ponto antes do segundo grupo de numero
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1'); // captura 2 numeros seguidos de um traço e não deixa ser digitado mais nada
  }

  function onHandleLoginCPF(event) {
    setLoginCpf(cpfMask(event.target.value));
  }

  function onHandleCPF(event) {
    setNewCpf(cpfMask(event.target.value));
    setValidateCpf(validateCPF(event.target.value));
  }

  async function requestNewPassword() {
    const response = await userApi.post('/requestRecovery', {
      email: email
    });
    if (response.status == 200) {
      toast.success('Solicitação enviada com sucesso');
    } else {
      toast.error('Erro ao solicitar email');
    }
  }
  async function updateUnitys() {
    const response = await api.get('/units');
    setUnits(response.data);
  }
  const allOptions = units.map((units) => {
    return { label: units.name, value: units.idUnit };
  });

  const OptionsRoles = [
    { label: 'DIRETOR', value: 1 },
    { label: 'JUIZ', value: 2 },
    { label: 'SERVIDOR', value: 3 },
    { label: 'ESTAGIARIO', value: 4 }
  ];
  const roles = ['', 'DIRETOR', 'JUIZ', 'SERVIDOR', 'ESTAGIARIO'];

  return (
    <Container>
      <Menu>
        <MenuElement
          onClick={() => {
            setSelectedTab('login');
          }}
          selected={selectedTab == 'login'}
        >
          Login
        </MenuElement>
        <MenuElement
          onClick={() => {
            setSelectedTab('register');
          }}
          selected={selectedTab == 'register'}
        >
          Cadastro
        </MenuElement>
      </Menu>
      {selectedTab == 'login' ? (
        <>
          <h1>Login</h1>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              login();
            }}
          >
            <Input
              placeholder="CPF"
              maxLength={14}
              onChange={onHandleLoginCPF}
              value={loginCpf}
            />
            <br />
            <br />
            <TextInput
              set={setPassword}
              value={password}
              placeholder="Senha"
              type="password"
            />
            <ForgotPassword
              onClick={() => {
                setModalOpen(true);
              }}
            >
              Esqueceu a senha?
            </ForgotPassword>
            <Button type="submit" text={'Entrar'} />
          </form>
        </>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            register();
          }}
        >
          <h1>Cadastre-se </h1>
          <Input
            set={setNewName}
            onChange={onHandleName}
            value={newName}
            placeholder="Nome completo"
          />
          {!newName ||
            (!nameValidate && (
              <>
                <br />
                <span
                  style={{
                    color: 'red',
                    fontSize: '0.6em',
                    fontWeight: 'bold',
                    marginRight: '17em'
                  }}
                >
                  Nome inválido
                </span>
              </>
            ))}
          <br />
          <Input
            placeholder="CPF"
            maxLength={14}
            onChange={onHandleCPF}
            value={newCpf}
          />
          {!newCpf ||
            (!validateCpf && (
              <React.Fragment>
                <br />
                <span
                  style={{
                    color: 'red',
                    fontSize: '0.6em',
                    fontWeight: 'bold',
                    marginRight: '17em'
                  }}
                >
                  CPF Inválido!
                </span>
              </React.Fragment>
            ))}
          <br />
          <TextInput set={setNewEmail} value={newEmail} placeholder="Email" />
          <br />
          <TextInput
            set={setNewPassword}
            value={newPassword}
            placeholder="Crie uma senha"
            type="password"
          />
          <br />
          <TextInput
            set={setNewPassword2}
            value={newPassword2}
            placeholder="Confirme a senha"
            type="password"
          />
          <EditDrop>
            <Dropdown
              options={OptionsRoles}
              onChange={(e) => setNewRole(e)}
              value={roles[newRole]}
              placeholder="Selecione o perfil"
              className="dropdown"
              controlClassName="dropdown-control"
              placeholderClassName="dropdown-placeholder"
              menuClassName="dropdown-menu"
              arrowClassName="dropdown-arrow"
            />
          </EditDrop>
          <EditDrop>
            <Dropdown
              options={allOptions}
              onChange={(e) => setNewUnity(e)}
              value={newUnity}
              placeholder="Selecione a unidade"
              className="dropdown"
              controlClassName="dropdown-control"
              placeholderClassName="dropdown-placeholder"
              menuClassName="dropdown-menu"
              arrowClassName="dropdown-arrow"
            />
          </EditDrop>
          <Criterios>
            <ul>
              <h6>
                <strong>Critérios para aceitação de senha:</strong>
                <li>Deve conter ao menos um dígito;</li>
                <li>Deve conter ao menos uma letra maiúscula;</li>
                <li>Deve conter ao menos 6 dos caracteres;</li>
              </h6>
            </ul>
          </Criterios>
          <Button type="submit" text={'Cadastrar'} />
        </form>
      )}
      {isModalOpen && (
        <Modal>
          <Content>
            <h3>Recuperação de senha</h3>
            <h5>Você receberá um link via e-mail para criar sua nova senha</h5>
            <TextInput
              set={setEmail}
              value={email}
              placeholder="Digite seu email"
            />
            <Button
              onClick={() => {
                requestNewPassword();
                setModalOpen(false);
              }}
              text={'Soliciar recuperação'}
            />
            <Button
              onClick={() => {
                setModalOpen(false);
              }}
              background="#DE5353"
              text={'Cancelar'}
            />
          </Content>
        </Modal>
      )}
    </Container>
  );
}

export default Login;
