import { VolunteerRegistrationForm } from '../components/public/VolunteerRegistrationForm';
import { PageBackground } from '../components/public/PageBackground';
import '../index.css';

function VolunteerRegister() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0f1e] font-sans text-white">
      <PageBackground />
      <div className="relative z-10">
        <VolunteerRegistrationForm />
      </div>
    </main>
  );
}

export default VolunteerRegister;
