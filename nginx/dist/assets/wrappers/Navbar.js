import styled from "styled-components";

const Wrapper = styled.nav`
  height: var(--nav-height);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 0px 0px rgba(0, 0, 0, 0.1);
  background: var(--background-secondary-color);
  .logo {
    display: flex;
    align-items: center;
    width: 100px;
  }

  .nav-center {
    display: flex;
    width: 90vw;
    height: 12vh;
    align-items: center;
    justify-content: space-between;
  }
  .toggle-btn {
    background: transparent;
    border-color: transparent;
    font-size: 1.75rem;
    color: var(--background-main-custom);
    cursor: pointer;
    display: flex;
    align-items: center;
  }
  .btn-container {
    display: flex;
    align-items: center;
  }

  .logo-text {
    display: none;
    font-family: "Plus Jakarta Sans", sans-serif;
  }
  @media (min-width: 992px) {
    position: sticky;
    top: 0;
    z-index: 99;

    .nav-center {
      width: 90%;
    }
    .logo {
      display: none;
    }
    .logo-text {
      color: var(--color-text-sidebar);

      display: block;
    }
  }

  @media (max-width: 768px) {
    .logo {
      display: none; /* Ẩn logo trên điện thoại */
    }
  }
`;
export default Wrapper;
