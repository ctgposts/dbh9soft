import { SignInForm } from "../SignInForm";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function LoginWrapper() {
  const storeSettings = useQuery(api.settings.get);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        {/* Floating Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full animate-bounce-gentle"></div>
        <div className="absolute top-32 right-20 w-16 h-16 bg-purple-300/20 rounded-full animate-bounce-gentle" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-blue-300/15 rounded-full animate-bounce-gentle" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-32 right-10 w-12 h-12 bg-indigo-300/25 rounded-full animate-bounce-gentle" style={{ animationDelay: '0.5s' }}></div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Logo and Brand Section */}
        <div className="text-center mb-8 animate-fadeInUp">
          <div className="inline-flex items-center justify-center w-32 h-32 bg-white/10 backdrop-blur-md rounded-full mb-6 border border-white/20">
            {storeSettings?.logo ? (
              <img 
                src={storeSettings.logo} 
                alt="Store Logo" 
                className="w-28 h-28 object-contain"
              />
            ) : (
              <img 
                src="/LOGO2.png" 
                alt="Dubai Borka House" 
                className="w-28 h-28 object-contain rounded-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "🏪";
                }}
              />
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            {storeSettings?.storeTitle || "DUBAI BORKA HOUSE"}
          </h1>
          {storeSettings?.tagline && (
            <p className="text-purple-200 text-sm mb-2">{storeSettings.tagline}</p>
          )}
          <div className="w-24 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mx-auto mt-4"></div>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-2xl animate-slideInRight">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-purple-200">Sign in to your account</p>
          </div>

          {/* Enhanced Sign In Form */}
          <div className="space-y-6">
            <SignInForm />
          </div>

          {/* Additional Features */}
          <div className="mt-8 pt-6 border-t border-white/20">
            <div className="text-center">
              <p className="text-purple-200 text-sm mb-4">
                Secure & Encrypted Connection
              </p>
              <div className="flex items-center justify-center space-x-4 text-white/60">
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <span className="text-xs">Online</span>
                </div>
                <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                <div className="flex items-center space-x-1">
                  <span className="text-xs">🔒 SSL Secured</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
          <p className="text-purple-200 text-sm">
            © 2024 DUBAI BORKA HOUSE
          </p>
          <p className="text-purple-300 text-xs mt-1">
            Premium Islamic Fashion Store
          </p>
        </div>
      </div>


    </div>
  );
}
