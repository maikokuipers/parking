"use client";

interface ParkingButtonProps {
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
}

export default function ParkingButton({
  disabled,
  loading,
  onClick,
}: ParkingButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full py-4 rounded-2xl text-lg font-bold transition-all
        ${
          disabled || loading
            ? "bg-gray-800 text-gray-600 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700 shadow-lg shadow-blue-500/25 active:shadow-none active:scale-[0.98]"
        }`}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg
            className="animate-spin h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Bezig...
        </span>
      ) : (
        "Start Parkeren"
      )}
    </button>
  );
}
