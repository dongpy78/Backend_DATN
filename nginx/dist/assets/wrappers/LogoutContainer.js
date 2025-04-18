import styled from "styled-components";

const Wrapper = styled.div`
  position: relative;

  .logout-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;

    gap: 0 0.5rem;
    font-family: "Plus Jakarta Sans", sans-serif;
  }

  .img {
    width: 25px;
    height: 25px;
    border-radius: 50%;
  }

  .dropdown {
    position: absolute;
    top: 45px;
    left: 0;
    width: 100%;
    box-shadow: var(--shadow-2);
    text-align: center;
    visibility: hidden;
    border-radius: var(--border-radius);
    background: var(--background-main-custom);
  }

  .show-dropdown {
    visibility: visible;
  }

  .dropdown-btn {
    border-radius: var(--border-radius);
    padding: 0.5rem;
    background-color: transparent;
    border-color: transparent;
    color: var(--white);
    letter-spacing: var(--letter-spacing);
    text-transform: capitalize;
    cursor: pointer;
    width: 100%;
    height: 100%;
  }
`;

export default Wrapper;
