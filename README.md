# ...just convert - File Format Converter

A modern web application built with Next.js that allows users to easily convert files between different formats. Currently supports CSV to ICS (iCalendar) conversion with plans to support more formats like JSON, Excel, PDF, and Markdown.

## Features

- 🎨 Modern Neo-brutalist UI with dark/light mode support
- 📁 Drag & drop file upload
- 🔄 Real-time conversion
- 📋 Supports multiple calendar fields
- 📖 Interactive CSV format guide
- 🔔 Toast notifications for feedback
- 📱 Fully responsive design
- 🎯 Type-safe with TypeScript

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
git clone www.github.com/egv2/simple-ical
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

1. Visit the application in your web browser
2. Select source and target formats
3. Either drag & drop your file or click to select it
4. Click the "Convert" button
5. Download the generated file automatically

## Tech Stack

- [Next.js 16](https://nextjs.org/) - React framework
- [React 19](https://react.dev/) - UI library
- [TypeScript 5](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS 4](https://tailwindcss.com/) - Styling
- [Shadcn/ui](https://ui.shadcn.com/) - UI components
- [Radix UI](https://www.radix-ui.com/) - Accessible primitives
- [csv-parse](https://csv.js.org/parse/) - CSV parsing
- [ical-toolkit](https://www.npmjs.com/package/ical-toolkit) - ICS generation
- [Sonner](https://sonner.emilkowal.ski/) - Toast notifications
- [next-themes](https://github.com/pacocoursey/next-themes) - Theme management
- [Lucide React](https://lucide.dev/) - Icon library

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
