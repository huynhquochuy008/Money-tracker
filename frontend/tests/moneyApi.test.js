import { describe, it, expect, beforeEach } from 'vitest';
import { authApi, expenseApi, budgetApi } from '../src/api/moneyApi';

describe('MoneyPro API Client (with MSW)', () => {
    describe('authApi', () => {
        it('session retrieves correct user status', async () => {
            const data = await authApi.session();
            expect(data.status).toBe('authenticated');
            expect(data.user.email).toBe('demo@moneypro.ai');
        });

        it('login returns success', async () => {
            const data = await authApi.login('test@example.com', 'password');
            expect(data.status).toBe('success');
        });
    });

    describe('expenseApi', () => {
        it('list retrieves expenses array', async () => {
            const data = await expenseApi.list('2024-03');
            expect(Array.isArray(data)).toBe(true);
            expect(data[0].category).toBe('Food');
        });

        it('add returns the new expense item', async () => {
            const res = await expenseApi.add(200, 'Travel', 'Trip', '2024-03-05');
            expect(res.status).toBe('success');
            expect(res.data.category).toBe('Travel');
        });
    });

    describe('budgetApi', () => {
        it('get retrieves budget object', async () => {
            const data = await budgetApi.get();
            expect(data.Food).toBe(500);
        });

        it('update returns success', async () => {
            const res = await budgetApi.update({ Food: 600 });
            expect(res.status).toBe('success');
        });
    });
});
