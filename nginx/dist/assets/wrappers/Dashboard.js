import styled from "styled-components";

const Wrapper = styled.section`
  .wrapper-test {
    background-color: var(--background-secondary-color);

    border: 1px solid rgba(0, 0, 0, 0.1);
    /* box-shadow: 0 1px 0px 0px rgba(0, 0, 0, 0.1); */
  }
  .dashboard {
    display: grid;
    grid-template-columns: 1fr;
  }
  .dashboard-page {
    width: 90vw;
    margin: 0 auto;
    padding: 2rem 0;
  }
  @media (min-width: 992px) {
    .dashboard {
      grid-template-columns: auto 1fr;
    }
    .dashboard-page {
      width: 90%;
    }
  }

  @media (max-width: 740px) {
    .wrapper-test {
      background-color: var(--background-third-color);
    }

    .dashboard-page {
      padding: 0;
    }
  }
`;
export default Wrapper;
