import { SignUp } from "@clerk/clerk-react";

export default function Signup() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md flex justify-center">
        <SignUp routing="path" path="/signup" signInUrl="/login" fallbackRedirectUrl="/permissions" />
      </div>
    </div>
  );
}
