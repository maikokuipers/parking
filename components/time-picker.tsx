"use client";

interface TimePickerProps {
  startTime: string;
  endTime: string;
  onStartChange: (time: string) => void;
  onEndChange: (time: string) => void;
}

export default function TimePicker({
  startTime,
  endTime,
  onStartChange,
  onEndChange,
}: TimePickerProps) {
  return (
    <div className="flex gap-4">
      <div className="flex-1">
        <label className="block text-xs text-gray-500 mb-1">Van</label>
        <input
          type="time"
          value={startTime}
          onChange={(e) => onStartChange(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white
            focus:outline-none focus:border-blue-500 text-center"
        />
      </div>
      <div className="flex-1">
        <label className="block text-xs text-gray-500 mb-1">Tot</label>
        <input
          type="time"
          value={endTime}
          onChange={(e) => onEndChange(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white
            focus:outline-none focus:border-blue-500 text-center"
        />
      </div>
    </div>
  );
}
