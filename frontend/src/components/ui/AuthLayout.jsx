import { Cross } from 'lucide-react';

const AVATAR_URLS = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCMKADtt2ffMNP5vWlRwHERFzmfGj6HIdEubH8x39H7YTiDccGj4vPocqyIoKlUe1wLQToMb7BqM0Xj9YG8LgFHBKmIXgb3W-J79LwO4dw4wWp6AE6E_s3a-MWSJtbU1-bbihe4trwlU7xOlRbbYOUWvYPWjcZYDZe-tTCt2IxnZF5buUSdYnB3VOyqnygpZ8Sji323gviBD8ZdtGvmh_CHexe9F0O6pxEurROWo_lwJaZMKWRK2A_LGVlesJZcCZ2BXMcqF1Gp5M4',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDja5HqL40jm1mq2vxNL8mC4ZOoUXqycErbYDhTr2S_GohD3NhlzhVBVq1Fcmw5m7sc4VpD7JOuJUZOeTXn4-TNFNLk8oDWYu6YMRZ17zvroBMj2tXK7JpzhnH5VbA1oZ1eDpv4sQIqpKxnDCkl6vM-c0ehcZaZEBkRaP4XzReRN5I7pb7sdrpF8NmHeop_eNjXU-iARsLRnh_zu5dm4qU0dM5lr_9S08yrew5PgHLwG9Ct0Uk_As2N6GpGNCsRyo6O5jqogTmOygE',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAk2Ji7QULkIKGHIyt5Uy8_2rU8YnmVKByU_Pg0XBDPgxsLsC0NMzrE9rG14lHFICEjqgUAFqOnDHlKpgFab34EYtbPX7RPz4VgtCwpMpnwu3vFcBHUe5gWFD6QwlCOrybXWHlnXsYtWJlME4Hu5lk2DsDZwSI98hIpCRcFeeqBsgiXujXp4iIJrh2mgsxZcGJBUeJ4qubIPL-SutzAdNzt-iqO1CfnrQ85E4bpPawK6PWRCmwuaJeZ863TgUVeBDvUIFv4Xyux1CQ',
];

export default function AuthLayout({ children }) {
  return (
    <div className="relative flex min-h-screen w-full overflow-hidden font-display antialiased bg-background-light dark:bg-background-dark text-neutral-900 dark:text-white">
      {/* Left Side: Hero Image & Branding */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-end p-12 xl:p-20 overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCvvy21BLn_Vq4xlCI-fBsYwIRXQAUEwtI74rUwfz5cZShtKzl-KnxM8bd11anOwDRGxS_rsp-hG2vV1RvvFmWWZ4Mi3TEDN7Xzk-UQLjpqNhVLEWHJZyVSUzrLFDJKc4bbqAFICzu7KQacYPQjyy6AmEiKQBBIWhcot4ocx5703FpsstrNvMECY1GV8Vpttdc2_LVnFQO4dcVLQ_m83rDhE3lM0kv6dVNNFybZKXmwMfdXB7eZmq275HeUQw5QPDkl8kb3XT6pBPQ')",
          }}
        />
        {/* Overlays for legibility and theme */}
        <div className="absolute inset-0 z-10 bg-primary/30 mix-blend-multiply" />
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-background-dark via-background-dark/80 to-transparent opacity-90" />

        {/* Content */}
        <div className="relative z-20 flex flex-col gap-6 max-w-lg">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600 text-white">
              <Cross className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">MedAI</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-extrabold leading-tight tracking-tight text-white">
            Transforming Healthcare with Artificial Intelligence
          </h1>

          <p className="text-lg text-gray-300 font-normal leading-relaxed">
            Access a secure, intelligent, and efficient platform designed for modern medical professionals and patients.
          </p>

          {/* Trust indicators */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex -space-x-3">
              {AVATAR_URLS.map((url, i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full border-2 border-background-dark bg-gray-600 bg-cover"
                  style={{ backgroundImage: `url('${url}')` }}
                />
              ))}
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-background-dark bg-gray-700 text-xs text-white font-bold">
                +2k
              </div>
            </div>
            <p className="text-sm text-gray-400">Trusted by over 2,000 specialists.</p>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-gray-700">
            <div className="space-y-1">
              <div className="text-white font-semibold text-sm">AI-Powered Chatbot</div>
              <p className="text-xs text-gray-400">24/7 medical assistance</p>
            </div>
            <div className="space-y-1">
              <div className="text-white font-semibold text-sm">Health Tracking</div>
              <p className="text-xs text-gray-400">Monitor vitals & progress</p>
            </div>
            <div className="space-y-1">
              <div className="text-white font-semibold text-sm">Medicine Reminders</div>
              <p className="text-xs text-gray-400">Never miss a dose</p>
            </div>
            <div className="space-y-1">
              <div className="text-white font-semibold text-sm">Lab Tests & Pharmacy</div>
              <p className="text-xs text-gray-400">Complete healthcare solution</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 relative bg-background-light dark:bg-background-dark">
        {/* Mobile Header (Logo visible only on small screens) */}
        <div className="lg:hidden absolute top-6 left-6 flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded bg-primary text-white">
            <Cross className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">MedAI</span>
        </div>

        {children}
      </div>
    </div>
  );
}
