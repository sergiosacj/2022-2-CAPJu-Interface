import api from 'services/api';
import Modal from 'react-modal';
import toast from 'react-hot-toast';
import { Ring } from 'react-awesome-spinners';
import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import SkipNextIcon from '@mui/icons-material/SkipNext';

import { Container, FlowWrapper } from './styles';
import Button from 'components/Button/Button';
import FlowViewer from 'components/Flow/FlowViewer';
import ModalHeader from 'components/ModalHeader/ModalHeader';
import ModalBody from 'components/ModalBody/ModalBody';
import hasPermission from 'util/permissionChecker';

Modal.setAppElement('body');

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: '-30%',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    padding: '0px'
  }
};

const flowStyle = {
  zIndex: '0'
};

const textAreaStyle = {
  minHeight: '300px',
  minWidth: '500px',
  marginTop: '15%',
  marginBottom: '7%',
  fontSize: '20px'
};

const OBSERVATION_MAX_LENGTH = 100;

function ShowProcess() {
  const [openNextStageModal, setOpenNextStageModal] = useState(false);
  const [newObservationModal, setNewObservationModal] = useState(false);
  const [editObservationModal, setEditObservationModal] = useState(false);
  const [commentary, setCommentary] = useState('');
  const [originStage, setOriginStage] = useState('');
  const [destinationStage, setDestinationStage] = useState('');
  const location = useLocation();
  const [stages, setStages] = useState([]);
  const [proc, setProc] = useState(location.state?.proc);
  const [flow, setFlow] = useState(location.state?.flow);

  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchFlow();
    fetchStages();
    updateProc();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function closeModal() {
    setOpenNextStageModal(false);
    setNewObservationModal(false);
    setEditObservationModal(false);
  }

  function checkExistAnnotation() {
    const foundSequence = flow.sequences.find((sequence) => {
      return (
        sequence.from === proc.idStage &&
        sequence.commentary != null &&
        sequence.commentary.length > 0
      );
    });
    if (foundSequence) {
      handleObservation(foundSequence.commentary);
    } else {
      handleObservation('');
    }

    setOpenNextStageModal(true);
  }

  async function updateProc() {
    const response = await api.get(
      `/getOneProcess/${location.state?.proc.record}`
    );
    setProc(response.data);
  }

  async function fetchStages() {
    let response = await api.get('/stages');
    setStages(response.data);
  }

  async function fetchFlow() {
    const processFlows = await api.get(`/flows/process/${proc.record}`);
    const response = await api.get(`/flow/${processFlows.data[0].idFlow}`);
    setFlow(response.data);
  }

  async function nextStage() {
    try {
      let stageTo = '';
      for (const sequence of flow.sequences) {
        if (sequence.from == proc?.idStage) {
          stageTo = sequence.to;
          break;
        }
      }

      await api.put('/processNextStage/', {
        record: proc?.record,
        to: stageTo,
        from: proc?.idStage,
        commentary,
        idFlow: flow?.idFlow
      });

      const response = await api.get(`getOneProcess/${proc?.record}`);

      setProc(response.data);
      proc.idStage = stageTo;
      updateObservations(commentary);
      closeModal();

      toast.success('Etapa avançada!', { duration: 4000 });
    } catch (error) {
      if (error.response.status == 401) {
        toast(error.response.data.message, {
          icon: '⚠️',
          duration: 3000
        });
      } else {
        toast.error('Erro ao avançar etapa \n ' + error.response.data.message, {
          duration: 3000
        });
      }
    }
  }

  async function newObservation(newObservation) {
    try {
      await api.put('/processNewObservation/', {
        record: proc.record,
        originStage,
        destinationStage,
        commentary: newObservation
      });

      updateObservations(newObservation);
      closeModal();
      toast.success('Notificação alterada com sucesso!', { duration: 4000 });
    } catch (error) {
      if (error.response.status == 401) {
        toast(error.response.data.message, {
          icon: '⚠️',
          duration: 3000
        });
      } else {
        toast.error(
          'Erro ao alterar notificação \n ' + error.response.data.message,
          {
            duration: 3000
          }
        );
      }
    }
  }

  function updateObservations(newObservation) {
    const newSequences = flow.sequences.map((sequence) => {
      if (
        String(sequence.from) === originStage &&
        String(sequence.to) === destinationStage
      ) {
        sequence.commentary = newObservation;
      }
      return sequence;
    });
    setFlow({ ...flow, sequences: newSequences });
  }

  function handleObservation(observation) {
    if (observation.length <= OBSERVATION_MAX_LENGTH)
      setCommentary(observation);
  }

  const renderNextStageModal = () => {
    return (
      <Modal
        isOpen={openNextStageModal}
        onRequestClose={closeModal}
        style={customStyles}
        contentLabel="avançar etapa"
      >
        <ModalHeader close={closeModal}>Avançar etapa</ModalHeader>
        <ModalBody>
          <textarea
            className="observation-field"
            placeholder="Observações sobre a etapa atual..."
            style={textAreaStyle}
            value={commentary}
            onChange={(e) => handleObservation(e.target.value)}
          />
          <Button
            buttonType={'showProcess'}
            onClick={nextStage}
            text={'Avançar'}
          />
        </ModalBody>
      </Modal>
    );
  };

  function deleteObservation() {
    newObservation('');
    updateProc();
  }

  const observationModal = useCallback(
    (originStage, destinationStage, observation) => {
      observation !== '+ Adicionar nova notificação'
        ? setEditObservationModal(true)
        : setNewObservationModal(true);
      handleObservation(observation);
      setOriginStage(originStage);
      setDestinationStage(destinationStage);
    },
    []
  );

  const renderNewObservationModal = () => {
    return (
      <Modal
        isOpen={newObservationModal}
        onRequestClose={() => setNewObservationModal(false)}
        style={customStyles}
        contentLabel="nova anotação"
      >
        <ModalHeader close={() => setNewObservationModal(false)}>
          Nova Anotação
        </ModalHeader>
        <ModalBody>
          <textarea
            className="observation-field"
            placeholder="Observações sobre a etapa."
            style={textAreaStyle}
            value={
              commentary === '+ Adicionar nova notificação' ? '' : commentary
            }
            onChange={(e) => handleObservation(e.target.value)}
          />
          <Button
            buttonType={'showProcess'}
            onClick={() => newObservation(commentary)}
            text={'Salvar'}
          />
        </ModalBody>
      </Modal>
    );
  };

  const renderEditObservationModal = () => {
    return (
      <Modal
        isOpen={editObservationModal}
        onRequestClose={() => setEditObservationModal(false)}
        style={customStyles}
        contentLabel="Editar anotação"
      >
        <ModalHeader close={() => setEditObservationModal(false)}>
          Editar Anotação
        </ModalHeader>
        <ModalBody>
          <textarea
            className="observation-field"
            placeholder="Observações sobre a etapa."
            style={textAreaStyle}
            value={commentary}
            onChange={(e) => handleObservation(e.target.value)}
          />
          <div>
            <Button
              buttonType={'showProcess'}
              onClick={() => setEditObservationModal(false)}
              text={'Cancelar'}
            />
            <Button
              buttonType={'showProcess'}
              onClick={() => newObservation(commentary)}
              text={'Salvar'}
            />
            <Button
              buttonType={'showProcess'}
              onClick={() => deleteObservation()}
              text={'Excluir'}
            />
          </div>
        </ModalBody>
      </Modal>
    );
  };

  return (
    proc && (
      <Container>
        <Link to="../processes" state={flow} className="voltarButton">
          <span>Voltar</span>
        </Link>
        <div className="processInfo">
          <h1>
            {proc.nickname.length > 0
              ? proc.nickname
              : `Processo ${proc.record}`}
          </h1>
          <div className="process">
            {proc?.nickname.length > 0
              ? `${proc?.record} - ${proc?.nickname}`
              : `${proc?.record}`}
          </div>
        </div>
        {flow ? (
          <FlowWrapper style={flowStyle}>
            <FlowViewer
              openModal={observationModal}
              stages={stages}
              flow={flow}
              highlight={proc?.idStage}
              proc={proc}
            />
          </FlowWrapper>
        ) : (
          <Ring />
        )}
        {renderNextStageModal()}
        {renderNewObservationModal()}
        {renderEditObservationModal()}
        <Button
          onClick={() => checkExistAnnotation()}
          disabled={!hasPermission(user, 'advance-stage')}
        >
          <SkipNextIcon />
          <span>Avançar etapa</span>
        </Button>
      </Container>
    )
  );
}

export default ShowProcess;
