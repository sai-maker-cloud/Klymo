import Hero from '../Hero/Hero';
import Form from '../Form/Form';
import UsersJoined from '../UsersJoined/UsersJoined';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="klymo-wrapper">
      <div className="layout-grid">
        <section className="info-side">
          <Hero />
          <UsersJoined />
        </section>
        <section className="action-side">
          <Form />
        </section>
      </div>
    </div>
  );
};

export default LandingPage;