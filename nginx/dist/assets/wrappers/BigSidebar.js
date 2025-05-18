import styled from "styled-components";

const Wrapper = styled.aside`
  display: none;
  @media (min-width: 992px) {
    display: block;
    box-shadow: 1px 0px 0px 0px rgba(0, 0, 0, 0.1);

    .sidebar-container {
      background-color: var(--background-secondary-color);
      min-height: 100vh;
      height: 100%;
      width: 250px;
      margin-left: -250px;
      transition: margin-left 0.3s ease-in-out;
    }

    .content-company {
      position: sticky;
      top: 0;
    }

    .show-sidebar {
      margin-left: 0;
    }

    header {
      height: 6rem;
      display: flex;
      align-items: center;
      padding-left: 2.5rem;
    }

    .nav-links {
      padding-top: 2rem;
      padding-left: 0.5rem;
      padding-right: 0.5rem;
      display: flex;
      flex-direction: column;
    }

    .nav-link {
      display: flex;
      align-items: center;
      color: var(--text-color);
      /* background-color: var(--primary-500); */
      padding: 0.8rem 0;
      padding-left: 1rem;
      border-radius: 8px;
      /* text-transform: capitalize; */
      transition: padding-left 0.3s ease-in-out;
      font-size: 14px;
      font-family: "Plus Jakarta Sans", sans-serif;
    }

    .nav-link:not(:first-child) {
      margin-top: 0.2rem;
    }

    .nav-link:hover {
      padding-left: 1.1rem;
      color: var(--color-text-sidebar-secondary);
      background-color: var(--background-main-secondary);
      transition: var(--transition);
    }

    .icon {
      font-size: 1.5rem;
      margin-right: 1rem;
      display: grid;
      place-items: center;
    }

    .active {
      color: #fff;
      background-color: var(--background-main-custom);
    }

    .pending {
      background: var(--background-color);
    }
  }
`;
export default Wrapper;
