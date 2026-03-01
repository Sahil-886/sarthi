import { SignIn } from "@clerk/clerk-react";

export default function Login() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md flex justify-center">
        <SignIn routing="path" path="/login" signUpUrl="/signup" fallbackRedirectUrl="/dashboard" />
      </div>
    </div>
  );
}
