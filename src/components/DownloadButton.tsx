export function DownloadButton({ filename }: { filename: string }) {
  return (
    <a
      href={filename}
      download="events.ics"
      className="block w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-center"
    >
      ICS Dosyasını İndir
    </a>
  );
}
