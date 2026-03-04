/**
 * Charts.jsx — Doughnut (by category) + Line (daily trend) charts via Chart.js.
 */
import { useEffect, useRef } from 'react';
import {
    Chart,
    ArcElement,
    DoughnutController,
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Filler,
    Tooltip,
    Legend,
} from 'chart.js';

Chart.register(
    ArcElement, DoughnutController,
    LineController, LineElement, PointElement,
    LinearScale, CategoryScale,
    Filler, Tooltip, Legend
);

/** Colour palette for the doughnut slices */
const COLORS = [
    '#6366f1', '#10b981', '#f59e0b', '#ef4444',
    '#ec4899', '#8b5cf6', '#06b6d4', '#475569',
];

/**
 * @param {Object} props
 * @param {Object} props.catSum  - { category: totalAmount }
 * @param {Object} props.daySum  - { 'YYYY-MM-DD': totalAmount }
 */
export default function Charts({ catSum, daySum }) {
    const catRef = useRef(null);
    const dayRef = useRef(null);
    const catChart = useRef(null);
    const dayChart = useRef(null);

    useEffect(() => {
        // Destroy existing charts before re-rendering
        catChart.current?.destroy();
        dayChart.current?.destroy();

        const catLabels = Object.keys(catSum);
        const catData = Object.values(catSum);

        if (catRef.current) {
            catChart.current = new Chart(catRef.current, {
                type: 'doughnut',
                data: {
                    labels: catLabels,
                    datasets: [{
                        data: catData,
                        backgroundColor: COLORS,
                        borderWidth: 0,
                        hoverOffset: 18,
                    }],
                },
                options: {
                    cutout: '80%',
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'bottom',
                            labels: {
                                usePointStyle: true,
                                padding: 20,
                                color: '#94a3b8',
                                font: { family: 'Outfit', size: 12 },
                            },
                        },
                        tooltip: {
                            backgroundColor: '#0f172a',
                            padding: 12,
                            callbacks: {
                                label: (c) => ` ${c.label}: ${c.raw.toLocaleString()}đ`,
                            },
                        },
                    },
                },
            });
        }

        const days = Object.keys(daySum).sort();
        const dayData = days.map((d) => daySum[d]);
        const dayLabels = days.map((d) => d.split('-')[2]);

        if (dayRef.current) {
            dayChart.current = new Chart(dayRef.current, {
                type: 'line',
                data: {
                    labels: dayLabels,
                    datasets: [{
                        data: dayData,
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99,102,241,0.12)',
                        borderWidth: 3,
                        pointBackgroundColor: '#fff',
                        pointBorderColor: '#6366f1',
                        pointBorderWidth: 3,
                        pointRadius: 5,
                        tension: 0.4,
                        fill: true,
                    }],
                },
                options: {
                    maintainAspectRatio: false,
                    scales: {
                        y: { display: false, beginAtZero: true },
                        x: {
                            border: { display: false },
                            grid: { display: false, color: 'transparent' },
                            ticks: { color: '#64748b', font: { family: 'Outfit' } },
                        },
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: '#0f172a',
                            padding: 12,
                            callbacks: {
                                label: (c) => ` Spent: ${c.raw.toLocaleString()}đ`,
                            },
                        },
                    },
                },
            });
        }

        // Cleanup on unmount
        return () => {
            catChart.current?.destroy();
            dayChart.current?.destroy();
        };
    }, [catSum, daySum]);

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
                <p style={{ color: '#64748b', fontSize: '0.82rem', textAlign: 'center', marginBottom: '0.75rem' }}>
                    Spending by Category
                </p>
                <div className="chart-wrap"><canvas ref={catRef} /></div>
            </div>
            <div>
                <p style={{ color: '#64748b', fontSize: '0.82rem', textAlign: 'center', marginBottom: '0.75rem' }}>
                    Daily Trend
                </p>
                <div className="chart-wrap"><canvas ref={dayRef} /></div>
            </div>
        </div>
    );
}
