import styled from 'styled-components';

export const Container = styled.div`
  width: 100%;
  color: #eee;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 20px;
  background-color: rgba(255, 255, 255, 0.1);
  width: fit-content;
  padding: 50px;
  border-radius: 15px;

  flex-direction: column;
  gap: 20px;

  label {
    font-size: 18px;
  }
`;
