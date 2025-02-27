# CSV to ICS Calendar Converter

A modern web application built with Next.js that allows users to easily convert CSV files containing event data into ICS (iCalendar) format. Perfect for bulk importing events into calendar applications.

![CSV to ICS Converter](public/preview.png)

## Features

- 🚀 Modern UI with dark/light mode support
- 📁 Drag & drop file upload
- 📊 Real-time conversion progress
- 📅 Supports multiple calendar fields
- 💡 Interactive CSV format guide
- 🔔 Toast notifications for feedback
- 📱 Responsive design

## Required CSV Format

The CSV file must include these columns:

| Field       | Required | Example               | Description                   |
| ----------- | -------- | --------------------- | ----------------------------- |
| title       | ✅       | Team Meeting          | Event title                   |
| start       | ✅       | 2024-03-20T14:30      | Start date and time           |
| end         | ✅       | 2024-03-20T15:30      | End date and time             |
| description | ❌       | Weekly review meeting | Optional event description    |
| location    | ❌       | Conference Room 1     | Optional location information |

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn package manager

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

1. Visit the application in your web browser.
2. Either drag & drop your CSV file or click to select it.
3. Wait for the conversion process to complete.
4. Download the generated ICS file.
5. Import the ICS file into your preferred calendar application.

## Tech Stack

- [Next.js 14](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Shadcn/ui](https://ui.shadcn.com/) - UI components
- [csv-parse](https://csv.js.org/parse/) - CSV parsing
- [ical-toolkit](https://www.npmjs.com/package/ical-toolkit) - ICS generation
- [Sonner](https://sonner.emilkowal.ski/) - Toast notifications

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Shadcn/ui Documentation](https://ui.shadcn.com)

## Support

If you have any questions or need help, please open an issue in the repository.
