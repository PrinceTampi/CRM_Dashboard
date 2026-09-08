import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
	title: 'CRM Dashboard',
	description: 'One Dashboard One Control untuk pengelolaan CRM.',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: ReactNode;
}>) {
	return (
		<html lang="id">
			<body>{children}</body>
		</html>
	);
}
