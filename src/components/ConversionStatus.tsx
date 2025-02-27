export function ConversionStatus({ progress }: { progress: number }) {
  return (
    <div className="w-full space-y-2">
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-sm text-center text-gray-500">
        Dönüştürülüyor... {progress}%
      </p>
    </div>
  );
}
