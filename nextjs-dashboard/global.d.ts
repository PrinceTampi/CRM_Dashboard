declare module '*.css' {
	const styles: Record<string, string>;
	export default styles;
}

import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
	interface User {
		role: 'ADMIN' | 'AHASS';
	}

	interface Session {
		user: {
			id: string;
			role: 'ADMIN' | 'AHASS';
		} & DefaultSession['user'];
	}
}

declare module 'next-auth/jwt' {
	interface JWT {
		role?: 'ADMIN' | 'AHASS';
	}
}
