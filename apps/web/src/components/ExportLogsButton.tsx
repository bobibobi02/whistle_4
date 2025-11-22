export default function ExportLogsButton() {
  const download = () => {
    const link = document.createElement('a');
    link.href = '/api/mod/exportLogs';
    link.download = 'mod_actions.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={download}
      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
    >
      Export Mod Actions CSV
    </button>
  );
}
