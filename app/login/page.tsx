import LoginForm from '@/components/LoginForm' // Import the LoginForm component

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Login to Capz</h1>
        <LoginForm /> {/* Render the LoginForm component */}
      </div>
    </div>
  )
}