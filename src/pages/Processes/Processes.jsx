import toast from 'react-hot-toast';
import Dropdown from 'react-dropdown';
import Tooltip from '@mui/material/Tooltip';
import EditIcon from '@mui/icons-material/Edit';
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Visibility from '@mui/icons-material/Visibility';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

import {
  Container,
  InputSearch,
  AddProcess,
  Table,
  Content,
  ContentHeader,
  Modal,
  PrioritySelection,
  ContentBody,
  PriorityFilter
} from './styles';
import BackButton from 'components/BackButton/BackButton';
import api from 'services/api';
import Button from 'components/Button/Button';
import TextInput from 'components/TextInput/TextInput';
import { isLate } from 'components/IsLate/index.js';
import hasPermission from 'util/permissionChecker';

function Processes() {
  const [processes, setProcesses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteProcessModal, setDeleteProcessModal] = useState(-1);
  const [editModalIsOpen, setEditModalIsOpen] = useState(false);
  const [registro, setRegistro] = useState('');
  const [apelido, setApelido] = useState('');
  const [editOrCreate, setEditOrCreate] = useState('');
  const location = useLocation();
  const flow = location.state;
  const [flows, setFlows] = useState([]);
  const [flowId, setFlowId] = useState(flow && flow.idFlow);
  const [stages, setStages] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [priority, setPriority] = useState(null);
  const [showPriorityPlaceholder, setShowPriorityPlaceholder] = useState(false);
  const [filterPriorityProcess, setFilterPriorityProcess] = useState(false);

  useEffect(() => {
    updateProcesses();
    getFlows();
    getStages();
    setPriority(0);
    getPriorities();
    // eslint-disable-next-line
  }, []);

  async function updateProcesses() {
    const response = await api.get(`/processes/${flow ? flow.idFlow : ''}`);
    setProcesses(response.data);
  }

  async function getPriorities() {
    const response = await api.get(`/priorities`);
    setPriorities(response.data);
  }

  //Catch the event when the input changes
  const handleChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleRadioButton = () => {
    setShowPriorityPlaceholder(!showPriorityPlaceholder);
    setPriority(null);
  };

  //Filter processes by record and nickname
  function filterProcesses() {
    return processes.filter((process) => {
      if (
        filterPriorityProcess &&
        process.idPriority !== 0 &&
        (process.record.toLowerCase().includes(searchTerm.toLowerCase()) ||
          process.nickname.toLowerCase().includes(searchTerm.toLowerCase()))
      ) {
        return process;
      }
      if (
        !filterPriorityProcess &&
        (process.record.toLowerCase().includes(searchTerm.toLowerCase()) ||
          process.nickname.toLowerCase().includes(searchTerm.toLowerCase()))
      ) {
        return process;
      }
    });
  }

  async function deleteProcess(registro) {
    try {
      await api.delete(`/deleteProcess/${registro}`);
      toast.success('Processo Removido com Sucesso', { duration: 4000 });
      updateProcesses();
    } catch (error) {
      if (error.response.status == 401) {
        toast(error.response.data.message, {
          icon: '⚠️',
          duration: 3000
        });
      } else {
        toast.error(
          'Erro ao deletar processo \n ' + error.response.data.message,
          { duration: 3000 }
        );
      }
    }
  }

  function closeModal() {
    setEditModalIsOpen(false);
  }
  function findFlow(idFlow) {
    return flows.find((flow) => flow.idFlow === idFlow);
  }

  function openEditModal(proc) {
    if (proc) {
      const priorityIdx = proc.idPriority > 0 ? proc.idPriority - 1 : 0;
      const flow = findFlow(proc.idFlow[0]);
      setEditOrCreate('edit');
      setRegistro(proc.record);
      setApelido(proc.nickname);
      setFlowId({ value: flow.idFlow, label: flow.name });
      setPriority({
        value: proc.idPriority,
        label: priorities[priorityIdx].description
      });
      setShowPriorityPlaceholder(proc.idPriority != 0);
    } else {
      setEditOrCreate('create');
      setRegistro('');
      setApelido('');
      setFlowId('');
      setPriority(null);
    }
    setEditModalIsOpen(true);
  }

  async function getFlows() {
    const response = await api.get(`/flows/`);
    setFlows(response.data);
  }

  async function editProcess() {
    try {
      await api.put(`/updateProcess`, {
        record: registro,
        nickname: apelido,
        idFlow: flowId.value,
        priority: priority ? priority.value : 0
      });
      toast.success('Processo Alterado com Sucesso', { duration: 4000 });
    } catch (error) {
      if (error.response.status == 401) {
        toast(error.response.data.message, {
          icon: '⚠️',
          duration: 3000
        });
      } else {
        toast.error(
          'Erro ao alterar processo \n ' + error.response.data.message,
          { duration: 3000 }
        );
      }
    }
  }

  async function createProcess() {
    try {
      const flow = flows.find((flow) => flow.idFlow === flowId.value);
      if (registro && flow) {
        const body = {
          record: registro,
          nickname: apelido,
          effectiveDate: new Date(),
          idFlow: flowId.value,
          priority: priority ? priority.value : 0
        };
        await api.post('/newProcess', body);
      } else {
        toast.error('Registro vazio', { duration: 3000 });
        return;
      }
      toast.success('Processo Registrado com Sucesso', { duration: 4000 });
    } catch (error) {
      if (error.response?.status == 401) {
        toast(error.response.data.message, {
          icon: '⚠️',
          duration: 3000
        });
      } else {
        toast.error(
          'Erro ao registrar processo \n ' + error.response.data.message,
          { duration: 3000 }
        );
      }
    }
  }

  async function getStages() {
    try {
      const stage = await api.get(`/stages`);

      setStages(stage.data);
    } catch (error) {
      toast.error('Erro ao pegar etapa\n ' + error.response.data.message, {
        duration: 3000
      });
    }
  }

  const user = JSON.parse(localStorage.getItem('user'));

  return (
    <Container>
      <div className="processes">
        {flow && <BackButton />}
        <h1>Processos {flow && '- ' + flow.name}</h1>
        <AddProcess
          onClick={() => openEditModal(false)}
          disabled={!hasPermission(user, 'create-process')}
        >
          + Adicionar Processo
        </AddProcess>
        <div className="processSearch">
          <InputSearch
            value={searchTerm}
            placeholder={'Buscar Processo'}
            onChange={handleChange}
          />
          <PriorityFilter>
            <label htmlFor="priority-checkbox">
              Mostrar processos com Prioridade Legal
            </label>
            <input
              type="checkbox"
              id="priority-checkbox"
              onClick={() => setFilterPriorityProcess(!filterPriorityProcess)}
            ></input>
          </PriorityFilter>
        </div>
        {processes.length == 0 && (
          <>
            Nenhum processo foi encontrado <br /> <br />{' '}
          </>
        )}
        <Table>
          <thead>
            <tr>
              <th>Registro</th>
              <th>Apelido</th>
              {flow && stages && (
                <>
                  <th>Etapa Atual</th>
                  <th>Última Etapa</th>
                </>
              )}
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filterProcesses()
              /*.sort((a, b) => b.etapas.length - a.etapas.length)*/
              .map((proc, idx) => {
                let CurrentStage, FinalStage, CurrentStagePos, FinalStagePos;

                if (flow && stages) {
                  CurrentStage = stages.find(
                    (stage) => stage.idStage === proc.idStage
                  );
                  FinalStage = stages.find(
                    (stage) =>
                      stage.idStage ===
                      flow.sequences[flow.sequences.length - 1]
                  );

                  CurrentStagePos = stages.indexOf(CurrentStage) + 1;
                  FinalStagePos = stages.indexOf(FinalStage) + 1;
                }

                let className = 'processName ';

                if (flow) {
                  className += isLate(CurrentStage, proc, flow)
                    ? 'currentStage-red'
                    : 'currentStage-green';
                }

                return (
                  <tr key={idx} className={className}>
                    {`${proc.idPriority}` !== '0' ? (
                      <>
                        <td> ⬆ {proc.record}</td>
                        <td> ⬆ {proc.nickname}</td>
                      </>
                    ) : (
                      <>
                        <td>{proc.record}</td>
                        <td>{proc.nickname}</td>
                      </>
                    )}
                    {flow && stages && (
                      <>
                        <td>
                          {CurrentStagePos}. {CurrentStage?.name}
                        </td>
                        <td className="processName finalStage">
                          {FinalStagePos}. {FinalStage?.name}
                        </td>
                      </>
                    )}
                    <td className="action-column">
                      <Tooltip title="Visualizar processo">
                        <Link to="showProcess" state={{ proc, flow }}>
                          <Visibility className="see-process"></Visibility>
                        </Link>
                      </Tooltip>
                      <Tooltip
                        title="Editar processo"
                        disabled={!hasPermission(user, 'edit-process')}
                      >
                        <EditIcon
                          className="edit-process"
                          onClick={() => openEditModal(proc)}
                        />
                      </Tooltip>
                      <Tooltip
                        title="Deletar processo"
                        disabled={!hasPermission(user, 'delete-process')}
                      >
                        <DeleteForeverIcon
                          className="delete-process"
                          onClick={() => setDeleteProcessModal(idx)}
                        />
                      </Tooltip>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </Table>
        {editModalIsOpen && (
          <Modal>
            <Content>
              <ContentHeader>
                <span>
                  {editOrCreate == 'edit'
                    ? 'Editar Processo'
                    : 'Criar Processo'}{' '}
                </span>
              </ContentHeader>
              <PrioritySelection>
                <label>Prioridade legal?</label>
                <div>
                  <input
                    type="radio"
                    name="selection"
                    value="yes"
                    id="radio-button-yes"
                    onClick={() => handleRadioButton()}
                    defaultChecked={showPriorityPlaceholder}
                  />
                  <label htmlFor="radio-button-yes">sim</label>
                  <input
                    type="radio"
                    name="selection"
                    value="no"
                    id="radio-button-no"
                    onClick={() => handleRadioButton()}
                    defaultChecked={!showPriorityPlaceholder}
                  />
                  <label htmlFor="radio-button-no">não</label>
                </div>
                {showPriorityPlaceholder && (
                  <Dropdown
                    options={priorities.map((priority) => {
                      return {
                        label: priority.description,
                        value: priority.idPriority
                      };
                    })}
                    onChange={(e) => setPriority(e)}
                    value={priority}
                    placeholder="Selecione a prioridade"
                    className="dropdown"
                    controlClassName="dropdown-control"
                    placeholderClassName="dropdown-placeholder"
                    menuClassName="dropdown-menu"
                    arrowClassName="dropdown-arrow"
                  />
                )}
              </PrioritySelection>
              <ContentBody>
                <Dropdown
                  options={flows.map((flow) => {
                    return { label: flow.name, value: flow.idFlow };
                  })}
                  onChange={(e) => setFlowId(e)}
                  value={flowId}
                  placeholder="Selecione o fluxo"
                  className="dropdown"
                  controlClassName="dropdown-control"
                  placeholderClassName="dropdown-placeholder"
                  menuClassName="dropdown-menu"
                  arrowClassName="dropdown-arrow"
                />
                <div>
                  <TextInput
                    label="Registro"
                    value={registro}
                    set={setRegistro}
                    placeholder="registro"
                    disabled={editOrCreate == 'edit'}
                  />
                  <TextInput
                    label="Apelido"
                    value={apelido}
                    set={setApelido}
                    placeholder="apelido"
                  />
                </div>
              </ContentBody>
              <div>
                <Button
                  onClick={async () => {
                    if (editOrCreate == 'edit') await editProcess();
                    else await createProcess();
                    await updateProcesses();
                    closeModal();
                  }}
                  text={'Confirmar'}
                />
                <Button
                  onClick={closeModal}
                  background="#DE5353"
                  text={'Cancelar'}
                />
              </div>
            </Content>
          </Modal>
        )}

        {deleteProcessModal != -1 && (
          <Modal>
            <Content>
              <ContentHeader>
                {' '}
                <span>Excluir Processo</span>
              </ContentHeader>
              <span>Deseja realmente excluir este Processo?</span>
              {processes[deleteProcessModal].record} -{' '}
              {processes[deleteProcessModal].nickname}
              <div>
                <Button
                  onClick={async () => {
                    setDeleteProcessModal(-1);
                    deleteProcess(processes[deleteProcessModal].record);
                  }}
                  text={'Confirmar'}
                />
                <Button
                  onClick={() => {
                    setDeleteProcessModal(-1);
                  }}
                  background="#DE5353"
                  text={'Cancelar'}
                />
              </div>
            </Content>
          </Modal>
        )}
      </div>
    </Container>
  );
}

export default Processes;
