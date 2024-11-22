import LoginForm from '@/components/LoginForm';

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        <LoginForm />
      </main>
    </div>
  );
};

export default LoginPage;