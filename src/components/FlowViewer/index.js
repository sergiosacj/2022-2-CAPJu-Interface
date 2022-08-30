import PropTypes from 'prop-types';
import React from 'react';
import { Container } from './styles';
import ReactFlow, { MarkerType } from 'react-flow-renderer';

function FlowViewer(props) {
  const procStages = props.proc.etapas;
  function getStageDate(stageId) {
    if (stageId === props.flow.sequences[0].from) {
      return new Date(props.proc.createdAt);
    } else {
      let currentStage = props.proc.etapas.find(
        (el) => el.stageIdTo === stageId
      );
      if (currentStage) return new Date(currentStage.createdAt);
      else return null;
    }
  }

  function isLate(stage) {
    const today = new Date();
    const dayInMilisseconds = 24 * 3600 * 1000;
    const stageDate = getStageDate(props.highlight);

    const timeInDays = Math.abs(today - stageDate) / dayInMilisseconds;
    if (timeInDays > parseInt(stage.time)) {
      return true;
    }
    return false;
  }

  function deadlineDate(stage) {
    const stageDate = getStageDate(stage._id);
    if (stageDate instanceof Date && !isNaN(stageDate)) {
      stageDate.setDate(stageDate.getDate() + parseInt(stage.time), 10);
      return stageDate.toLocaleDateString();
    }
  }
  const nodes = props.stages
    .filter((stage) => {
      return props.flow.stages.includes(stage._id);
    })
    .map((stage, idx) => {
      const deadline = deadlineDate(stage);
      return {
        id: stage._id,
        data: {
          label: (
            <>
              {stage.name} <br /> {deadline ? `Vencimento: ${deadline}` : ``}
            </>
          )
        },
        position: { x: (idx % 2) * 130, y: 140 * idx },
        style:
          props.highlight == stage._id
            ? {
                backgroundColor: isLate(stage) ? '#de5353' : '#1b9454',
                color: '#f1f1f1'
              }
            : {}
      };
    });

  let edges;
  if (procStages) {
    const edgesProcs =
      procStages.map((sequence) => {
        return {
          id: 'e' + sequence.stageIdFrom + '-' + sequence.stageIdTo,
          source: sequence.stageIdFrom,
          target: sequence.stageIdTo,
          label: sequence.observation,
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#2a2a32'
          },
          style: { stroke: '#1b9454' }
        };
      }) || [];
    const edgesFlows =
      props.flow.sequences.map((sequence) => {
        const id = 'e' + sequence.from + '-' + sequence.to;
        if (edgesProcs.some((edge) => edge.id === id)) return;
        return {
          id: id,
          source: sequence.from,
          target: sequence.to,
          animated: true,
          style: { stroke: 'black' }
        };
      }) || [];
    edges = edgesProcs.concat(edgesFlows);
  } else {
    edges = props.flow.sequences.map((sequence) => {
      const id = 'e' + sequence.from + '-' + sequence.to;
      return {
        id: id,
        source: sequence.from,
        target: sequence.to,
        animated: true,
        style: { stroke: 'black' }
      };
    });
  }
  return (
    <Container onClick={props.onClick}>
      <ReactFlow nodes={nodes} edges={edges} fitView></ReactFlow>
    </Container>
  );
}

FlowViewer.propTypes = {
  onClick: PropTypes.func,
  flow: PropTypes.any,
  stages: PropTypes.array,
  highlight: PropTypes.string,
  proc: PropTypes.object
};

export default FlowViewer;
