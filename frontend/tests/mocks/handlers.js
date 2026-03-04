import { http, HttpResponse } from 'msw';

export const handlers = [
    // Auth handlers
    http.get('/api/auth/session', () => {
        return HttpResponse.json({
            status: 'authenticated',
            user: { id: 'test-user', email: 'demo@moneypro.ai' }
        });
    }),

    http.post('/api/auth/login', async ({ request }) => {
        const { email } = await request.json();
        return HttpResponse.json({
            status: 'success',
            session: { user: { id: 'test-user', email } }
        });
    }),

    // Expense handlers
    http.get('/api/list', ({ request }) => {
        const url = new URL(request.url);
        const month = url.searchParams.get('month');
        return HttpResponse.json([
            { id: 1, amount: 100, category: 'Food', note: 'Test', date: '2024-03-01' }
        ]);
    }),

    http.post('/api/add', async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json({
            status: 'success',
            data: { id: Date.now(), ...body }
        });
    }),

    // Budget handlers
    http.get('/api/budget', () => {
        return HttpResponse.json({ Food: 500, Rent: 1000 });
    }),

    http.post('/api/budget/update', async ({ request }) => {
        return HttpResponse.json({ status: 'success' });
    }),
];
